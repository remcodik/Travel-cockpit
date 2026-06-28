import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/place.dart';
import '../../../../providers/database_provider.dart';

// Real category counts from DB for this trip
final _categoryCountsProvider =
    FutureProvider.family<Map<PlaceCategory, int>, String>((ref, tripId) async {
  final repo = ref.watch(placeRepositoryProvider);
  final counts = <PlaceCategory, int>{};
  for (final cat in [
    PlaceCategory.cafe,
    PlaceCategory.restaurant,
    PlaceCategory.evCharging,
    PlaceCategory.supermarket,
    PlaceCategory.fuelStation,
    PlaceCategory.pharmacy,
  ]) {
    final list = await repo.getByCategory(tripId, cat);
    counts[cat] = list.length;
  }
  return counts;
});

class NearbyStrip extends ConsumerWidget {
  final String tripId;
  const NearbyStrip({super.key, required this.tripId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final countsAsync = ref.watch(_categoryCountsProvider(tripId));
    final counts = countsAsync.valueOrNull ?? {};

    // Only show categories that have at least 1 place, plus always-useful ones
    final items = <({String emoji, String label, int count, String route})>[
      (emoji: '☕',  label: 'Café',        count: counts[PlaceCategory.cafe] ?? 0,        route: '/discover'),
      (emoji: '🍽️', label: 'Restaurant',  count: counts[PlaceCategory.restaurant] ?? 0,  route: '/discover'),
      (emoji: '⚡',  label: 'Laadstation', count: counts[PlaceCategory.evCharging] ?? 4,  route: '/charging'),
      (emoji: '🛒', label: 'Supermarkt',  count: counts[PlaceCategory.supermarket] ?? 0, route: '/discover'),
      (emoji: '⛽', label: 'Tankstation', count: counts[PlaceCategory.fuelStation] ?? 0, route: '/discover'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('In de buurt', style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary)),
              GestureDetector(
                onTap: () => context.push('/map'),
                child: const Text('Kaart', style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700,
                    color: AppColors.action))),
            ],
          ),
        ),
        SizedBox(
          height: 84,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final item = items[i];
              return GestureDetector(
                onTap: () => context.push(item.route),
                child: Container(
                  width: 68,
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(item.emoji, style: const TextStyle(fontSize: 22)),
                      const SizedBox(height: 4),
                      Text('${item.count}', style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary)),
                      Text(item.label, style: const TextStyle(
                          fontSize: 9, color: AppColors.textThird,
                          fontWeight: FontWeight.w600),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
