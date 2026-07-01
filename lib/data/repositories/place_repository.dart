import 'dart:convert';
import 'package:drift/drift.dart';
import '../local/database.dart';
import '../../domain/models/place.dart';

class PlaceRepository {
  final AppDatabase _db;
  PlaceRepository(this._db);

  Stream<List<Place>> watchByTrip(String tripId) =>
      _db.placeDao.watchByTrip(tripId).map((r) => r.map(_fromRow).toList());

  Future<List<Place>> getByCategory(String tripId, PlaceCategory cat) async {
    final rows = await _db.placeDao.getByCategory(tripId, cat.name);
    return rows.map(_fromRow).toList();
  }

  Future<Place?> getById(String id) async {
    final r = await _db.placeDao.getById(id);
    return r != null ? _fromRow(r) : null;
  }

  Future<void> save(Place place) =>
      _db.placeDao.insert(_toCompanion(place));

  Future<void> delete(String id) =>
      _db.placeDao.deletePlace(id);

  Place _fromRow(PlacesTableData r) => Place(
    id:           r.id,
    tripId:       r.tripId,
    name:         r.name,
    category:     PlaceCategory.values.firstWhere((c) => c.name == r.category,
                    orElse: () => PlaceCategory.other),
    latitude:     r.latitude,
    longitude:    r.longitude,
    source:       PlaceSource.values.firstWhere((s) => s.name == r.source,
                    orElse: () => PlaceSource.manual),
    address:      r.address,
    description:  r.description,
    websiteUrl:   r.websiteUrl,
    phone:        r.phone,
    openingHours: r.openingHours,
    rating:       r.rating,
    ratingCount:  r.ratingCount,
    distanceFromAccommodationKm: r.distanceKm,
    photoUrls:    (jsonDecode(r.photoUrls) as List).cast<String>(),
    notes:        r.notes,
    isOfflineAvailable: r.isOffline,
    createdAt:    r.createdAt,
    updatedAt:    r.updatedAt,
  );

  PlacesTableCompanion _toCompanion(Place p) => PlacesTableCompanion.insert(
    id:          p.id,
    tripId:      p.tripId,
    name:        p.name,
    category:    p.category.name,
    latitude:    p.latitude,
    longitude:   p.longitude,
    source:      Value(p.source.name),
    address:     Value(p.address),
    description: Value(p.description),
    websiteUrl:  Value(p.websiteUrl),
    phone:       Value(p.phone),
    openingHours:Value(p.openingHours),
    rating:      Value(p.rating),
    ratingCount: Value(p.ratingCount),
    distanceKm:  Value(p.distanceFromAccommodationKm),
    photoUrls:   Value(jsonEncode(p.photoUrls)),
    notes:       Value(p.notes),
    isOffline:   Value(p.isOfflineAvailable),
    createdAt:   Value(p.createdAt),
    updatedAt:   Value(p.updatedAt),
  );
}
