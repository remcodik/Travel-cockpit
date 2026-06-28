import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/planning_item.dart';
import '../../../providers/planning_provider.dart';
import '../../../providers/trip_provider.dart';
import 'widgets/day_tab_bar.dart';
import 'widgets/planning_item_row.dart';

class PlanningScreen extends ConsumerStatefulWidget {
  const PlanningScreen({super.key});

  @override
  ConsumerState<PlanningScreen> createState() => _PlanningScreenState();
}

class _PlanningScreenState extends ConsumerState<PlanningScreen> {
  DateTime _selectedDay = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final tripAsync     = ref.watch(activeTripProvider);
    final planningAsync = ref.watch(allPlanningProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _PlanningHeader(onAdd: () => context.push('/discover')),
            tripAsync.when(
              loading: () => const SizedBox(height: 52),
              error:   (_, __) => const SizedBox(height: 52),
              data: (trip) => trip == null
                  ? const SizedBox(height: 52)
                  : DayTabBar(
                      trip: trip,
                      selectedDay: _selectedDay,
                      onDaySelected: (d) => setState(() => _selectedDay = d),
                    ),
            ),
            Expanded(
              child: planningAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error:   (e, _) => Center(child: Text('Fout: $e')),
                data:    (items) => _buildList(items),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList(List<PlanningItem> allItems) {
    final items = allItems.where((item) {
      if (item.plannedDate == null) return false;
      final d = item.plannedDate!;
      return d.year == _selectedDay.year &&
             d.month == _selectedDay.month &&
             d.day   == _selectedDay.day;
    }).toList();

    final unscheduled = allItems.where((i) => i.plannedDate == null).toList();

    if (items.isEmpty && unscheduled.isEmpty) {
      return _EmptyDay(onDiscover: () => context.push('/discover'));
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      children: [
        if (items.isNotEmpty) ...[
          _DayLabel(date: _selectedDay),
          ...items.asMap().entries.map((e) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: PlanningItemRow(
              index:    e.key + 1,
              item:     e.value,
              onTap:    () => context.push('/place/${e.value.placeId}'),
              onCheck:  () => ref.read(planningNotifierProvider.notifier)
                  .markCompleted(e.value.id),
              onDelete: () => _confirmDelete(e.value.id),
            ),
          )),
        ],
        if (unscheduled.isNotEmpty) ...[
          const _SectionLabel(text: 'Nog niet ingepland'),
          ...unscheduled.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: PlanningItemRow(
              index:    null,
              item:     item,
              onTap:    () => context.push('/place/${item.placeId}'),
              onCheck:  () => ref.read(planningNotifierProvider.notifier)
                  .markCompleted(item.id),
              onDelete: () => _confirmDelete(item.id),
            ),
          )),
        ],
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: () => context.push('/discover'),
          icon: const Icon(Icons.add),
          label: const Text('Activiteit toevoegen'),
        ),
      ],
    );
  }

  Future<void> _confirmDelete(String itemId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Verwijderen?'),
        content: const Text('Wil je dit item uit je planning verwijderen?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuleer')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Verwijderen',
                  style: TextStyle(color: AppColors.flagRed))),
        ],
      ),
    );
    if (ok == true) {
      ref.read(planningNotifierProvider.notifier).remove(itemId);
    }
  }
}

class _PlanningHeader extends StatelessWidget {
  final VoidCallback onAdd;
  const _PlanningHeader({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 4, 4),
      child: Row(
        children: [
          const Text('Planning',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary, letterSpacing: -0.3)),
          const Spacer(),
          IconButton(
            onPressed: onAdd,
            icon: const Icon(Icons.add_circle_outline_rounded,
                color: AppColors.primary, size: 26),
          ),
        ],
      ),
    );
  }
}

class _DayLabel extends StatelessWidget {
  final DateTime date;
  const _DayLabel({required this.date});

  @override
  Widget build(BuildContext context) {
    const months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];
    const days   = ['ma','di','wo','do','vr','za','zo'];
    final label  = '${days[date.weekday-1]} ${date.day} ${months[date.month-1]}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(label.toUpperCase(),
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
              letterSpacing: 0.6, color: AppColors.textThird)),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel({required this.text});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(0, 20, 0, 10),
    child: Text(text.toUpperCase(),
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
            letterSpacing: 0.6, color: AppColors.textThird)),
  );
}

class _EmptyDay extends StatelessWidget {
  final VoidCallback onDiscover;
  const _EmptyDay({required this.onDiscover});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('📅', style: TextStyle(fontSize: 52)),
            const SizedBox(height: 16),
            const Text('Niets gepland',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            const Text('Voeg activiteiten toe via AI ideeën.',
                style: TextStyle(fontSize: 13, color: AppColors.textThird),
                textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onDiscover,
              icon: const Text('✨'),
              label: const Text('Bekijk AI ideeën'),
            ),
          ],
        ),
      ),
    );
  }
}
