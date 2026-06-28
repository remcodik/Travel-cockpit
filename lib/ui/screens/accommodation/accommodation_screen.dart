import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/database_provider.dart';
import '../../../providers/trip_provider.dart';
import '../../../providers/weather_provider.dart';

class AccommodationScreen extends ConsumerWidget {
  const AccommodationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripAsync = ref.watch(activeTripProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: tripAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:   (e, _) => Center(child: Text('Fout: $e')),
        data: (trip) => trip == null
            ? const _NoAccommodation()
            : _Body(tripId: trip.id),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  final String tripId;
  const _Body({required this.tripId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weather   = ref.watch(weatherProvider).valueOrNull;
    final accsAsync = ref.watch(
      StreamProvider.autoDispose((ref) =>
          ref.watch(databaseProvider).accommodationDao.watchByTrip(tripId)));

    return accsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error:   (e, _) => Center(child: Text('Fout: $e')),
      data: (rows) {
        if (rows.isEmpty) return const _NoAccommodation();
        final active = rows.firstWhere((r) => r.isActive,
            orElse: () => rows.first);
        return _Detail(rows: rows, active: active, weather: weather);
      },
    );
  }
}

class _Detail extends ConsumerWidget {
  final List<dynamic> rows;
  final dynamic active;
  final dynamic weather;
  const _Detail({required this.rows, required this.active,
      required this.weather});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final db = ref.watch(databaseProvider);
    final placeAsync = ref.watch(
      FutureProvider.autoDispose((_) => db.placeDao.getById(active.placeId)));
    final place = placeAsync.valueOrNull;

    const months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];
    final ci     = '${active.checkInDate.day} ${months[active.checkInDate.month-1]}';
    final co     = '${active.checkOutDate.day} ${months[active.checkOutDate.month-1]}';
    final nights = active.checkOutDate.difference(active.checkInDate).inDays;
    final name   = place?.name   ?? 'Accommodatie';
    final addr   = place?.address ?? '';
    final desc   = place?.description;

    return CustomScrollView(slivers: [
      // Hero
      SliverToBoxAdapter(child: _Hero(
        name: name, address: addr,
        dates: '$ci – $co · $nights nachten',
        weather: weather,
        onBack: () => context.pop(),
      )),
      // Action bar
      SliverToBoxAdapter(child: _ActionBar(
        address: addr, phone: active.contactPhone)),
      // Check-in info
      SliverToBoxAdapter(child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        child: _InfoCard(
          checkIn:      ci,
          checkOut:     co,
          nights:       nights,
          checkInTime:  active.checkInHour != null
              ? '${active.checkInHour.toString().padLeft(2,"0")}:${active.checkInMinute.toString().padLeft(2,"0")}'
              : '15:00',
          checkOutTime: active.checkOutHour != null
              ? '${active.checkOutHour.toString().padLeft(2,"0")}:${active.checkOutMinute.toString().padLeft(2,"0")}'
              : '11:00',
          confirmation: active.confirmationNumber,
          contactName:  active.contactName,
          contactPhone: active.contactPhone,
          address:      addr,
        ),
      )),
      // Description
      if (desc != null)
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: _DescCard(text: desc),
        )),
      // From here
      SliverToBoxAdapter(child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
        child: _FromHere(),
      )),
      // All stops
      SliverToBoxAdapter(child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        child: _AllStops(rows: rows),
      )),
    ]);
  }
}

// ── Hero ──────────────────────────────────────────────────
class _Hero extends StatelessWidget {
  final String name, address, dates;
  final dynamic weather;
  final VoidCallback onBack;
  const _Hero({required this.name, required this.address,
      required this.dates, required this.weather, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 248,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [Color(0xFF0A1E12), Color(0xFF1B4D35), Color(0xFF12304A)]),
      ),
      child: Stack(children: [
        Positioned.fill(child: CustomPaint(painter: _TopoPainter())),
        Positioned.fill(child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter, end: Alignment.bottomCenter,
              colors: [Colors.transparent, Colors.black.withOpacity(0.6)])))),
        // Back button
        Positioned(
          top: MediaQuery.of(context).padding.top + 8, left: 14,
          child: GestureDetector(onTap: onBack,
            child: Container(width: 38, height: 38,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3), shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withOpacity(0.2))),
              child: const Icon(Icons.arrow_back_rounded,
                  color: Colors.white, size: 20)))),
        // Weather
        if (weather != null)
          Positioned(
            top: MediaQuery.of(context).padding.top + 8, right: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.18),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withOpacity(0.22))),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(weather.emoji, style: const TextStyle(fontSize: 14)),
                const SizedBox(width: 5),
                Text('${weather.temperatureCelsius.round()}°',
                    style: const TextStyle(fontSize: 14,
                        fontWeight: FontWeight.w700, color: Colors.white)),
              ]))),
        // Text
        Positioned(bottom: 16, left: 16, right: 16,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: const TextStyle(fontSize: 24,
                  fontWeight: FontWeight.w700, color: Colors.white,
                  letterSpacing: -0.4)),
              const SizedBox(height: 4),
              if (address.isNotEmpty)
                Text('📍 ${address.split(',').first}',
                    style: const TextStyle(fontSize: 12, color: Colors.white70)),
              const SizedBox(height: 3),
              Text(dates, style: const TextStyle(fontSize: 12,
                  color: Colors.white60, fontWeight: FontWeight.w500)),
            ])),
      ]),
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
        path.lineTo(x, y + 5 * (0.5 - (x / size.width)));
      }
      canvas.drawPath(path, p);
    }
  }
  @override bool shouldRepaint(_) => false;
}

// ── Action bar ────────────────────────────────────────────
class _ActionBar extends StatelessWidget {
  final String address;
  final String? phone;
  const _ActionBar({required this.address, this.phone});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Row(children: [
        _Btn(icon: Icons.map_outlined, label: 'Route',
            onTap: () => _launch('https://www.google.com/maps/dir/?api=1'
                '&destination=${Uri.encodeComponent(address)}')),
        _Btn(icon: Icons.near_me_outlined, label: 'In de buurt',
            onTap: () => context.push('/map')),
        _Btn(icon: Icons.wb_sunny_outlined, label: 'Weer', onTap: () {}),
        if (phone != null)
          _Btn(icon: Icons.phone_outlined, label: 'Bel',
              onTap: () => _launch('tel:$phone')),
      ]),
    );
  }

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) launchUrl(uri,
        mode: LaunchMode.externalApplication);
  }
}

class _Btn extends StatelessWidget {
  final IconData icon; final String label; final VoidCallback onTap;
  const _Btn({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) => Expanded(child: InkWell(onTap: onTap,
    child: Padding(padding: const EdgeInsets.symmetric(vertical: 13),
      child: Column(children: [
        Icon(icon, size: 22, color: AppColors.textSecond),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 10,
            color: AppColors.textSecond, fontWeight: FontWeight.w600)),
      ]))));
}

// ── Info card ─────────────────────────────────────────────
class _InfoCard extends StatelessWidget {
  final String checkIn, checkOut, checkInTime, checkOutTime;
  final int nights;
  final String? confirmation, contactName, contactPhone, address;
  const _InfoCard({required this.checkIn, required this.checkOut,
      required this.checkInTime, required this.checkOutTime,
      required this.nights, this.confirmation, this.contactName,
      this.contactPhone, this.address});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border)),
      child: Column(children: [
        _Row(icon: Icons.login_rounded,       label: 'Check-in',
            value: '$checkIn · vanaf $checkInTime'),
        const Divider(height: 1, indent: 52),
        _Row(icon: Icons.logout_rounded,      label: 'Check-out',
            value: '$checkOut · voor $checkOutTime'),
        const Divider(height: 1, indent: 52),
        _Row(icon: Icons.nights_stay_outlined, label: 'Nachten',
            value: '$nights nachten'),
        if (confirmation != null) ...[
          const Divider(height: 1, indent: 52),
          _Row(icon: Icons.confirmation_number_outlined,
              label: 'Boekingsnummer', value: confirmation!),
        ],
        if (address != null) ...[
          const Divider(height: 1, indent: 52),
          _Row(icon: Icons.location_on_outlined, label: 'Adres',
              value: address!,
              trailing: _MapsBtn(query: address!)),
        ],
        if (contactPhone != null) ...[
          const Divider(height: 1, indent: 52),
          _Row(icon: Icons.phone_outlined,
              label: contactName ?? 'Contact', value: contactPhone!,
              trailing: _CallBtn(phone: contactPhone!)),
        ],
      ]),
    );
  }
}

class _Row extends StatelessWidget {
  final IconData icon; final String label, value; final Widget? trailing;
  const _Row({required this.icon, required this.label,
      required this.value, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
    child: Row(children: [
      Icon(icon, size: 20, color: AppColors.textThird),
      const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11,
              color: AppColors.textThird, fontWeight: FontWeight.w700,
              letterSpacing: 0.3)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 14,
              fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ])),
      if (trailing != null) trailing!,
    ]),
  );
}

class _MapsBtn extends StatelessWidget {
  final String query;
  const _MapsBtn({required this.query});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () async {
      final uri = Uri.parse('https://www.google.com/maps/search/'
          '?api=1&query=${Uri.encodeComponent(query)}');
      if (await canLaunchUrl(uri)) launchUrl(uri,
          mode: LaunchMode.externalApplication);
    },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: AppColors.primaryLight,
          borderRadius: BorderRadius.circular(20)),
      child: const Text('Maps', style: TextStyle(fontSize: 12,
          fontWeight: FontWeight.w700, color: AppColors.primary))));
}

class _CallBtn extends StatelessWidget {
  final String phone;
  const _CallBtn({required this.phone});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () async {
      final uri = Uri.parse('tel:$phone');
      if (await canLaunchUrl(uri)) launchUrl(uri);
    },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: AppColors.primaryLight,
          borderRadius: BorderRadius.circular(20)),
      child: const Text('Bel', style: TextStyle(fontSize: 12,
          fontWeight: FontWeight.w700, color: AppColors.primary))));
}

// ── Desc card ─────────────────────────────────────────────
class _DescCard extends StatelessWidget {
  final String text;
  const _DescCard({required this.text});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border)),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('💡', style: TextStyle(fontSize: 16)),
      const SizedBox(width: 10),
      Expanded(child: Text(text, style: const TextStyle(fontSize: 13,
          color: AppColors.primaryDark, height: 1.55,
          fontWeight: FontWeight.w500))),
    ]));
}

// ── From here ─────────────────────────────────────────────
class _FromHere extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const items = [
      (icon: '🏔️', label: 'Geplande activiteiten', route: '/planning'),
      (icon: '💡', label: 'AI ideeën in de buurt',  route: '/discover'),
      (icon: '⚡', label: 'Laadstations',            route: '/charging'),
      (icon: '🎟️', label: 'Tickets',                route: '/tickets'),
      (icon: '🗺️', label: 'Bekijk op kaart',        route: '/map'),
    ];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('VANAF HIER', style: TextStyle(fontSize: 11,
          fontWeight: FontWeight.w800, letterSpacing: 0.6,
          color: AppColors.textThird)),
      const SizedBox(height: 10),
      Container(
        decoration: BoxDecoration(color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border)),
        child: Column(children: items.asMap().entries.map((e) {
          final item   = e.value;
          final isLast = e.key == items.length - 1;
          return Column(children: [
            InkWell(
              onTap: () => context.push(item.route),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                child: Row(children: [
                  Text(item.icon, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 14),
                  Expanded(child: Text(item.label, style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary))),
                  const Icon(Icons.chevron_right_rounded,
                      color: AppColors.border, size: 20),
                ]))),
            if (!isLast)
              const Divider(height: 1, indent: 52, endIndent: 16),
          ]);
        }).toList()),
      ),
    ]);
  }
}

// ── All trip stops — real Norway 2026 route ────────────────
class _AllStops extends StatelessWidget {
  final List<dynamic> rows;
  const _AllStops({required this.rows});

  @override
  Widget build(BuildContext context) {
    const months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];
    // Real labels from index.html
    const stayLabels = {
      1: ('Sogndal',               'Årøyvegen 202, Sogndal'),
      2: ('Skjåk Solside',         'Skjåk Solside 799, Skjåk'),
      3: ('Valdres / Noord-Aurdal','Førsøddin 30, Leira i Valdres'),
      4: ('Gjerstad',              'Løyteveien 14, Gjerstad'),
    };

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('ROUTE DEZE REIS', style: TextStyle(fontSize: 11,
          fontWeight: FontWeight.w800, letterSpacing: 0.6,
          color: AppColors.textThird)),
      const SizedBox(height: 10),
      ...rows.asMap().entries.map((e) {
        final a      = e.value;
        final n      = a.checkOutDate.difference(a.checkInDate).inDays;
        final ci     = '${a.checkInDate.day} ${months[a.checkInDate.month-1]}';
        final co     = '${a.checkOutDate.day} ${months[a.checkOutDate.month-1]}';
        final info   = stayLabels[a.orderInTrip];
        final label  = info?.$1 ?? 'Stop ${a.orderInTrip}';
        final sub    = info?.$2 ?? '';
        final isLast = e.key == rows.length - 1;

        return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Column(children: [
            Container(width: 28, height: 28,
              decoration: BoxDecoration(
                color: a.isActive ? AppColors.primary : AppColors.border,
                shape: BoxShape.circle),
              child: Center(child: Text('${a.orderInTrip}',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800,
                      color: a.isActive ? Colors.white : AppColors.textThird)))),
            if (!isLast)
              Container(width: 2, height: 52, color: AppColors.primaryLight),
          ]),
          const SizedBox(width: 12),
          Expanded(child: Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: a.isActive ? AppColors.primaryLight : AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: a.isActive ? AppColors.primary : AppColors.border,
                  width: a.isActive ? 1.5 : 1)),
              child: Row(children: [
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                    Text('$ci – $co · $n nachten',
                        style: const TextStyle(fontSize: 11,
                            color: AppColors.textThird)),
                    if (sub.isNotEmpty)
                      Text(sub, style: const TextStyle(fontSize: 10,
                          color: AppColors.textThird),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                  ])),
                if (a.isActive)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: AppColors.primary,
                        borderRadius: BorderRadius.circular(20)),
                    child: const Text('Nu actief', style: TextStyle(
                        fontSize: 10, fontWeight: FontWeight.w800,
                        color: Colors.white))),
              ]),
            ))),
        ]);
      }),
    ]);
  }
}

class _NoAccommodation extends StatelessWidget {
  const _NoAccommodation();
  @override
  Widget build(BuildContext context) => Center(child: Column(
    mainAxisAlignment: MainAxisAlignment.center, children: [
      const Text('🏡', style: TextStyle(fontSize: 52)),
      const SizedBox(height: 16),
      const Text('Geen accommodatie', style: TextStyle(fontSize: 18,
          fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      const Text('Voeg een verblijf toe aan je reis.',
          style: TextStyle(fontSize: 13, color: AppColors.textThird)),
      const SizedBox(height: 24),
      ElevatedButton(onPressed: () => context.push('/trips'),
          child: const Text('Naar mijn reizen')),
    ]));
}
