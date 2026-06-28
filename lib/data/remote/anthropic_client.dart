// lib/data/remote/anthropic_client.dart
//
// Direct integration with the Anthropic Claude API.
// Handles: request building, response parsing, error handling, retries.

import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../core/env.dart';
import '../../domain/models/ai_suggestion.dart';
import '../../domain/models/ai_context.dart';

/// Result wrapper — avoids throwing exceptions through the UI layer.
sealed class AiResult {
  const AiResult();
}

class AiSuccess extends AiResult {
  final List<AiSuggestion> suggestions;
  const AiSuccess(this.suggestions);
}

class AiFailure extends AiResult {
  final AiFailureReason reason;
  final String? message;
  const AiFailure(this.reason, {this.message});
}

enum AiFailureReason {
  noInternet,
  apiError,
  parseError,
  rateLimited,
  unknown,
}

/// Low-level Anthropic API client.
/// Only responsible for HTTP. Business logic lives in AiRepository.
class AnthropicClient {
  static const _baseUrl    = 'https://api.anthropic.com/v1';
  static const _model      = 'claude-sonnet-4-6';
  static const _maxTokens  = 1500;
  static const _apiVersion = '2023-06-01';

  late final Dio _dio;

  AnthropicClient() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'x-api-key':         Env.anthropicApiKey,
        'anthropic-version': _apiVersion,
        'content-type':      'application/json',
      },
    ));

    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (o) => debugPrint(o.toString()),
      ));
    }
  }

  /// Fetch AI suggestions for the given context.
  Future<AiResult> fetchSuggestions(AiContext context) async {
    try {
      final response = await _dio.post(
        '/messages',
        data: {
          'model':      _model,
          'max_tokens': _maxTokens,
          'system':     _buildSystemPrompt(context.language),
          'messages': [
            {'role': 'user', 'content': _buildUserMessage(context)},
          ],
        },
      );

      if (response.statusCode != 200) {
        return AiFailure(
          AiFailureReason.apiError,
          message: 'Status ${response.statusCode}',
        );
      }

      return _parseResponse(response.data);

    } on DioException catch (e) {
      return _handleDioError(e);
    } catch (e) {
      debugPrint('AnthropicClient unexpected error: $e');
      return AiFailure(AiFailureReason.unknown, message: e.toString());
    }
  }

  // ── Private ──────────────────────────────────────────

  String _buildSystemPrompt(String language) {
    final isNl = language == 'nl';
    return '''
You are the AI assistant inside Travel Cockpit, a roadtrip travel app.

Your job is to suggest ${isNl ? 'activiteiten, restaurants en cafés' : 'activities, restaurants and cafés'} for travellers based on their current location, weather and personal preferences.

${isNl ? 'REGELS:' : 'RULES:'}
- ${isNl ? 'Reageer ALLEEN in JSON. Geen tekst, geen markdown, geen uitleg.' : 'Respond ONLY in JSON. No text, no markdown, no explanation.'}
- ${isNl ? 'Geef altijd precies 5 suggesties terug.' : 'Always return exactly 5 suggestions.'}
- ${isNl ? 'Verzin geen adressen, telefoonnummers of openingstijden.' : 'Never invent addresses, phone numbers or opening hours.'}
- ${isNl ? 'Vermijd activiteiten die al in de planning staan.' : 'Avoid activities already in the planning.'}
- ${isNl ? 'Als het regent, voeg altijd minstens één overdekte optie toe.' : 'If it rains, always include at least one indoor option.'}
- ${isNl ? 'Houd rekening met het seizoen en de regio.' : 'Consider the season and region.'}
- ${isNl ? 'why_recommended mag maximaal 1 zin zijn.' : 'why_recommended must be maximum 1 sentence.'}

Return this exact JSON structure (array of 5 objects):
[
  {
    "name": "string",
    "category": "activity" | "restaurant" | "cafe" | "rain" | "drive",
    "description": "string (max 2 sentences)",
    "why_recommended": "string (max 1 sentence)",
    "distance_km": number,
    "duration_minutes": number,
    "difficulty": "easy" | "medium" | "hard" | null,
    "rating": number (0-5) | null,
    "lat": number | null,
    "lng": number | null,
    "google_maps_query": "string"
  }
]
''';
  }

  String _buildUserMessage(AiContext ctx) {
    final filterText = ctx.filter != null
        ? '\nFilter: alleen ${ctx.filter!.label}'
        : '';

    final plannedText = ctx.alreadyPlanned.isNotEmpty
        ? '\nAl gepland (vermijd duplicaten): ${ctx.alreadyPlanned.join(', ')}'
        : '';

    final prefsText = ctx.userPreferences.isNotEmpty
        ? '\nVoorkeuren: ${ctx.userPreferences.join(', ')}'
        : '';

    return '''
Huidige accommodatie: ${ctx.accommodationName}, ${ctx.accommodationLocation}
Land: ${ctx.country} (${ctx.countryCode})
Datum: ${ctx.formattedDate}
Weer: ${ctx.weatherSummary}$prefsText$plannedText$filterText

Genereer 5 suggesties in JSON.
''';
  }

  AiResult _parseResponse(dynamic responseData) {
    try {
      // Extract text content from Claude response
      final content = responseData['content'] as List<dynamic>;
      final textBlock = content.firstWhere(
        (c) => c['type'] == 'text',
        orElse: () => null,
      );

      if (textBlock == null) {
        return const AiFailure(AiFailureReason.parseError,
            message: 'No text block in response');
      }

      final rawText = textBlock['text'] as String;

      // Strip any accidental markdown fences
      final cleaned = rawText
          .replaceAll('```json', '')
          .replaceAll('```', '')
          .trim();

      final decoded = jsonDecode(cleaned) as List<dynamic>;

      final suggestions = decoded
          .map((item) => _mapToSuggestion(item as Map<String, dynamic>))
          .where((s) => s != null)
          .cast<AiSuggestion>()
          .toList();

      if (suggestions.isEmpty) {
        return const AiFailure(AiFailureReason.parseError,
            message: 'Parsed 0 suggestions');
      }

      debugPrint('✅ AI: parsed ${suggestions.length} suggestions');
      return AiSuccess(suggestions);

    } catch (e) {
      debugPrint('❌ AI parse error: $e');
      return AiFailure(AiFailureReason.parseError, message: e.toString());
    }
  }

  AiSuggestion? _mapToSuggestion(Map<String, dynamic> item) {
    try {
      final categoryStr = item['category'] as String? ?? 'activity';
      final category = _parseCategory(categoryStr);

      return AiSuggestion(
        name:            item['name'] as String? ?? 'Onbekend',
        category:        category,
        description:     item['description'] as String? ?? '',
        whyRecommended:  item['why_recommended'] as String? ?? '',
        distanceKm:      (item['distance_km'] as num?)?.toDouble() ?? 0,
        durationMinutes: (item['duration_minutes'] as num?)?.toInt() ?? 0,
        difficulty:      item['difficulty'] as String?,
        rating:          (item['rating'] as num?)?.toDouble(),
        lat:             (item['lat'] as num?)?.toDouble(),
        lng:             (item['lng'] as num?)?.toDouble(),
        googleMapsQuery: item['google_maps_query'] as String?,
      );
    } catch (e) {
      debugPrint('Skipping malformed suggestion: $e');
      return null;
    }
  }

  AiSuggestionCategory _parseCategory(String value) {
    switch (value) {
      case 'restaurant': return AiSuggestionCategory.restaurant;
      case 'cafe':       return AiSuggestionCategory.cafe;
      case 'rain':       return AiSuggestionCategory.rain;
      case 'drive':      return AiSuggestionCategory.drive;
      default:           return AiSuggestionCategory.activity;
    }
  }

  AiFailure _handleDioError(DioException e) {
    debugPrint('❌ AI Dio error: ${e.type} — ${e.message}');
    switch (e.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.connectionTimeout:
        return const AiFailure(AiFailureReason.noInternet);
      case DioExceptionType.receiveTimeout:
        return const AiFailure(AiFailureReason.apiError,
            message: 'Request timed out');
      default:
        if (e.response?.statusCode == 429) {
          return const AiFailure(AiFailureReason.rateLimited);
        }
        return AiFailure(AiFailureReason.apiError,
            message: e.response?.statusCode?.toString());
    }
  }
}
