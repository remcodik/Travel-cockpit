// lib/data/repositories/ai_repository.dart
//
// Business logic layer between the provider and the API client.
// Handles: caching, offline detection, context building.

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../domain/models/ai_suggestion.dart';
import '../../domain/models/ai_context.dart';
import '../remote/anthropic_client.dart';

class AiRepository {
  final AnthropicClient _client;
  final SharedPreferences _prefs;

  static const _cachePrefix    = 'ai_cache_';
  static const _cacheTimePrefix = 'ai_cache_time_';
  static const _cacheDuration  = Duration(hours: 24);

  AiRepository({
    required AnthropicClient client,
    required SharedPreferences prefs,
  })  : _client = client,
        _prefs = prefs;

  /// Get suggestions. Returns cached if fresh, otherwise fetches from API.
  Future<AiResult> getSuggestions({
    required AiContext context,
    bool forceRefresh = false,
  }) async {
    final cacheKey = _buildCacheKey(context);

    // Try cache first unless force refresh
    if (!forceRefresh) {
      final cached = _loadFromCache(cacheKey);
      if (cached != null) {
        debugPrint('💾 AI: returning ${cached.length} cached suggestions');
        return AiSuccess(cached);
      }
    }

    // Fetch from API
    final result = await _client.fetchSuggestions(context);

    // Cache successful results
    if (result is AiSuccess) {
      await _saveToCache(cacheKey, result.suggestions);
    }

    return result;
  }

  /// Load more suggestions appended to the current list.
  Future<AiResult> loadMore({
    required AiContext context,
    required List<AiSuggestion> existing,
  }) async {
    // Pass existing names so AI doesn't duplicate them
    final enrichedContext = AiContext(
      accommodationName:      context.accommodationName,
      accommodationLocation:  context.accommodationLocation,
      country:                context.country,
      countryCode:            context.countryCode,
      today:                  context.today,
      temperatureCelsius:     context.temperatureCelsius,
      weatherCondition:       context.weatherCondition,
      rainProbabilityPercent: context.rainProbabilityPercent,
      userPreferences:        context.userPreferences,
      alreadyPlanned: [
        ...context.alreadyPlanned,
        ...existing.map((s) => s.name),
      ],
      filter:   context.filter,
      language: context.language,
    );

    // Don't cache "load more" results
    return _client.fetchSuggestions(enrichedContext);
  }

  /// Clear all AI caches. Called when trip changes.
  Future<void> clearCache() async {
    final keys = _prefs.getKeys()
        .where((k) => k.startsWith(_cachePrefix) ||
                      k.startsWith(_cacheTimePrefix))
        .toList();
    for (final key in keys) {
      await _prefs.remove(key);
    }
    debugPrint('🗑️ AI cache cleared');
  }

  // ── Private ──────────────────────────────────────────

  String _buildCacheKey(AiContext context) {
    final filterStr = context.filter?.name ?? 'all';
    final prefsStr  = context.userPreferences.join(',');
    return '$_cachePrefix${context.countryCode}_${context.accommodationName}_$filterStr$prefsStr'
        .replaceAll(' ', '_')
        .toLowerCase();
  }

  List<AiSuggestion>? _loadFromCache(String key) {
    final timeKey  = key.replaceFirst(_cachePrefix, _cacheTimePrefix);
    final savedAt  = _prefs.getInt(timeKey);
    if (savedAt == null) return null;

    final age = DateTime.now().millisecondsSinceEpoch - savedAt;
    if (age > _cacheDuration.inMilliseconds) {
      debugPrint('⏰ AI cache expired for $key');
      return null;
    }

    final json = _prefs.getString(key);
    if (json == null) return null;

    try {
      final list = jsonDecode(json) as List<dynamic>;
      return list
          .map((item) => AiSuggestion.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('Cache parse error: $e');
      return null;
    }
  }

  Future<void> _saveToCache(
      String key, List<AiSuggestion> suggestions) async {
    final timeKey = key.replaceFirst(_cachePrefix, _cacheTimePrefix);
    final json    = jsonEncode(suggestions.map((s) => s.toJson()).toList());
    await _prefs.setString(key, json);
    await _prefs.setInt(timeKey, DateTime.now().millisecondsSinceEpoch);
    debugPrint('💾 AI: cached ${suggestions.length} suggestions');
  }
}
