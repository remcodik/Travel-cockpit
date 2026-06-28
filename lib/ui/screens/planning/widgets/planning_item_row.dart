import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/planning_item.dart';
import '../../../../domain/models/place.dart';
import '../../../../providers/place_provider.dart';

class PlanningItemRow extends ConsumerWidget {
  final int? index;
  final PlanningItem item;
  final VoidCallback onTap;
  final VoidCallback onCheck;
  final VoidCallback onDelete;

  const PlanningItemRow({
    super.key,
    required this.index,
    required this.item,
    required this.onTap,
    required this.onCheck,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placeAsync = ref.watch(placeByIdProvider(item.placeId));
    final done = item.isCompleted;

    return placeAsync.when(
      loading: () => _buildSkeleton(),
      error:   (_, __) => _buildRow(null, done),
      data:    (place) => _buildRow(place, done),
    );
  }

  Widget _buildSkeleton() {
    return Container(
      height: 76,
      margin: const EdgeInsets.only(bottom: 0),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(children: [
        const SizedBox(width: 14),
        Container(width: 26, height: 26,
            decoration: const BoxDecoration(
                color: AppColors.primaryLight, shape: BoxShape.circle)),
        const SizedBox(width: 10),
        Container(width: 48, height: 48, decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(12))),
        const SizedBox(width: 12),
        Expanded(child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(height: 12, width: 140, decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(6))),
            const SizedBox(height: 6),
            Container(height: 10, width: 90, decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(5))),
          ],
        )),
      ]),
    );
  }

  Widget _buildRow(Place? place, bool done) {
    final name    = place?.name     ?? 'Activiteit';
    final emoji   = place?.category.emoji ?? '📍';
    final subText = place?.description?.split('.').first ?? '';

    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.flagRed,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline_rounded,
            color: Colors.white, size: 24),
      ),
      confirmDismiss: (_) async { onDelete(); return false; },
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: done ? AppColors.background : AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: done ? AppColors.border : AppColors.border),
            boxShadow: done ? null : const [
              BoxShadow(color: Color(0x080F2E1E),
                  blurRadius: 6, offset: Offset(0, 2)),
            ],
          ),
          child: Row(children: [
            // Index badge
            if (index != null)
              Container(
                width: 26, height: 26,
                decoration: BoxDecoration(
                  color: done ? AppColors.border : AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: Center(child: Text('$index',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
                        color: done ? AppColors.textThird : Colors.white))),
              )
            else
              Container(width: 8, height: 8,
                  decoration: BoxDecoration(
                    color: done ? AppColors.border : AppColors.primaryMid,
                    shape: BoxShape.circle)),
            const SizedBox(width: 10),
            // Emoji thumb
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: done
                    ? const Color(0xFFF0EDE8)
                    : AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(child: Text(emoji,
                  style: const TextStyle(fontSize: 22))),
            ),
            const SizedBox(width: 12),
            // Name + sub
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w700,
                      color: done
                          ? AppColors.textThird : AppColors.textPrimary,
                      decoration: done ? TextDecoration.lineThrough : null,
                    ),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                if (subText.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(subText,
                      style: const TextStyle(fontSize: 11,
                          color: AppColors.textThird),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ],
            )),
            const SizedBox(width: 8),
            // Checkmark
            GestureDetector(
              onTap: onCheck,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 26, height: 26,
                decoration: BoxDecoration(
                  color: done ? AppColors.action : Colors.transparent,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: done ? AppColors.action : AppColors.border,
                    width: 2,
                  ),
                ),
                child: done
                    ? const Icon(Icons.check_rounded,
                        color: Colors.white, size: 14)
                    : null,
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
