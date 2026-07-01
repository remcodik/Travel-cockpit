// lib/ui/screens/discover/widgets/filter_chips_row.dart

import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/ai_suggestion.dart';

class FilterChipsRow extends StatelessWidget {
  final AiSuggestionCategory? activeFilter;
  final ValueChanged<AiSuggestionCategory?> onFilterChanged;

  const FilterChipsRow({
    super.key,
    required this.activeFilter,
    required this.onFilterChanged,
  });

  static const _filters = [
    null,                              // All
    AiSuggestionCategory.activity,
    AiSuggestionCategory.restaurant,
    AiSuggestionCategory.cafe,
    AiSuggestionCategory.rain,
  ];

  static String _label(AiSuggestionCategory? filter) {
    if (filter == null) return 'Alles';
    return '${filter.emoji} ${filter.label}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _filters.map((filter) {
            final isActive = filter == activeFilter;
            return Padding(
              padding: const EdgeInsets.only(right: 7),
              child: FilterChip(
                label: Text(_label(filter)),
                selected: isActive,
                onSelected: (_) => onFilterChanged(isActive ? null : filter),
                selectedColor: AppColors.primary,
                checkmarkColor: Colors.white,
                labelStyle: TextStyle(
                  color: isActive ? Colors.white : AppColors.textSecond,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
                side: BorderSide(
                  color: isActive ? AppColors.primary : AppColors.border,
                  width: 1.5,
                ),
                backgroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                shape: const StadiumBorder(),
                showCheckmark: false,
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
