import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/planning_item.dart';
import '../../../../providers/planning_provider.dart';
import '../../../../providers/place_provider.dart';

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
            data: (items) {
              // Only show non-completed items, max 3
              final active = items.where((i) => !i.isCompleted).take(3).toList();
              return active.isEmpty
                  ? const _EmptyPlanning()
                  : _PlanningList(items: active);
            },
          ),
        ),
      ],
    );
  }
}

class _PlanningList extends ConsumerWidget {
  final List<PlanningItem> items;
  const _PlanningList({required this.items});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(children: [
      ...items.asMap().entries.map((e) {
        final item = e.value;
        return _HomeItemRow(
          index:   e.key + 1,
          item:    item,
          onTap:   () => context.push('/place/${item.placeId}'),
          onCheck: () => ref.read(planningNotifierProvider.notifier)
              .markCompleted(item.id),
        );
      }),
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        child: SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => context.push('/discover'),
            icon: const Text('✨'),
            label: const Text('AI ideeën bekijken'),
          ),
        ),
      ),
    ]);
  }
}

// Shows real place name from DB
class _HomeItemRow extends ConsumerWidget {
  final int index;
  final PlanningItem item;
  final VoidCallback onTap;
  final VoidCallback onCheck;

  const _HomeItemRow({required this.index, required this.item,
      required this.onTap, required this.onCheck});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placeAsync = ref.watch(placeByIdProvider(item.placeId));
    final place = placeAsync.valueOrNull;
    final name  = place?.name     ?? '…';
    final emoji = place?.category.emoji ?? '📍';
    final sub   = place?.description?.split('.').first ?? '';
    final done  = item.isCompleted;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(children: [
          // Number badge
          Container(width: 26, height: 26,
            decoration: BoxDecoration(
              color: done ? AppColors.border : AppColors.primary,
              shape: BoxShape.circle),
            child: Center(child: Text('$index',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
                    color: done ? AppColors.textThird : Colors.white)))),
          const SizedBox(width: 10),
          // Emoji thumb
          Container(width: 48, height: 48,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12)),
            child: Center(child: Text(emoji,
                style: const TextStyle(fontSize: 22)))),
          const SizedBox(width: 12),
          // Name
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: TextStyle(fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: done ? AppColors.textThird : AppColors.textPrimary,
                  decoration: done ? TextDecoration.lineThrough : null),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              if (sub.isNotEmpty)
                Text(sub, style: const TextStyle(fontSize: 11,
                    color: AppColors.textThird),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
            ])),
          // Check
          GestureDetector(
            onTap: onCheck,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 24, height: 24,
              decoration: BoxDecoration(
                color: done ? AppColors.action : Colors.transparent,
                shape: BoxShape.circle,
                border: Border.all(
                  color: done ? AppColors.action : AppColors.border,
                  width: 2)),
              child: done
                  ? const Icon(Icons.check_rounded,
                      color: Colors.white, size: 14)
                  : null)),
        ]),
      ),
    );
  }
}

class _EmptyPlanning extends StatelessWidget {
  const _EmptyPlanning();
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(20),
    child: Column(children: [
      const Text('📅', style: TextStyle(fontSize: 32)),
      const SizedBox(height: 8),
      const Text('Niets gepland vandaag', style: TextStyle(
          fontSize: 14, fontWeight: FontWeight.w700,
          color: AppColors.textPrimary)),
      const SizedBox(height: 4),
      const Text('Voeg activiteiten toe via AI ideeën.',
          style: TextStyle(fontSize: 12, color: AppColors.textThird),
          textAlign: TextAlign.center),
      const SizedBox(height: 14),
      OutlinedButton(
        onPressed: () => context.push('/discover'),
        child: const Text('Bekijk AI ideeën ✨')),
    ]));
}

class _LoadingRows extends StatelessWidget {
  const _LoadingRows();
  @override
  Widget build(BuildContext context) => Column(
    children: List.generate(2, (_) => Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.border,
        borderRadius: BorderRadius.circular(12)))));
}
