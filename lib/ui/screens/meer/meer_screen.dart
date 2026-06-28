import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/trip_provider.dart';
import '../../../providers/weather_provider.dart';

class MeerScreen extends ConsumerWidget {
  const MeerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trip    = ref.watch(activeTripProvider).valueOrNull;
    final weather = ref.watch(weatherProvider).valueOrNull;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(slivers: [
          // Header
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(children: [
              const Expanded(child: Text('Meer', style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary, letterSpacing: -0.3))),
              if (trip != null)
                Text(trip.countryFlag,
                    style: const TextStyle(fontSize: 28)),
            ]),
          )),

          // ── Roadtrip quick card ────────────────────
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
            child: GestureDetector(
              onTap: () => context.push('/roadtrip'),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                    colors: [Color(0xFF0A1E12), Color(0xFF1B4D35),
                             Color(0xFF1A3F6F)]),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: const [BoxShadow(
                      color: Color(0x180F2E1E), blurRadius: 12,
                      offset: Offset(0, 4))]),
                child: Row(children: [
                  const Text('🚗', style: TextStyle(fontSize: 32)),
                  const SizedBox(width: 14),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Roadtrip-modus', style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w800,
                          color: Colors.white, letterSpacing: -0.2)),
                      const SizedBox(height: 3),
                      Text(
                        weather != null
                            ? '${weather.emoji} ${weather.temperatureCelsius.round()}°C · Noorwegen 2026'
                            : 'Noorwegen 2026 · 15–30 juni',
                        style: const TextStyle(fontSize: 12,
                            color: Colors.white70)),
                    ])),
                  const Icon(Icons.arrow_forward_ios_rounded,
                      color: Colors.white38, size: 16),
                ]),
              ),
            ),
          )),

          // ── Main navigation sections ───────────────
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: _SectionLabel('Mijn reis'),
          )),
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: _NavCard(items: [
              _NavItem(icon: '🏡', label: 'Accommodaties',
                  sub: '4 verblijven · Noorwegen',
                  route: '/accommodation'),
              _NavItem(icon: '🎟️', label: 'Tickets',
                  sub: '1 ticket · Klimapark 2469',
                  route: '/tickets'),
              _NavItem(icon: '✈️', label: 'Mijn reizen',
                  sub: trip != null ? trip.name : 'Geen actieve reis',
                  route: '/trips'),
            ]),
          )),

          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: _SectionLabel('Onderweg'),
          )),
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: _NavCard(items: [
              _NavItem(icon: '⚡', label: 'Laadstations',
                  sub: '4 stations in de buurt',
                  route: '/charging'),
              _NavItem(icon: '🗺️', label: 'Kaart',
                  sub: 'Alle activiteiten en stops',
                  route: '/map'),
              _NavItem(icon: '💡', label: 'AI ideeën',
                  sub: 'Activiteiten suggesties',
                  route: '/discover'),
            ]),
          )),

          // ── Norway 2026 info ───────────────────────
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: _SectionLabel('Noorwegen 2026'),
          )),
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border)),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _TripFact('📅', '15–30 juni 2026 · 15 dagen'),
                  const SizedBox(height: 8),
                  const _TripFact('🏡', '4 verblijven · Sogndal, Skjåk, Valdres, Gjerstad'),
                  const SizedBox(height: 8),
                  const _TripFact('🏔️', '19 activiteiten gepland'),
                  const SizedBox(height: 8),
                  const _TripFact('⛴️', 'Heen: Nijmegen → Hirtshals (ferry) → Stavanger → Bergen'),
                  const SizedBox(height: 8),
                  const _TripFact('🚗', 'Bergen → Sogndal → Skjåk → Valdres → Gjerstad'),
                  const SizedBox(height: 8),
                  const _TripFact('⛴️', 'Terug: Kristiansand → Hirtshals (ferry) → Kolding → Nijmegen'),
                  const SizedBox(height: 12),
                  // Route tips from index.html
                  _TipBox('Op verblijfsdagen liever niet de hele dag autorijden. '
                      'Rustige dag: één hoofdactiviteit + koffie/lunch + kleine stop.'),
                ]),
            ),
          )),

          // ── App settings ──────────────────────────
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: _SectionLabel('Instellingen'),
          )),
          SliverToBoxAdapter(child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            child: _NavCard(items: [
              _NavItem(icon: '⚙️', label: 'Instellingen',
                  sub: 'Voorkeuren en voertuig', route: '/settings'),
              _NavItem(icon: '👤', label: 'Profiel',
                  sub: 'Reisvoorkeuren', route: '/profile'),
            ]),
          )),
        ]),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(text.toUpperCase(),
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
          letterSpacing: 0.6, color: AppColors.textThird));
}

class _NavItem {
  final String icon, label, sub, route;
  const _NavItem({required this.icon, required this.label,
      required this.sub, required this.route});
}

class _NavCard extends StatelessWidget {
  final List<_NavItem> items;
  const _NavCard({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
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
                Text(item.icon, style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 14),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.label, style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    Text(item.sub, style: const TextStyle(
                        fontSize: 12, color: AppColors.textThird)),
                  ])),
                const Icon(Icons.chevron_right_rounded,
                    color: AppColors.border, size: 20),
              ])),
          ),
          if (!isLast)
            const Divider(height: 1, indent: 56, endIndent: 16),
        ]);
      }).toList()),
    );
  }
}

class _TripFact extends StatelessWidget {
  final String icon, text;
  const _TripFact(this.icon, this.text);
  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(icon, style: const TextStyle(fontSize: 15)),
      const SizedBox(width: 10),
      Expanded(child: Text(text, style: const TextStyle(
          fontSize: 13, color: AppColors.textSecond, height: 1.4))),
    ]);
}

class _TipBox extends StatelessWidget {
  final String text;
  const _TipBox(this.text);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: AppColors.primaryLight,
      borderRadius: BorderRadius.circular(10)),
    child: Text(text, style: const TextStyle(
        fontSize: 12, color: AppColors.primaryDark, height: 1.5)));
}
