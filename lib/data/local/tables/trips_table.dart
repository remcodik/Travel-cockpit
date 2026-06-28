import 'package:drift/drift.dart';

class TripsTable extends Table {
  TextColumn  get id          => text()();
  TextColumn  get name        => text()();
  TextColumn  get countryCode => text()();
  TextColumn  get countryFlag => text()();
  DateTimeColumn get startDate => dateTime()();
  DateTimeColumn get endDate   => dateTime()();
  TextColumn  get status      => text().withDefault(const Constant('planned'))();
  BoolColumn  get isActive    => boolean().withDefault(const Constant(false))();
  TextColumn  get description => text().nullable()();
  TextColumn  get coverPhotoPath => text().nullable()();
  DateTimeColumn get createdAt => dateTime().nullable()();
  DateTimeColumn get updatedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
