import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';

class ChargingScreen extends StatefulWidget {
  const ChargingScreen({super.key});

  @override
  State<ChargingScreen> createState() => _ChargingScreenState();
}

class _ChargingScreenState extends State<ChargingScreen> {
  String _type = 'dc';  // dc | ac

  static const _stations = [
    _Station('IONITY Skjåk',          '150 kW · CCS · CHAdeMO',
        '24/7 · 2,3 km', 4, 6, true,  61.876, 8.398),
    _Station('Circle K Otta',          '200 kW · CCS',
        '24/7 · 18 km',  2, 4, true,  61.830, 9.514),
    _Station('Mer Fossbergom',         '120 kW · CCS',
        '24/7 · 22 km',  3, 4, true,  61.716, 8.684),
    _Station('Tesla Supercharger Otta','250 kW · Tesla',
        '24/7 · 28 km',  6, 8, false, 61.770, 9.526),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
            child: Row(children: [
              const Expanded(child: Text('Laadstations',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary, letterSpacing: -0.3))),
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.tune_rounded,
                    color: AppColors.primary, size: 24),
                tooltip: 'Filters',
              ),
            ]),
          ),
          // DC / AC toggle
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Row(children: [
              _TypeBtn(label: 'DC Snellader', value: 'dc',
                  current: _type,
                  onTap: () => setState(() => _type = 'dc')),
              const SizedBox(width: 8),
              _TypeBtn(label: 'AC Lader', value: 'ac',
                  current: _type,
                  onTap: () => setState(() => _type = 'ac')),
            ]),
          ),
          // Active filters
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Wrap(spacing: 6, children: const [
              _FilterChip(label: 'Min. 100 kW'),
              _FilterChip(label: 'CCS & Tesla'),
              _FilterChip(label: '24/7 open'),
            ]),
          ),
          // Station list
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
              itemCount: _stations.length + 1,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                if (i == _stations.length) {
                  return OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.route_outlined, size: 18),
                    label: const Text('Laadstation langs route zoeken'),
                  );
                }
                return _StationCard(
                  station: _stations[i],
                  onNavigate: () => _navigate(_stations[i]),
                );
              },
            ),
          ),
        ]),
      ),
    );
  }

  Future<void> _navigate(_Station s) async {
    final uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1'
        '&destination=\${s.lat},\${s.lng}');
    if (await canLaunchUrl(uri)) {
      launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

class _Station {
  final String name, specs, dist;
  final int free, total;
  final bool open24;
  final double lat, lng;
  const _Station(this.name, this.specs, this.dist,
      this.free, this.total, this.open24, this.lat, this.lng);
}

class _StationCard extends StatelessWidget {
  final _Station station;
  final VoidCallback onNavigate;
  const _StationCard({required this.station, required this.onNavigate});

  Color get _availColor {
    final ratio = station.free / station.total;
    if (ratio >= 0.5) return AppColors.primary;
    if (ratio > 0)    return const Color(0xFFC87820);
    return AppColors.flagRed;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: _availColor, width: 4)),
        boxShadow: const [BoxShadow(color: Color(0x080F2E1E),
            blurRadius: 8, offset: Offset(0, 2))],
      ),
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        // Icon
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(12)),
          child: const Center(child: Text('⚡',
              style: TextStyle(fontSize: 22))),
        ),
        const SizedBox(width: 12),
        // Info
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(station.name, style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w800,
                color: AppColors.textPrimary)),
            const SizedBox(height: 2),
            Text(station.specs, style: const TextStyle(
                fontSize: 12, color: AppColors.textThird)),
            const SizedBox(height: 4),
            Text(station.dist, style: const TextStyle(
                fontSize: 12, color: AppColors.textSecond,
                fontWeight: FontWeight.w600)),
          ],
        )),
        // Availability
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: _availColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10)),
            child: Text('\${station.free}/\${station.total}',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800,
                    color: _availColor)),
          ),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: onNavigate,
            child: Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.navigation_rounded,
                  color: AppColors.primary, size: 17),
            ),
          ),
        ]),
      ]),
    );
  }
}

class _TypeBtn extends StatelessWidget {
  final String label, value, current;
  final VoidCallback onTap;
  const _TypeBtn({required this.label, required this.value,
      required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final on = value == current;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: on ? AppColors.primary : AppColors.card,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: on ? AppColors.primary : AppColors.border)),
        child: Text(label, style: TextStyle(
            fontSize: 13, fontWeight: FontWeight.w700,
            color: on ? Colors.white : AppColors.textSecond)),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  const _FilterChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border)),
      child: Text(label, style: const TextStyle(
          fontSize: 11, fontWeight: FontWeight.w700,
          color: AppColors.primary)),
    );
  }
}
