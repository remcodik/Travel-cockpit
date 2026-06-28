import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/trip.dart';

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

  @override
  void initState() {
    super.initState();
    _scroll = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToSelected());
  }

  void _scrollToSelected() {
    final idx = _days.indexWhere((d) =>
        d.year == widget.selectedDay.year &&
        d.month == widget.selectedDay.month &&
        d.day == widget.selectedDay.day);
    if (idx > 2) {
      _scroll.animateTo(
        idx * 72.0 - 100,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  List<DateTime> get _days {
    final days = <DateTime>[];
    var d = widget.trip.startDate;
    while (!d.isAfter(widget.trip.endDate)) {
      days.add(d);
      d = d.add(const Duration(days: 1));
    }
    return days;
  }

  @override
  Widget build(BuildContext context) {
    const months   = ['jan','feb','mrt','apr','mei','jun',
                      'jul','aug','sep','okt','nov','dec'];
    const weekdays = ['ma','di','wo','do','vr','za','zo'];
    final today    = DateTime.now();

    return Container(
      height: 72,
      color: Colors.white,
      child: ListView.separated(
        controller: _scroll,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        itemCount: _days.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (context, i) {
          final day = _days[i];
          final isSelected = day.year  == widget.selectedDay.year &&
                             day.month == widget.selectedDay.month &&
                             day.day   == widget.selectedDay.day;
          final isToday    = day.year  == today.year &&
                             day.month == today.month &&
                             day.day   == today.day;

          return GestureDetector(
            onTap: () => widget.onDaySelected(day),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 62,
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : AppColors.background,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isToday && !isSelected
                      ? AppColors.primary : Colors.transparent,
                  width: 1.5,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(weekdays[day.weekday - 1].toUpperCase(),
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                          color: isSelected
                              ? Colors.white70 : AppColors.textThird)),
                  const SizedBox(height: 2),
                  Text('${day.day}',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900,
                          color: isSelected
                              ? Colors.white : AppColors.textPrimary)),
                  Text(months[day.month - 1],
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500,
                          color: isSelected
                              ? Colors.white60 : AppColors.textThird)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }
}
