import 'package:freezed_annotation/freezed_annotation.dart';
part 'ai_suggestion.freezed.dart';
part 'ai_suggestion.g.dart';

@freezed
class AiSuggestion with _$AiSuggestion {
  const factory AiSuggestion({
    required String name,
    required AiSuggestionCategory category,
    required String description,
    required String whyRecommended,
    @Default(0.0) double distanceKm,
    @Default(0) int durationMinutes,
    String? difficulty,
    double? rating,
    double? lat,
    double? lng,
    String? googleMapsQuery,
    @Default(false) bool isAddedToPlan,
  }) = _AiSuggestion;

  factory AiSuggestion.fromJson(Map<String, dynamic> json) =>
      _$AiSuggestionFromJson(json);
}

enum AiSuggestionCategory {
  @JsonValue('activity')   activity,
  @JsonValue('restaurant') restaurant,
  @JsonValue('cafe')       cafe,
  @JsonValue('rain')       rain,
  @JsonValue('drive')      drive,
}

extension AiSuggestionCategoryX on AiSuggestionCategory {
  String get label {
    switch (this) {
      case AiSuggestionCategory.activity:   return 'Activiteit';
      case AiSuggestionCategory.restaurant: return 'Restaurant';
      case AiSuggestionCategory.cafe:       return 'Caf\u00e9';
      case AiSuggestionCategory.rain:       return 'Regen-alternatief';
      case AiSuggestionCategory.drive:      return 'Rijroute';
    }
  }
  String get emoji {
    switch (this) {
      case AiSuggestionCategory.activity:   return '\U0001f3d4\ufe0f';
      case AiSuggestionCategory.restaurant: return '\U0001f37d\ufe0f';
      case AiSuggestionCategory.cafe:       return '\u2615';
      case AiSuggestionCategory.rain:       return '\U0001f327\ufe0f';
      case AiSuggestionCategory.drive:      return '\U0001f697';
    }
  }
}
