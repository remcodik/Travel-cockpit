import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/trip.dart';
import '../../../domain/models/planning_item.dart';
import '../../../providers/trip_provider.dart';
import '../../../providers/planning_provider.dart';
import 'widgets/hero_accommodation_card.dart';
import 'widgets/stats_row.dart';
import 'widgets/planning_section.dart';
import 'widgets/nearby_strip.dart';
import 'widgets/ai_card_home.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripAsync     = ref.watch(activeTripProvider);
    final planningAsync = ref.watch(todayPlanningProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: tripAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error:   (e, _) => _ErrorView(message: e.toString()),
          data:    (trip) => trip == null
              ? const _NoTripView()
              : _DashboardContent(trip: trip, planningAsync: planningAsync),
        ),
      ),
    );
  }
}

// ── No active trip ────────────────────────────────────────

class _NoTripView extends StatelessWidget {
  const _NoTripView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('\U0001f9ed', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 20),
            const Text('Geen actieve reis',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            const Text('Maak een nieuwe reis aan om te beginnen.',
                style: TextStyle(fontSize: 14, color: AppColors.textThird),
                textAlign: TextAlign.center),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: () => context.push('/trips'),
              icon: const Icon(Icons.add),
              label: const Text('Nieuwe reis'),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Main dashboard content ───────────────────────────────

class _DashboardContent extends StatelessWidget {
  final Trip trip;
  final AsyncValue<List<PlanningItem>> planningAsync;

  const _DashboardContent({required this.trip, required this.planningAsync});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // Trip header
        SliverToBoxAdapter(child: _TripHeader(trip: trip)),
        // Hero accommodation card
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            child: HeroAccommodationCard(tripId: trip.id),
          ),
        ),
        // Stats row
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: StatsRow(tripId: trip.id, planningAsync: planningAsync),
          ),
        ),
        // Today's planning
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
            child: PlanningSection(planningAsync: planningAsync),
          ),
        ),
        // Nearby strip
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(0, 20, 0, 0),
            child: NearbyStrip(tripId: trip.id),
          ),
        ),
        // AI card
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            child: AiCardHome(trip: trip),
          ),
        ),
      ],
    );
  }
}

// ── Trip header ──────────────────────────────────────────

class _TripHeader extends StatelessWidget {
  final Trip trip;
  const _TripHeader({required this.trip});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Actieve reis',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
                        letterSpacing: 0.6, color: AppColors.textThird)),
                const SizedBox(height: 3),
                GestureDetector(
                  onTap: () => context.push('/trips'),
                  child: Row(
                    children: [
                      Text(trip.name,
                          style: const TextStyle(
                            fontSize: 22, fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary, letterSpacing: -0.3,
                          )),
                      const SizedBox(width: 4),
                      const Icon(Icons.keyboard_arrow_down_rounded,
                          color: AppColors.textThird, size: 20),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatDateRange(trip.startDate, trip.endDate),
                  style: const TextStyle(fontSize: 12,
                      color: AppColors.textThird, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          // Notification bell
          Stack(
            children: [
              IconButton(
                onPressed: () => context.push('/notifications'),
                icon: const Icon(Icons.notifications_outlined,
                    color: AppColors.textSecond, size: 26),
              ),
              Positioned(
                top: 8, right: 8,
                child: Container(
                  width: 16, height: 16,
                  decoration: BoxDecoration(
                    color: AppColors.flagRed,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.background, width: 2),
                  ),
                  child: const Center(
                    child: Text('2',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800,
                            color: Colors.white)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDateRange(DateTime s, DateTime e) {
    const months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];
    final days = e.difference(s).inDays;
    return '\${s.day} \${months[s.month-1]} – \${e.day} \${months[e.month-1]} · \$days dagen';
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  const _ErrorView({required this.message});
  @override
  Widget build(BuildContext context) => Center(
    child: Text('Fout: \$message', style: const TextStyle(color: AppColors.flagRed)));
}
