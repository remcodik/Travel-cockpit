import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

import 'tables/trips_table.dart';
import 'tables/places_table.dart';
import 'tables/accommodations_table.dart';
import 'tables/planning_items_table.dart';
import 'daos/trip_dao.dart';
import 'daos/place_dao.dart';
import 'daos/accommodation_dao.dart';
import 'daos/planning_dao.dart';

part 'database.g.dart';

@DriftDatabase(
  tables: [
    TripsTable,
    PlacesTable,
    AccommodationsTable,
    PlanningItemsTable,
  ],
  daos: [
    TripDao,
    PlaceDao,
    AccommodationDao,
    PlanningDao,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) async {
      await m.createAll();
    },
    onUpgrade: (m, from, to) async {
      // Future migrations go here
    },
  );
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir  = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'travel_cockpit.db'));
    return NativeDatabase.createInBackground(file);
  });
}
