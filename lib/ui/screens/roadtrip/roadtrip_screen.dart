import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/trip_provider.dart';
import '../../../providers/planning_provider.dart';
import '../../../providers/weather_provider.dart';
import '../../../providers/database_provider.dart';
import '../../../providers/place_provider.dart';
import '../../../providers/connectivity_provider.dart';
import '../../../domain/models/planning_item.dart';
import '../../../domain/models/place.dart';

class RoadtripScreen extends ConsumerStatefulWidget {
  const RoadtripScreen({super.key});

  @override
  ConsumerState<RoadtripScreen> createState() => _RoadtripScreenState();
}

class _RoadtripScreenState extends ConsumerState<RoadtripScreen> {
  bool _mapExpanded = false;

  // Norway 2026 — next accommodation coordinates
  static const _nextStops = [
    (name: 'Sogndal',               lat: 61.219, lng: 7.158,  dates: '16–19 jun'),
    (name: 'Skjåk Solside',         lat: 61.913, lng: 8.275,  dates: '19–23 jun'),
    (name: 'Valdres / Noord-Aurdal',lat: 60.985, lng: 9.236,  dates: '23–27 jun'),
    (name: 'Gjerstad',              lat: 58.880, lng: 9.020,  dates: '27–29 jun'),
    (name: 'Kristiansand (ferry)',  lat: 58.145, lng: 7.989,  dates: '29 jun'),
  ];

  @override
  Widget build(BuildContext context) {
    final trip        = ref.watch(activeTripProvider).valueOrNull;
    final weather     = ref.watch(weatherProvider).valueOrNull;
    final isOnline    = ref.watch(isOnlineProvider);
    final todayItems  = ref.watch(todayPlanningProvider).valueOrNull ?? [];
    final allItems    = ref.watch(allPlanningProvider).valueOrNull ?? [];

    final done  = allItems.where((i) => i.isCompleted).length;
    final total = allItems.length;

    // Find today's first unfinished activity
    final nextActivity = todayItems.firstWhere(
      (i) => !i.isCompleted,
      orElse: () => todayItems.isNotEmpty ? todayItems.first : _emptyItem,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(children: [
          // ── Top bar ─────────────────────────────────
          _TopBar(
            tripName: trip?.name ?? 'Noorwegen 2026',
            isOnline: isOnline,
          ),

          Expanded(
            child: _mapExpanded
                ? _MapView(onCollapse: () => setState(() => _mapExpanded = false))
                : _DashboardView(
                    weather:      weather,
                    nextActivity: nextActivity,
                    todayItems:   todayItems,
                    done:         done,
                    total:        total,
                    onExpandMap:  () => setState(() => _mapExpanded = true),
                  ),
          ),
        ]),
      ),
    );
  }

  static final _emptyItem = PlanningItem(
    id: '', tripId: '', placeId: '',
    status: PlanningStatus.planned,
  );
}

// ── Top bar ───────────────────────────────────────────────
class _TopBar extends StatelessWidget {
  final String tripName;
  final bool isOnline;
  const _TopBar({required this.tripName, required this.isOnline});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primaryDark,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Row(children: [
        // Back
        GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: const Icon(Icons.arrow_back_rounded,
              color: Colors.white70, size: 22)),
        const SizedBox(width: 12),
        // Title
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Roadtrip-modus', style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.w900,
                color: Colors.white, letterSpacing: -0.2)),
            Text(tripName, style: const TextStyle(
                fontSize: 11, color: Colors.white60)),
          ],
        )),
        // Online dot
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isOnline
                ? Colors.green.withOpacity(0.2)
                : Colors.red.withOpacity(0.2),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isOnline ? Colors.green : Colors.red, width: 1)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 6, height: 6,
                decoration: BoxDecoration(
                  color: isOnline ? Colors.green : Colors.red,
                  shape: BoxShape.circle)),
            const SizedBox(width: 5),
            Text(isOnline ? 'Online' : 'Offline',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                    color: isOnline ? Colors.green : Colors.red)),
          ])),
      ]),
    );
  }
}

// ── Dashboard view ────────────────────────────────────────
class _DashboardView extends StatelessWidget {
  final dynamic weather;
  final PlanningItem nextActivity;
  final List<PlanningItem> todayItems;
  final int done, total;
  final VoidCallback onExpandMap;

  const _DashboardView({
    required this.weather,
    required this.nextActivity,
    required this.todayItems,
    required this.done,
    required this.total,
    required this.onExpandMap,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // ── Weather strip ──────────────────────────
        _WeatherStrip(weather: weather),
        const SizedBox(height: 12),

        // ── Next accommodation ─────────────────────
        _NextStopCard(),
        const SizedBox(height: 12),

        // ── Today's activity ──────────────────────
        _TodayActivityCard(item: nextActivity),
        const SizedBox(height: 12),

        // ── Progress bar ──────────────────────────
        _ProgressCard(done: done, total: total),
        const SizedBox(height: 12),

        // ── Quick map ─────────────────────────────
        _MiniMapCard(onExpand: onExpandMap),
        const SizedBox(height: 12),

        // ── Quick actions ─────────────────────────
        _QuickActions(),
        const SizedBox(height: 12),

        // ── Today planning list ───────────────────
        _TodayList(items: todayItems),
      ],
    );
  }
}

// ── Weather strip ─────────────────────────────────────────
class _WeatherStrip extends StatelessWidget {
  final dynamic weather;
  const _WeatherStrip({required this.weather});

  @override
  Widget build(BuildContext context) {
    if (weather == null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border)),
        child: const Text('Weerdata laden…',
            style: TextStyle(fontSize: 13, color: AppColors.textThird)));
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _weatherGradient(weather.condition),
          begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        Text(weather.emoji, style: const TextStyle(fontSize: 32)),
        const SizedBox(width: 14),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${weather.temperatureCelsius.round()}°C',
                style: const TextStyle(fontSize: 28,
                    fontWeight: FontWeight.w900, color: Colors.white)),
            Text(weather.condition, style: const TextStyle(
                fontSize: 13, color: Colors.white80)),
          ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Row(children: [
            const Icon(Icons.water_drop_outlined,
                color: Colors.white70, size: 14),
            const SizedBox(width: 4),
            Text('${weather.precipitationProbability}% regen',
                style: const TextStyle(fontSize: 11,
                    color: Colors.white70, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 4),
          const Text('Skjåk, Noorwegen',
              style: TextStyle(fontSize: 10, color: Colors.white60)),
        ]),
      ]),
    );
  }

  List<Color> _weatherGradient(String cond) {
    if (cond.contains('Hel')) return [const Color(0xFF1565C0), const Color(0xFF42A5F5)];
    if (cond.contains('regen') || cond.contains('Regen'))
      return [const Color(0xFF37474F), const Color(0xFF546E7A)];
    return [const Color(0xFF1B4D35), const Color(0xFF2E7D52)];
  }
}

// ── Next accommodation ────────────────────────────────────
class _NextStopCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trip = ref.watch(activeTripProvider).valueOrNull;
    final db   = ref.watch(databaseProvider);

    final accsAsync = ref.watch(
      StreamProvider.autoDispose((_) =>
          db.accommodationDao.watchByTrip(trip?.id ?? '')));

    final rows = accsAsync.valueOrNull ?? [];
    final active = rows.where((r) => r.isActive).firstOrNull
        ?? (rows.isNotEmpty ? rows.first : null);
    if (active == null) return const SizedBox.shrink();

    // Find next (non-active) accommodation
    final nextIdx  = rows.indexWhere((r) => r.isActive);
    final next     = nextIdx >= 0 && nextIdx + 1 < rows.length
        ? rows[nextIdx + 1] : null;

    const months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: const [BoxShadow(color: Color(0x080F2E1E),
            blurRadius: 8, offset: Offset(0, 2))]),
      child: Column(children: [
        // Current stay
        Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(width: 44, height: 44,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12)),
              child: const Center(child: Text('🏡',
                  style: TextStyle(fontSize: 22)))),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Huidig verblijf', style: TextStyle(
                    fontSize: 10, fontWeight: FontWeight.w700,
                    color: AppColors.textThird, letterSpacing: 0.3)),
                const SizedBox(height: 2),
                Text('Skjåk Solside', style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
                Text(
                  'Check-out: ${active.checkOutDate.day} ${months[active.checkOutDate.month-1]} · 11:00',
                  style: const TextStyle(fontSize: 12,
                      color: AppColors.textThird)),
              ])),
            // Navigate button
            GestureDetector(
              onTap: () async {
                final uri = Uri.parse(
                    'https://www.google.com/maps/search/'
                    '?api=1&query=Skj%C3%A5k+Solside+Norway');
                if (await canLaunchUrl(uri)) launchUrl(uri,
                    mode: LaunchMode.externalApplication);
              },
              child: Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.navigation_rounded,
                    color: Colors.white, size: 20))),
          ]),
        ),
        // Next stop
        if (next != null) ...[
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
            child: Row(children: [
              const Icon(Icons.arrow_downward_rounded,
                  color: AppColors.textThird, size: 16),
              const SizedBox(width: 8),
              const Text('Volgende stop:', style: TextStyle(
                  fontSize: 11, color: AppColors.textThird,
                  fontWeight: FontWeight.w600)),
              const SizedBox(width: 6),
              Text('Valdres / Noord-Aurdal', style: const TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary)),
              const Spacer(),
              Text(
                '${next.checkInDate.day} ${months[next.checkInDate.month-1]}',
                style: const TextStyle(fontSize: 11,
                    color: AppColors.textThird)),
            ])),
        ],
      ]),
    );
  }
}

// ── Today's first activity ────────────────────────────────
class _TodayActivityCard extends ConsumerWidget {
  final PlanningItem item;
  const _TodayActivityCard({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (item.id.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border)),
        child: Row(children: [
          const Text('📅', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          const Expanded(child: Text('Geen activiteiten gepland vandaag',
              style: TextStyle(fontSize: 14, color: AppColors.textSecond))),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Ideeën')),
        ]));
    }

    final placeAsync = ref.watch(placeByIdProvider(item.placeId));
    final place = placeAsync.valueOrNull;
    final name  = place?.name ?? 'Activiteit';
    final emoji = place?.category.emoji ?? '🏔️';
    final desc  = place?.description?.split('.').first ?? '';

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [AppColors.primary.withOpacity(0.9), AppColors.primaryDark]),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x200F2E1E),
            blurRadius: 10, offset: Offset(0, 3))]),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: () => Navigator.of(context).pop(),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              // Emoji
              Container(width: 54, height: 54,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16)),
                child: Center(child: Text(emoji,
                    style: const TextStyle(fontSize: 28)))),
              const SizedBox(width: 14),
              // Info
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Volgende activiteit', style: TextStyle(
                      fontSize: 10, fontWeight: FontWeight.w700,
                      color: Colors.white60, letterSpacing: 0.3)),
                  const SizedBox(height: 3),
                  Text(name, style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w800,
                      color: Colors.white, letterSpacing: -0.2)),
                  if (desc.isNotEmpty)
                    Text(desc, style: const TextStyle(
                        fontSize: 12, color: Colors.white70),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                ])),
              // Navigate
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.navigation_rounded,
                    color: Colors.white, size: 22)),
            ]),
          ),
        ),
      ),
    );
  }
}

// ── Progress bar ──────────────────────────────────────────
class _ProgressCard extends StatelessWidget {
  final int done, total;
  const _ProgressCard({required this.done, required this.total});

  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? done / total : 0.0;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Text('Voortgang reis', style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w800,
              color: AppColors.textPrimary)),
          const Spacer(),
          Text('$done / $total gedaan', style: const TextStyle(
              fontSize: 12, color: AppColors.textThird,
              fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 8,
            backgroundColor: AppColors.primaryLight,
            valueColor: const AlwaysStoppedAnimation(AppColors.primary))),
        const SizedBox(height: 6),
        Text('${(pct * 100).round()}% van activiteiten afgerond',
            style: const TextStyle(fontSize: 10,
                color: AppColors.textThird)),
      ]),
    );
  }
}

// ── Mini map ──────────────────────────────────────────────
class _MiniMapCard extends StatelessWidget {
  final VoidCallback onExpand;
  const _MiniMapCard({required this.onExpand});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onExpand,
      child: Container(
        height: 160,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [BoxShadow(color: Color(0x100F2E1E),
              blurRadius: 8, offset: Offset(0, 2))]),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: Stack(children: [
            FlutterMap(
              options: const MapOptions(
                initialCenter: LatLng(61.9, 8.3),
                initialZoom: 9,
                interactionOptions: InteractionOptions(
                  flags: InteractiveFlag.none), // mini map not interactive
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.travelcockpit.app'),
                MarkerLayer(markers: [
                  // Skjåk pin
                  const Marker(
                    point: LatLng(61.913, 8.275), width: 32, height: 32,
                    child: _MapDot(color: Color(0xFF1565c0), emoji: '🏡')),
                ]),
              ],
            ),
            // Expand overlay
            Positioned(bottom: 8, right: 8, child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(10),
                boxShadow: const [BoxShadow(color: Color(0x14000000),
                    blurRadius: 4)]),
              child: Row(mainAxisSize: MainAxisSize.min, children: const [
                Icon(Icons.fullscreen_rounded, size: 14,
                    color: AppColors.textSecond),
                SizedBox(width: 4),
                Text('Uitvouwen', style: TextStyle(fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecond)),
              ]))),
          ]),
        ),
      ),
    );
  }
}

class _MapDot extends StatelessWidget {
  final Color color;
  final String emoji;
  const _MapDot({required this.color, required this.emoji});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(color: color, shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [BoxShadow(color: color.withOpacity(0.4), blurRadius: 6)]),
    child: Center(child: Text(emoji,
        style: const TextStyle(fontSize: 14))));
}

// ── Quick action buttons ──────────────────────────────────
class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      (icon: Icons.navigation_rounded, label: 'Navigeer\nnaar stop',
          color: AppColors.primary,
          onTap: () async {
            final uri = Uri.parse(
                'https://www.google.com/maps/dir/?api=1'
                '&destination=61.913,8.275');
            if (await canLaunchUrl(uri)) launchUrl(uri,
                mode: LaunchMode.externalApplication);
          }),
      (icon: Icons.bolt_rounded, label: 'Laadstation\nvinden',
          color: const Color(0xFF1565c0),
          onTap: () => Navigator.of(context).pop()),
      (icon: Icons.lightbulb_rounded, label: 'AI\nideeën',
          color: AppColors.primaryMid,
          onTap: () => Navigator.of(context).pop()),
      (icon: Icons.local_gas_station_rounded, label: 'Tankstation\nvinden',
          color: const Color(0xFF795548),
          onTap: () {}),
    ];

    return Row(children: actions.map((a) => Expanded(
      child: GestureDetector(
        onTap: a.onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: a.color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: a.color.withOpacity(0.3))),
          child: Column(children: [
            Icon(a.icon, color: a.color, size: 24),
            const SizedBox(height: 5),
            Text(a.label, style: TextStyle(fontSize: 9,
                fontWeight: FontWeight.w700, color: a.color),
                textAlign: TextAlign.center),
          ])),
      ),
    )).toList());
  }
}

// ── Today's planning list ─────────────────────────────────
class _TodayList extends ConsumerWidget {
  final List<PlanningItem> items;
  const _TodayList({required this.items});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('VANDAAG', style: TextStyle(fontSize: 11,
          fontWeight: FontWeight.w800, letterSpacing: 0.6,
          color: AppColors.textThird)),
      const SizedBox(height: 8),
      ...items.asMap().entries.map((e) {
        final item  = e.value;
        final place = ref.watch(placeByIdProvider(item.placeId)).valueOrNull;
        final done  = item.isCompleted;
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: done ? AppColors.background : AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border)),
          child: Row(children: [
            // Check
            Container(width: 24, height: 24,
              decoration: BoxDecoration(
                color: done ? AppColors.action : Colors.transparent,
                shape: BoxShape.circle,
                border: Border.all(
                  color: done ? AppColors.action : AppColors.border,
                  width: 2)),
              child: done ? const Icon(Icons.check_rounded,
                  color: Colors.white, size: 13) : null),
            const SizedBox(width: 10),
            Text(place?.category.emoji ?? '📍',
                style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 10),
            Expanded(child: Text(
              place?.name ?? 'Activiteit',
              style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w700,
                color: done ? AppColors.textThird : AppColors.textPrimary,
                decoration: done ? TextDecoration.lineThrough : null))),
            if (!done)
              GestureDetector(
                onTap: () async {
                  final p = place;
                  if (p == null) return;
                  final uri = Uri.parse(
                      'https://www.google.com/maps/dir/?api=1'
                      '&destination=${p.latitude},${p.longitude}');
                  if (await canLaunchUrl(uri)) launchUrl(uri,
                      mode: LaunchMode.externalApplication);
                },
                child: Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.navigation_rounded,
                      color: AppColors.primary, size: 16))),
          ]));
      }),
    ]);
  }
}

// ── Full map view ─────────────────────────────────────────
class _MapView extends StatelessWidget {
  final VoidCallback onCollapse;
  const _MapView({required this.onCollapse});

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      FlutterMap(
        options: const MapOptions(
          initialCenter: LatLng(61.5, 8.0),
          initialZoom: 8),
        children: [
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.travelcockpit.app'),
          PolylineLayer(polylines: [
            Polyline(
              points: const [
                LatLng(61.219, 7.158),
                LatLng(61.913, 8.275),
                LatLng(60.985, 9.236),
                LatLng(58.880, 9.020),
              ],
              color: AppColors.primary.withOpacity(0.7),
              strokeWidth: 3),
          ]),
          MarkerLayer(markers: [
            const Marker(point: LatLng(61.219, 7.158), width: 40, height: 40,
                child: _MapDot(color: Color(0xFF2d6a4f), emoji: '🏡')),
            const Marker(point: LatLng(61.913, 8.275), width: 44, height: 44,
                child: _MapDot(color: Color(0xFF1565c0), emoji: '🏡')),
            const Marker(point: LatLng(60.985, 9.236), width: 40, height: 40,
                child: _MapDot(color: Color(0xFFef6c00), emoji: '🏡')),
            const Marker(point: LatLng(58.880, 9.020), width: 40, height: 40,
                child: _MapDot(color: Color(0xFF6a1b9a), emoji: '🏡')),
          ]),
        ],
      ),
      Positioned(top: 12, right: 12,
        child: GestureDetector(
          onTap: onCollapse,
          child: Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: const [BoxShadow(color: Color(0x18000000),
                  blurRadius: 8)]),
            child: const Icon(Icons.close_rounded,
                color: AppColors.textSecond, size: 20)))),
    ]);
  }
}
