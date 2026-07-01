import 'package:drift/drift.dart';
import '../local/database.dart';
import '../../domain/models/trip.dart';

class TripRepository {
  final AppDatabase _db;
  TripRepository(this._db);

  Stream<List<Trip>> watchAll() =>
      _db.tripDao.watchAll().map((rows) => rows.map(_fromRow).toList());

  Future<List<Trip>> getAll() async {
    final rows = await _db.tripDao.getAll();
    return rows.map(_fromRow).toList();
  }

  Stream<Trip?> watchActive() =>
      _db.tripDao.watchActive().map((r) => r != null ? _fromRow(r) : null);

  Future<Trip?> getActive() async {
    final r = await _db.tripDao.getActive();
    return r != null ? _fromRow(r) : null;
  }

  Future<void> save(Trip trip) async {
    await _db.tripDao.insert(_toCompanion(trip));
  }

  Future<void> setActive(String tripId) =>
      _db.tripDao.setActive(tripId);

  Future<void> delete(String tripId) =>
      _db.tripDao.deleteTrip(tripId);

  Trip _fromRow(TripsTableData r) => Trip(
    id:            r.id,
    name:          r.name,
    countryCode:   r.countryCode,
    countryFlag:   r.countryFlag,
    startDate:     r.startDate,
    endDate:       r.endDate,
    status:        TripStatus.values.firstWhere((s) => s.name == r.status,
                     orElse: () => TripStatus.planned),
    isActive:      r.isActive,
    description:   r.description,
    coverPhotoPath:r.coverPhotoPath,
    createdAt:     r.createdAt,
    updatedAt:     r.updatedAt,
  );

  TripsTableCompanion _toCompanion(Trip t) => TripsTableCompanion.insert(
    id:            t.id,
    name:          t.name,
    countryCode:   t.countryCode,
    countryFlag:   t.countryFlag,
    startDate:     t.startDate,
    endDate:       t.endDate,
    status:        Value(t.status.name),
    isActive:      Value(t.isActive),
    description:   Value(t.description),
    coverPhotoPath:Value(t.coverPhotoPath),
    createdAt:     Value(t.createdAt),
    updatedAt:     Value(t.updatedAt),
  );
}
