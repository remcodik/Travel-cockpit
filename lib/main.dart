import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';
import 'providers/ai_provider.dart';
import 'providers/preferences_provider.dart';
import 'data/local/database.dart';
import 'data/seed/seed_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. SharedPreferences
  final prefs = await SharedPreferences.getInstance();
  setGlobalPrefs(prefs);
  initPreferencesProvider(prefs);

  // 2. Database
  final db = AppDatabase();

  // 3. Seed real Norway 2026 data on first launch
  final seeder = SeedService(db, prefs);
  await seeder.loadIfNeeded();

  runApp(ProviderScope(
    overrides: [
      // Make the seeded database available to all providers
      databaseInstanceProvider.overrideWithValue(db),
    ],
    child: const TravelCockpitApp(),
  ));
}
