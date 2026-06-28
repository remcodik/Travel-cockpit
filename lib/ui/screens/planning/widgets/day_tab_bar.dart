import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/trip.dart';

// Accommodation color config — matches index.html c-sogndal etc.
class AccommodationDay {
  final String name;
  final DateTime checkIn;
  final DateTime checkOut;
  final Color color;
  final String shortName;

  const AccommodationDay({
    required this.name,
    required this.checkIn,
    required this.checkOut,
    required this.color,
    required this.shortName,
  });
}

// Global accommodation schedule for Norway 2026
// Derived from index.html seed data
const _norwayAccommodations = [
  AccommodationDay(
    name: 'Sogndal', shortName: 'Sgd',
    checkIn:  DateTime.utc(2026, 6, 16),
    checkOut: DateTime.utc(2026, 6, 19),
    color: const Color(0xFF2d6a4f),
  ),
  AccommodationDay(
    name: 'Skjåk Solside', shortName: 'Skj',
    checkIn:  DateTime.utc(2026, 6, 19),
    checkOut: DateTime.utc(2026, 6, 23),
    color: const Color(0xFF1565c0),
  ),
  AccommodationDay(
    name: 'Valdres', shortName: 'Val',
    checkIn:  DateTime.utc(2026, 6, 23),
    checkOut: DateTime.utc(2026, 6, 27),
    color: const Color(0xFFef6c00),
  ),
  AccommodationDay(
    name: 'Gjerstad', shortName: 'Gjr',
    checkIn:  DateTime.utc(2026, 6, 27),
    checkOut: DateTime.utc(2026, 6, 29),
    color: const Color(0xFF6a1b9a),
  ),
];

AccommodationDay? accForDate(DateTime d) {
  final date = DateTime.utc(d.year, d.month, d.day);
  for (final a in _norwayAccommodations) {
    if (!date.isBefore(a.checkIn) && date.isBefore(a.checkOut)) {
      return a;
    }
  }
  return null;
}

Color accColorForDate(DateTime d) =>
    accForDate(d)?.color ?? AppColors.textThird;

String accNameForDate(DateTime d) =>
    accForDate(d)?.name ?? '';

String accShortForDate(DateTime d) =>
    accForDate(d)?.shortName ?? '';

class DayTabBar extends StatefulWidget {
  final Trip trip;
  final DateTime selectedDay;
  final ValueChanged<DateTime> onDaySelected;

  const DayTabBar({
    super.key,
    required this.trip,
    required this.selectedDay,
    required this.onDaySelected,
  });

  @override
  State<DayTabBar> createState() => _DayTabBarState();
}

class _DayTabBarState extends State<DayTabBar> {
  late ScrollController _scroll;
  late final List<DateTime> _days;

  @override
  void initState() {
    super.initState();
    _scroll = ScrollController();
    // Cache days list — do NOT recompute every build
    final days = <DateTime>[];
    var d = widget.trip.startDate;
    while (!d.isAfter(widget.trip.endDate)) {
      days.add(d);
      d = d.add(const Duration(days: 1));
    }
    _days = days;
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToSelected());
  }

  void _scrollToSelected() {
    final idx = _days.indexWhere((d) =>
        d.year  == widget.selectedDay.year &&
        d.month == widget.selectedDay.month &&
        d.day   == widget.selectedDay.day);
    if (idx > 1) {
      _scroll.animateTo(
        (idx * 76.0) - 60,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  int _dayNumber(DateTime d) =>
      d.difference(widget.trip.startDate).inDays + 1;

  @override
  Widget build(BuildContext context) {
    const months   = ['jan','feb','mrt','apr','mei','jun',
                      'jul','aug','sep','okt','nov','dec'];
    const weekdays = ['ma','di','wo','do','vr','za','zo'];
    final today    = DateTime.now();

    return Container(
      height: 88,
      color: Colors.white,
      child: Column(
        children: [
          Expanded(
            child: ListView.separated(
              controller: _scroll,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              itemCount: _days.length,
              separatorBuilder: (_, __) => const SizedBox(width: 5),
              itemBuilder: (context, i) {
                final day        = _days[i];
                final dn         = _dayNumber(day);
                final acc        = accForDate(day);
                final accColor   = acc?.color ?? AppColors.textThird;
                final isSelected = day.year  == widget.selectedDay.year &&
                                   day.month == widget.selectedDay.month &&
                                   day.day   == widget.selectedDay.day;
                final isToday    = day.year  == today.year &&
                                   day.month == today.month &&
                                   day.day   == today.day;

                return GestureDetector(
                  onTap: () {
                    widget.onDaySelected(day);
                    // Scroll to keep selected in view
                    final pos = i * 76.0 - 60;
                    _scroll.animateTo(pos.clamp(0, _scroll.position.maxScrollExtent),
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOut);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 70,
                    decoration: BoxDecoration(
                      color: isSelected ? accColor : AppColors.background,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isToday && !isSelected
                            ? accColor
                            : isSelected
                                ? accColor
                                : Colors.transparent,
                        width: 2,
                      ),
                      boxShadow: isSelected ? [
                        BoxShadow(color: accColor.withOpacity(0.3),
                            blurRadius: 8, offset: const Offset(0, 3)),
                      ] : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Dag nummer — prominent
                        Text('D$dn',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: isSelected
                                  ? Colors.white
                                  : accColor,
                              letterSpacing: 0.3,
                            )),
                        const SizedBox(height: 1),
                        // Date number — largest
                        Text('${day.day}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: isSelected
                                  ? Colors.white : AppColors.textPrimary,
                            )),
                        // Month
                        Text(months[day.month - 1],
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? Colors.white70 : AppColors.textThird,
                            )),
                        // Accommodation dot
                        if (acc != null)
                          Container(
                            margin: const EdgeInsets.only(top: 2),
                            width: 5, height: 5,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.white.withOpacity(0.8)
                                  : accColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          // Accommodation legend strip
          _AccLegendStrip(selectedDay: widget.selectedDay),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }
}

// ── Accommodation legend below tab bar ────────────────────
class _AccLegendStrip extends StatelessWidget {
  final DateTime selectedDay;
  const _AccLegendStrip({required this.selectedDay});

  @override
  Widget build(BuildContext context) {
    final acc = accForDate(selectedDay);

    return Container(
      height: 24,
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
      child: Row(children: [
        if (acc != null) ...[
          Container(
            width: 10, height: 10,
            decoration: BoxDecoration(
                color: acc.color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text('🏡 ${acc.name}',
              style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w700,
                color: acc.color)),
          const Spacer(),
          // All 4 accommodation dots
          Row(children: _norwayAccommodations.map((a) => Tooltip(
            message: a.name,
            child: Container(
              margin: const EdgeInsets.only(left: 5),
              width: 10, height: 10,
              decoration: BoxDecoration(
                color: a.color,
                shape: BoxShape.circle,
                border: Border.all(
                  color: a == acc ? Colors.white : Colors.transparent,
                  width: 1.5),
              ),
            ),
          )).toList()),
        ] else ...[
          const Text('🚗 Reisdag',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                  color: AppColors.textThird)),
        ],
      ]),
    );
  }
}
