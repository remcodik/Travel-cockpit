import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/models/planning_item.dart';
import '../domain/models/place.dart';
import '../data/repositories/planning_repository.dart';
import '../data/repositories/place_repository.dart';
import 'database_provider.dart';
import 'trip_provider.dart';

// Today's planning for the active trip
final todayPlanningProvider = StreamProvider<List<PlanningItem>>((ref) {
  final trip  = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  final today = DateTime.now();
  return ref.watch(planningRepositoryProvider).watchByDate(trip.id, today);
});

// All planning items for the active trip (all days)
final allPlanningProvider = StreamProvider<List<PlanningItem>>((ref) {
  final trip = ref.watch(activeTripProvider).valueOrNull;
  if (trip == null) return const Stream.empty();
  return ref.watch(planningRepositoryProvider).watchByTrip(trip.id);
});

// Planning actions notifier
class PlanningNotifier extends StateNotifier<AsyncValue<void>> {
  final PlanningRepository _planningRepo;
  final PlaceRepository    _placeRepo;
  final Ref                _ref;

  PlanningNotifier(this._planningRepo, this._placeRepo, this._ref)
      : super(const AsyncValue.data(null));

  String? get _tripId =>
      _ref.read(activeTripProvider).valueOrNull?.id;

  /// Add a Place to planning.
  /// Per DL-008: only called by explicit user action — never automatic.
  Future<void> addPlace(Place place, {DateTime? plannedDate}) async {
    final tid = _tripId;
    if (tid == null) return;

    state = const AsyncValue.loading();
    try {
      await _placeRepo.save(place);
      await _planningRepo.save(PlanningItem.create(
        tripId:      tid,
        placeId:     place.id,
        plannedDate: plannedDate,
      ));
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
  return PlanningNotifier(
    ref.watch(planningRepositoryProvider),
    ref.watch(placeRepositoryProvider),
    ref,                         // pass ref so notifier can always read current trip
  );
});
