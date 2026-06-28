import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/preferences_provider.dart';
import '../../../domain/models/user_preferences.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(preferencesProvider);
    final notifier = ref.read(preferencesProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(children: [
              GestureDetector(
                onTap: () => context.pop(),
                child: const Icon(Icons.arrow_back_rounded,
                    color: AppColors.textSecond, size: 24)),
              const SizedBox(width: 12),
              const Expanded(child: Text('Instellingen',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary, letterSpacing: -0.3))),
            ]),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
              children: [

                // ── Reisvoertuig ───────────────────────
                _SectionLabel('Voertuig'),
                _Card(children: [
                  _VehicleOption(
                    icon: '⚡', label: 'Elektrisch',
                    sub: 'Toont laadstations en EV-routes',
                    selected: prefs.vehicleType == VehicleType.ev,
                    onTap: () => notifier.setVehicle(VehicleType.ev)),
                  const Divider(height: 1, indent: 16),
                  _VehicleOption(
                    icon: '⛽', label: 'Benzine / Diesel',
                    sub: 'Toont tankstations',
                    selected: prefs.vehicleType == VehicleType.fuel,
                    onTap: () => notifier.setVehicle(VehicleType.fuel)),
                  const Divider(height: 1, indent: 16),
                  _VehicleOption(
                    icon: '🚶', label: 'Geen voertuig',
                    sub: 'Alleen OV en wandelen',
                    selected: prefs.vehicleType == VehicleType.none,
                    onTap: () => notifier.setVehicle(VehicleType.none)),
                ]),

                // ── Reisvoorkeuren ─────────────────────
                const SizedBox(height: 20),
                _SectionLabel('Wat vind je leuk?'),
                const SizedBox(height: 4),
                const Text(
                  'Dit gebruiken we voor AI suggesties.',
                  style: TextStyle(fontSize: 12, color: AppColors.textThird)),
                const SizedBox(height: 10),
                _StyleGrid(prefs: prefs, notifier: notifier),

                // ── AI instellingen ────────────────────
                const SizedBox(height: 20),
                _SectionLabel('AI ideeën'),
                _Card(children: [
                  _SwitchRow(
                    icon: '🤖', label: 'AI suggesties ingeschakeld',
                    sub: 'Dagelijkse activiteiten via Claude',
                    value: prefs.aiSuggestionsEnabled,
                    onChanged: (v) => notifier.toggleAi(v)),
                  const Divider(height: 1, indent: 16),
                  _SwitchRow(
                    icon: '☀️', label: 'Weersuggesties',
                    sub: 'Pas ideeën aan op het weer',
                    value: prefs.weatherSuggestionsEnabled,
                    onChanged: (v) => notifier.update(
                        prefs.copyWith(weatherSuggestionsEnabled: v))),
                ]),

                // ── Taal ──────────────────────────────
                const SizedBox(height: 20),
                _SectionLabel('Taal'),
                _Card(children: [
                  _LangRow(
                    flag: '🇳🇱', label: 'Nederlands',
                    selected: prefs.language == 'nl',
                    onTap: () => notifier.update(
                        prefs.copyWith(language: 'nl'))),
                  const Divider(height: 1, indent: 16),
                  _LangRow(
                    flag: '🇬🇧', label: 'Engels',
                    selected: prefs.language == 'en',
                    onTap: () => notifier.update(
                        prefs.copyWith(language: 'en'))),
                  const Divider(height: 1, indent: 16),
                  _LangRow(
                    flag: '🇩🇪', label: 'Duits',
                    selected: prefs.language == 'de',
                    onTap: () => notifier.update(
                        prefs.copyWith(language: 'de'))),
                ]),

                // ── App info ──────────────────────────
                const SizedBox(height: 20),
                _SectionLabel('Over'),
                _Card(children: [
                  _InfoRow(icon: Icons.info_outline_rounded,
                      label: 'Travel Cockpit', value: 'v1.0.0 — beta'),
                  const Divider(height: 1, indent: 52),
                  _InfoRow(icon: Icons.map_outlined,
                      label: 'Kaartdata', value: 'OpenStreetMap'),
                  const Divider(height: 1, indent: 52),
                  _InfoRow(icon: Icons.cloud_outlined,
                      label: 'Weer', value: 'Open-Meteo (gratis)'),
                  const Divider(height: 1, indent: 52),
                  _InfoRow(icon: Icons.auto_awesome_rounded,
                      label: 'AI', value: 'Claude (Anthropic)'),
                ]),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

// ── Section label ─────────────────────────────────────────
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

// ── Card wrapper ──────────────────────────────────────────
class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.border)),
    child: Column(children: children));
}

// ── Vehicle option ────────────────────────────────────────
class _VehicleOption extends StatelessWidget {
  final String icon, label, sub;
  final bool selected;
  final VoidCallback onTap;
  const _VehicleOption({required this.icon, required this.label,
      required this.sub, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(12),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(children: [
        Text(icon, style: const TextStyle(fontSize: 22)),
        const SizedBox(width: 14),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 14,
                fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            Text(sub, style: const TextStyle(fontSize: 11,
                color: AppColors.textThird)),
          ])),
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: 22, height: 22,
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : Colors.transparent,
            shape: BoxShape.circle,
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
              width: 2)),
          child: selected ? const Icon(Icons.check_rounded,
              color: Colors.white, size: 13) : null),
      ])));
}

// ── Travel style grid ─────────────────────────────────────
class _StyleGrid extends StatelessWidget {
  final UserPreferences prefs;
  final PreferencesNotifier notifier;
  const _StyleGrid({required this.prefs, required this.notifier});

  static const _styles = [
    (emoji: '🏔️', label: 'Natuur',       key: 'natuur'),
    (emoji: '🥾', label: 'Wandelen',      key: 'wandelen'),
    (emoji: '📸', label: 'Fotografie',    key: 'fotografie'),
    (emoji: '🍽️', label: 'Eten & drinken',key: 'eten'),
    (emoji: '🏛️', label: 'Cultuur',       key: 'cultuur'),
    (emoji: '🎭', label: 'Geschiedenis',  key: 'geschiedenis'),
    (emoji: '🛶', label: 'Water & fjord', key: 'water'),
    (emoji: '🧘', label: 'Rust & natuur', key: 'rust'),
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: _styles.map((s) {
        final isOn = prefs.travelStyles.contains(s.key);
        return GestureDetector(
          onTap: () => notifier.toggleStyle(s.key),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isOn ? AppColors.primary : AppColors.card,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isOn ? AppColors.primary : AppColors.border,
                width: 1.5)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Text(s.emoji, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 6),
              Text(s.label, style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w700,
                  color: isOn ? Colors.white : AppColors.textSecond)),
            ])));
      }).toList());
  }
}

// ── Switch row ────────────────────────────────────────────
class _SwitchRow extends StatelessWidget {
  final String icon, label, sub;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _SwitchRow({required this.icon, required this.label,
      required this.sub, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    child: Row(children: [
      Text(icon, style: const TextStyle(fontSize: 22)),
      const SizedBox(width: 14),
      Expanded(child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 14,
              fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          Text(sub, style: const TextStyle(fontSize: 11,
              color: AppColors.textThird)),
        ])),
      Switch.adaptive(
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.primary),
    ]));
}

// ── Language row ──────────────────────────────────────────
class _LangRow extends StatelessWidget {
  final String flag, label;
  final bool selected;
  final VoidCallback onTap;
  const _LangRow({required this.flag, required this.label,
      required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(12),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(children: [
        Text(flag, style: const TextStyle(fontSize: 22)),
        const SizedBox(width: 14),
        Expanded(child: Text(label, style: const TextStyle(
            fontSize: 14, fontWeight: FontWeight.w700,
            color: AppColors.textPrimary))),
        if (selected)
          const Icon(Icons.check_rounded,
              color: AppColors.primary, size: 20),
      ])));
}

// ── Info row ──────────────────────────────────────────────
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  const _InfoRow({required this.icon, required this.label,
      required this.value});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
    child: Row(children: [
      Icon(icon, size: 20, color: AppColors.textThird),
      const SizedBox(width: 14),
      Expanded(child: Text(label, style: const TextStyle(
          fontSize: 14, fontWeight: FontWeight.w600,
          color: AppColors.textPrimary))),
      Text(value, style: const TextStyle(
          fontSize: 12, color: AppColors.textThird)),
    ]));
}
