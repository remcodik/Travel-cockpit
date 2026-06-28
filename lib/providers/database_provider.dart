import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/local/database.dart';
import '../data/repositories/trip_repository.dart';
import '../data/repositories/place_repository.dart';
import '../data/repositories/planning_repository.dart';

// Single database instance for the whole app
final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
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
