import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'ui/screens/home/home_screen.dart';
import 'ui/screens/discover/discover_screen.dart';
import 'ui/screens/planning/planning_screen.dart';
import 'ui/screens/map/map_screen.dart';
import 'ui/screens/accommodation/accommodation_screen.dart';
import 'ui/screens/trips/trips_screen.dart';
import 'ui/screens/tickets/tickets_screen.dart';
import 'ui/screens/charging/charging_screen.dart';
import 'ui/screens/activity/activity_detail_screen.dart';
import 'ui/screens/meer/meer_screen.dart';
import 'ui/screens/roadtrip/roadtrip_screen.dart';
import 'ui/screens/settings/settings_screen.dart';

class _Placeholder extends StatelessWidget {
  final String title;
  const _Placeholder({required this.title});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title)),
    body: Center(child: Column(
      mainAxisAlignment: MainAxisAlignment.center, children: [
        const Text('🚧', style: TextStyle(fontSize: 48)),
        const SizedBox(height: 16),
        Text(title, style: const TextStyle(fontSize: 18,
            fontWeight: FontWeight.w700, color: Color(0xFF3D5244))),
        const SizedBox(height: 8),
        const Text('Komt binnenkort',
            style: TextStyle(fontSize: 13, color: Color(0xFF7A9280))),
      ])),
  );
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) =>
          _Shell(child: child, location: state.matchedLocation),
      routes: [
        GoRoute(path: '/',         builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/map',      builder: (_, __) => const MapScreen()),
        GoRoute(path: '/planning', builder: (_, __) => const PlanningScreen()),
        GoRoute(path: '/discover', builder: (_, __) => const DiscoverScreen()),
        GoRoute(path: '/meer',     builder: (_, __) => const MeerScreen()),
      ],
    ),
    GoRoute(path: '/accommodation',
        builder: (_, __) => const AccommodationScreen()),
    GoRoute(path: '/trips',
        builder: (_, __) => const TripsScreen()),
    GoRoute(path: '/tickets',
        builder: (_, __) => const TicketsScreen()),
    GoRoute(path: '/charging',
        builder: (_, __) => const ChargingScreen()),
    GoRoute(path: '/place/:id',
        builder: (_, s) => ActivityDetailScreen(
            placeId: s.pathParameters['id']!)),
    // ✅ Nu echte schermen
    GoRoute(path: '/roadtrip',
        builder: (_, __) => const RoadtripScreen()),
    GoRoute(path: '/settings',
        builder: (_, __) => const SettingsScreen()),
    // Nog placeholders
    GoRoute(path: '/notifications',
        builder: (_, __) => const _Placeholder(title: 'Meldingen')),
    GoRoute(path: '/profile',
        builder: (_, __) => const _Placeholder(title: 'Profiel')),
  ],
);

class _Shell extends StatelessWidget {
  final Widget child;
  final String location;
  const _Shell({required this.child, required this.location});

  int get _idx {
    if (location.startsWith('/map'))      return 1;
    if (location.startsWith('/planning')) return 2;
    if (location.startsWith('/discover')) return 3;
    if (location.startsWith('/meer'))     return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: child,
    bottomNavigationBar: NavigationBar(
      selectedIndex: _idx,
      onDestinationSelected: (i) {
        const routes = ['/', '/map', '/planning', '/discover', '/meer'];
        context.go(routes[i]);
      },
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded), label: 'Vandaag'),
        NavigationDestination(icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map_rounded),  label: 'Kaart'),
        NavigationDestination(icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today_rounded), label: 'Planning'),
        NavigationDestination(icon: Icon(Icons.lightbulb_outline),
            selectedIcon: Icon(Icons.lightbulb_rounded), label: 'Ideeën'),
        NavigationDestination(icon: Icon(Icons.more_horiz_rounded),
            selectedIcon: Icon(Icons.more_horiz_rounded), label: 'Meer'),
      ],
    ),
  );
}

class TravelCockpitApp extends ConsumerWidget {
  const TravelCockpitApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp.router(
    title: 'Travel Cockpit',
    debugShowCheckedModeBanner: false,
    theme: AppTheme.light,
    routerConfig: _router,
  );
}