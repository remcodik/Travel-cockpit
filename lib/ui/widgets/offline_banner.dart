import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/connectivity_provider.dart';

/// Shows a slim banner at top of screen when offline.
/// Use inside SafeArea column as first child.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(isOnlineProvider);
    if (isOnline) return const SizedBox.shrink();

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: double.infinity,
      color: const Color(0xFF5D3A00),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
      child: Row(children: [
        const Icon(Icons.wifi_off_rounded, color: Colors.white70, size: 15),
        const SizedBox(width: 8),
        const Expanded(
          child: Text(
            'Offline · Alle reisdata beschikbaar · AI vereist internet',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                color: Colors.white70),
          ),
        ),
      ]),
    );
  }
}
