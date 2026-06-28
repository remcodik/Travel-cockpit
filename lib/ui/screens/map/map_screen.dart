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

// All places for active trip, from DB
final _mapPlacesProvider = StreamProvider<List<Place>>((ref) {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  return ref.watch(placeRepositoryProvider).watchByTrip(trip.id);
});

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  MapFilter _filter   = MapFilter.all;
  Place? _selected;
  final _mapController = MapController();

  // Norway 2026 route — real coordinates from index.html
  static const _routePoints = [
    LatLng(61.219, 7.158),  // Sogndal
    LatLng(61.913, 8.275),  // Skjåk
    LatLng(60.985, 9.236),  // Valdres
    LatLng(58.880, 9.020),  // Gjerstad
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

    // Filter places by selected category
    final filtered = _filter == MapFilter.all
        ? places
        : places.where((p) =>
            _filterForCategory(p.category) == _filter).toList();

    // Center map on Norway (default to Skjåk area)
    final center = places.isNotEmpty
        ? LatLng(
            places.map((p) => p.latitude).reduce((a, b) => a + b) / places.length,
            places.map((p) => p.longitude).reduce((a, b) => a + b) / places.length,
          )
        : const LatLng(61.5, 8.3);

    return Scaffold(
      body: Stack(children: [
        // ── Map ──────────────────────────────────────
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: center,
            initialZoom: 8,
            onTap: (_, __) => setState(() => _selected = null),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.travelcockpit.app',
            ),
            // Route line — real Norway 2026 route
            PolylineLayer(polylines: [
              Polyline(
                points: _routePoints,
                color: AppColors.primary.withOpacity(0.65),
                strokeWidth: 3.5,
                isDotted: true,
              ),
            ]),
            // Place pins from DB
            MarkerLayer(
              markers: filtered
                  .where((p) => p.latitude != 0 && p.longitude != 0)
                  .map((place) => Marker(
                    point: LatLng(place.latitude, place.longitude),
                    width: 46, height: 46,
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _selected = place);
                        _mapController.move(
                          LatLng(place.latitude, place.longitude), 11);
                      },
                      child: _Pin(
                        place: place,
                        isSelected: _selected?.id == place.id,
                      ),
                    ),
                  )).toList(),
            ),
          ],
        ),

        // ── Search + filters ─────────────────────────
        SafeArea(child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: GestureDetector(
              onTap: () {},
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: const [BoxShadow(
                      color: Color(0x18000000),
                      blurRadius: 12, offset: Offset(0,3))],
                ),
                child: Row(children: [
                  const Icon(Icons.search_rounded,
                      color: AppColors.textThird, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text(
                    '${filtered.length} plaatsen in Noorwegen',
                    style: const TextStyle(fontSize: 14,
                        color: AppColors.textThird))),
                  const Icon(Icons.layers_outlined,
                      color: AppColors.textThird, size: 20),
                ]),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: MapFilterChips(
              selected: _filter,
              onChanged: (f) => setState(() {
                _filter   = f;
                _selected = null;
              }),
            ),
          ),
        ])),

        // ── Bottom sheet ──────────────────────────────
        if (_selected != null)
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: MapPlaceSheet(
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
            ),
          )
        else
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: _RouteStrip(),
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
      content: Text(msg),
      backgroundColor: AppColors.primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      duration: const Duration(seconds: 2),
    ));
  }
}

// ── Pin widget ────────────────────────────────────────────
class _Pin extends StatelessWidget {
  final Place place;
  final bool isSelected;
  const _Pin({required this.place, required this.isSelected});

  Color get _color {
    switch (place.category) {
      case PlaceCategory.accommodation: return AppColors.primaryDark;
      case PlaceCategory.activity:      return AppColors.primary;
      case PlaceCategory.restaurant:
      case PlaceCategory.cafe:          return const Color(0xFFC87820);
      case PlaceCategory.evCharging:
      case PlaceCategory.fuelStation:   return AppColors.flagRed;
      default:                          return AppColors.fjordBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final sz = isSelected ? 46.0 : 40.0;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: sz, height: sz,
      decoration: BoxDecoration(
        color: _color, shape: BoxShape.circle,
        border: Border.all(
            color: Colors.white.withOpacity(isSelected ? 1 : 0.85),
            width: isSelected ? 3 : 2.5),
        boxShadow: [BoxShadow(
            color: _color.withOpacity(isSelected ? 0.5 : 0.3),
            blurRadius: isSelected ? 14 : 8,
            offset: const Offset(0, 3))],
      ),
      child: Center(child: Text(place.category.emoji,
          style: TextStyle(fontSize: isSelected ? 20 : 17))),
    );
  }
}

// ── Route strip — real Norway 2026 stops from index.html ──
class _RouteStrip extends StatelessWidget {
  // Real data from index.html stays + dates
  static const _stops = [
    (name: 'Sogndal',               dates: '16–19 jun', addr: 'Årøyvegen 202'),
    (name: 'Skjåk Solside',         dates: '19–23 jun', addr: 'Skjåk Solside 799'),
    (name: 'Valdres / Noord-Aurdal',dates: '23–27 jun', addr: 'Førsøddin 30'),
    (name: 'Gjerstad',              dates: '27–29 jun', addr: 'Løyteveien 14'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        boxShadow: [BoxShadow(color: Color(0x18000000),
            blurRadius: 20, offset: Offset(0, -4))],
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: Container(width: 38, height: 4,
              decoration: BoxDecoration(color: AppColors.border,
                  borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 12),
          Row(children: [
            const Text('🇳🇴 Noorwegen 2026', style: TextStyle(
                fontSize: 14, fontWeight: FontWeight.w800,
                color: AppColors.textPrimary)),
            const Spacer(),
            const Text('4 stops · 15–29 jun', style: TextStyle(
                fontSize: 12, color: AppColors.textThird)),
          ]),
          const SizedBox(height: 12),
          SizedBox(
            height: 72,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _stops.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final s = _stops[i];
                return Container(
                  width: 130,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(width: 18, height: 18,
                          decoration: const BoxDecoration(
                            color: AppColors.primary, shape: BoxShape.circle),
                          child: Center(child: Text('${i+1}',
                              style: const TextStyle(fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white)))),
                        const SizedBox(width: 5),
                        Expanded(child: Text(s.name, style: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary),
                            maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ]),
                      const SizedBox(height: 4),
                      Text(s.dates, style: const TextStyle(fontSize: 10,
                          color: AppColors.textThird)),
                      const SizedBox(height: 2),
                      Text(s.addr, style: const TextStyle(fontSize: 9,
                          color: AppColors.textThird),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ]),
                );
              },
            ),
          ),
        ]),
    );
  }
}

// Data class for the bottom sheet (decoupled from DB Place)
class MapPlaceData {
  final String id, name, emoji;
  final MapFilter type;
  const MapPlaceData({required this.id, required this.name,
      required this.emoji, required this.type});
}
