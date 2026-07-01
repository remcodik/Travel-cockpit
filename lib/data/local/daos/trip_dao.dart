import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/trips_table.dart';

part 'trip_dao.g.dart';

@DriftAccessor(tables: [TripsTable])
class TripDao extends DatabaseAccessor<AppDatabase> with _$TripDaoMixin {
  TripDao(super.db);

  // All trips ordered by start date
  Stream<List<TripsTableData>> watchAll() =>
      (select(tripsTable)..orderBy([(t) => OrderingTerm.desc(t.startDate)])).watch();

  Future<List<TripsTableData>> getAll() =>
      (select(tripsTable)..orderBy([(t) => OrderingTerm.desc(t.startDate)])).get();

  // Active trip — only one at a time per DL-004
  Stream<TripsTableData?> watchActive() =>
      (select(tripsTable)..where((t) => t.isActive.equals(true))).watchSingleOrNull();

  Future<TripsTableData?> getActive() =>
      (select(tripsTable)..where((t) => t.isActive.equals(true))).getSingleOrNull();

  Future<void> insert(TripsTableCompanion entry) =>
      into(tripsTable).insert(entry);

  Future<bool> updateTrip(TripsTableCompanion entry) async =>
      (await (update(tripsTable)..where((t) => t.id.equals(entry.id.value))).write(entry)) > 0;

  Future<void> setActive(String tripId) async {
    // Deactivate all first
    await (update(tripsTable)).write(const TripsTableCompanion(isActive: Value(false)));
    // Activate this one
    await (update(tripsTable)..where((t) => t.id.equals(tripId)))
        .write(const TripsTableCompanion(isActive: Value(true)));
  }

  Future<int> deleteTrip(String id) =>
      (delete(tripsTable)..where((t) => t.id.equals(id))).go();
}
