import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/models/user_preferences.dart';

const _prefsKey = 'user_preferences';

// Global prefs instance — set in main.dart before runApp()
SharedPreferences? _sharedPrefs;
void initPreferencesProvider(SharedPreferences prefs) => _sharedPrefs = prefs;

class PreferencesNotifier extends StateNotifier<UserPreferences> {
  final SharedPreferences _prefs;

  PreferencesNotifier(this._prefs) : super(_load(_prefs));

  static UserPreferences _load(SharedPreferences prefs) {
    final raw = prefs.getString(_prefsKey);
    if (raw == null) return UserPreferences.defaults();
    try {
      return UserPreferences.fromJson(jsonDecode(raw));
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
  assert(_sharedPrefs != null,
      'Call initPreferencesProvider() in main() before runApp()');
  return PreferencesNotifier(_sharedPrefs!);
});
