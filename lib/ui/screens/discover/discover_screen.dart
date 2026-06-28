// lib/ui/screens/discover/discover_screen.dart
//
// The AI Ideeën screen. Shows Claude suggestions, handles filters,
// lets the user add to planning with one tap.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/ai_suggestion.dart';
import '../../../domain/models/ai_context.dart';
import '../../../providers/ai_provider.dart';
import 'widgets/suggestion_card.dart';
import 'widgets/ai_header.dart';
import 'widgets/filter_chips_row.dart';
import 'widgets/empty_state.dart';

class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  // In the real app these come from TripProvider / AccommodationProvider.
  // Hardcoded here for the AI integration demo.
  AiContext get _context => AiContext(
    accommodationName:      'Skjåk Solside',
    accommodationLocation:  'Skjåk, Noorwegen',
    country:                'Noorwegen',
    countryCode:            'NO',
    today:                  DateTime.now(),
    temperatureCelsius:     18,
    weatherCondition:       'Licht bewolkt',
    rainProbabilityPercent: 10,
    userPreferences:        ['natuur', 'wandelen', 'fotografie'],
    alreadyPlanned:         ['Dønfoss', 'Grotli Uitzichtpunt', 'Pollfoss Café'],
    language:               'nl',
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiProvider.notifier).load(context: _context);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header with AI context ──
            AiHeader(
              accommodationName: _context.accommodationName,
              weather: '${_context.temperatureCelsius?.round()}°C · '
                  '${_context.weatherCondition}',
              onRefresh: () => ref.read(aiProvider.notifier).load(
                context: _context,
                forceRefresh: true,
              ),
            ),

            // ── Category filter chips ──
            FilterChipsRow(
              activeFilter: state.activeFilter,
              onFilterChanged: (filter) => ref
                  .read(aiProvider.notifier)
                  .setFilter(filter, _context),
            ),

            // ── Main content ──
            Expanded(
              child: _buildContent(state),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(AiState state) {
    switch (state.status) {
      case AiLoadStatus.initial:
      case AiLoadStatus.loading:
        return _buildLoading();

      case AiLoadStatus.offline:
        return EmptyState(
          emoji: '📵',
          title: 'Offline',
          message: state.suggestions.isNotEmpty
              ? 'Je ziet opgeslagen ideeën van maximaal 24 uur geleden.'
              : 'Geen internet. Verbind om nieuwe ideeën te laden.',
          showRetry: true,
          onRetry: () => ref.read(aiProvider.notifier).load(
            context: _context,
            forceRefresh: true,
          ),
          child: state.suggestions.isNotEmpty
              ? _buildList(state)
              : null,
        );

      case AiLoadStatus.error:
        return EmptyState(
          emoji: '⚠️',
          title: 'Kon ideeën niet laden',
          message: state.errorMessage ?? 'Probeer het opnieuw.',
          showRetry: true,
          onRetry: () => ref.read(aiProvider.notifier).load(
            context: _context,
            forceRefresh: true,
          ),
        );

      case AiLoadStatus.success:
        if (state.suggestions.isEmpty) {
          return EmptyState(
            emoji: '🔍',
            title: 'Geen ideeën gevonden',
            message: 'Probeer een andere categorie.',
            showRetry: false,
          );
        }
        return _buildList(state);
    }
  }

  Widget _buildLoading() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => const _SkeletonCard(),
    );
  }

  Widget _buildList(AiState state) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: state.suggestions.length + 1, // +1 for load more button
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        if (index == state.suggestions.length) {
          return _buildLoadMoreButton(state);
        }
        final suggestion = state.suggestions[index];
        return SuggestionCard(
          suggestion: suggestion,
          onAdd: () => _addToPlan(suggestion),
          onNavigate: () => _openNavigation(suggestion),
          onTap: () => _showDetail(suggestion),
        );
      },
    );
  }

  Widget _buildLoadMoreButton(AiState state) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: OutlinedButton.icon(
        onPressed: state.isLoadingMore
            ? null
            : () => ref.read(aiProvider.notifier).loadMore(_context),
        icon: state.isLoadingMore
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primary,
                ),
              )
            : const Icon(Icons.refresh, size: 18),
        label: Text(
          state.isLoadingMore ? 'Laden…' : '↻  Meer ideeën laden',
        ),
      ),
    );
  }

  void _addToPlan(AiSuggestion suggestion) {
    // Mark as added in UI
    ref.read(aiProvider.notifier).markAdded(suggestion.name);

    // TODO: connect to PlanningProvider.addItem() in Phase 2

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓  ${suggestion.name} toegevoegd aan planning'),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _openNavigation(AiSuggestion suggestion) async {
    final query = suggestion.googleMapsQuery ?? suggestion.name;
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(query)}',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showDetail(AiSuggestion suggestion) {
    // TODO: navigate to activity detail screen in Phase 2
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SuggestionDetailSheet(suggestion: suggestion),
    );
  }
}

// ── Skeleton loading card ──────────────────────────────

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 96,
            decoration: const BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(15),
                bottomLeft: Radius.circular(15),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                    height: 14, width: 160,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(7),
                    )),
                const SizedBox(height: 8),
                Container(
                    height: 11, width: 220,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(6),
                    )),
                const SizedBox(height: 6),
                Container(
                    height: 11, width: 140,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(6),
                    )),
              ],
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
    );
  }
}

// ── Quick detail bottom sheet ──────────────────────────

class _SuggestionDetailSheet extends StatelessWidget {
  final AiSuggestion suggestion;
  const _SuggestionDetailSheet({required this.suggestion});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      maxChildSize: 0.9,
      minChildSize: 0.3,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: ListView(
          controller: controller,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          children: [
            // Drag handle
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Category + name
            Row(
              children: [
                Text(suggestion.category.emoji,
                    style: const TextStyle(fontSize: 28)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    suggestion.name,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // Rating + distance
            Row(
              children: [
                if (suggestion.rating != null) ...[
                  const Icon(Icons.star_rounded,
                      color: AppColors.amber, size: 16),
                  const SizedBox(width: 3),
                  Text(
                    suggestion.rating!.toStringAsFixed(1),
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                const Icon(Icons.near_me_outlined,
                    size: 14, color: AppColors.textThird),
                const SizedBox(width: 3),
                Text(
                  '${suggestion.distanceKm.toStringAsFixed(1)} km',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textThird,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (suggestion.durationMinutes > 0) ...[
                  const SizedBox(width: 12),
                  const Icon(Icons.schedule_outlined,
                      size: 14, color: AppColors.textThird),
                  const SizedBox(width: 3),
                  Text(
                    _formatDuration(suggestion.durationMinutes),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textThird,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),
            // Description
            Text(
              suggestion.description,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecond,
                height: 1.65,
              ),
            ),
            const SizedBox(height: 12),
            // Why recommended
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Text('🤖', style: TextStyle(fontSize: 16)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      suggestion.whyRecommended,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Action buttons
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                // Add to plan — trigger from parent in production
              },
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Toevoegen aan planning'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () async {
                final query = suggestion.googleMapsQuery ?? suggestion.name;
                final uri = Uri.parse(
                  'https://www.google.com/maps/search/?api=1&query='
                  '${Uri.encodeComponent(query)}',
                );
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              },
              icon: const Icon(Icons.map_outlined, size: 18),
              label: const Text('Navigeer via Google Maps'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) return '${minutes}min';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m == 0 ? '${h}u' : '${h}u ${m}min';
  }
}
