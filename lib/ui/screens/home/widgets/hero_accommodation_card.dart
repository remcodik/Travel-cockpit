import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/database_provider.dart';
import '../../../../providers/weather_provider.dart';

// Top-level providers — NOT created inside build() (avoids leaks)
final _accsForTripProvider = StreamProvider.family((ref, String tripId) =>
    ref.watch(databaseProvider).accommodationDao.watchByTrip(tripId));

final _placeByIdProvider = FutureProvider.family((ref, String placeId) =>
    ref.watch(databaseProvider).placeDao.getById(placeId));

class HeroAccommodationCard extends ConsumerWidget {
  final String tripId;
  const HeroAccommodationCard({super.key, required this.tripId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weather = ref.watch(weatherProvider).valueOrNull;
    final accs    = ref.watch(_accsForTripProvider(tripId));

    return accs.when(
      loading: () => _card(context, 'Laden…', '', weather),
      error:   (_, __) => _card(context, 'Accommodatie', '', weather),
      data: (rows) {
        final active = rows.where((r) => r.isActive).firstOrNull
            ?? (rows.isNotEmpty ? rows.first : null);
        if (active == null) {
          return _card(context, 'Geen accommodatie', '', weather);
        }
        final place  = ref.watch(_placeByIdProvider(active.placeId)).valueOrNull;
        final nights = active.checkOutDate.difference(active.checkInDate).inDays;
        const months = ['jan','feb','mrt','apr','mei','jun',
                        'jul','aug','sep','okt','nov','dec'];
        final ci = '${active.checkInDate.day} ${months[active.checkInDate.month-1]}';
        final co = '${active.checkOutDate.day} ${months[active.checkOutDate.month-1]}';
        final addr = place?.address?.split(',').first ?? '';
        return _card(
          context,
          place?.name ?? 'Accommodatie',
          '📍 $addr · $ci–$co · $nights nachten',
          weather,
        );
      },
    );
  }

  Widget _card(BuildContext context, String name, String sub, dynamic weather) {
    return GestureDetector(
      onTap: () => context.push('/accommodation'),
      child: Container(
        height: 190,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [Color(0xFF0A2418), Color(0xFF1B4D35), Color(0xFF1A3F6F)]),
          boxShadow: const [BoxShadow(color: Color(0x200F2E1E),
              blurRadius: 16, offset: Offset(0, 4))],
        ),
        child: Stack(children: [
          // Topo texture
          Positioned.fill(child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: CustomPaint(painter: _TopoPainter()))),
          // Gradient overlay
          Positioned.fill(child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black.withOpacity(0.55)])))),
          // Label
          Positioned(top: 14, left: 14, child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.28),
                borderRadius: BorderRadius.circular(20)),
            child: const Text('Huidige accommodatie', style: TextStyle(
                fontSize: 10, fontWeight: FontWeight.w800,
                letterSpacing: 0.8, color: Colors.white70)))),
          // Weather badge
          Positioned(top: 14, right: 14, child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.18),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withOpacity(0.22))),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Text(weather?.emoji ?? '🌡️', style: const TextStyle(fontSize: 14)),
              const SizedBox(width: 5),
              Text(weather != null
                  ? '${weather.temperatureCelsius.round()}°' : '--°',
                  style: const TextStyle(fontSize: 14,
                      fontWeight: FontWeight.w700, color: Colors.white)),
            ]))),
          // Name + sub
          Positioned(bottom: 14, left: 16, right: 16, child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: const TextStyle(fontSize: 22,
                  fontWeight: FontWeight.w700, color: Colors.white,
                  letterSpacing: -0.2)),
              if (sub.isNotEmpty) ...[
                const SizedBox(height: 3),
                Text(sub, style: const TextStyle(
                    fontSize: 12, color: Colors.white70)),
              ],
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white.withOpacity(0.28))),
                child: const Text('Details bekijken ›', style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700,
                    color: Colors.white))),
            ])),
        ]),
      ),
    );
  }
}

class _TopoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..color = Colors.white.withOpacity(0.05)
        ..strokeWidth = 0.8..style = PaintingStyle.stroke;
    for (var i = 0; i < 10; i++) {
      final y = size.height * (i / 10);
      final path = Path()..moveTo(0, y);
      for (var x = 0.0; x < size.width; x += 4) {
        path.lineTo(x, y + 6 * (0.5 - (x / size.width)));
      }
      canvas.drawPath(path, p);
    }
  }
  @override bool shouldRepaint(_) => false;
}
