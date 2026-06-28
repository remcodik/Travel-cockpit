import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/local/database.dart';
import '../data/repositories/trip_repository.dart';
import '../data/repositories/place_repository.dart';
import '../data/repositories/planning_repository.dart';

/// Overridden in main() with the seeded instance
final databaseInstanceProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError('databaseInstanceProvider must be overridden in main()');
});

final databaseProvider = Provider<AppDatabase>((ref) {
  return ref.watch(databaseInstanceProvider);
});

final tripRepositoryProvider = Provider<TripRepository>((ref) {
  return TripRepository(ref.watch(databaseProvider));
});

final placeRepositoryProvider = Provider<PlaceRepository>((ref) {
  return PlaceRepository(ref.watch(databaseProvider));
});

final planningRepositoryProvider = Provider<PlanningRepository>((ref) {
  return PlanningRepository(ref.watch(databaseProvider));
});
