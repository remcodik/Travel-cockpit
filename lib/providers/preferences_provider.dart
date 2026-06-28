import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/models/user_preferences.dart';

const _prefsKey = 'user_preferences';

class PreferencesNotifier extends StateNotifier<UserPreferences> {
  final SharedPreferences _prefs;

  PreferencesNotifier(this._prefs)
      : super(_load(_prefs));

  static UserPreferences _load(SharedPreferences prefs) {
    final json = prefs.getString(_prefsKey);
    if (json == null) return UserPreferences.defaults();
    try {
      return UserPreferences.fromJson(jsonDecode(json));
    } catch (_) {
      return UserPreferences.defaults();
    }
  }

  Future<void> update(UserPreferences updated) async {
    state = updated;
    await _prefs.setString(_prefsKey, jsonEncode(updated.toJson()));
  }

  Future<void> toggleStyle(String style) async {
    final styles = List<String>.from(state.travelStyles);
    if (styles.contains(style)) {
      styles.remove(style);
    } else {
      styles.add(style);
    }
    await update(state.copyWith(travelStyles: styles));
  }

  Future<void> setVehicle(VehicleType type) =>
      update(state.copyWith(vehicleType: type));

  Future<void> toggleAi(bool enabled) =>
      update(state.copyWith(aiSuggestionsEnabled: enabled));
}

final preferencesProvider =
    StateNotifierProvider<PreferencesNotifier, UserPreferences>((ref) {
  // Requires setGlobalPrefs() called in main()
  return PreferencesNotifier(_globalPrefs!);
});

// Reuse the global prefs instance from ai_provider.dart
import 'ai_provider.dart' show _globalPrefs;
