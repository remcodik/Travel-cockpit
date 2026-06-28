import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/models/place.dart';
import 'database_provider.dart';

/// Single place by ID — used by PlanningItemRow, ActivityDetailScreen
final placeByIdProvider =
    FutureProvider.family<Place?, String>((ref, placeId) async {
  final repo = ref.watch(placeRepositoryProvider);
  return repo.getById(placeId);
});

/// All places for active trip as a stream
final allPlacesProvider = StreamProvider<List<Place>>((ref) {
  // We need the trip — import from trip_provider
  return const Stream.empty(); // wired up in home screen
});
