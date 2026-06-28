import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/place.dart';
import '../../../providers/trip_provider.dart';
import '../../../providers/database_provider.dart';
import '../../../providers/planning_provider.dart';
import 'widgets/map_filter_chips.dart';
import 'widgets/map_place_sheet.dart';

enum MapFilter { all, activities, food, charging, accommodation }

// ── Accommodation config — matches index.html exactly ─────
class _AccConfig {
  final String name;
  final String shortName;
  final Color color;
  final DateTime checkIn;
  final DateTime checkOut;
  final double lat, lng;
  const _AccConfig({required this.name, required this.shortName,
      required this.color, required this.checkIn, required this.checkOut,
      required this.lat, required this.lng});
}

const _accs = [
  _AccConfig(name: 'Sogndal',              shortName: 'Sgd',
      color: Color(0xFF2d6a4f),
      checkIn: DateTime.utc(2026,6,16), checkOut: DateTime.utc(2026,6,19),
      lat: 61.219, lng: 7.158),
  _AccConfig(name: 'Skjåk Solside',        shortName: 'Skj',
      color: Color(0xFF1565c0),
      checkIn: DateTime.utc(2026,6,19), checkOut: DateTime.utc(2026,6,23),
      lat: 61.913, lng: 8.275),
  _AccConfig(name: 'Valdres / N-Aurdal',   shortName: 'Val',
      color: Color(0xFFef6c00),
      checkIn: DateTime.utc(2026,6,23), checkOut: DateTime.utc(2026,6,27),
      lat: 60.985, lng: 9.236),
  _AccConfig(name: 'Gjerstad',             shortName: 'Gjr',
      color: Color(0xFF6a1b9a),
      checkIn: DateTime.utc(2026,6,27), checkOut: DateTime.utc(2026,6,29),
      lat: 58.880, lng: 9.020),
];

// Map activity name → accommodation config
_AccConfig? _accForActivity(String name) {
  final n = name.toLowerCase();
  if (n.contains('molden') || n.contains('solvorn') ||
      n.contains('urnes')  || n.contains('bøyabreen'))
    return _accs[0]; // Sogndal
  if (n.contains('lom')    || n.contains('bakeriet') ||
      n.contains('klimapark') || n.contains('vegaskjelet') ||
      n.contains('dønfoss') || n.contains('gjelbrue'))
    return _accs[1]; // Skjåk
  if (n.contains('besseggen') || n.contains('bygdin') ||
      n.contains('mjølkevegen') || n.contains('gomobu') ||
      n.contains('syndin'))
    return _accs[2]; // Valdres
  if (n.contains('solhomfjell') || n.contains('risør') ||
      n.contains('tvedestrand'))
    return _accs[3]; // Gjerstad
  return null;
}

// All places from DB for active trip
final _mapPlacesProvider = StreamProvider<List<Place>>((ref) {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  return ref.watch(placeRepositoryProvider).watchByTrip(trip.id);
});

// All planning items for day numbers on pins
final _planningForMapProvider = StreamProvider<List<dynamic>>((ref) {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  return ref.watch(planningRepositoryProvider).watchByTrip(trip.id);
});

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});
  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  MapFilter _filter      = MapFilter.all;
  Place?    _selected;
  bool      _showFullRoute = false; // default Norway view
  _AccConfig? _filterAcc;           // filter by accommodation
  final _mapController = MapController();

  // ── Complete route segments ───────────────────────────
  static final _driveSegments = [
    [const LatLng(51.8125, 5.8372), const LatLng(52.3676, 4.9041),
     const LatLng(53.2194, 6.5665), const LatLng(55.4768, 8.4497),
     const LatLng(57.5879, 9.9580)], // Nijmegen → Hirtshals
    [const LatLng(60.3913, 5.3221), const LatLng(60.6000, 5.7000),
     const LatLng(60.8600, 6.4000), const LatLng(61.0500, 6.8000),
     const LatLng(61.2190, 7.1580)], // Bergen → Sogndal
    [const LatLng(61.2190, 7.1580), const LatLng(61.4000, 7.5000),
     const LatLng(61.5640, 8.0000), const LatLng(61.8370, 8.5680),
     const LatLng(61.9130, 8.2750)], // Sogndal → Skjåk
    [const LatLng(61.9130, 8.2750), const LatLng(61.5000, 8.8000),
     const LatLng(60.9850, 9.2360)], // Skjåk → Valdres
    [const LatLng(60.9850, 9.2360), const LatLng(59.7000, 9.7000),
     const LatLng(58.8800, 9.0200)], // Valdres → Gjerstad
    [const LatLng(58.8800, 9.0200), const LatLng(58.5000, 8.5000),
     const LatLng(58.1450, 7.9890)], // Gjerstad → Kristiansand
    [const LatLng(57.5879, 9.9580), const LatLng(57.0000, 9.8000),
     const LatLng(55.4900, 9.4720)], // Hirtshals → Kolding
    [const LatLng(55.4900, 9.4720), const LatLng(53.5500, 9.9900),
     const LatLng(51.8125, 5.8372)], // Kolding → Nijmegen
  ];

  static final _ferrySegments = [
    [const LatLng(57.5879, 9.9580), const LatLng(57.9000, 7.5000),
     const LatLng(58.9700, 5.7331), const LatLng(60.3913, 5.3221)], // Hirtshals→Bergen
    [const LatLng(58.1450, 7.9890), const LatLng(57.9000, 8.5000),
     const LatLng(57.5879, 9.9580)], // Kristiansand→Hirtshals
  ];

  MapFilter _filterForCategory(PlaceCategory cat) {
    switch (cat) {
      case PlaceCategory.accommodation: return MapFilter.accommodation;
      case PlaceCategory.activity:      return MapFilter.activities;
      case PlaceCategory.restaurant:
      case PlaceCategory.cafe:          return MapFilter.food;
      case PlaceCategory.evCharging:
      case PlaceCategory.fuelStation:   return MapFilter.charging;
      default:                          return MapFilter.activities;
    }
  }

  bool _placeMatchesAccFilter(Place p) {
    if (_filterAcc == null) return true;
    final acc = _accForActivity(p.name);
    return acc?.name == _filterAcc!.name;
  }

  @override
  Widget build(BuildContext context) {
    final placesAsync   = ref.watch(_mapPlacesProvider);
    final planningAsync = ref.watch(_planningForMapProvider);

    final places   = placesAsync.valueOrNull ?? [];
    final planning = planningAsync.valueOrNull ?? [];

    // Build day number map: placeId → "D4-2" label
    final Map<String, String> dayLabels = {};
    final tripStart = DateTime(2026, 6, 15);
    for (final item in planning) {
      if (item.plannedDate == null) continue;
      final dn = item.plannedDate.difference(tripStart).inDays + 1;
      // Count position within that day
      final sameDay = planning.where((i) =>
          i.plannedDate != null &&
          i.plannedDate.year  == item.plannedDate.year &&
          i.plannedDate.month == item.plannedDate.month &&
          i.plannedDate.day   == item.plannedDate.day).toList();
      sameDay.sort((a,b) => (a.priority ?? 99).compareTo(b.priority ?? 99));
      final pos = sameDay.indexOf(item) + 1;
      dayLabels[item.placeId] = 'D$dn-$pos';
    }

    // Filter places
    final filtered = places.where((p) {
      if (p.category == PlaceCategory.accommodation) return true;
      if (_filter != MapFilter.all &&
          _filterForCategory(p.category) != _filter) return false;
      if (!_placeMatchesAccFilter(p)) return false;
      return true;
    }).toList();

    return Scaffold(
      body: Stack(children: [

        // ── Map ──────────────────────────────────────────
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _showFullRoute
                ? const LatLng(57.0, 7.5)
                : const LatLng(61.0, 8.0),
            initialZoom: _showFullRoute ? 4.5 : 7.0,
            onTap: (_, __) => setState(() => _selected = null),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.travelcockpit.app',
            ),

            // Drive lines — green
            PolylineLayer(polylines: _driveSegments.map((pts) => Polyline(
              points: pts,
              color: AppColors.primary.withOpacity(0.55),
              strokeWidth: 2.5,
            )).toList()),

            // Ferry lines — blue dashed
            PolylineLayer(polylines: _ferrySegments.map((pts) => Polyline(
              points: pts,
              color: AppColors.fjordBlue.withOpacity(0.7),
              strokeWidth: 2.5,
              isDotted: true,
            )).toList()),

            // ── Lines from accommodation to activities ────
            // Draw a thin line from each accommodation to its activities
            PolylineLayer(polylines: [
              for (final acc in _accs)
                for (final p in filtered)
                  if (p.category != PlaceCategory.accommodation &&
                      p.latitude != 0 &&
                      _accForActivity(p.name)?.name == acc.name)
                    Polyline(
                      points: [LatLng(acc.lat, acc.lng),
                               LatLng(p.latitude, p.longitude)],
                      color: acc.color.withOpacity(0.18),
                      strokeWidth: 1.5,
                    ),
            ]),

            // ── Accommodation pins — large, prominent ─────
            MarkerLayer(markers: _accs.map((acc) {
              final isFilterActive = _filterAcc?.name == acc.name;
              return Marker(
                point: LatLng(acc.lat, acc.lng),
                width: 64, height: 64,
                child: GestureDetector(
                  onTap: () => setState(() {
                    _filterAcc = _filterAcc?.name == acc.name ? null : acc;
                  }),
                  child: _AccPin(acc: acc, isActive: isFilterActive),
                ),
              );
            }).toList()),

            // ── Activity pins — colored by accommodation ──
            MarkerLayer(markers: filtered
                .where((p) =>
                    p.category != PlaceCategory.accommodation &&
                    p.latitude != 0 && p.longitude != 0)
                .map((place) {
              final acc      = _accForActivity(place.name);
              final pinColor = acc?.color ?? AppColors.primary;
              final dayLabel = dayLabels[place.id];
              final isSelected = _selected?.id == place.id;

              return Marker(
                point: LatLng(place.latitude, place.longitude),
                width: isSelected ? 56 : 44,
                height: isSelected ? 56 : 44,
                child: GestureDetector(
                  onTap: () {
                    setState(() => _selected = place);
                    _mapController.move(
                        LatLng(place.latitude, place.longitude), 11);
                  },
                  child: _ActivityPin(
                    place:      place,
                    pinColor:   pinColor,
                    dayLabel:   dayLabel,
                    isSelected: isSelected,
                  ),
                ),
              );
            }).toList()),
          ],
        ),

        // ── Top overlay ───────────────────────────────────
        SafeArea(child: Column(children: [
          // Search + route toggle
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Row(children: [
              Expanded(child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 11),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: const [BoxShadow(
                      color: Color(0x18000000),
                      blurRadius: 12, offset: Offset(0, 3))]),
                child: Row(children: [
                  const Icon(Icons.search_rounded,
                      color: AppColors.textThird, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text(
                    _filterAcc != null
                        ? '${_filterAcc!.name} · ${filtered.where((p) => p.category != PlaceCategory.accommodation).length} activiteiten'
                        : '${filtered.where((p) => p.category != PlaceCategory.accommodation).length} activiteiten',
                    style: const TextStyle(fontSize: 13,
                        color: AppColors.textThird))),
                  if (_filterAcc != null)
                    GestureDetector(
                      onTap: () => setState(() => _filterAcc = null),
                      child: const Icon(Icons.close_rounded,
                          color: AppColors.textThird, size: 18)),
                ]))),
              const SizedBox(width: 8),
              // 🌍 / 🇳🇴 toggle
              GestureDetector(
                onTap: () {
                  setState(() => _showFullRoute = !_showFullRoute);
                  _mapController.move(
                    _showFullRoute
                        ? const LatLng(57.0, 7.5)
                        : const LatLng(61.0, 8.0),
                    _showFullRoute ? 4.5 : 7.0,
                  );
                },
                child: Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: _showFullRoute
                        ? AppColors.fjordBlue : Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: const [BoxShadow(
                        color: Color(0x18000000),
                        blurRadius: 8, offset: Offset(0, 2))]),
                  child: Center(child: Text(
                    _showFullRoute ? '🌍' : '🇳🇴',
                    style: const TextStyle(fontSize: 20))))),
            ]),
          ),
          // Category filters
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: MapFilterChips(
              selected: _filter,
              onChanged: (f) => setState(() {
                _filter = f; _selected = null;
              }),
            ),
          ),
          // Accommodation filter row
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 6, 14, 0),
            child: _AccFilterRow(
              selected:   _filterAcc,
              onSelected: (acc) => setState(() {
                _filterAcc = _filterAcc?.name == acc.name ? null : acc;
                _selected  = null;
              }),
            ),
          ),
        ])),

        // ── Bottom: detail sheet or legend ────────────────
        Positioned(
          bottom: 0, left: 0, right: 0,
          child: _selected != null
              ? MapPlaceSheet(
                  place: MapPlaceData(
                    id:    _selected!.id,
                    name:  _selected!.name,
                    emoji: _selected!.category.emoji,
                    type:  _filterForCategory(_selected!.category),
                  ),
                  onAdd: () {
                    _snack('✓ ${_selected!.name} toegevoegd');
                    setState(() => _selected = null);
                  },
                  onNavigate: () => _navigate(_selected!),
                  onClose:    () => setState(() => _selected = null),
                )
              : _BottomLegend(filterAcc: _filterAcc),
        ),
      ]),
    );
  }

  Future<void> _navigate(Place place) async {
    final uri = Uri.parse('https://www.google.com/maps/dir/?api=1'
        '&destination=${place.latitude},${place.longitude}');
    if (await canLaunchUrl(uri)) {
      launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg), backgroundColor: AppColors.primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      duration: const Duration(seconds: 2)));
  }
}

// ── Accommodation pin — large, labeled ────────────────────
class _AccPin extends StatelessWidget {
  final _AccConfig acc;
  final bool isActive;
  const _AccPin({required this.acc, required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      // Pin circle
      AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width:  isActive ? 58 : 50,
        height: isActive ? 58 : 50,
        decoration: BoxDecoration(
          color: acc.color,
          shape: BoxShape.circle,
          border: Border.all(
              color: Colors.white,
              width: isActive ? 3.5 : 2.5),
          boxShadow: [BoxShadow(
            color: acc.color.withOpacity(isActive ? 0.55 : 0.35),
            blurRadius: isActive ? 16 : 10,
            offset: const Offset(0, 3))]),
        child: Center(child: Text('🏡',
            style: TextStyle(fontSize: isActive ? 26 : 22))),
      ),
      // Name label
      Container(
        margin: const EdgeInsets.only(top: 2),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: acc.color,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 4)]),
        child: Text(acc.shortName, style: const TextStyle(
            fontSize: 9, fontWeight: FontWeight.w900,
            color: Colors.white))),
    ]);
  }
}

// ── Activity pin — colored by accommodation, with day label ─
class _ActivityPin extends StatelessWidget {
  final Place place;
  final Color pinColor;
  final String? dayLabel; // "D4-2"
  final bool isSelected;
  const _ActivityPin({required this.place, required this.pinColor,
      this.dayLabel, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    final sz = isSelected ? 52.0 : 40.0;
    return Column(mainAxisSize: MainAxisSize.min, children: [
      AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        width: sz, height: sz,
        decoration: BoxDecoration(
          color: pinColor,
          shape: BoxShape.circle,
          border: Border.all(
              color: Colors.white.withOpacity(isSelected ? 1.0 : 0.85),
              width: isSelected ? 3 : 2),
          boxShadow: [BoxShadow(
              color: pinColor.withOpacity(isSelected ? 0.5 : 0.3),
              blurRadius: isSelected ? 14 : 6,
              offset: const Offset(0, 2))]),
        child: Center(child: Text(place.category.emoji,
            style: TextStyle(fontSize: isSelected ? 22 : 17))),
      ),
      // Day label badge
      if (dayLabel != null)
        Container(
          margin: const EdgeInsets.only(top: 1),
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
          decoration: BoxDecoration(
            color: pinColor,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.6), width: 1)),
          child: Text(dayLabel!, style: const TextStyle(
              fontSize: 8, fontWeight: FontWeight.w900,
              color: Colors.white))),
    ]);
  }
}

// ── Accommodation filter chips ────────────────────────────
class _AccFilterRow extends StatelessWidget {
  final _AccConfig? selected;
  final ValueChanged<_AccConfig> onSelected;
  const _AccFilterRow({required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 30,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _accs.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (_, i) {
          final acc  = _accs[i];
          final isOn = selected?.name == acc.name;
          return GestureDetector(
            onTap: () => onSelected(acc),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: isOn ? acc.color : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: isOn ? acc.color : AppColors.border, width: 1.5),
                boxShadow: const [BoxShadow(
                    color: Color(0x10000000), blurRadius: 4)]),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 8, height: 8,
                    decoration: BoxDecoration(
                      color: isOn ? Colors.white : acc.color,
                      shape: BoxShape.circle)),
                const SizedBox(width: 5),
                Text(acc.shortName, style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w800,
                    color: isOn ? Colors.white : acc.color)),
              ])));
        },
      ),
    );
  }
}

// ── Bottom legend ─────────────────────────────────────────
class _BottomLegend extends StatelessWidget {
  final _AccConfig? filterAcc;
  const _BottomLegend({this.filterAcc});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [BoxShadow(color: Color(0x18000000),
            blurRadius: 16, offset: Offset(0, -3))]),
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Center(child: Container(width: 38, height: 4,
            decoration: BoxDecoration(color: AppColors.border,
                borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 10),
        // Title
        Row(children: [
          const Text('Legenda', style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w800,
              color: AppColors.textPrimary)),
          const Spacer(),
          const Text('Tik op 🏡 om per verblijf te filteren',
              style: TextStyle(fontSize: 10, color: AppColors.textThird)),
        ]),
        const SizedBox(height: 10),
        // Accommodation colors
        Row(children: _accs.map((acc) => Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 3),
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: BoxDecoration(
              color: acc.color.withOpacity(
                  filterAcc == null || filterAcc?.name == acc.name ? 0.12 : 0.05),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: filterAcc?.name == acc.name
                    ? acc.color : acc.color.withOpacity(0.3),
                width: filterAcc?.name == acc.name ? 2 : 1)),
            child: Column(children: [
              Text('🏡', style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 2),
              Text(acc.shortName, style: TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w800,
                  color: acc.color)),
            ]),
          ))).toList()),
        const SizedBox(height: 10),
        // Transport legend
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _leg(AppColors.primary, '── Rijden'),
          const SizedBox(width: 16),
          _leg(AppColors.fjordBlue, '- - Ferry'),
          const SizedBox(width: 16),
          _leg(AppColors.textThird, 'D4-2 = Dag 4, stop 2'),
        ]),
      ]),
    );
  }

  Widget _leg(Color c, String label) => Row(mainAxisSize: MainAxisSize.min,
    children: [
      Container(width: 12, height: 3,
          decoration: BoxDecoration(color: c,
              borderRadius: BorderRadius.circular(2))),
      const SizedBox(width: 5),
      Text(label, style: TextStyle(fontSize: 10,
          color: c, fontWeight: FontWeight.w700)),
    ]);
}

// Data class voor MapPlaceSheet
class MapPlaceData {
  final String id, name, emoji;
  final MapFilter type;
  const MapPlaceData({required this.id, required this.name,
      required this.emoji, required this.type});
}
