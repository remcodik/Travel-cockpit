// lib/app.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'ui/screens/discover/discover_screen.dart';

// Temporary home screen placeholder until Phase 2
class _HomeScreen extends StatelessWidget {
  const _HomeScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F0EC),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🧭', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            const Text(
              'Travel Cockpit',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: Color(0xFF111A14),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Noorwegen 2025',
              style: TextStyle(fontSize: 16, color: Color(0xFF7A9280)),
            ),
            const SizedBox(height: 40),
            ElevatedButton.icon(
              onPressed: () => context.push('/discover'),
              icon: const Text('💡', style: TextStyle(fontSize: 18)),
              label: const Text('AI Ideeën openen'),
            ),
          ],
        ),
      ),
    );
  }
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (_, __) => const _HomeScreen(),
    ),
    GoRoute(
      path: '/discover',
      builder: (_, __) => const DiscoverScreen(),
    ),
  ],
);

class TravelCockpitApp extends ConsumerWidget {
  const TravelCockpitApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Travel Cockpit',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: _router,
    );
  }
}
