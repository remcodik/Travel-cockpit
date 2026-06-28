// lib/ui/screens/discover/widgets/suggestion_card.dart

import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/ai_suggestion.dart';

class SuggestionCard extends StatelessWidget {
  final AiSuggestion suggestion;
  final VoidCallback onAdd;
  final VoidCallback onNavigate;
  final VoidCallback onTap;

  const SuggestionCard({
    super.key,
    required this.suggestion,
    required this.onAdd,
    required this.onNavigate,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0F0F2E1E),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Left: category gradient thumbnail ──
            Container(
              width: 96,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: _gradientForCategory(suggestion.category),
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(15),
                  bottomLeft: Radius.circular(15),
                ),
              ),
              child: Center(
                child: Text(
                  suggestion.category.emoji,
                  style: const TextStyle(fontSize: 36),
                ),
              ),
            ),

            // ── Middle: info ──
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(13, 12, 8, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name
                    Text(
                      suggestion.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    // Sub info
                    Text(
                      '${suggestion.category.label} · '
                      '${suggestion.distanceKm.toStringAsFixed(1)} km',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textThird,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    // Rating
                    if (suggestion.rating != null)
                      Row(
                        children: [
                          const Icon(Icons.star_rounded,
                              color: AppColors.amber, size: 14),
                          const SizedBox(width: 3),
                          Text(
                            suggestion.rating!.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),

            // ── Right: add button ──
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: suggestion.isAddedToPlan
                    ? _AddedButton()
                    : _AddButton(onTap: onAdd),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Color> _gradientForCategory(AiSuggestionCategory cat) {
    switch (cat) {
      case AiSuggestionCategory.activity:
        return const [Color(0xFF0A2418), Color(0xFF1B4D35), Color(0xFF1A3F6F)];
      case AiSuggestionCategory.restaurant:
        return const [Color(0xFF3D1A0A), Color(0xFF7B3010)];
      case AiSuggestionCategory.cafe:
        return const [Color(0xFF2A1A0A), Color(0xFF6B4A20)];
      case AiSuggestionCategory.rain:
        return const [Color(0xFF0A1828), Color(0xFF1A3F6F)];
      case AiSuggestionCategory.drive:
        return const [Color(0xFF0A2010), Color(0xFF2A6B4A)];
    }
  }
}

class _AddButton extends StatelessWidget {
  final VoidCallback onTap;
  const _AddButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: AppColors.primaryLight,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFA8D5B5), width: 2),
        ),
        child: const Center(
          child: Icon(Icons.add, color: AppColors.primary, size: 20),
        ),
      ),
    );
  }
}

class _AddedButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: const BoxDecoration(
        color: AppColors.primary,
        shape: BoxShape.circle,
      ),
      child: const Center(
        child: Icon(Icons.check, color: Colors.white, size: 16),
      ),
    );
  }
}
