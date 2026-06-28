import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/planning_item.dart';
import '../../../../domain/models/place.dart';
import '../../../../providers/planning_provider.dart';
import '../../../../providers/place_provider.dart';
import '../../../../providers/trip_provider.dart';
import '../../../../providers/database_provider.dart';

// Real counts from DB for the active trip
final _restaurantCountProvider = FutureProvider<int>((ref) async {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return 0;
  final repo = ref.watch(placeRepositoryProvider);
  final cafes = await repo.getByCategory(trip.id, PlaceCategory.cafe);
  final rests = await repo.getByCategory(trip.id, PlaceCategory.restaurant);
  return cafes.length + rests.length;
});

final _ticketCountProvider = FutureProvider<int>((ref) async {
  // Tickets in planning with category ticket — placeholder until TicketModel
  return 1; // Klimapark ticket from seed
});

class StatsRow extends ConsumerWidget {
  final String tripId;
  final AsyncValue<List<PlanningItem>> planningAsync;

  const StatsRow({
    super.key,
    required this.tripId,
    required this.planningAsync,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Count planned (non-completed) items
    final allPlanned = planningAsync.valueOrNull
            ?.where((i) => !i.isCompleted).length ?? 0;
    final done = planningAsync.valueOrNull
            ?.where((i) => i.isCompleted).length ?? 0;
    final restCount = ref.watch(_restaurantCountProvider).valueOrNull ?? 0;
    final ticketCount = ref.watch(_ticketCountProvider).valueOrNull ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(color: Color(0x080F2E1E), blurRadius: 8, offset: Offset(0,2)),
        ],
      ),
      child: Row(children: [
        _Stat(icon: '🏔️', count: allPlanned.toString(),
            label: 'Te doen',
            onTap: () => context.push('/planning')),
        _Stat(icon: '✅', count: done.toString(),
            label: 'Gedaan',
            onTap: () => context.push('/planning')),
        _Stat(icon: '🎟️', count: ticketCount.toString(),
            label: 'Tickets',
            onTap: () => context.push('/tickets')),
        _Stat(icon: '⚡', count: '4',
            label: 'Laders nabij',
            onTap: () => context.push('/charging'),
            isLast: true),
      ]),
    );
  }
}

class _Stat extends StatelessWidget {
  final String icon, count, label;
  final VoidCallback onTap;
  final bool isLast;

  const _Stat({required this.icon, required this.count,
      required this.label, required this.onTap, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
          decoration: BoxDecoration(
            border: isLast ? null : const Border(
              right: BorderSide(color: AppColors.border)),
          ),
          child: Column(children: [
            Text(icon, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(count, style: const TextStyle(fontSize: 17,
                fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 9,
                color: AppColors.textThird, fontWeight: FontWeight.w600),
                textAlign: TextAlign.center, maxLines: 2),
          ]),
        ),
      ),
    );
  }
}
