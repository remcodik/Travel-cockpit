import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../map_screen.dart';

class MapFilterChips extends StatelessWidget {
  final MapFilter selected;
  final ValueChanged<MapFilter> onChanged;

  const MapFilterChips({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  static const _items = [
    (filter: MapFilter.all,           label: 'Alles',          emoji: ''),
    (filter: MapFilter.accommodation, label: 'Accommodaties',  emoji: '🏡'),
    (filter: MapFilter.activities,    label: 'Activiteiten',   emoji: '🏔️'),
    (filter: MapFilter.food,          label: 'Eten & drinken', emoji: '🍽️'),
    (filter: MapFilter.charging,      label: 'Laders',         emoji: '⚡'),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (_, i) {
          final item  = _items[i];
          final isOn  = item.filter == selected;
          final label = item.emoji.isEmpty
              ? item.label
              : '${item.emoji} ${item.label}';
          return GestureDetector(
            onTap: () => onChanged(item.filter),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isOn ? AppColors.primary : Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                    color: isOn ? AppColors.primary : AppColors.border,
                    width: 1.5),
                boxShadow: [BoxShadow(
                    color: Colors.black.withOpacity(0.07),
                    blurRadius: 6, offset: const Offset(0, 2))],
              ),
              child: Text(label, style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700,
                  color: isOn ? Colors.white : AppColors.textSecond)),
            ),
          );
        },
      ),
    );
  }
}
