import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/places_table.dart';

part 'place_dao.g.dart';

@DriftAccessor(tables: [PlacesTable])
class PlaceDao extends DatabaseAccessor<AppDatabase> with _$PlaceDaoMixin {
  PlaceDao(super.db);

  Stream<List<PlacesTableData>> watchByTrip(String tripId) =>
      (select(placesTable)..where((p) => p.tripId.equals(tripId))).watch();

  Future<List<PlacesTableData>> getByTrip(String tripId) =>
      (select(placesTable)..where((p) => p.tripId.equals(tripId))).get();

  Future<List<PlacesTableData>> getByCategory(String tripId, String category) =>
      (select(placesTable)
        ..where((p) => p.tripId.equals(tripId) & p.category.equals(category)))
          .get();

  Future<PlacesTableData?> getById(String id) =>
      (select(placesTable)..where((p) => p.id.equals(id))).getSingleOrNull();

  Future<void> insert(PlacesTableCompanion entry) =>
      into(placesTable).insert(entry);

  Future<bool> updatePlace(PlacesTableCompanion entry) async =>
      (await (update(placesTable)..where((p) => p.id.equals(entry.id.value))).write(entry)) > 0;

  Future<int> deletePlace(String id) =>
      (delete(placesTable)..where((p) => p.id.equals(id))).go();
}
