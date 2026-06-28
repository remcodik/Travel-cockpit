import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'ui/screens/home/home_screen.dart';
import 'ui/screens/discover/discover_screen.dart';

// Bottom nav destinations
const _navItems = [
  (icon: Icons.home_outlined,      activeIcon: Icons.home_rounded,
   label: 'Vandaag',   route: '/'),
  (icon: Icons.map_outlined,       activeIcon: Icons.map_rounded,
   label: 'Kaart',     route: '/map'),
  (icon: Icons.calendar_today_outlined, activeIcon: Icons.calendar_today_rounded,
   label: 'Planning',  route: '/planning'),
  (icon: Icons.lightbulb_outline,  activeIcon: Icons.lightbulb_rounded,
   label: 'Idee\u00ebn',   route: '/discover'),
  (icon: Icons.more_horiz_rounded, activeIcon: Icons.more_horiz_rounded,
   label: 'Meer',      route: '/meer'),
];

// Placeholder screen for screens not yet built
class _PlaceholderScreen extends StatelessWidget {
  final String title;
  const _PlaceholderScreen({required this.title});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title)),
    body: Center(child: Text('\u2696\ufe0f  Komt eraan',
        style: TextStyle(fontSize: 18, color: Colors.grey[500]))),
  );
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => _Shell(child: child, location: state.matchedLocation),
      routes: [
        GoRoute(path: '/',          builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/map',       builder: (_, __) => const _PlaceholderScreen(title: 'Kaart')),
        GoRoute(path: '/planning',  builder: (_, __) => const _PlaceholderScreen(title: 'Planning')),
        GoRoute(path: '/discover',  builder: (_, __) => const DiscoverScreen()),
        GoRoute(path: '/meer',      builder: (_, __) => const _PlaceholderScreen(title: 'Meer')),
      ],
    ),
    // Full-screen routes (no bottom nav)
    GoRoute(path: '/trips',         builder: (_, __) => const _PlaceholderScreen(title: 'Mijn reizen')),
    GoRoute(path: '/accommodation', builder: (_, __) => const _PlaceholderScreen(title: 'Accommodatie')),
    GoRoute(path: '/charging',      builder: (_, __) => const _PlaceholderScreen(title: 'Laadstations')),
    GoRoute(path: '/tickets',       builder: (_, __) => const _PlaceholderScreen(title: 'Tickets')),
    GoRoute(path: '/place/:id',     builder: (_, s) => _PlaceholderScreen(title: 'Activiteit')),
    GoRoute(path: '/notifications', builder: (_, __) => const _PlaceholderScreen(title: 'Meldingen')),
    GoRoute(path: '/settings',      builder: (_, __) => const _PlaceholderScreen(title: 'Instellingen')),
    GoRoute(path: '/profile',       builder: (_, __) => const _PlaceholderScreen(title: 'Profiel')),
  ],
);

// Shell with bottom nav
class _Shell extends StatelessWidget {
  final Widget child;
  final String location;
  const _Shell({required this.child, required this.location});

  int get _currentIndex {
    if (location.startsWith('/map'))      return 1;
    if (location.startsWith('/planning')) return 2;
    if (location.startsWith('/discover')) return 3;
    if (location.startsWith('/meer'))     return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => context.go(_navItems[i].route),
        destinations: _navItems.map((item) => NavigationDestination(
          icon:         Icon(item.icon),
          selectedIcon: Icon(item.activeIcon),
          label:        item.label,
        )).toList(),
      ),
    );
  }
}

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
