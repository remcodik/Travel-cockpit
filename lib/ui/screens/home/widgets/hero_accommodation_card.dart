import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/database_provider.dart';
import '../../../../providers/trip_provider.dart';
import '../../../../providers/weather_provider.dart';

class HeroAccommodationCard extends ConsumerWidget {
  final String tripId;
  const HeroAccommodationCard({super.key, required this.tripId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final db      = ref.watch(databaseProvider);
    final weather = ref.watch(weatherProvider).valueOrNull;

    final accStream = StreamProvider((ref) =>
        ref.watch(databaseProvider).accommodationDao.watchByTrip(tripId));
    final accs = ref.watch(accStream);

    return accs.when(
      loading: () => _buildCard(context, 'Laden…', '', weather),
      error:   (_, __) => _buildCard(context, 'Accommodatie', '', weather),
      data: (rows) {
        // Find active accommodation
        final active = rows.where((r) => r.isActive).firstOrNull ?? rows.firstOrNull;
        if (active == null) {
          return _buildCard(context, 'Geen accommodatie', '', weather);
        }
        // Get place name
        final placeStream = StreamProvider((ref) async* {
          final place = await db.placeDao.getById(active.placeId);
          if (place != null) yield place;
        });
        final place = ref.watch(placeStream).valueOrNull;
        final nights = active.checkOutDate.difference(active.checkInDate).inDays;
        const months = ['jan','feb','mrt','apr','mei','jun',
                        'jul','aug','sep','okt','nov','dec'];
        final ci = '${active.checkInDate.day} ${months[active.checkInDate.month-1]}';
        final co = '${active.checkOutDate.day} ${months[active.checkOutDate.month-1]}';
        return _buildCard(
          context,
          place?.name ?? 'Accommodatie',
          '📍 ${place?.address?.split(',').first ?? ''} · $ci–$co · $nights nachten',
          weather,
        );
      },
    );
  }

  Widget _buildCard(BuildContext context, String name, String sub,
      dynamic weather) {
    return GestureDetector(
      onTap: () => context.push('/accommodation'),
      child: Container(
        height: 190,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [Color(0xFF0A2418), Color(0xFF1B4D35), Color(0xFF1A3F6F)],
          ),
          boxShadow: const [BoxShadow(color: Color(0x200F2E1E),
              blurRadius: 16, offset: Offset(0,4))],
        ),
        child: Stack(children: [
          // Gradient overlay
          Positioned.fill(child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black.withOpacity(0.55)],
              ),
            ),
          )),
          // Label
          Positioned(top: 14, left: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.28),
                  borderRadius: BorderRadius.circular(20)),
              child: const Text('Huidige accommodatie',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800,
                      letterSpacing: 0.8, color: Colors.white70)),
            )),
          // Weather badge
          Positioned(top: 14, right: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.18),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withOpacity(0.22)),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(weather?.emoji ?? '🌡️',
                    style: const TextStyle(fontSize: 14)),
                const SizedBox(width: 5),
                Text(
                  weather != null
                      ? '${weather.temperatureCelsius.round()}°'
                      : '--°',
                  style: const TextStyle(fontSize: 14,
                      fontWeight: FontWeight.w700, color: Colors.white),
                ),
              ]),
            )),
          // Name + sub
          Positioned(bottom: 14, left: 16, right: 16,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: Colors.white, letterSpacing: -0.2)),
                if (sub.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(sub, style: const TextStyle(
                      fontSize: 12, color: Colors.white70)),
                ],
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 13, vertical: 7),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: Colors.white.withOpacity(0.28)),
                  ),
                  child: const Text('Details bekijken ›',
                      style: TextStyle(fontSize: 12,
                          fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ])),
        ]),
      ),
    );
  }
}
