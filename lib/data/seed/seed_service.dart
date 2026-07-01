import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../local/database.dart';
import 'package:drift/drift.dart';
import 'norway_2026_seed.dart';

const _seedKey = 'seed_loaded_v1';

class SeedService {
  final AppDatabase _db;
  final SharedPreferences _prefs;

  SeedService(this._db, this._prefs);

  /// Load seed data if not already loaded.
  Future<void> loadIfNeeded() async {
    if (_prefs.getBool(_seedKey) == true) {
      debugPrint('🌱 Seed already loaded, skipping');
      return;
    }
    await _loadNorway2026();
    await _prefs.setBool(_seedKey, true);
    debugPrint('✅ Norway 2026 seed loaded');
  }

  Future<void> _loadNorway2026() async {
    // 1. Create trip
    final trip = NorwaySeed.trip;
    await _db.into(_db.tripsTable).insert(TripsTableCompanion.insert(
      id:          trip.id,
      name:        trip.name,
      countryCode: trip.countryCode,
      countryFlag: trip.countryFlag,
      startDate:   trip.startDate,
      endDate:     trip.endDate,
      status:      const Value('active'),
      isActive:    const Value(true),
      description: Value(trip.description),
      createdAt:   Value(DateTime.now()),
      updatedAt:   Value(DateTime.now()),
    ));

    // 2. Create accommodations + their places
    final accSeeds = NorwaySeed.accommodations(trip.id);
    for (final seed in accSeeds) {
      final place = seed.place;
      await _db.into(_db.placesTable).insert(PlacesTableCompanion.insert(
        id:          place.id,
        tripId:      place.tripId,
        name:        place.name,
        category:    place.category.name,
        latitude:    place.latitude,
        longitude:   place.longitude,
        source:      const Value('manual'),
        address:     Value(place.address),
        description: Value(place.description),
        photoUrls:   const Value('[]'),
        isOffline:   const Value(true),
        createdAt:   Value(DateTime.now()),
        updatedAt:   Value(DateTime.now()),
      ));

      // Determine if active based on today
      final today = DateTime.now();
      final isActive = !today.isBefore(seed.checkIn) &&
                       today.isBefore(seed.checkOut);

      await _db.into(_db.accommodationsTable).insert(
        AccommodationsTableCompanion.insert(
          id:          const Uuid().v4(),
          placeId:     place.id,
          tripId:      trip.id,
          checkInDate: seed.checkIn,
          checkOutDate:seed.checkOut,
          orderInTrip: seed.order,
          isActive:    Value(isActive),
          checkInHour:    Value(seed.checkInTime?.hour),
          checkInMinute:  Value(seed.checkInTime?.minute),
          checkOutHour:   Value(seed.checkOutTime?.hour),
          checkOutMinute: Value(seed.checkOutTime?.minute),
          createdAt:   Value(DateTime.now()),
        ),
      );
    }

    // 3. Create activity places
    final actPlaces = NorwaySeed.activities(trip.id);
    for (final place in actPlaces) {
      await _db.into(_db.placesTable).insert(PlacesTableCompanion.insert(
        id:          place.id,
        tripId:      place.tripId,
        name:        place.name,
        category:    place.category.name,
        latitude:    place.latitude,
        longitude:   place.longitude,
        source:      const Value('manual'),
        description: Value(place.description),
        notes:       Value(place.notes),
        photoUrls:   const Value('[]'),
        isOffline:   const Value(true),
        createdAt:   Value(DateTime.now()),
        updatedAt:   Value(DateTime.now()),
      ));
    }

    // 4. Create planning items
    final planSeeds = NorwaySeed.planningItems(trip.id, actPlaces);
    for (final seed in planSeeds) {
      await _db.into(_db.planningItemsTable).insert(
        PlanningItemsTableCompanion.insert(
          id:         const Uuid().v4(),
          tripId:     seed.tripId,
          placeId:    seed.placeId,
          status:     const Value('planned'),
          plannedDate:Value(seed.date),
          priority:   Value(seed.priority),
          createdAt:  Value(DateTime.now()),
        ),
      );
    }
  }
}

// Simple UUID without package for seed
class Uuid {
  const Uuid();
  String v4() {
    final now = DateTime.now().microsecondsSinceEpoch;
    return '${now.toRadixString(16).padLeft(12,'0')}-${(now % 0xFFFF).toRadixString(16).padLeft(4,'0')}-4${(now % 0xFFF).toRadixString(16).padLeft(3,'0')}-${(8 + (now % 4)).toRadixString(16)}${(now % 0xFFF).toRadixString(16).padLeft(3,'0')}-${(now % 0xFFFFFFFFFFFF).toRadixString(16).padLeft(12,'0')}';
  }
}
