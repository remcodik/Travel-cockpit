import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/trip.dart';
import '../../../providers/trip_provider.dart';

class TripsScreen extends ConsumerWidget {
  const TripsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(allTripsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 4),
            child: Row(children: [
              const Expanded(child: Text('Mijn reizen',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary, letterSpacing: -0.3))),
              IconButton(
                onPressed: () => _showCreateSheet(context, ref),
                icon: const Icon(Icons.add_circle_outline_rounded,
                    color: AppColors.primary, size: 26),
                tooltip: 'Nieuwe reis',
              ),
            ]),
          ),
          // List
          Expanded(
            child: tripsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error:   (e, _) => Center(child: Text('Fout: $e')),
              data:    (trips) => trips.isEmpty
                  ? _EmptyTrips(onCreate: () => _showCreateSheet(context, ref))
                  : _TripList(trips: trips),
            ),
          ),
        ]),
      ),
    );
  }

  void _showCreateSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CreateTripSheet(
        onSave: (trip) async {
          await ref.read(tripNotifierProvider.notifier).createTrip(trip);
          await ref.read(tripNotifierProvider.notifier).setActive(trip.id);
          if (context.mounted) Navigator.pop(context);
        },
      ),
    );
  }
}

// ── Trip list ──────────────────────────────────────────────

class _TripList extends ConsumerWidget {
  final List<Trip> trips;
  const _TripList({required this.trips});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = trips.where((t) => t.isActive).toList();
    final others = trips.where((t) => !t.isActive).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        if (active.isNotEmpty) ...[
          _sectionLabel('Actief'),
          ...active.map((t) => _TripCard(
            trip: t,
            onActivate: null,  // already active
            onDelete: () => _confirmDelete(context, ref, t),
          )),
        ],
        if (others.isNotEmpty) ...[
          _sectionLabel(active.isEmpty ? 'Mijn reizen' : 'Eerder'),
          ...others.map((t) => _TripCard(
            trip: t,
            onActivate: () async {
              await ref.read(tripNotifierProvider.notifier).setActive(t.id);
              if (context.mounted) context.go('/');
            },
            onDelete: () => _confirmDelete(context, ref, t),
          )),
        ],
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () {
            final notifier = ref.read(tripNotifierProvider.notifier);
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => _CreateTripSheet(
                onSave: (trip) async {
                  await notifier.createTrip(trip);
                  await notifier.setActive(trip.id);
                  if (context.mounted) {
                    Navigator.pop(context);
                    context.go('/');
                  }
                },
              ),
            );
          },
          icon: const Icon(Icons.add),
          label: const Text('Nieuwe reis aanmaken'),
        ),
      ],
    );
  }

  Widget _sectionLabel(String label) => Padding(
    padding: const EdgeInsets.fromLTRB(0, 16, 0, 8),
    child: Text(label.toUpperCase(),
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
            letterSpacing: 0.6, color: AppColors.textThird)),
  );

  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, Trip trip) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Reis verwijderen?'),
        content: Text('${trip.name} en alle bijbehorende data worden verwijderd.'),
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
      await ref.read(tripNotifierProvider.notifier).deleteTrip(trip.id);
    }
  }
}

// ── Trip card ──────────────────────────────────────────────

class _TripCard extends StatelessWidget {
  final Trip trip;
  final VoidCallback? onActivate;
  final VoidCallback onDelete;

  const _TripCard({
    required this.trip,
    required this.onActivate,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    const months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];
    final sd = trip.startDate;
    final ed = trip.endDate;
    final dates = '${sd.day} ${months[sd.month-1]} '
        '– ${ed.day} ${months[ed.month-1]} ${ed.year}';
    final days = ed.difference(sd).inDays;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: _gradient(trip.countryCode),
        ),
        boxShadow: const [
          BoxShadow(color: Color(0x18000000), blurRadius: 10,
              offset: Offset(0, 3)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onActivate,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              // Flag emoji
              Text(trip.countryFlag,
                  style: const TextStyle(fontSize: 36)),
              const SizedBox(width: 14),
              // Info
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(trip.name,
                      style: const TextStyle(fontSize: 17,
                          fontWeight: FontWeight.w800, color: Colors.white,
                          letterSpacing: -0.2)),
                  const SizedBox(height: 3),
                  Text('$dates · $days dagen',
                      style: const TextStyle(fontSize: 12,
                          color: Colors.white70)),
                ],
              )),
              // Active badge or "Activeer" button
              if (trip.isActive)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text('Actief',
                      style: TextStyle(fontSize: 11,
                          fontWeight: FontWeight.w800, color: Colors.white)),
                )
              else
                GestureDetector(
                  onTap: onActivate,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: Colors.white.withOpacity(0.3)),
                    ),
                    child: const Text('Activeer',
                        style: TextStyle(fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                  ),
                ),
              const SizedBox(width: 8),
              // Delete
              GestureDetector(
                onTap: onDelete,
                child: Container(
                  width: 30, height: 30,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close_rounded,
                      color: Colors.white70, size: 16),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  List<Color> _gradient(String code) {
    switch (code) {
      case 'IT': return const [Color(0xFF5D1A0A), Color(0xFF9B3A1A)];
      case 'FR': return const [Color(0xFF0D1540), Color(0xFF1A2A6C)];
      case 'DE': return const [Color(0xFF1A1A1A), Color(0xFF3A3A3A)];
      case 'ES': return const [Color(0xFF8B0000), Color(0xFFCC3300)];
      default:   return const [Color(0xFF0A1E12), Color(0xFF1B4D35)];
    }
  }
}

// ── Empty state ───────────────────────────────────────────

class _EmptyTrips extends StatelessWidget {
  final VoidCallback onCreate;
  const _EmptyTrips({required this.onCreate});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🧭', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 20),
            const Text('Geen reizen',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            const Text(
              'Maak je eerste reis aan om Travel Cockpit te gebruiken.',
              style: TextStyle(fontSize: 14, color: AppColors.textThird),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: onCreate,
              icon: const Icon(Icons.add),
              label: const Text('Reis aanmaken'),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Create trip bottom sheet ──────────────────────────────

class _CreateTripSheet extends StatefulWidget {
  final void Function(Trip) onSave;
  const _CreateTripSheet({required this.onSave});

  @override
  State<_CreateTripSheet> createState() => _CreateTripSheetState();
}

class _CreateTripSheetState extends State<_CreateTripSheet> {
  final _nameCtrl = TextEditingController();
  String _countryCode = 'NO';
  String _countryFlag = '🇳🇴';
  DateTime _start = DateTime.now();
  DateTime _end   = DateTime.now().add(const Duration(days: 14));
  bool _saving = false;

  static const _countries = [
    (code: 'NO', flag: '🇳🇴', name: 'Noorwegen'),
    (code: 'IT', flag: '🇮🇹', name: 'Italië'),
    (code: 'FR', flag: '🇫🇷', name: 'Frankrijk'),
    (code: 'DE', flag: '🇩🇪', name: 'Duitsland'),
    (code: 'ES', flag: '🇪🇸', name: 'Spanje'),
    (code: 'NL', flag: '🇳🇱', name: 'Nederland'),
    (code: 'PT', flag: '🇵🇹', name: 'Portugal'),
    (code: 'AT', flag: '🇦🇹', name: 'Oostenrijk'),
    (code: 'CH', flag: '🇨🇭', name: 'Zwitserland'),
    (code: 'HR', flag: '🇭🇷', name: 'Kroatië'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: AppColors.border,
                  borderRadius: BorderRadius.circular(2)))),
            // Title
            const Text('Nieuwe reis',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary, letterSpacing: -0.3)),
            const SizedBox(height: 20),
            // Trip name
            TextField(
              controller: _nameCtrl,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Naam van de reis',
                hintText: 'bijv. Noorwegen 2025',
                prefixIcon: Icon(Icons.drive_eta_outlined),
              ),
            ),
            const SizedBox(height: 16),
            // Country
            const Text('Land', style: TextStyle(fontSize: 12,
                fontWeight: FontWeight.w700, color: AppColors.textThird)),
            const SizedBox(height: 8),
            SizedBox(
              height: 48,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _countries.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final c = _countries[i];
                  final on = c.code == _countryCode;
                  return GestureDetector(
                    onTap: () => setState(() {
                      _countryCode = c.code;
                      _countryFlag = c.flag;
                    }),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: on ? AppColors.primary : AppColors.background,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: on ? AppColors.primary : AppColors.border),
                      ),
                      child: Text('${c.flag} ${c.name}',
                          style: TextStyle(fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: on ? Colors.white : AppColors.textSecond)),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            // Dates
            Row(children: [
              Expanded(child: _DateField(
                label: 'Vertrekdatum',
                date: _start,
                onPick: (d) => setState(() {
                  _start = d;
                  if (_end.isBefore(_start)) {
                    _end = _start.add(const Duration(days: 7));
                  }
                }),
              )),
              const SizedBox(width: 12),
              Expanded(child: _DateField(
                label: 'Thuiskomst',
                date: _end,
                onPick: (d) => setState(() => _end = d),
              )),
            ]),
            const SizedBox(height: 24),
            // Save button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Reis aanmaken'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) return;
    setState(() => _saving = true);
    final trip = Trip.create(
      name:        name,
      countryCode: _countryCode,
      countryFlag: _countryFlag,
      startDate:   _start,
      endDate:     _end,
    );
    widget.onSave(trip);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }
}

class _DateField extends StatelessWidget {
  final String label;
  final DateTime date;
  final ValueChanged<DateTime> onPick;

  const _DateField({
    required this.label,
    required this.date,
    required this.onPick,
  });

  @override
  Widget build(BuildContext context) {
    const months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];
    final text = '${date.day} ${months[date.month-1]} ${date.year}';

    return GestureDetector(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date,
          firstDate: DateTime(2020),
          lastDate: DateTime(2030),
          builder: (ctx, child) => Theme(
            data: Theme.of(ctx).copyWith(
              colorScheme: const ColorScheme.light(
                primary: AppColors.primary,
              ),
            ),
            child: child!,
          ),
        );
        if (picked != null) onPick(picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10,
                fontWeight: FontWeight.w700, color: AppColors.textThird)),
            const SizedBox(height: 3),
            Row(children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 14, color: AppColors.primary),
              const SizedBox(width: 5),
              Text(text, style: const TextStyle(fontSize: 13,
                  fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            ]),
          ],
        ),
      ),
    );
  }
}
