import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/accommodations_table.dart';

part 'accommodation_dao.g.dart';

@DriftAccessor(tables: [AccommodationsTable])
class AccommodationDao extends DatabaseAccessor<AppDatabase>
    with _$AccommodationDaoMixin {
  AccommodationDao(super.db);

  Stream<List<AccommodationsTableData>> watchByTrip(String tripId) =>
      (select(accommodationsTable)
        ..where((a) => a.tripId.equals(tripId))
        ..orderBy([(a) => OrderingTerm.asc(a.orderInTrip)]))
          .watch();

  Future<List<AccommodationsTableData>> getByTrip(String tripId) =>
      (select(accommodationsTable)
        ..where((a) => a.tripId.equals(tripId))
        ..orderBy([(a) => OrderingTerm.asc(a.orderInTrip)]))
          .get();

  Future<AccommodationsTableData?> getActive(String tripId) =>
      (select(accommodationsTable)
        ..where((a) => a.tripId.equals(tripId) & a.isActive.equals(true)))
          .getSingleOrNull();

  Future<void> insert(AccommodationsTableCompanion entry) =>
      into(accommodationsTable).insert(entry);

  Future<bool> updateAccommodation(AccommodationsTableCompanion entry) async =>
      (await (update(accommodationsTable)..where((a) => a.id.equals(entry.id.value)))
          .write(entry)) > 0;

  Future<void> updateActiveStatus(String tripId, DateTime today) async {
    final all = await getByTrip(tripId);
    for (final a in all) {
      final isActive = !today.isBefore(a.checkInDate) &&
                       today.isBefore(a.checkOutDate);
      await (update(accommodationsTable)..where((t) => t.id.equals(a.id)))
          .write(AccommodationsTableCompanion(isActive: Value(isActive)));
    }
  }

  Future<int> deleteAccommodation(String id) =>
      (delete(accommodationsTable)..where((a) => a.id.equals(id))).go();
}
