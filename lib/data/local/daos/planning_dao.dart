import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/planning_items_table.dart';

part 'planning_dao.g.dart';

@DriftAccessor(tables: [PlanningItemsTable])
class PlanningDao extends DatabaseAccessor<AppDatabase>
    with _$PlanningDaoMixin {
  PlanningDao(super.db);

  Stream<List<PlanningItemsTableData>> watchByTrip(String tripId) =>
      (select(planningItemsTable)
        ..where((p) => p.tripId.equals(tripId))
        ..orderBy([
          (p) => OrderingTerm.asc(p.plannedDate),
          (p) => OrderingTerm.asc(p.priority),
        ]))
          .watch();

  Stream<List<PlanningItemsTableData>> watchByDate(
      String tripId, DateTime date) {
    final start = DateTime(date.year, date.month, date.day);
    final end   = start.add(const Duration(days: 1));
    return (select(planningItemsTable)
      ..where((p) =>
          p.tripId.equals(tripId) &
          p.plannedDate.isBiggerOrEqualValue(start) &
          p.plannedDate.isSmallerThanValue(end)))
        .watch();
  }

  Future<void> insert(PlanningItemsTableCompanion entry) =>
      into(planningItemsTable).insert(entry);

  Future<bool> updateStatus(String id, String status) async =>
      (await (update(planningItemsTable)..where((p) => p.id.equals(id)))
          .write(PlanningItemsTableCompanion(
            status: Value(status),
            completedAt: status == 'completed'
                ? Value(DateTime.now()) : const Value.absent(),
          ))) > 0;

  Future<int> deletePlanningItem(String id) =>
      (delete(planningItemsTable)..where((p) => p.id.equals(id))).go();
}
