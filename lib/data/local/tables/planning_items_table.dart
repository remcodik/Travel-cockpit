import 'package:drift/drift.dart';

class PlanningItemsTable extends Table {
  TextColumn   get id          => text()();
  TextColumn   get tripId      => text()();
  TextColumn   get placeId     => text()();
  TextColumn   get status      => text().withDefault(const Constant('planned'))();
  DateTimeColumn get plannedDate  => dateTime().nullable()();
  IntColumn    get plannedHour    => integer().nullable()();
  IntColumn    get plannedMinute  => integer().nullable()();
  IntColumn    get priority       => integer().nullable()();
  TextColumn   get notes          => text().nullable()();
  DateTimeColumn get completedAt  => dateTime().nullable()();
  DateTimeColumn get createdAt    => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
