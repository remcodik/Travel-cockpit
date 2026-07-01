import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/models/trip.dart';
import '../data/repositories/trip_repository.dart';
import 'database_provider.dart';

// All trips — reactive stream
final allTripsProvider = StreamProvider<List<Trip>>((ref) {
  return ref.watch(tripRepositoryProvider).watchAll();
});

// Active trip — DL-004: only one at a time
final activeTripProvider = StreamProvider<Trip?>((ref) {
  return ref.watch(tripRepositoryProvider).watchActive();
});

// Trip actions
class TripNotifier extends StateNotifier<AsyncValue<void>> {
  final TripRepository _repo;
  TripNotifier(this._repo) : super(const AsyncValue.data(null));

  Future<void> createTrip(Trip trip) async {
    state = const AsyncValue.loading();
    try {
      await _repo.save(trip);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> setActive(String tripId) async {
    await _repo.setActive(tripId);
  }

  Future<void> deleteTrip(String tripId) async {
    await _repo.delete(tripId);
  }
}

final tripNotifierProvider =
    StateNotifierProvider<TripNotifier, AsyncValue<void>>((ref) {
  return TripNotifier(ref.watch(tripRepositoryProvider));
});
