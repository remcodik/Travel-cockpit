import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/accommodation.dart';
import '../../../../providers/database_provider.dart';
import '../../../../providers/trip_provider.dart';

class HeroAccommodationCard extends ConsumerWidget {
  final String tripId;
  const HeroAccommodationCard({super.key, required this.tripId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accStream = ref.watch(
      StreamProvider((ref) =>
          ref.watch(databaseProvider).accommodationDao.watchByTrip(tripId)).future,
    );

    // For now show a static card — will be reactive once DB is populated
    return GestureDetector(
      onTap: () => context.push('/accommodation'),
      child: Container(
        height: 190,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0A2418),
              Color(0xFF1B4D35),
              Color(0xFF1A3F6F),
            ],
          ),
          boxShadow: const [
            BoxShadow(color: Color(0x200F2E1E), blurRadius: 16, offset: Offset(0,4)),
          ],
        ),
        child: Stack(
          children: [
            // Topo texture overlay
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black.withOpacity(0.55)],
                  ),
                ),
              ),
            ),
            // Label
            Positioned(
              top: 14, left: 14,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.28),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('Huidige accommodatie',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800,
                        letterSpacing: 0.8, color: Colors.white70)),
              ),
            ),
            // Weather
            Positioned(
              top: 14, right: 14,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withOpacity(0.22)),
                ),
                child: const Row(
                  children: [
                    Text('\u26c5', style: TextStyle(fontSize: 14)),
                    SizedBox(width: 5),
                    Text('18\u00b0', style: TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                  ],
                ),
              ),
            ),
            // Name + location
            Positioned(
              bottom: 14, left: 16, right: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Skj\u00e5k Solside',
                      style: TextStyle(fontSize: 23, fontWeight: FontWeight.w600,
                          color: Colors.white, fontFamily: 'Lora',
                          letterSpacing: -0.2)),
                  const SizedBox(height: 3),
                  const Text('\U0001f4cd Skj\u00e5k, Noorwegen · 16–20 jul',
                      style: TextStyle(fontSize: 13, color: Colors.white70)),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white.withOpacity(0.28)),
                    ),
                    child: const Text('Details bekijken \u203a',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                            color: Colors.white)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
