import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';
import 'providers/ai_provider.dart';
import 'providers/preferences_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Init SharedPreferences once — used by AI + Preferences providers
  final prefs = await SharedPreferences.getInstance();
  setGlobalPrefs(prefs);               // AI provider
  initPreferencesProvider(prefs);      // Preferences provider

  runApp(const ProviderScope(child: TravelCockpitApp()));
}
