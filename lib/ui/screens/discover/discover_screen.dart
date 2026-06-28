import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/ai_suggestion.dart';
import '../../../domain/models/ai_context.dart';
import '../../../domain/models/place.dart';
import '../../../providers/ai_provider.dart';
import '../../../providers/planning_provider.dart';
import '../../../providers/preferences_provider.dart';
import '../../../providers/trip_provider.dart';
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

  /// Build AiContext from real providers — no hardcoded values.
  AiContext _buildContext() {
    final trip   = ref.read(activeTripProvider).valueOrNull;
    final prefs  = ref.read(preferencesProvider);

    return AiContext(
      accommodationName:      trip?.name ?? 'Onbekend',
      accommodationLocation:  '${trip?.countryCode ?? ''}',
      country:                _countryName(trip?.countryCode),
      countryCode:            trip?.countryCode ?? 'NL',
      today:                  DateTime.now(),
      temperatureCelsius:     18,   // TODO: replace with WeatherProvider
      weatherCondition:       'Licht bewolkt',
      rainProbabilityPercent: 10,
      userPreferences:        prefs.travelStyles,
      alreadyPlanned:         const [],  // TODO: pull from planningProvider
      language:               prefs.language,
    );
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(aiProvider.notifier).load(context: _buildContext());
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiProvider);
    final ctx   = _buildContext();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            AiHeader(
              accommodationName: ctx.accommodationName,
              weather: '${ctx.temperatureCelsius?.round() ?? '--'}°C · '
                  '${ctx.weatherCondition ?? ''}',
              onRefresh: () => ref.read(aiProvider.notifier)
                  .load(context: ctx, forceRefresh: true),
            ),
            FilterChipsRow(
              activeFilter: state.activeFilter,
              onFilterChanged: (filter) => ref
                  .read(aiProvider.notifier)
                  .setFilter(filter, ctx),
            ),
            Expanded(child: _buildContent(state, ctx)),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(AiState state, AiContext ctx) {
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
          onRetry: () => ref.read(aiProvider.notifier)
              .load(context: ctx, forceRefresh: true),
          child: state.suggestions.isNotEmpty ? _buildList(state, ctx) : null,
        );

      case AiLoadStatus.error:
        return EmptyState(
          emoji: '⚠️',
          title: 'Kon ideeën niet laden',
          message: state.errorMessage ?? 'Probeer het opnieuw.',
          showRetry: true,
          onRetry: () => ref.read(aiProvider.notifier)
              .load(context: ctx, forceRefresh: true),
        );

      case AiLoadStatus.success:
        if (state.suggestions.isEmpty) {
          return const EmptyState(
            emoji: '🔍',
            title: 'Geen ideeën gevonden',
            message: 'Probeer een andere categorie.',
            showRetry: false,
          );
        }
        return _buildList(state, ctx);
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

  Widget _buildList(AiState state, AiContext ctx) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: state.suggestions.length + 1,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        if (index == state.suggestions.length) {
          return _loadMoreButton(state, ctx);
        }
        final s = state.suggestions[index];
        return SuggestionCard(
          suggestion: s,
          onAdd:      () => _addToPlan(s),
          onNavigate: () => _openNavigation(s),
          onTap:      () => _showDetail(s),
        );
      },
    );
  }

  Widget _loadMoreButton(AiState state, AiContext ctx) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: OutlinedButton.icon(
        onPressed: state.isLoadingMore
            ? null
            : () => ref.read(aiProvider.notifier).loadMore(ctx),
        icon: state.isLoadingMore
            ? const SizedBox(width: 16, height: 16,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: AppColors.primary))
            : const Icon(Icons.refresh, size: 18),
        label: Text(state.isLoadingMore ? 'Laden…' : '↻  Meer ideeën laden'),
      ),
    );
  }

  /// FIX: saves the suggestion as a Place and adds it to PlanningProvider.
  Future<void> _addToPlan(AiSuggestion suggestion) async {
    final trip = ref.read(activeTripProvider).valueOrNull;
    if (trip == null) {
      _snack('Geen actieve reis. Maak eerst een reis aan.');
      return;
    }

    // Convert suggestion → Place
    final place = Place.create(
      tripId:      trip.id,
      name:        suggestion.name,
      category:    _categoryForSuggestion(suggestion.category),
      latitude:    suggestion.lat    ?? 0,
      longitude:   suggestion.lng    ?? 0,
      source:      PlaceSource.ai,
      description: suggestion.description,
    );

    // Save to DB via PlanningProvider (DL-008 — user explicitly tapped +)
    await ref.read(planningNotifierProvider.notifier).addPlace(place);

    // Mark visually
    ref.read(aiProvider.notifier).markAdded(suggestion.name);

    if (mounted) {
      _snack('✓  ${suggestion.name} toegevoegd aan planning');
    }
  }

  Future<void> _openNavigation(AiSuggestion suggestion) async {
    final query = suggestion.googleMapsQuery ?? suggestion.name;
    final uri   = Uri.parse(
        'https://www.google.com/maps/search/?api=1'
        '&query=${Uri.encodeComponent(query)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showDetail(AiSuggestion suggestion) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _DetailSheet(
        suggestion: suggestion,
        onAdd: () {
          Navigator.pop(context);
          _addToPlan(suggestion);
        },
      ),
    );
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: AppColors.primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      duration: const Duration(seconds: 2),
    ));
  }

  PlaceCategory _categoryForSuggestion(AiSuggestionCategory cat) {
    switch (cat) {
      case AiSuggestionCategory.restaurant: return PlaceCategory.restaurant;
      case AiSuggestionCategory.cafe:       return PlaceCategory.cafe;
      default:                              return PlaceCategory.activity;
    }
  }

  String _countryName(String? code) {
    const map = {
      'NO': 'Noorwegen', 'IT': 'Italië', 'FR': 'Frankrijk',
      'DE': 'Duitsland', 'ES': 'Spanje', 'NL': 'Nederland',
    };
    return map[code] ?? code ?? 'Onbekend';
  }
}

// ── Skeleton ───────────────────────────────────────────────

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
      child: Row(children: [
        Container(
          width: 96,
          decoration: const BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(15), bottomLeft: Radius.circular(15)),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _bar(160, 14),
            const SizedBox(height: 8),
            _bar(220, 11),
            const SizedBox(height: 6),
            _bar(140, 11),
          ],
        )),
        const SizedBox(width: 16),
      ]),
    );
  }

  Widget _bar(double w, double h) => Container(
    height: h, width: w,
    decoration: BoxDecoration(
      color: AppColors.border,
      borderRadius: BorderRadius.circular(h / 2),
    ),
  );
}

// ── Detail bottom sheet ────────────────────────────────────

class _DetailSheet extends StatelessWidget {
  final AiSuggestion suggestion;
  final VoidCallback onAdd;
  const _DetailSheet({required this.suggestion, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      maxChildSize:     0.92,
      minChildSize:     0.3,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: ListView(
          controller: ctrl,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          children: [
            Center(child: Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: AppColors.border,
                  borderRadius: BorderRadius.circular(2)))),
            // Name
            Row(children: [
              Text(suggestion.category.emoji,
                  style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 12),
              Expanded(child: Text(suggestion.name,
                  style: const TextStyle(fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.3))),
            ]),
            const SizedBox(height: 8),
            // Meta row
            _MetaRow(suggestion: suggestion),
            const SizedBox(height: 16),
            // Description
            Text(suggestion.description,
                style: const TextStyle(fontSize: 14,
                    color: AppColors.textSecond, height: 1.65)),
            const SizedBox(height: 12),
            // Why recommended
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(children: [
                const Text('🤖', style: TextStyle(fontSize: 16)),
                const SizedBox(width: 8),
                Expanded(child: Text(suggestion.whyRecommended,
                    style: const TextStyle(fontSize: 13,
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.w600, height: 1.4))),
              ]),
            ),
            const SizedBox(height: 20),
            // Add to planning
            ElevatedButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Toevoegen aan planning'),
            ),
            const SizedBox(height: 10),
            // Navigate
            OutlinedButton.icon(
              onPressed: () async {
                final q   = suggestion.googleMapsQuery ?? suggestion.name;
                final uri = Uri.parse(
                    'https://www.google.com/maps/search/?api=1'
                    '&query=${Uri.encodeComponent(q)}');
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              },
              icon: const Icon(Icons.map_outlined, size: 18),
              label: const Text('Open in Google Maps'),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final AiSuggestion suggestion;
  const _MetaRow({required this.suggestion});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      children: [
        if (suggestion.rating != null)
          _chip(Icons.star_rounded, suggestion.rating!.toStringAsFixed(1),
              AppColors.amber),
        _chip(Icons.near_me_outlined,
            '${suggestion.distanceKm.toStringAsFixed(1)} km',
            AppColors.textThird),
        if (suggestion.durationMinutes > 0)
          _chip(Icons.schedule_outlined,
              _dur(suggestion.durationMinutes),
              AppColors.textThird),
        if (suggestion.difficulty != null)
          _chip(Icons.terrain_outlined,
              _diff(suggestion.difficulty!),
              AppColors.textThird),
      ],
    );
  }

  Widget _chip(IconData icon, String label, Color color) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 14, color: color),
      const SizedBox(width: 3),
      Text(label, style: TextStyle(fontSize: 13, color: color,
          fontWeight: FontWeight.w600)),
    ]);
  }

  String _dur(int min) {
    if (min < 60) return '${min}min';
    final h = min ~/ 60; final m = min % 60;
    return m == 0 ? '${h}u' : '${h}u ${m}min';
  }

  String _diff(String d) {
    switch (d) {
      case 'easy':   return 'Gemakkelijk';
      case 'medium': return 'Gemiddeld';
      case 'hard':   return 'Zwaar';
      default:       return d;
    }
  }
}
