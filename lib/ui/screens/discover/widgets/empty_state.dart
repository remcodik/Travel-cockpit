import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

/// Shown in DiscoverScreen for offline / error / empty / no-results states.
class EmptyState extends StatelessWidget {
  final String emoji;
  final String title;
  final String message;
  final bool showRetry;
  final VoidCallback? onRetry;
  final Widget? child; // optional content shown below (e.g. cached list)

  const EmptyState({
    super.key,
    required this.emoji,
    required this.title,
    required this.message,
    this.showRetry = false,
    this.onRetry,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    // If there's child content (cached results), show a slim banner + the list
    if (child != null) {
      return Column(
        children: [
          Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            decoration: BoxDecoration(
              color: AppColors.flagRedLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x33A8291F)),
            ),
            child: Row(children: [
              Text(emoji, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 10),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 13,
                      fontWeight: FontWeight.w800, color: AppColors.flagRed)),
                  const SizedBox(height: 1),
                  Text(message, style: const TextStyle(fontSize: 11,
                      color: AppColors.textSecond)),
                ],
              )),
              if (showRetry && onRetry != null)
                GestureDetector(
                  onTap: onRetry,
                  child: const Icon(Icons.refresh_rounded,
                      color: AppColors.flagRed, size: 20)),
            ]),
          ),
          Expanded(child: child!),
        ],
      );
    }

    // Full empty state
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 56)),
            const SizedBox(height: 18),
            Text(title,
                style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary),
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(message,
                style: const TextStyle(fontSize: 13, color: AppColors.textThird,
                    height: 1.5),
                textAlign: TextAlign.center),
            if (showRetry && onRetry != null) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Opnieuw proberen'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
