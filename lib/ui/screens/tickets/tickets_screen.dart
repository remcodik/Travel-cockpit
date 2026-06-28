import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';

// Simple in-memory ticket model (until DB table is wired)
class _Ticket {
  final String id, title, sub, date, time, venue, code;
  final int persons;
  final bool valid;

  const _Ticket({
    required this.id, required this.title, required this.sub,
    required this.date, required this.time, required this.venue,
    required this.code, required this.persons, required this.valid,
  });
}

// Tickets notifier — manages list in memory
class _TicketsNotifier extends StateNotifier<List<_Ticket>> {
  _TicketsNotifier() : super(_seeds);

  static const _seeds = [
    _Ticket(
      id: '1',
      title: 'Klimapark 2469 / Mimisbrunnr',
      sub: 'IJstunnel & permafrost tour · 2 personen',
      date: '21 jun 2026', time: '10:00', venue: 'Juvasshytta, Jotunheimen',
      code: 'TC-2026-06-21-KLIMAPARK',
      persons: 2, valid: false, // already done
    ),
  ];

  void add(_Ticket ticket) => state = [...state, ticket];
  void remove(String id) => state = state.where((t) => t.id != id).toList();
}

final _ticketsProvider =
    StateNotifierProvider<_TicketsNotifier, List<_Ticket>>(
        (_) => _TicketsNotifier());

class TicketsScreen extends ConsumerWidget {
  const TicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tickets = ref.watch(_ticketsProvider);
    final valid   = tickets.where((t) => t.valid).toList();
    final used    = tickets.where((t) => !t.valid).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 4),
            child: Row(children: [
              const Expanded(child: Text('Tickets', style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary, letterSpacing: -0.3))),
              IconButton(
                onPressed: () => _showAddSheet(context, ref),
                icon: const Icon(Icons.add_circle_outline_rounded,
                    color: AppColors.primary, size: 26),
                tooltip: 'Ticket toevoegen'),
            ]),
          ),
          // List
          Expanded(
            child: tickets.isEmpty
                ? _EmptyTickets(onAdd: () => _showAddSheet(context, ref))
                : ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    children: [
                      if (valid.isNotEmpty) ...[
                        const _SectionLabel('Geldig'),
                        ...valid.map((t) => _TicketCard(
                            ticket: t,
                            onDelete: () => ref
                                .read(_ticketsProvider.notifier)
                                .remove(t.id))),
                      ],
                      if (used.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const _SectionLabel('Gebruikt'),
                        ...used.map((t) => _TicketCard(
                            ticket: t,
                            onDelete: () => ref
                                .read(_ticketsProvider.notifier)
                                .remove(t.id))),
                      ],
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: () => _showAddSheet(context, ref),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Ticket toevoegen')),
                    ],
                  ),
          ),
        ]),
      ),
    );
  }

  void _showAddSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddTicketSheet(
        onSave: (t) => ref.read(_ticketsProvider.notifier).add(t)),
    );
  }
}

// ── Ticket card ───────────────────────────────────────────
class _TicketCard extends StatefulWidget {
  final _Ticket ticket;
  final VoidCallback onDelete;
  const _TicketCard({required this.ticket, required this.onDelete});
  @override State<_TicketCard> createState() => _TicketCardState();
}

class _TicketCardState extends State<_TicketCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final t    = widget.ticket;
    final done = !t.valid;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border(left: BorderSide(
          color: done ? AppColors.border : AppColors.primary,
          width: 5)),
        boxShadow: const [BoxShadow(color: Color(0x080F2E1E),
            blurRadius: 10, offset: Offset(0, 3))]),
      child: Opacity(
        opacity: done ? 0.6 : 1.0,
        child: Column(children: [
          // Main row
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(17),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(child: Text(t.title, style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary, letterSpacing: -0.2))),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: done
                            ? const Color(0xFFF0F0F0)
                            : AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(20)),
                      child: Text(done ? 'Gebruikt' : 'Geldig',
                          style: TextStyle(fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: done
                                  ? AppColors.textThird : AppColors.primary))),
                  ]),
                  const SizedBox(height: 4),
                  Text(t.sub, style: const TextStyle(
                      fontSize: 12, color: AppColors.textThird)),
                  const SizedBox(height: 10),
                  // Meta chips
                  Wrap(spacing: 8, children: [
                    _chip(Icons.calendar_today_outlined, t.date),
                    _chip(Icons.schedule_outlined, t.time),
                    _chip(Icons.people_outline_rounded,
                        '${t.persons} personen'),
                  ]),
                ]),
            )),
          // Barcode (expandable)
          if (!done && _expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12)),
                  child: Column(children: [
                    Text(t.venue, style: const TextStyle(fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textThird)),
                    const SizedBox(height: 8),
                    const Text('Toon bij ingang · Werkt offline',
                        style: TextStyle(fontSize: 10,
                            color: AppColors.textThird)),
                    const SizedBox(height: 12),
                    _BarcodeWidget(code: t.code),
                    const SizedBox(height: 6),
                    Text(t.code, style: const TextStyle(
                        fontSize: 9, color: AppColors.textThird,
                        fontFamily: 'monospace')),
                  ])),
                const SizedBox(height: 10),
                // Delete
                TextButton.icon(
                  onPressed: widget.onDelete,
                  icon: const Icon(Icons.delete_outline_rounded,
                      size: 16, color: AppColors.flagRed),
                  label: const Text('Verwijderen',
                      style: TextStyle(
                          color: AppColors.flagRed, fontSize: 13))),
              ])),
          ],
          // Tap to expand hint
          if (!done)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _expanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    size: 18, color: AppColors.textThird),
                  const SizedBox(width: 4),
                  Text(_expanded ? 'Verbergen' : 'Toon barcode',
                      style: const TextStyle(fontSize: 11,
                          color: AppColors.textThird)),
                ])),
        ]),
      ),
    );
  }

  Widget _chip(IconData icon, String label) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 12, color: AppColors.textThird),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(fontSize: 11,
          color: AppColors.textSecond, fontWeight: FontWeight.w600)),
    ]);
}

// ── Barcode ───────────────────────────────────────────────
class _BarcodeWidget extends StatelessWidget {
  final String code;
  const _BarcodeWidget({required this.code});

  @override
  Widget build(BuildContext context) {
    final bars = code.codeUnits.take(48).toList();
    return SizedBox(
      height: 56,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: bars.map((h) => Container(
          width: 2.2, height: 8.0 + (h % 6) * 8.0,
          margin: const EdgeInsets.symmetric(horizontal: 0.7),
          color: AppColors.textPrimary)).toList()));
  }
}

// ── Add sheet ─────────────────────────────────────────────
class _AddTicketSheet extends StatefulWidget {
  final void Function(_Ticket) onSave;
  const _AddTicketSheet({required this.onSave});
  @override State<_AddTicketSheet> createState() => _AddTicketSheetState();
}

class _AddTicketSheetState extends State<_AddTicketSheet> {
  final _titleCtrl  = TextEditingController();
  final _venueCtrl  = TextEditingController();
  final _codeCtrl   = TextEditingController();
  DateTime _date    = DateTime.now();
  TimeOfDay _time   = const TimeOfDay(hour: 10, minute: 0);
  int _persons      = 2;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: AppColors.border,
                  borderRadius: BorderRadius.circular(2)))),
          const Text('Ticket toevoegen', style: TextStyle(
              fontSize: 18, fontWeight: FontWeight.w800,
              color: AppColors.textPrimary, letterSpacing: -0.3)),
          const SizedBox(height: 20),

          TextField(controller: _titleCtrl,
              decoration: const InputDecoration(
                  labelText: 'Naam activiteit / evenement',
                  prefixIcon: Icon(Icons.confirmation_number_outlined))),
          const SizedBox(height: 12),

          TextField(controller: _venueCtrl,
              decoration: const InputDecoration(
                  labelText: 'Locatie',
                  prefixIcon: Icon(Icons.location_on_outlined))),
          const SizedBox(height: 12),

          TextField(controller: _codeCtrl,
              decoration: const InputDecoration(
                  labelText: 'Boekingscode / referentie',
                  prefixIcon: Icon(Icons.qr_code_outlined))),
          const SizedBox(height: 16),

          // Date + time row
          Row(children: [
            Expanded(child: GestureDetector(
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime(2026), lastDate: DateTime(2027),
                  builder: (c, child) => Theme(
                    data: Theme.of(c).copyWith(colorScheme:
                        const ColorScheme.light(primary: AppColors.primary)),
                    child: child!));
                if (d != null) setState(() => _date = d);
              },
              child: _FieldBox(
                label: 'Datum',
                value: '${_date.day}/${_date.month}/${_date.year}',
                icon: Icons.calendar_today_outlined))),
            const SizedBox(width: 12),
            Expanded(child: GestureDetector(
              onTap: () async {
                final t = await showTimePicker(
                    context: context, initialTime: _time);
                if (t != null) setState(() => _time = t);
              },
              child: _FieldBox(
                label: 'Tijd',
                value: _time.format(context),
                icon: Icons.schedule_outlined))),
          ]),
          const SizedBox(height: 16),

          // Persons
          Row(children: [
            const Expanded(child: Text('Aantal personen',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary))),
            _CountBtn(icon: Icons.remove_rounded,
                onTap: () { if (_persons > 1) setState(() => _persons--); }),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Text('$_persons', style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary))),
            _CountBtn(icon: Icons.add_rounded,
                onTap: () => setState(() => _persons++)),
          ]),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                if (_titleCtrl.text.trim().isEmpty) return;
                final months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];
                widget.onSave(_Ticket(
                  id:      DateTime.now().millisecondsSinceEpoch.toString(),
                  title:   _titleCtrl.text.trim(),
                  sub:     '${_persons} personen · ${_venueCtrl.text.trim()}',
                  date:    '${_date.day} ${months[_date.month-1]} ${_date.year}',
                  time:    _time.format(context),
                  venue:   _venueCtrl.text.trim(),
                  code:    _codeCtrl.text.trim().isEmpty
                      ? 'TC-${DateTime.now().millisecondsSinceEpoch}'
                      : _codeCtrl.text.trim(),
                  persons: _persons,
                  valid:   true,
                ));
                Navigator.pop(context);
              },
              child: const Text('Ticket opslaan'))),
        ])));
  }

  @override void dispose() {
    _titleCtrl.dispose(); _venueCtrl.dispose(); _codeCtrl.dispose();
    super.dispose();
  }
}

class _FieldBox extends StatelessWidget {
  final String label, value;
  final IconData icon;
  const _FieldBox({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
    decoration: BoxDecoration(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: AppColors.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 10,
          fontWeight: FontWeight.w700, color: AppColors.textThird)),
      const SizedBox(height: 3),
      Row(children: [
        Icon(icon, size: 14, color: AppColors.primary),
        const SizedBox(width: 5),
        Text(value, style: const TextStyle(fontSize: 13,
            fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      ])]));
}

class _CountBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _CountBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border)),
      child: Icon(icon, color: AppColors.primary, size: 18)));
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text.toUpperCase(), style: const TextStyle(
        fontSize: 11, fontWeight: FontWeight.w800,
        letterSpacing: 0.6, color: AppColors.textThird)));
}

class _EmptyTickets extends StatelessWidget {
  final VoidCallback onAdd;
  const _EmptyTickets({required this.onAdd});

  @override
  Widget build(BuildContext context) => Center(child: Padding(
    padding: const EdgeInsets.all(32),
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Text('🎟️', style: TextStyle(fontSize: 56)),
      const SizedBox(height: 18),
      const Text('Geen tickets', style: TextStyle(
          fontSize: 18, fontWeight: FontWeight.w800,
          color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      const Text('Voeg tickets toe zodat ze altijd offline beschikbaar zijn.',
          style: TextStyle(fontSize: 13, color: AppColors.textThird),
          textAlign: TextAlign.center),
      const SizedBox(height: 24),
      ElevatedButton.icon(
          onPressed: onAdd,
          icon: const Icon(Icons.add, size: 18),
          label: const Text('Ticket toevoegen')),
    ])));
}
