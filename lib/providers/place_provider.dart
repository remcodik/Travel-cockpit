import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/models/place.dart';
import 'database_provider.dart';
import 'trip_provider.dart';

/// Single place by ID — used by PlanningItemRow, ActivityDetailScreen,
/// PlanningSection. Cached per id by Riverpod's family.
final placeByIdProvider =
    FutureProvider.family<Place?, String>((ref, placeId) async {
  final repo = ref.watch(placeRepositoryProvider);
  return repo.getById(placeId);
});

/// All places for the active trip as a reactive stream.
/// Used by the map and nearby strip.
final allPlacesProvider = StreamProvider<List<Place>>((ref) {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  return ref.watch(placeRepositoryProvider).watchByTrip(trip.id);
});

/// Places filtered by category for the active trip.
final placesByCategoryProvider =
    FutureProvider.family<List<Place>, PlaceCategory>((ref, cat) async {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return [];
  return ref.watch(placeRepositoryProvider).getByCategory(trip.id, cat);
});
