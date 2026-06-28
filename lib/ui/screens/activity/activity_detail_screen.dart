import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/place.dart';
import '../../../domain/models/planning_item.dart';
import '../../../providers/place_provider.dart';
import '../../../providers/planning_provider.dart';

class ActivityDetailScreen extends ConsumerWidget {
  final String placeId;
  const ActivityDetailScreen({super.key, required this.placeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placeAsync = ref.watch(placeByIdProvider(placeId));

    return placeAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(
        body: Center(child: Text('Fout: $e'))),
      data: (place) => place == null
          ? const Scaffold(body: Center(child: Text('Niet gevonden')))
          : _DetailBody(place: place),
    );
  }
}

class _DetailBody extends ConsumerWidget {
  final Place place;
  const _DetailBody({required this.place});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allPlanning = ref.watch(allPlanningProvider).valueOrNull ?? [];
    final inPlan = allPlanning.any((i) => i.placeId == place.id);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(slivers: [
        // Hero
        SliverToBoxAdapter(child: _Hero(place: place)),
        // Action bar
        SliverToBoxAdapter(child: _ActionBar(place: place)),
        // Content
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // In planning badge
              if (inPlan)
                _InPlanBadge(
                  onRemove: () async {
                    final item = allPlanning.firstWhere(
                        (i) => i.placeId == place.id);
                    await ref.read(planningNotifierProvider.notifier)
                        .remove(item.id);
                    if (context.mounted) {
                      _snack(context, 'Verwijderd uit planning');
                    }
                  },
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      await ref.read(planningNotifierProvider.notifier)
                          .addPlace(place);
                      if (context.mounted) {
                        _snack(context,
                            '✓ ${place.name} toegevoegd aan planning');
                      }
                    },
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Toevoegen aan planning'),
                  ),
                ),
              const SizedBox(height: 20),
              // Description
              if (place.description != null &&
                  place.description!.isNotEmpty) ...[
                _SectionTitle('Over deze plek'),
                const SizedBox(height: 8),
                Text(place.description!,
                    style: const TextStyle(fontSize: 14,
                        color: AppColors.textSecond, height: 1.65)),
                const SizedBox(height: 20),
              ],
              // Category chips
              Wrap(spacing: 7, runSpacing: 6, children: [
                _Chip(place.category.emoji + ' ' + place.category.label),
                if (place.rating != null)
                  _Chip('⭐ ${place.rating!.toStringAsFixed(1)}'),
              ]),
              const SizedBox(height: 20),
              // Notes
              if (place.notes != null && place.notes!.isNotEmpty) ...[
                _SectionTitle('Notities'),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(place.notes!,
                      style: const TextStyle(fontSize: 13,
                          color: AppColors.primaryDark,
                          fontWeight: FontWeight.w500, height: 1.5)),
                ),
                const SizedBox(height: 20),
              ],
              // Mark as done (if in planning)
              if (inPlan) ...[
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final items = ref.read(allPlanningProvider).valueOrNull ?? [];
                      final item = items.firstWhere(
                          (i) => i.placeId == place.id);
                      if (item.isCompleted) {
                        await ref.read(planningNotifierProvider.notifier)
                            .markPlanned(item.id);
                        if (context.mounted) _snack(context, 'Teruggezet naar gepland');
                      } else {
                        await ref.read(planningNotifierProvider.notifier)
                            .markCompleted(item.id);
                        if (context.mounted) _snack(context, '✓ Gemarkeerd als gedaan!');
                      }
                    },
                    icon: const Icon(Icons.check_circle_outline_rounded),
                    label: Text(_isDone(ref)
                        ? 'Terugzetten naar gepland'
                        : 'Markeren als gedaan ✓'),
                  ),
                ),
              ],
            ]),
        )),
      ]),
    );
  }

  bool _isDone(WidgetRef ref) {
    final items = ref.read(allPlanningProvider).valueOrNull ?? [];
    try {
      return items.firstWhere((i) => i.placeId == place.id).isCompleted;
    } catch (_) { return false; }
  }

  void _snack(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: AppColors.primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      duration: const Duration(seconds: 2),
    ));
  }
}

// ── Sub-widgets ────────────────────────────────────────

class _Hero extends StatelessWidget {
  final Place place;
  const _Hero({required this.place});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 240,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A2418), Color(0xFF1B4D35), Color(0xFF1A3F6F)],
        ),
      ),
      child: Stack(children: [
        // Big emoji
        Center(child: Text(place.category.emoji,
            style: const TextStyle(fontSize: 80))),
        // Gradient
        Positioned.fill(child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter, end: Alignment.bottomCenter,
              colors: [Colors.transparent, Colors.black.withOpacity(0.6)]),
          ),
        )),
        // Back button
        Positioned(
          top: MediaQuery.of(context).padding.top + 8, left: 14,
          child: GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withOpacity(0.2)),
              ),
              child: const Icon(Icons.arrow_back_rounded,
                  color: Colors.white, size: 20),
            ),
          ),
        ),
        // Fav + share
        Positioned(
          top: MediaQuery.of(context).padding.top + 8, right: 14,
          child: Row(children: [
            _HeroBtn(icon: Icons.favorite_border_rounded,
                onTap: () {}),
            const SizedBox(width: 8),
            _HeroBtn(icon: Icons.share_outlined,
                onTap: () {}),
          ]),
        ),
        // Title
        Positioned(bottom: 16, left: 16, right: 16,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(place.name,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800,
                    color: Colors.white, letterSpacing: -0.4,
                    shadows: [Shadow(blurRadius: 8)])),
            const SizedBox(height: 4),
            Text(place.category.label,
                style: const TextStyle(fontSize: 13, color: Colors.white70)),
          ])),
      ]),
    );
  }
}

class _HeroBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _HeroBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 38, height: 38,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.3), shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withOpacity(0.2))),
      child: Icon(icon, color: Colors.white, size: 18),
    ),
  );
}

class _ActionBar extends StatelessWidget {
  final Place place;
  const _ActionBar({required this.place});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Row(children: [
        _Btn(icon: Icons.map_outlined,     label: 'Route',
            onTap: () => _mapsRoute(place)),
        _Btn(icon: Icons.explore_outlined,  label: 'Komoot',
            onTap: () => _komoot(place)),
        _Btn(icon: Icons.language_outlined, label: 'Website',
            onTap: () {}),
        _Btn(icon: Icons.share_outlined,    label: 'Delen',
            onTap: () {}),
      ]),
    );
  }

  Future<void> _mapsRoute(Place place) async {
    final uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1'
        '&destination=${place.latitude},${place.longitude}');
    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _komoot(Place place) async {
    final uri = Uri.parse(
        'https://www.komoot.com/search/${Uri.encodeComponent(place.name)}');
    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _Btn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _Btn({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => Expanded(
    child: InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 13),
        child: Column(children: [
          Icon(icon, size: 22, color: AppColors.textSecond),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 10,
              color: AppColors.textSecond, fontWeight: FontWeight.w600)),
        ]),
      ),
    ),
  );
}

class _InPlanBadge extends StatelessWidget {
  final VoidCallback onRemove;
  const _InPlanBadge({required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFA8D5B5), width: 1.5),
      ),
      child: Row(children: [
        const Text('✅', style: TextStyle(fontSize: 18)),
        const SizedBox(width: 9),
        const Expanded(child: Text('In planning',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800,
                color: AppColors.primaryDark))),
        GestureDetector(
          onTap: onRemove,
          child: const Icon(Icons.close_rounded,
              color: AppColors.textThird, size: 18),
        ),
      ]),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) => Text(text.toUpperCase(),
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
          letterSpacing: 0.6, color: AppColors.textThird));
}

class _Chip extends StatelessWidget {
  final String label;
  const _Chip(this.label);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    decoration: BoxDecoration(
      color: AppColors.primaryLight,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: AppColors.border)),
    child: Text(label, style: const TextStyle(fontSize: 12,
        fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
  );
}
