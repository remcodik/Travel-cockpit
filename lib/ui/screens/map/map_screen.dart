import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import 'widgets/map_filter_chips.dart';
import 'widgets/map_place_sheet.dart';

enum MapFilter { all, activities, food, charging, accommodation }

class MapPlace {
  final String id, name, emoji;
  final double lat, lng;
  final MapFilter type;
  const MapPlace({required this.id, required this.name, required this.emoji,
      required this.lat, required this.lng, required this.type});
}

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  MapFilter _filter   = MapFilter.all;
  MapPlace? _selected;
  final _mapController = MapController();

  final _places = const [
    MapPlace(id:'1', name:'Skjåk Solside', emoji:'🏠',
        lat:61.882, lng:8.412, type:MapFilter.accommodation),
    MapPlace(id:'2', name:'Dønfoss', emoji:'🌊',
        lat:61.902, lng:8.445, type:MapFilter.activities),
    MapPlace(id:'3', name:'Grotli Uitzichtpunt', emoji:'🏔️',
        lat:61.934, lng:8.388, type:MapFilter.activities),
    MapPlace(id:'4', name:'Pollfoss Café', emoji:'☕',
        lat:61.891, lng:8.430, type:MapFilter.food),
    MapPlace(id:'5', name:'IONITY Skjåk', emoji:'⚡',
        lat:61.876, lng:8.398, type:MapFilter.charging),
    MapPlace(id:'6', name:'Trollstigen', emoji:'🌊',
        lat:62.458, lng:7.668, type:MapFilter.activities),
    MapPlace(id:'7', name:'Lom', emoji:'🏕️',
        lat:61.839, lng:8.566, type:MapFilter.accommodation),
  ];

  List<MapPlace> get _filtered => _filter == MapFilter.all
      ? _places
      : _places.where((p) => p.type == _filter).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: const LatLng(61.88, 8.41),
              initialZoom: 10,
              onTap: (_, __) => setState(() => _selected = null),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.travelcockpit.app',
              ),
              // Route line
              PolylineLayer(polylines: [
                Polyline(
                  points: const [
                    LatLng(61.882, 8.412),
                    LatLng(61.839, 8.566),
                    LatLng(62.101, 7.206),
                  ],
                  color: AppColors.primary,
                  strokeWidth: 3,
                  isDotted: true,
                ),
              ]),
              // Pins
              MarkerLayer(
                markers: _filtered.map((place) => Marker(
                  point: LatLng(place.lat, place.lng),
                  width: 46, height: 46,
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selected = place);
                      _mapController.move(LatLng(place.lat, place.lng), 12);
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

          // Top: search + filters
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
                  child: GestureDetector(
                    onTap: () => _toast('Zoeken op kaart…'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(26),
                        boxShadow: const [BoxShadow(
                            color: Color(0x18000000),
                            blurRadius: 12, offset: Offset(0, 3))],
                      ),
                      child: Row(children: const [
                        Icon(Icons.search_rounded,
                            color: AppColors.textThird, size: 20),
                        SizedBox(width: 8),
                        Expanded(child: Text('Zoeken op kaart…',
                            style: TextStyle(fontSize: 14,
                                color: AppColors.textThird))),
                        Icon(Icons.tune_rounded,
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
                      _filter = f;
                      _selected = null;
                    }),
                  ),
                ),
              ],
            ),
          ),

          // Bottom: place sheet or route strip
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: _selected != null
                ? MapPlaceSheet(
                    place: _selected!,
                    onAdd:      () {
                      _toast('✓ ${_selected!.name} toegevoegd aan planning');
                      setState(() => _selected = null);
                    },
                    onNavigate: () => _navigate(_selected!),
                    onClose:    () => setState(() => _selected = null),
                  )
                : _RouteStrip(),
          ),
        ],
      ),
    );
  }

  Future<void> _navigate(MapPlace place) async {
    final uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}');
    if (await canLaunchUrl(uri)) {
      launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: AppColors.primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      duration: const Duration(seconds: 2),
    ));
  }
}

// Pin widget
class _Pin extends StatelessWidget {
  final MapPlace place;
  final bool isSelected;
  const _Pin({required this.place, required this.isSelected});

  Color get _color {
    switch (place.type) {
      case MapFilter.accommodation: return AppColors.primaryDark;
      case MapFilter.activities:    return AppColors.primary;
      case MapFilter.food:          return const Color(0xFFC87820);
      case MapFilter.charging:      return AppColors.flagRed;
      default:                      return AppColors.fjordBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final sz = isSelected ? 46.0 : 40.0;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: sz, height: sz,
      decoration: BoxDecoration(
        color: _color,
        shape: BoxShape.circle,
        border: Border.all(
            color: Colors.white.withOpacity(isSelected ? 1 : 0.85),
            width: isSelected ? 3 : 2.5),
        boxShadow: [BoxShadow(
            color: _color.withOpacity(isSelected ? 0.5 : 0.3),
            blurRadius: isSelected ? 14 : 8,
            offset: const Offset(0, 3))],
      ),
      child: Center(child: Text(place.emoji,
          style: TextStyle(fontSize: isSelected ? 20 : 17))),
    );
  }
}

// Route strip (shown when no pin selected)
class _RouteStrip extends StatelessWidget {
  static const _stops = [
    (name: 'Skjåk Solside', dates: '14–20 jul', dist: '2,3 km'),
    (name: 'Lom',           dates: '20–23 jul', dist: '18 km'),
    (name: 'Geiranger',     dates: '23–27 jul', dist: '144 km'),
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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: Container(
            width: 38, height: 4,
            decoration: BoxDecoration(color: AppColors.border,
                borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 12),
          Row(children: [
            const Text('Route', style: TextStyle(fontSize: 14,
                fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
            const SizedBox(width: 6),
            const Text('3 accommodaties · 164 km',
                style: TextStyle(fontSize: 12, color: AppColors.textThird)),
          ]),
          const SizedBox(height: 10),
          ..._stops.asMap().entries.map((e) {
            final s      = e.value;
            final isLast = e.key == _stops.length - 1;
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(children: [
                  Container(
                    width: 24, height: 24,
                    decoration: const BoxDecoration(
                        color: AppColors.primary, shape: BoxShape.circle),
                    child: Center(child: Text('${e.key+1}',
                        style: const TextStyle(fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white)))),
                  if (!isLast)
                    Container(width: 2, height: 28,
                        color: AppColors.primaryLight),
                ]),
                const SizedBox(width: 12),
                Expanded(child: Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(children: [
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.name, style: const TextStyle(fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary)),
                        Text(s.dates, style: const TextStyle(fontSize: 11,
                            color: AppColors.textThird)),
                      ])),
                    Text(s.dist, style: const TextStyle(fontSize: 12,
                        color: AppColors.textSecond,
                        fontWeight: FontWeight.w600)),
                  ]),
                )),
              ],
            );
          }),
        ],
      ),
    );
  }
}
