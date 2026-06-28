import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

class NearbyStrip extends StatelessWidget {
  final String tripId;
  const NearbyStrip({super.key, required this.tripId});

  static const _items = [
    (emoji: '\u2615', label: 'Caf\u00e9', count: '8',  route: '/discover'),
    (emoji: '\U0001f37d\ufe0f', label: 'Restaurant', count: '13', route: '/discover'),
    (emoji: '\u26a1', label: 'Laadstation', count: '7', route: '/charging'),
    (emoji: '\U0001f6d2', label: 'Supermarkt', count: '3', route: '/discover'),
    (emoji: '\u26fd', label: 'Tankstation', count: '5', route: '/discover'),
    (emoji: '\U0001f48a', label: 'Apotheek', count: '1', route: '/discover'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('In de buurt',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary)),
              GestureDetector(
                onTap: () => context.push('/map'),
                child: const Text('Kaart',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                        color: AppColors.action)),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 84,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final item = _items[i];
              return GestureDetector(
                onTap: () => context.push(item.route),
                child: Container(
                  width: 68,
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                    boxShadow: const [
                      BoxShadow(color: Color(0x080F2E1E), blurRadius: 6,
                          offset: Offset(0,2)),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(item.emoji, style: const TextStyle(fontSize: 22)),
                      const SizedBox(height: 3),
                      Text(item.label,
                          style: const TextStyle(fontSize: 10,
                              color: AppColors.textSecond,
                              fontWeight: FontWeight.w600),
                          textAlign: TextAlign.center,
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text(item.count,
                          style: const TextStyle(fontSize: 12,
                              color: AppColors.fjordBlue,
                              fontWeight: FontWeight.w800)),
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
