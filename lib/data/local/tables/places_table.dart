import 'package:drift/drift.dart';

class PlacesTable extends Table {
  TextColumn   get id             => text()();
  TextColumn   get tripId         => text()();
  TextColumn   get name           => text()();
  TextColumn   get category       => text()();
  RealColumn   get latitude       => real()();
  RealColumn   get longitude      => real()();
  TextColumn   get source         => text().withDefault(const Constant('manual'))();
  TextColumn   get address        => text().nullable()();
  TextColumn   get description    => text().nullable()();
  TextColumn   get websiteUrl     => text().nullable()();
  TextColumn   get phone          => text().nullable()();
  TextColumn   get openingHours   => text().nullable()();
  RealColumn   get rating         => real().nullable()();
  IntColumn    get ratingCount    => integer().nullable()();
  RealColumn   get distanceKm     => real().nullable()();
  TextColumn   get photoUrls      => text().withDefault(const Constant('[]'))();
  TextColumn   get notes          => text().nullable()();
  BoolColumn   get isOffline      => boolean().withDefault(const Constant(true))();
  DateTimeColumn get createdAt    => dateTime().nullable()();
  DateTimeColumn get updatedAt    => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
