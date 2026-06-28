import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/models/planning_item.dart';
import '../domain/models/place.dart';
import 'database_provider.dart';
import 'trip_provider.dart';

// Today's planning items for active trip
final todayPlanningProvider = StreamProvider<List<PlanningItem>>((ref) {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  final today = DateTime.now();
  return ref.watch(planningRepositoryProvider).watchByDate(trip.id, today);
});

// All planning items for active trip
final allPlanningProvider = StreamProvider<List<PlanningItem>>((ref) {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  return ref.watch(planningRepositoryProvider).watchByTrip(trip.id);
});

// Planning actions
class PlanningNotifier extends StateNotifier<AsyncValue<void>> {
  final PlanningRepository _planningRepo;
  final PlaceRepository _placeRepo;
  final String? _tripId;

  PlanningNotifier(this._planningRepo, this._placeRepo, this._tripId)
      : super(const AsyncValue.data(null));

  /// Add AI suggestion or manual place to planning.
  /// AI never adds automatically — user must call this explicitly (DL-008).
  Future<void> addPlace(Place place, {DateTime? plannedDate}) async {
    if (_tripId == null) return;
    state = const AsyncValue.loading();
    try {
      // Save place first if not already saved
      await _placeRepo.save(place);
      // Create planning item
      final item = PlanningItem.create(
        tripId:      _tripId!,
        placeId:     place.id,
        plannedDate: plannedDate,
      );
      await _planningRepo.save(item);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markCompleted(String itemId) =>
      _planningRepo.markCompleted(itemId);

  Future<void> markPlanned(String itemId) =>
      _planningRepo.markPlanned(itemId);

  Future<void> remove(String itemId) =>
      _planningRepo.delete(itemId);
}

final planningNotifierProvider =
    StateNotifierProvider<PlanningNotifier, AsyncValue<void>>((ref) {
  final trip        = ref.watch(activeTripProvider).valueOrNull;
  final planningRepo= ref.watch(planningRepositoryProvider);
  final placeRepo   = ref.watch(placeRepositoryProvider);
  return PlanningNotifier(planningRepo, placeRepo, trip?.id);
});
