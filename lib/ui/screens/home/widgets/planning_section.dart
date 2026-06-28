import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/planning_item.dart';
import '../../../../providers/planning_provider.dart';

class PlanningSection extends ConsumerWidget {
  final AsyncValue<List<PlanningItem>> planningAsync;
  const PlanningSection({super.key, required this.planningAsync});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Gepland vandaag',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
            GestureDetector(
              onTap: () => context.push('/planning'),
              child: const Text('Alles bekijken',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                      color: AppColors.action)),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: planningAsync.when(
            loading: () => const _LoadingRows(),
            error:   (_, __) => const _EmptyPlanning(),
            data:    (items) => items.isEmpty
                ? const _EmptyPlanning()
                : _PlanningList(items: items, ref: ref),
          ),
        ),
      ],
    );
  }
}

class _PlanningList extends StatelessWidget {
  final List<PlanningItem> items;
  final WidgetRef ref;
  const _PlanningList({required this.items, required this.ref});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ...items.take(3).toList().asMap().entries.map((entry) {
          final i    = entry.key;
          final item = entry.value;
          return _PlanningRow(
            index: i + 1,
            item: item,
            onTap: () => context.push('/place/\${item.placeId}'),
            onCheck: () => ref.read(planningNotifierProvider.notifier)
                .markCompleted(item.id),
          );
        }),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context.push('/planning'),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Activiteit toevoegen'),
            ),
          ),
        ),
      ],
    );
  }
}

class _PlanningRow extends StatelessWidget {
  final int index;
  final PlanningItem item;
  final VoidCallback onTap;
  final VoidCallback onCheck;

  const _PlanningRow({
    required this.index,
    required this.item,
    required this.onTap,
    required this.onCheck,
  });

  @override
  Widget build(BuildContext context) {
    final done = item.isCompleted;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            // Number
            Container(
              width: 26, height: 26,
              decoration: const BoxDecoration(
                color: AppColors.primary, shape: BoxShape.circle),
              child: Center(child: Text('\$index',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
                      color: Colors.white))),
            ),
            const SizedBox(width: 10),
            // Thumb
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(child: Text('\U0001f3d4\ufe0f',
                  style: TextStyle(fontSize: 22))),
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Activiteit \$index',
                      style: TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700,
                        color: done ? AppColors.textThird : AppColors.textPrimary,
                        decoration: done ? TextDecoration.lineThrough : null,
                      )),
                  const Text('Tap om te openen',
                      style: TextStyle(fontSize: 12, color: AppColors.textThird)),
                ],
              ),
            ),
            // Check
            GestureDetector(
              onTap: onCheck,
              child: Container(
                width: 24, height: 24,
                decoration: BoxDecoration(
                  color: done ? AppColors.action : Colors.transparent,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: done ? AppColors.action : AppColors.border,
                    width: 2,
                  ),
                ),
                child: done
                    ? const Icon(Icons.check, color: Colors.white, size: 14)
                    : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyPlanning extends StatelessWidget {
  const _EmptyPlanning();
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(20),
    child: Column(
      children: [
        const Text('\U0001f4c5', style: TextStyle(fontSize: 32)),
        const SizedBox(height: 8),
        const Text('Niets gepland vandaag',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700,
                color: AppColors.textPrimary)),
        const SizedBox(height: 4),
        const Text('Voeg een activiteit toe of bekijk AI idee\u00ebn.',
            style: TextStyle(fontSize: 12, color: AppColors.textThird),
            textAlign: TextAlign.center),
        const SizedBox(height: 14),
        OutlinedButton(
          onPressed: () => context.push('/discover'),
          child: const Text('Bekijk AI idee\u00ebn \u2728'),
        ),
      ],
    ),
  );
}

class _LoadingRows extends StatelessWidget {
  const _LoadingRows();
  @override
  Widget build(BuildContext context) => Column(
    children: List.generate(2, (_) => Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.border,
        borderRadius: BorderRadius.circular(12),
      ),
    )),
  );
}
