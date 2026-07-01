import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../map_screen.dart';

class MapPlaceSheet extends StatelessWidget {
  final MapPlaceData place;
  final VoidCallback onAdd;
  final VoidCallback onNavigate;
  final VoidCallback onClose;

  const MapPlaceSheet({
    super.key,
    required this.place,
    required this.onAdd,
    required this.onNavigate,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        boxShadow: [BoxShadow(color: Color(0x20000000),
            blurRadius: 24, offset: Offset(0, -6))],
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(children: [
            const Spacer(),
            Container(width: 38, height: 4,
                decoration: BoxDecoration(color: AppColors.border,
                    borderRadius: BorderRadius.circular(2))),
            const Spacer(),
            GestureDetector(
              onTap: onClose,
              child: const Icon(Icons.close_rounded,
                  color: AppColors.textThird, size: 20),
            ),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(child: Text(place.emoji,
                  style: const TextStyle(fontSize: 26))),
            ),
            const SizedBox(width: 14),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(place.name, style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary, letterSpacing: -0.2)),
                const SizedBox(height: 3),
                Text(_typeLabel(place.type), style: const TextStyle(
                    fontSize: 12, color: AppColors.textThird)),
              ],
            )),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(_typeLabel(place.type), style: const TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w700,
                  color: AppColors.primary)),
            ),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Toevoegen'),
                style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12)),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onNavigate,
                icon: const Icon(Icons.directions_rounded, size: 18),
                label: const Text('Navigeer'),
                style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12)),
              ),
            ),
          ]),
        ],
      ),
    );
  }

  String _typeLabel(MapFilter type) {
    switch (type) {
      case MapFilter.accommodation: return 'Accommodatie';
      case MapFilter.activities:    return 'Activiteit';
      case MapFilter.food:          return 'Eten & drinken';
      case MapFilter.charging:      return 'Laadstation';
      default:                      return 'Locatie';
    }
  }
}
