// lib/providers/ai_provider.dart
//
// Riverpod state for the AI Discover (Ideeën) screen.
// Manages: loading, suggestions list, filter, add-to-plan actions.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/remote/anthropic_client.dart';
import '../data/repositories/ai_repository.dart';
import '../domain/models/ai_suggestion.dart';
import '../domain/models/ai_context.dart';

// ── Dependency providers ──────────────────────────────

final anthropicClientProvider = Provider<AnthropicClient>((ref) {
  return AnthropicClient();
});

final sharedPrefsProvider = FutureProvider<SharedPreferences>((ref) {
  return SharedPreferences.getInstance();
});

final aiRepositoryProvider = Provider<AiRepository>((ref) {
  final client = ref.watch(anthropicClientProvider);
  // SharedPreferences — use synchronous instance for simplicity
  // In production: use ref.watch(sharedPrefsProvider).value
  // This is initialised in main.dart before runApp()
  assert(_globalPrefs != null,
      'setGlobalPrefs() must be called in main() before runApp()');
  return AiRepository(client: client, prefs: _globalPrefs!);
});

// Set by main.dart before runApp() — avoids async in provider
SharedPreferences? _globalPrefs;
void setGlobalPrefs(SharedPreferences prefs) => _globalPrefs = prefs;

// ── AI State ──────────────────────────────────────────

class AiState {
  final List<AiSuggestion> suggestions;
  final AiSuggestionCategory? activeFilter;
  final AiLoadStatus status;
  final String? errorMessage;
  final bool isLoadingMore;

  const AiState({
    this.suggestions = const [],
    this.activeFilter,
    this.status = AiLoadStatus.initial,
    this.errorMessage,
    this.isLoadingMore = false,
  });

  AiState copyWith({
    List<AiSuggestion>? suggestions,
    AiSuggestionCategory? Function()? activeFilter,
    AiLoadStatus? status,
    String? Function()? errorMessage,
    bool? isLoadingMore,
  }) {
    return AiState(
      suggestions:   suggestions  ?? this.suggestions,
      activeFilter:  activeFilter != null ? activeFilter() : this.activeFilter,
      status:        status       ?? this.status,
      errorMessage:  errorMessage != null ? errorMessage() : this.errorMessage,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }
}

enum AiLoadStatus { initial, loading, success, offline, error }

// ── AI Notifier ───────────────────────────────────────

class AiNotifier extends StateNotifier<AiState> {
  final AiRepository _repository;

  AiNotifier(this._repository) : super(const AiState());

  /// Build a context from current app state and load suggestions.
  Future<void> load({
    required AiContext context,
    bool forceRefresh = false,
  }) async {
    state = state.copyWith(status: AiLoadStatus.loading);

    final result = await _repository.getSuggestions(
      context: context.copyWithFilter(state.activeFilter),
      forceRefresh: forceRefresh,
    );

    _handleResult(result);
  }

  /// Load 5 more suggestions appended to the current list.
  Future<void> loadMore(AiContext context) async {
    if (state.isLoadingMore) return;
    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.loadMore(
      context: context.copyWithFilter(state.activeFilter),
      existing: state.suggestions,
    );

    if (result is AiSuccess) {
      state = state.copyWith(
        suggestions:   [...state.suggestions, ...result.suggestions],
        status:        AiLoadStatus.success,
        isLoadingMore: false,
      );
    } else {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  /// Change category filter and reload.
  Future<void> setFilter(
    AiSuggestionCategory? filter,
    AiContext context,
  ) async {
    state = state.copyWith(
      activeFilter: () => filter,
      suggestions:  [],
      status:       AiLoadStatus.loading,
    );

    final result = await _repository.getSuggestions(
      context: context.copyWithFilter(filter),
      forceRefresh: true,
    );

    _handleResult(result);
  }

  /// Mark suggestion as added to plan (optimistic UI update).
  void markAdded(String suggestionName) {
    state = state.copyWith(
      suggestions: state.suggestions
          .map((s) => s.name == suggestionName
              ? s.copyWith(isAddedToPlan: true)
              : s)
          .toList(),
    );
  }

  void _handleResult(AiResult result) {
    switch (result) {
      case AiSuccess(:final suggestions):
        state = state.copyWith(
          suggestions:  suggestions,
          status:       AiLoadStatus.success,
          errorMessage: () => null,
        );
      case AiFailure(:final reason, :final message):
        state = state.copyWith(
          status:       reason == AiFailureReason.noInternet
              ? AiLoadStatus.offline
              : AiLoadStatus.error,
          errorMessage: () => _errorMessage(reason, message),
        );
    }
  }

  String _errorMessage(AiFailureReason reason, String? message) {
    switch (reason) {
      case AiFailureReason.noInternet:
        return 'Geen internet. Opgeslagen ideeën worden getoond.';
      case AiFailureReason.rateLimited:
        return 'Even geduld — probeer het over een minuut opnieuw.';
      case AiFailureReason.parseError:
        return 'Kon de ideeën niet laden. Probeer het opnieuw.';
      default:
        return 'Er is iets misgegaan. Probeer het opnieuw.';
    }
  }
}

final aiProvider = StateNotifierProvider<AiNotifier, AiState>((ref) {
  final repository = ref.watch(aiRepositoryProvider);
  return AiNotifier(repository);
});

// ── Context extension ─────────────────────────────────

extension AiContextX on AiContext {
  AiContext copyWithFilter(AiSuggestionCategory? filter) {
    return AiContext(
      accommodationName:      accommodationName,
      accommodationLocation:  accommodationLocation,
      country:                country,
      countryCode:            countryCode,
      today:                  today,
      temperatureCelsius:     temperatureCelsius,
      weatherCondition:       weatherCondition,
      rainProbabilityPercent: rainProbabilityPercent,
      userPreferences:        userPreferences,
      alreadyPlanned:         alreadyPlanned,
      filter:                 filter,
      language:               language,
    );
  }
}
