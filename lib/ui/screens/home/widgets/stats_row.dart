import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/planning_item.dart';

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
    final count = planningAsync.valueOrNull?.length ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(color: Color(0x080F2E1E), blurRadius: 8, offset: Offset(0,2)),
        ],
      ),
      child: Row(
        children: [
          _Stat(icon: '\U0001f3d4\ufe0f', count: count.toString(),
              label: 'Geplande activiteiten',
              onTap: () => context.push('/planning')),
          _Stat(icon: '\U0001f37d\ufe0f', count: '2',
              label: 'Restaurants & cafés',
              onTap: () => context.push('/discover')),
          _Stat(icon: '\U0001f39f\ufe0f', count: '1', label: 'Tickets',
              onTap: () => context.push('/tickets'), isLast: false),
          _Stat(icon: '\u26a1', count: '7', label: 'Laadpunten',
              onTap: () => context.push('/charging'), isLast: true),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String icon;
  final String count;
  final String label;
  final VoidCallback onTap;
  final bool isLast;

  const _Stat({
    required this.icon,
    required this.count,
    required this.label,
    required this.onTap,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
          decoration: BoxDecoration(
            border: isLast ? null : const Border(
              right: BorderSide(color: AppColors.border),
            ),
          ),
          child: Column(
            children: [
              Text(icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(height: 4),
              Text(count,
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 2),
              Text(label,
                  style: const TextStyle(fontSize: 9, color: AppColors.textThird,
                      fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center,
                  maxLines: 2),
            ],
          ),
        ),
      ),
    );
  }
}
