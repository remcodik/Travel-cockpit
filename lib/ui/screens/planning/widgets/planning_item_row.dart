import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/planning_item.dart';
import '../../../../domain/models/place.dart';
import '../../../../providers/place_provider.dart';
import 'day_tab_bar.dart'; // for accForDate / AccommodationDay

class PlanningItemRow extends ConsumerWidget {
  final int? index;
  final PlanningItem item;
  final Color accColor;       // accommodation color for this day
  final VoidCallback onTap;
  final VoidCallback onCheck;
  final VoidCallback onDelete;

  const PlanningItemRow({
    super.key,
    required this.index,
    required this.item,
    required this.accColor,
    required this.onTap,
    required this.onCheck,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placeAsync = ref.watch(placeByIdProvider(item.placeId));
    final done = item.isCompleted;

    return placeAsync.when(
      loading: () => _skeleton(accColor),
      error:   (_, __) => _row(null, done, accColor),
      data:    (place) => _row(place, done, accColor),
    );
  }

  Widget _skeleton(Color color) {
    return Container(
      height: 76,
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(children: [
        // Accommodation color band
        Container(
          width: 4,
          decoration: BoxDecoration(
            color: color,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(15),
              bottomLeft: Radius.circular(15))),
        ),
        const SizedBox(width: 12),
        Container(width: 26, height: 26,
            decoration: const BoxDecoration(
                color: AppColors.primaryLight, shape: BoxShape.circle)),
        const SizedBox(width: 10),
        Container(width: 48, height: 48,
            decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12))),
        const SizedBox(width: 12),
        Expanded(child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(height: 12, width: 140,
                decoration: BoxDecoration(color: AppColors.border,
                    borderRadius: BorderRadius.circular(6))),
            const SizedBox(height: 6),
            Container(height: 10, width: 90,
                decoration: BoxDecoration(color: AppColors.border,
                    borderRadius: BorderRadius.circular(5))),
          ])),
      ]),
    );
  }

  Widget _row(Place? place, bool done, Color color) {
    final name  = place?.name ?? 'Activiteit';
    final emoji = place?.category.emoji ?? '📍';
    final sub   = place?.description?.split('.').first ?? '';

    // Determine accommodation from place's stayId context
    // (we use the date-based color passed in from parent)
    final effectiveColor = done ? AppColors.border : color;

    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.flagRed,
          borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.delete_outline_rounded,
            color: Colors.white, size: 24)),
      confirmDismiss: (_) async { onDelete(); return false; },
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: done ? AppColors.background : AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
                color: done ? AppColors.border : AppColors.border),
            boxShadow: done ? null : const [
              BoxShadow(color: Color(0x080F2E1E),
                  blurRadius: 6, offset: Offset(0, 2))],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: IntrinsicHeight(
              child: Row(crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                // ── Accommodation color band ──────────────
                Container(
                  width: 4,
                  color: effectiveColor,
                ),
                const SizedBox(width: 12),

                // ── Index badge ───────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: index != null
                    ? Container(
                        width: 28, height: 28,
                        decoration: BoxDecoration(
                          color: done ? AppColors.border : effectiveColor,
                          shape: BoxShape.circle),
                        child: Center(child: Text('$index',
                            style: const TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w900,
                              color: Colors.white))))
                    : Container(width: 8, height: 8,
                        margin: const EdgeInsets.only(top: 10),
                        decoration: BoxDecoration(
                          color: done ? AppColors.border : effectiveColor,
                          shape: BoxShape.circle)),
                ),
                const SizedBox(width: 10),

                // ── Emoji thumb ───────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      color: done
                          ? const Color(0xFFF0EDE8)
                          : effectiveColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12)),
                    child: Center(child: Text(emoji,
                        style: const TextStyle(fontSize: 22)))),
                ),
                const SizedBox(width: 12),

                // ── Name + accommodation tag ──────────────
                Expanded(child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(name, style: TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w700,
                          color: done
                              ? AppColors.textThird : AppColors.textPrimary,
                          decoration:
                              done ? TextDecoration.lineThrough : null),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      if (sub.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(sub, style: const TextStyle(
                            fontSize: 11, color: AppColors.textThird),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                      // Accommodation tag (for unscheduled items)
                      if (index == null && item.plannedDate == null) ...[
                        const SizedBox(height: 4),
                        _AccTag(placeId: item.placeId),
                      ],
                    ],
                  ),
                )),
                const SizedBox(width: 8),

                // ── Checkmark ─────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(0, 0, 14, 0),
                  child: Center(child: GestureDetector(
                    onTap: onCheck,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 26, height: 26,
                      decoration: BoxDecoration(
                        color: done ? effectiveColor : Colors.transparent,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: done ? effectiveColor : AppColors.border,
                          width: 2)),
                      child: done
                          ? const Icon(Icons.check_rounded,
                              color: Colors.white, size: 14)
                          : null),
                  )),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

// Shows which accommodation this activity belongs to
// Used for unscheduled items where there's no date context
class _AccTag extends ConsumerWidget {
  final String placeId;
  const _AccTag({required this.placeId});

  // Map stayId keywords to accommodation
  static AccommodationDay? _accForPlace(String name) {
    final n = name.toLowerCase();
    if (n.contains('molden') || n.contains('solvorn') ||
        n.contains('urnes')  || n.contains('bøyabreen'))
      return norwayAccommodations[0]; // Sogndal
    if (n.contains('lom')    || n.contains('bakeriet') ||
        n.contains('klimapark') || n.contains('vegaskjelet') ||
        n.contains('dønfoss') || n.contains('gjelbrue'))
      return norwayAccommodations[1]; // Skjåk
    if (n.contains('besseggen') || n.contains('bygdin') ||
        n.contains('mjølkevegen') || n.contains('gomobu') ||
        n.contains('syndin'))
      return norwayAccommodations[2]; // Valdres
    if (n.contains('solhomfjell') || n.contains('risør') ||
        n.contains('tvedestrand'))
      return norwayAccommodations[3]; // Gjerstad
    return null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placeAsync = ref.watch(placeByIdProvider(placeId));
    final place = placeAsync.valueOrNull;
    if (place == null) return const SizedBox.shrink();

    final acc = _accForPlace(place.name);
    if (acc == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: acc.color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: acc.color.withOpacity(0.3))),
      child: Text('vanuit ${acc.shortName}', style: TextStyle(
          fontSize: 9, fontWeight: FontWeight.w800,
          color: acc.color)));
  }
}
