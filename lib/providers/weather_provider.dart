import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'trip_provider.dart';
import 'database_provider.dart';

class WeatherData {
  final double temperatureCelsius;
  final int precipitationProbability;
  final String condition;
  final String emoji;
  final DateTime fetchedAt;

  const WeatherData({
    required this.temperatureCelsius,
    required this.precipitationProbability,
    required this.condition,
    required this.emoji,
    required this.fetchedAt,
  });

  bool get isStale =>
      DateTime.now().difference(fetchedAt).inMinutes > 60;

  String get display =>
      '${temperatureCelsius.round()}°C · $condition';
}

class WeatherNotifier extends AsyncNotifier<WeatherData?> {
  static final _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 10),
  ));

  @override
  Future<WeatherData?> build() async {
    // Get active accommodation coordinates
    final trip = ref.watch(activeTripProvider).valueOrNull;
    if (trip == null) return null;

    // Get active accommodation
    final db  = ref.watch(databaseProvider);
    final acc = await db.accommodationDao.getActive(trip.id);
    if (acc == null) return null;

    // Get place for coordinates
    final place = await db.placeDao.getById(acc.placeId);
    if (place == null) return null;

    return _fetch(place.latitude, place.longitude);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    final trip = ref.read(activeTripProvider).valueOrNull;
    if (trip == null) { state = const AsyncValue.data(null); return; }

    final db    = ref.read(databaseProvider);
    final acc   = await db.accommodationDao.getActive(trip.id);
    final place = acc != null ? await db.placeDao.getById(acc.placeId) : null;

    if (place == null) { state = const AsyncValue.data(null); return; }
    state = AsyncValue.data(await _fetch(place.latitude, place.longitude));
  }

  Future<WeatherData?> _fetch(double lat, double lng) async {
    try {
      final resp = await _dio.get(
        'https://api.open-meteo.com/v1/forecast',
        queryParameters: {
          'latitude':                    lat,
          'longitude':                   lng,
          'current':                     'temperature_2m,precipitation_probability,weathercode',
          'timezone':                    'auto',
          'forecast_days':               1,
        },
      );
      final current = resp.data['current'] as Map<String, dynamic>;
      final temp    = (current['temperature_2m'] as num).toDouble();
      final rain    = (current['precipitation_probability'] as num).toInt();
      final code    = (current['weathercode'] as num).toInt();

      return WeatherData(
        temperatureCelsius:       temp,
        precipitationProbability: rain,
        condition:                _condition(code, rain),
        emoji:                    _emoji(code, rain),
        fetchedAt:                DateTime.now(),
      );
    } catch (e) {
      debugPrint('Weather fetch failed: $e');
      return null;
    }
  }

  String _condition(int code, int rain) {
    if (code == 0)           return 'Helder';
    if (code <= 2)           return 'Gedeeltelijk bewolkt';
    if (code <= 3)           return 'Bewolkt';
    if (code <= 49)          return 'Mist';
    if (rain > 60)           return 'Regen';
    if (code <= 67)          return 'Lichte regen';
    if (code <= 77)          return 'Sneeuw';
    if (code <= 82)          return 'Regenbuien';
    return 'Onweer';
  }

  String _emoji(int code, int rain) {
    if (code == 0)           return '☀️';
    if (code <= 2)           return '🌤️';
    if (code <= 3)           return '⛅';
    if (code <= 49)          return '🌫️';
    if (rain > 60)           return '🌧️';
    if (code <= 67)          return '🌦️';
    if (code <= 77)          return '❄️';
    if (code <= 82)          return '🌧️';
    return '⛈️';
  }
}

final weatherProvider =
    AsyncNotifierProvider<WeatherNotifier, WeatherData?>(() {
  return WeatherNotifier();
});
