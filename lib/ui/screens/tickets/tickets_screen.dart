import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class TicketsScreen extends StatelessWidget {
  const TicketsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 4),
            child: Row(children: [
              const Expanded(child: Text('Tickets',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary, letterSpacing: -0.3))),
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.add_circle_outline_rounded,
                    color: AppColors.primary, size: 26),
              ),
            ]),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                // Coming ticket
                _ticketCard(
                  title:   'Geirangerfjord Cruise',
                  sub:     'Rondvaart · 2 uur · 2 personen',
                  date:    '24 jul 2025',
                  time:    '11:00',
                  persons: 2,
                  code:    'TC-2025-07-24-0847',
                  valid:   true,
                ),
                const SizedBox(height: 20),
                const Text('GEBRUIKT', style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w800,
                    letterSpacing: 0.6, color: AppColors.textThird)),
                const SizedBox(height: 10),
                _ticketCard(
                  title:   'Bismo Grotte Tour',
                  sub:     '15 jul 2025 · 14:00 · 2 personen',
                  date:    '15 jul 2025',
                  time:    '14:00',
                  persons: 2,
                  code:    'TC-2025-07-15-0234',
                  valid:   false,
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.add),
                  label: const Text('Ticket toevoegen'),
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _ticketCard({
    required String title, required String sub,
    required String date,  required String time,
    required int persons,  required String code,
    required bool valid,
  }) {
    return Opacity(
      opacity: valid ? 1.0 : 0.55,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(18),
          border: Border(
            left: BorderSide(
              color: valid ? AppColors.primary : AppColors.border,
              width: 5),
          ),
          boxShadow: const [BoxShadow(color: Color(0x080F2E1E),
              blurRadius: 10, offset: Offset(0, 3))],
        ),
        padding: const EdgeInsets.all(18),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(title,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary, letterSpacing: -0.2))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: valid ? AppColors.primaryLight : const Color(0xFFF0F0F0),
                borderRadius: BorderRadius.circular(20)),
              child: Text(valid ? 'Geldig' : 'Gebruikt',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800,
                      color: valid ? AppColors.primary : AppColors.textThird)),
            ),
          ]),
          const SizedBox(height: 4),
          Text(sub, style: const TextStyle(fontSize: 12,
              color: AppColors.textThird)),
          const SizedBox(height: 14),
          Row(children: [
            _field('Datum', date),
            const SizedBox(width: 24),
            _field('Tijd', time),
            const SizedBox(width: 24),
            _field('Personen', '$persons'),
          ]),
          if (valid) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12)),
              child: Column(children: [
                const Text('Toon bij ingang · Offline beschikbaar',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                        color: AppColors.textThird)),
                const SizedBox(height: 8),
                _BarcodeWidget(code: code),
                const SizedBox(height: 6),
                Text(code, style: const TextStyle(fontSize: 10,
                    color: AppColors.textThird,
                    fontFamily: 'monospace')),
              ]),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _field(String label, String value) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 10,
          fontWeight: FontWeight.w800, letterSpacing: 0.4,
          color: AppColors.textThird)),
      const SizedBox(height: 3),
      Text(value, style: const TextStyle(fontSize: 14,
          fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
    ]);
  }
}

class _BarcodeWidget extends StatelessWidget {
  final String code;
  const _BarcodeWidget({required this.code});

  @override
  Widget build(BuildContext context) {
    // Generate deterministic bar pattern from code string
    final bars = <int>[];
    for (final ch in code.codeUnits.take(40)) {
      bars.add((ch % 5) + 1);
    }
    return SizedBox(
      height: 48,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: bars.map((h) => Container(
          width: 2.5,
          height: 8.0 + h * 8.0,
          margin: const EdgeInsets.symmetric(horizontal: 0.8),
          color: AppColors.textPrimary,
        )).toList(),
      ),
    );
  }
}
