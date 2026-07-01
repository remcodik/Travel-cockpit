import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_preferences.freezed.dart';
part 'user_preferences.g.dart';

enum VehicleType {
  @JsonValue('ev')   ev,
  @JsonValue('fuel') fuel,
  @JsonValue('none') none,
}

@freezed
class UserPreferences with _$UserPreferences {
  const factory UserPreferences({
    @Default([]) List<String> travelStyles,
    @Default(VehicleType.ev) VehicleType vehicleType,
    @Default([]) List<String> evNetworks,
    @Default(100) int evMinPowerKw,
    @Default('nl') String language,
    @Default(false) bool darkMode,
    @Default(true) bool aiSuggestionsEnabled,
    @Default(true) bool weatherSuggestionsEnabled,
    @Default([]) List<String> offlineMapsDownloaded,
  }) = _UserPreferences;

  factory UserPreferences.defaults() => const UserPreferences(
    travelStyles: ['natuur', 'wandelen'],
    vehicleType: VehicleType.ev,
    evNetworks: ['ionity', 'tesla'],
  );

  factory UserPreferences.fromJson(Map<String, dynamic> json) =>
      _$UserPreferencesFromJson(json);
}
