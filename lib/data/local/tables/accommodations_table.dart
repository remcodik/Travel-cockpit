import 'package:drift/drift.dart';

class AccommodationsTable extends Table {
  TextColumn   get id                  => text()();
  TextColumn   get placeId             => text()();
  TextColumn   get tripId              => text()();
  DateTimeColumn get checkInDate       => dateTime()();
  DateTimeColumn get checkOutDate      => dateTime()();
  IntColumn    get orderInTrip         => integer()();
  IntColumn    get checkInHour         => integer().nullable()();
  IntColumn    get checkInMinute       => integer().nullable()();
  IntColumn    get checkOutHour        => integer().nullable()();
  IntColumn    get checkOutMinute      => integer().nullable()();
  TextColumn   get confirmationNumber  => text().nullable()();
  TextColumn   get contactName         => text().nullable()();
  TextColumn   get contactPhone        => text().nullable()();
  BoolColumn   get isActive            => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt         => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
