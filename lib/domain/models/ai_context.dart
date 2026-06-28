import 'ai_suggestion.dart';

class AiContext {
  final String accommodationName;
  final String accommodationLocation;
  final String country;
  final String countryCode;
  final DateTime today;
  final double? temperatureCelsius;
  final String? weatherCondition;
  final int? rainProbabilityPercent;
  final List<String> userPreferences;
  final List<String> alreadyPlanned;
  final AiSuggestionCategory? filter;
  final String language;

  const AiContext({
    required this.accommodationName,
    required this.accommodationLocation,
    required this.country,
    required this.countryCode,
    required this.today,
    this.temperatureCelsius,
    this.weatherCondition,
    this.rainProbabilityPercent,
    required this.userPreferences,
    required this.alreadyPlanned,
    this.filter,
    this.language = 'nl',
  });

  String get formattedDate {
    const months = ['jan','feb','mrt','apr','mei','jun',
                    'jul','aug','sep','okt','nov','dec'];
    return '${today.day} ${months[today.month - 1]} ${today.year}';
  }

  String get weatherSummary {
    if (temperatureCelsius == null) return 'Onbekend';
    final temp = '${temperatureCelsius!.round()}\u00b0C';
    final cond = weatherCondition ?? '';
    final rain = rainProbabilityPercent != null
        ? ', ${rainProbabilityPercent}% kans op regen' : '';
    return '$temp $cond$rain'.trim();
  }
}
