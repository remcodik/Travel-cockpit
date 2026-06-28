// lib/ui/screens/discover/widgets/ai_header.dart

import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class AiHeader extends StatelessWidget {
  final String accommodationName;
  final String weather;
  final VoidCallback onRefresh;

  const AiHeader({
    super.key,
    required this.accommodationName,
    required this.weather,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primaryLight, Color(0xFFEFF7F2)],
        ),
        border: Border(
          bottom: BorderSide(color: Color(0x1F1B4D35)),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // AI avatar — green-to-blue gradient (Norway flag colours)
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.primary, AppColors.fjordBlue],
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x381B4D35),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: const Center(
              child: Text('🤖', style: TextStyle(fontSize: 24)),
            ),
          ),
          const SizedBox(width: 12),
          // Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Wat kan ik vandaag doen?',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primaryDark,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$weather · $accommodationName',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecond,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          // Refresh button
          IconButton(
            onPressed: onRefresh,
            icon: const Icon(
              Icons.refresh_rounded,
              color: AppColors.primary,
              size: 22,
            ),
            tooltip: 'Nieuwe ideeën laden',
          ),
        ],
      ),
    );
  }
}
