import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/place.dart';
import '../../../providers/trip_provider.dart';
import '../../../providers/database_provider.dart';
import 'widgets/map_filter_chips.dart';
import 'widgets/map_place_sheet.dart';

enum MapFilter { all, activities, food, charging, accommodation }

// All places for active trip from DB
final _mapPlacesProvider = StreamProvider<List<Place>>((ref) {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  return ref.watch(placeRepositoryProvider).watchByTrip(trip.id);
});

// ── Route segment types ───────────────────────────────────
enum _SegmentType { drive, ferry }

class _RouteSegment {
  final List<LatLng> points;
  final _SegmentType type;
  final String label;
  const _RouteSegment(this.points, this.type, this.label);
}

// ── Route stop types ──────────────────────────────────────
enum _StopType { home, ferry, accommodation, waypoint, hotel }

class _RouteStop {
  final String name;
  final double lat, lng;
  final String emoji;
  final _StopType type;
  final String? date;
  final String? detail;
  const _RouteStop({
    required this.name, required this.lat, required this.lng,
    required this.emoji, required this.type,
    this.date, this.detail,
  });
}

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  MapFilter _filter   = MapFilter.all;
  Place?    _selected;
  bool      _showFullRoute = true; // toggle full Europe route vs Norway only
  final _mapController = MapController();

  // ── Complete route Nijmegen 2026 ──────────────────────
  // Heen: Nijmegen → Hirtshals → Stavanger → Bergen → Sogndal → Skjåk → Valdres → Gjerstad
  // Terug: Gjerstad → Kristiansand → Hirtshals → Kolding → Nijmegen

  static const _routeStops = [
    _RouteStop(name: 'Nijmegen (thuis)',        lat: 51.8125, lng: 5.8372,
        emoji: '🏠', type: _StopType.home,
        date: '15 jun', detail: 'Vertrek 18:00'),
    _RouteStop(name: 'Hirtshals',               lat: 57.5879, lng: 9.9580,
        emoji: '⛴️', type: _StopType.ferry,
        date: '15 jun', detail: 'Ferry terminal · nachtferry'),
    _RouteStop(name: 'Stavanger (tussenstop)',  lat: 58.9700, lng: 5.7331,
        emoji: '🚢', type: _StopType.waypoint,
        date: '16 jun', detail: 'Tussenstop · niet van boord'),
    _RouteStop(name: 'Bergen',                  lat: 60.3913, lng: 5.3221,
        emoji: '⛴️', type: _StopType.ferry,
        date: '16 jun', detail: 'Aankomst ±13:00'),
    _RouteStop(name: 'Sogndal',                 lat: 61.2190, lng: 7.1580,
        emoji: '🏡', type: _StopType.accommodation,
        date: '16–19 jun', detail: 'Årøyvegen 202 · 3 nachten'),
    _RouteStop(name: 'Skjåk Solside',           lat: 61.9130, lng: 8.2750,
        emoji: '🏡', type: _StopType.accommodation,
        date: '19–23 jun', detail: 'Skjåk Solside 799 · 4 nachten'),
    _RouteStop(name: 'Valdres / Noord-Aurdal',  lat: 60.9850, lng: 9.2360,
        emoji: '🏡', type: _StopType.accommodation,
        date: '23–27 jun', detail: 'Førsøddin 30 · 4 nachten'),
    _RouteStop(name: 'Gjerstad',                lat: 58.8800, lng: 9.0200,
        emoji: '🏡', type: _StopType.accommodation,
        date: '27–29 jun', detail: 'Løyteveien 14 · 2 nachten'),
    _RouteStop(name: 'Kristiansand',            lat: 58.1450, lng: 7.9890,
        emoji: '⛴️', type: _StopType.ferry,
        date: '29 jun', detail: 'Ferry terminal · terug'),
    _RouteStop(name: 'Hirtshals',               lat: 57.5879, lng: 9.9580,
        emoji: '⛴️', type: _StopType.ferry,
        date: '29 jun', detail: 'Aankomst Denemarken'),
    _RouteStop(name: 'Kolding',                 lat: 55.4900, lng: 9.4720,
        emoji: '🏨', type: _StopType.hotel,
        date: '29–30 jun', detail: 'Overnachting'),
    _RouteStop(name: 'Nijmegen (thuis)',         lat: 51.8125, lng: 5.8372,
        emoji: '🏠', type: _StopType.home,
        date: '30 jun', detail: 'Thuiskomst'),
  ];

  // Route lines — split by transport mode
  static final _segments = [
    // 🚗 Nijmegen → Hirtshals (rijden)
    _RouteSegment([
      const LatLng(51.8125, 5.8372),
      const LatLng(52.3676, 4.9041), // Amsterdam
      const LatLng(53.2194, 6.5665), // Groningen
      const LatLng(55.4768, 8.4497), // Esbjerg richting
      const LatLng(57.5879, 9.9580), // Hirtshals
    ], _SegmentType.drive, 'Nijmegen → Hirtshals'),

    // ⛴️ Hirtshals → Stavanger → Bergen (ferry)
    _RouteSegment([
      const LatLng(57.5879, 9.9580), // Hirtshals
      const LatLng(57.9000, 7.5000), // Skagerrak open water
      const LatLng(58.9700, 5.7331), // Stavanger (tussenstop)
      const LatLng(59.8000, 5.2000), // richting Bergen
      const LatLng(60.3913, 5.3221), // Bergen
    ], _SegmentType.ferry, 'Hirtshals → Bergen (Color Line)'),

    // 🚗 Bergen → Sogndal (rijden)
    _RouteSegment([
      const LatLng(60.3913, 5.3221),
      const LatLng(60.6000, 5.7000), // E16 richting
      const LatLng(60.8600, 6.4000), // Voss
      const LatLng(61.0500, 6.8000), // Gudvangen
      const LatLng(61.2190, 7.1580), // Sogndal
    ], _SegmentType.drive, 'Bergen → Sogndal'),

    // 🚗 Sogndal → Skjåk via Sognefjellet (rijden)
    _RouteSegment([
      const LatLng(61.2190, 7.1580),
      const LatLng(61.4000, 7.5000), // Gaupne
      const LatLng(61.5640, 8.0000), // Sognefjellet top
      const LatLng(61.7500, 8.1500), // Lom richting
      const LatLng(61.8370, 8.5680), // Lom
      const LatLng(61.9130, 8.2750), // Skjåk
    ], _SegmentType.drive, 'Sogndal → Skjåk (via Sognefjellet)'),

    // 🚗 Skjåk → Valdres (rijden)
    _RouteSegment([
      const LatLng(61.9130, 8.2750),
      const LatLng(61.5000, 8.8000), // Randsverk
      const LatLng(61.2000, 9.0000), // Vinstra
      const LatLng(60.9850, 9.2360), // Valdres
    ], _SegmentType.drive, 'Skjåk → Valdres'),

    // 🚗 Valdres → Gjerstad (rijden)
    _RouteSegment([
      const LatLng(60.9850, 9.2360),
      const LatLng(60.2000, 9.6000), // Numedal
      const LatLng(59.7000, 9.7000), // Kongsberg
      const LatLng(59.0000, 9.3000), // richting Telemark
      const LatLng(58.8800, 9.0200), // Gjerstad
    ], _SegmentType.drive, 'Valdres → Gjerstad'),

    // 🚗 Gjerstad → Kristiansand (rijden)
    _RouteSegment([
      const LatLng(58.8800, 9.0200),
      const LatLng(58.5000, 8.5000), // E18 Sørlandet
      const LatLng(58.1450, 7.9890), // Kristiansand
    ], _SegmentType.drive, 'Gjerstad → Kristiansand'),

    // ⛴️ Kristiansand → Hirtshals (ferry terug)
    _RouteSegment([
      const LatLng(58.1450, 7.9890),
      const LatLng(57.9000, 8.5000), // Skagerrak
      const LatLng(57.6500, 9.2000), // richting DK
      const LatLng(57.5879, 9.9580), // Hirtshals
    ], _SegmentType.ferry, 'Kristiansand → Hirtshals (Fjord Line)'),

    // 🚗 Hirtshals → Kolding (rijden)
    _RouteSegment([
      const LatLng(57.5879, 9.9580),
      const LatLng(57.0000, 9.8000), // Aalborg
      const LatLng(56.5000, 9.7000), // Viborg richting
      const LatLng(55.4900, 9.4720), // Kolding
    ], _SegmentType.drive, 'Hirtshals → Kolding'),

    // 🚗 Kolding → Nijmegen (rijden)
    _RouteSegment([
      const LatLng(55.4900, 9.4720),
      const LatLng(55.0000, 9.5000), // grens DK/DE
      const LatLng(53.5500, 9.9900), // Hamburg
      const LatLng(52.5000, 7.5000), // Osnabrück richting
      const LatLng(52.2200, 6.8800), // Münster
      const LatLng(51.8125, 5.8372), // Nijmegen
    ], _SegmentType.drive, 'Kolding → Nijmegen'),
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

  @override
  Widget build(BuildContext context) {
    final placesAsync = ref.watch(_mapPlacesProvider);
    final places = placesAsync.valueOrNull ?? [];

    final filtered = _filter == MapFilter.all
        ? places
        : places.where((p) =>
            _filterForCategory(p.category) == _filter).toList();

    // Default center: middle of Norway
    const center = LatLng(59.0, 7.5);
    // Zoom: Norway only or full route
    final zoom = _showFullRoute ? 4.5 : 7.0;

    return Scaffold(
      body: Stack(children: [

        // ── Map ──────────────────────────────────────
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: center,
            initialZoom: zoom,
            onTap: (_, __) => setState(() => _selected = null),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.travelcockpit.app',
            ),

            // Route lines — different style per type
            PolylineLayer(polylines: _segments.map((seg) {
              final isFerry = seg.type == _SegmentType.ferry;
              return Polyline(
                points:      seg.points,
                color:       isFerry
                    ? AppColors.fjordBlue.withOpacity(0.75)
                    : AppColors.primary.withOpacity(0.65),
                strokeWidth: isFerry ? 2.5 : 3.0,
                isDotted:    isFerry, // ferry = gestippeld
              );
            }).toList()),

            // Route stop markers (home, ferry, hotel)
            MarkerLayer(
              markers: _routeStops.map((stop) => Marker(
                point: LatLng(stop.lat, stop.lng),
                width:  stop.type == _StopType.accommodation ? 50 : 38,
                height: stop.type == _StopType.accommodation ? 50 : 38,
                child: _RouteMarker(stop: stop),
              )).toList(),
            ),

            // Activity/place pins from DB
            MarkerLayer(
              markers: filtered
                  .where((p) =>
                      p.latitude != 0 && p.longitude != 0 &&
                      p.category != PlaceCategory.accommodation)
                  .map((place) => Marker(
                    point: LatLng(place.latitude, place.longitude),
                    width: 40, height: 40,
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _selected = place);
                        _mapController.move(
                          LatLng(place.latitude, place.longitude), 11);
                      },
                      child: _PlacePin(
                        place:      place,
                        isSelected: _selected?.id == place.id,
                      ),
                    ),
                  )).toList(),
            ),
          ],
        ),

        // ── Top overlay ───────────────────────────────
        SafeArea(child: Column(children: [
          // Search bar + route toggle
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Row(children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 11),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(26),
                    boxShadow: const [BoxShadow(
                        color: Color(0x18000000),
                        blurRadius: 12, offset: Offset(0, 3))],
                  ),
                  child: Row(children: [
                    const Icon(Icons.search_rounded,
                        color: AppColors.textThird, size: 20),
                    const SizedBox(width: 8),
                    Expanded(child: Text(
                      '${filtered.length} plaatsen · Noorwegen 2026',
                      style: const TextStyle(fontSize: 13,
                          color: AppColors.textThird))),
                  ]),
                ),
              ),
              const SizedBox(width: 8),
              // Toggle full route / Norway only
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
                        ? AppColors.primary : Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: const [BoxShadow(
                        color: Color(0x18000000),
                        blurRadius: 8, offset: Offset(0, 2))],
                  ),
                  child: Center(child: Text(
                    _showFullRoute ? '🌍' : '🇳🇴',
                    style: const TextStyle(fontSize: 20))),
                ),
              ),
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
          // Legend
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 6, 14, 0),
            child: Row(children: [
              _LegendItem(color: AppColors.primary,    label: '─── Rijden',  dotted: false),
              const SizedBox(width: 12),
              _LegendItem(color: AppColors.fjordBlue,  label: '- - Ferry',   dotted: true),
              const SizedBox(width: 12),
              _LegendItem(color: AppColors.primaryDark, label: '🏡 Verblijf', dotted: false, isText: true),
            ]),
          ),
        ])),

        // ── Bottom: place sheet or route strip ────────
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
                    _snack('✓ ${_selected!.name} toegevoegd aan planning');
                    setState(() => _selected = null);
                  },
                  onNavigate: () => _navigate(_selected!),
                  onClose:    () => setState(() => _selected = null),
                )
              : _RouteStrip(showFull: _showFullRoute),
        ),
      ]),
    );
  }

  Future<void> _navigate(Place place) async {
    final uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1'
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

// ── Route stop marker ─────────────────────────────────────
class _RouteMarker extends StatelessWidget {
  final _RouteStop stop;
  const _RouteMarker({required this.stop});

  Color get _bg {
    switch (stop.type) {
      case _StopType.accommodation: return AppColors.primaryDark;
      case _StopType.ferry:         return AppColors.fjordBlue;
      case _StopType.home:          return AppColors.flagRed;
      case _StopType.hotel:         return const Color(0xFF5D4037);
      case _StopType.waypoint:      return AppColors.fjordBlue.withOpacity(0.7);
    }
  }

  double get _size => stop.type == _StopType.accommodation ? 50 : 38;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: _size, height: _size,
      decoration: BoxDecoration(
        color: _bg,
        shape: BoxShape.circle,
        border: Border.all(
          color: stop.type == _StopType.accommodation
              ? Colors.white : Colors.white.withOpacity(0.8),
          width: stop.type == _StopType.accommodation ? 3 : 2,
        ),
        boxShadow: [BoxShadow(
          color: _bg.withOpacity(0.4),
          blurRadius: stop.type == _StopType.accommodation ? 12 : 6,
          offset: const Offset(0, 3))],
      ),
      child: Center(child: Text(stop.emoji,
          style: TextStyle(
              fontSize: stop.type == _StopType.accommodation ? 22 : 17))),
    );
  }
}

// ── Activity pin ──────────────────────────────────────────
class _PlacePin extends StatelessWidget {
  final Place place;
  final bool isSelected;
  const _PlacePin({required this.place, required this.isSelected});

  Color get _color {
    switch (place.category) {
      case PlaceCategory.activity:   return AppColors.primary;
      case PlaceCategory.restaurant:
      case PlaceCategory.cafe:       return const Color(0xFFC87820);
      case PlaceCategory.evCharging: return AppColors.flagRed;
      default:                       return AppColors.fjordBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final sz = isSelected ? 44.0 : 36.0;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      width: sz, height: sz,
      decoration: BoxDecoration(
        color: _color, shape: BoxShape.circle,
        border: Border.all(
            color: Colors.white.withOpacity(isSelected ? 1.0 : 0.8),
            width: isSelected ? 2.5 : 2.0),
        boxShadow: [BoxShadow(
            color: _color.withOpacity(isSelected ? 0.5 : 0.25),
            blurRadius: isSelected ? 12 : 6,
            offset: const Offset(0, 2))],
      ),
      child: Center(child: Text(place.category.emoji,
          style: TextStyle(fontSize: isSelected ? 18 : 14))),
    );
  }
}

// ── Legend item ───────────────────────────────────────────
class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final bool dotted;
  final bool isText;
  const _LegendItem({required this.color, required this.label,
      required this.dotted, this.isText = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [BoxShadow(
            color: Color(0x10000000), blurRadius: 4)],
      ),
      child: Text(label, style: TextStyle(
          fontSize: 10, fontWeight: FontWeight.w700, color: color)),
    );
  }
}

// ── Route strip ───────────────────────────────────────────
class _RouteStrip extends StatelessWidget {
  final bool showFull;
  const _RouteStrip({required this.showFull});

  // Accommodations only for Norway view
  static const _norwayStops = [
    (name: 'Sogndal',              dates: '16–19 jun', nights: '3 nachten', emoji: '🏡'),
    (name: 'Skjåk Solside',        dates: '19–23 jun', nights: '4 nachten', emoji: '🏡'),
    (name: 'Valdres / N-Aurdal',   dates: '23–27 jun', nights: '4 nachten', emoji: '🏡'),
    (name: 'Gjerstad',             dates: '27–29 jun', nights: '2 nachten', emoji: '🏡'),
  ];

  // Full route including travel days
  static const _fullStops = [
    (name: 'Nijmegen',     dates: '15 jun 18:00', nights: 'vertrek', emoji: '🏠'),
    (name: 'Hirtshals',    dates: '15 jun nacht', nights: 'ferry →', emoji: '⛴️'),
    (name: 'Stavanger',    dates: '16 jun',        nights: 'tussenstop', emoji: '🚢'),
    (name: 'Bergen',       dates: '16 jun 13:00', nights: 'aankomst', emoji: '⛴️'),
    (name: 'Sogndal',      dates: '16–19 jun',    nights: '3 nachten', emoji: '🏡'),
    (name: 'Skjåk',        dates: '19–23 jun',    nights: '4 nachten', emoji: '🏡'),
    (name: 'Valdres',      dates: '23–27 jun',    nights: '4 nachten', emoji: '🏡'),
    (name: 'Gjerstad',     dates: '27–29 jun',    nights: '2 nachten', emoji: '🏡'),
    (name: 'Kristiansand', dates: '29 jun',        nights: 'ferry →', emoji: '⛴️'),
    (name: 'Hirtshals',   dates: '29 jun',        nights: 'aankomst', emoji: '⛴️'),
    (name: 'Kolding',      dates: '29–30 jun',    nights: 'overnacht', emoji: '🏨'),
    (name: 'Nijmegen',     dates: '30 jun',        nights: 'thuis!', emoji: '🏠'),
  ];

  @override
  Widget build(BuildContext context) {
    final stops = showFull ? _fullStops : _norwayStops;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        boxShadow: [BoxShadow(color: Color(0x20000000),
            blurRadius: 20, offset: Offset(0, -4))],
      ),
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        // Handle
        Center(child: Container(width: 38, height: 4,
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(color: AppColors.border,
                borderRadius: BorderRadius.circular(2)))),
        // Title row
        Row(children: [
          const Text('🇳🇴', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 8),
          Expanded(child: Text(
            showFull
                ? 'Volledige route · Nijmegen – Noorwegen – Nijmegen'
                : 'Verblijven Noorwegen 2026',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800,
                color: AppColors.textPrimary))),
          // Legend: ferry colour
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.fjordBlueLt,
              borderRadius: BorderRadius.circular(8)),
            child: const Text('⛴️ ferry gestippeld',
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                    color: AppColors.fjordBlue))),
        ]),
        const SizedBox(height: 10),
        // Horizontal scrollable stops
        SizedBox(
          height: 76,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: stops.length,
            separatorBuilder: (_, __) => const SizedBox(width: 6),
            itemBuilder: (_, i) {
              final s = stops[i];
              final isAcc  = s.emoji == '🏡';
              final isFerry = s.emoji == '⛴️' || s.emoji == '🚢';
              final isHome  = s.emoji == '🏠';

              return Container(
                width: 100,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isAcc
                      ? AppColors.primaryLight
                      : isFerry
                          ? AppColors.fjordBlueLt
                          : isHome
                              ? AppColors.flagRedLight
                              : AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isAcc
                        ? AppColors.primary
                        : isFerry
                            ? AppColors.fjordBlue
                            : isHome
                                ? AppColors.flagRed
                                : AppColors.border,
                    width: isAcc ? 1.5 : 1,
                  )),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text(s.emoji, style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 4),
                      Expanded(child: Text(s.name, style: TextStyle(
                          fontSize: 10, fontWeight: FontWeight.w800,
                          color: isAcc
                              ? AppColors.primaryDark
                              : isFerry
                                  ? AppColors.fjordBlue
                                  : AppColors.textPrimary),
                          maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ]),
                    const SizedBox(height: 3),
                    Text(s.dates, style: const TextStyle(fontSize: 9,
                        color: AppColors.textThird)),
                    const SizedBox(height: 1),
                    Text(s.nights, style: TextStyle(
                        fontSize: 9, fontWeight: FontWeight.w700,
                        color: isAcc ? AppColors.primary : AppColors.textThird)),
                  ]),
              );
            },
          ),
        ),
        // Transport legend
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _dot(AppColors.primary),      const SizedBox(width: 4),
          const Text('Rijden', style: TextStyle(fontSize: 10, color: AppColors.textThird)),
          const SizedBox(width: 16),
          _dot(AppColors.fjordBlue),    const SizedBox(width: 4),
          const Text('Ferry', style: TextStyle(fontSize: 10, color: AppColors.textThird)),
          const SizedBox(width: 16),
          _dot(AppColors.primaryDark, large: true),  const SizedBox(width: 4),
          const Text('Verblijf', style: TextStyle(fontSize: 10, color: AppColors.textThird)),
          const SizedBox(width: 16),
          _dot(AppColors.flagRed),      const SizedBox(width: 4),
          const Text('Thuis', style: TextStyle(fontSize: 10, color: AppColors.textThird)),
        ]),
      ]),
    );
  }

  Widget _dot(Color c, {bool large = false}) => Container(
    width: large ? 14 : 10, height: large ? 14 : 10,
    decoration: BoxDecoration(color: c, shape: BoxShape.circle));
}

// Data class for MapPlaceSheet
class MapPlaceData {
  final String id, name, emoji;
  final MapFilter type;
  const MapPlaceData({required this.id, required this.name,
      required this.emoji, required this.type});
}
