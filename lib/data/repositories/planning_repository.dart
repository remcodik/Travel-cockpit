import 'package:drift/drift.dart';
import '../local/database.dart';
import '../../domain/models/planning_item.dart';

class PlanningRepository {
  final AppDatabase _db;
  PlanningRepository(this._db);

  Stream<List<PlanningItem>> watchByTrip(String tripId) =>
      _db.planningDao.watchByTrip(tripId)
          .map((rows) => rows.map(_fromRow).toList());

  Stream<List<PlanningItem>> watchByDate(String tripId, DateTime date) =>
      _db.planningDao.watchByDate(tripId, date)
          .map((rows) => rows.map(_fromRow).toList());

  Future<void> save(PlanningItem item) =>
      _db.planningDao.insert(_toCompanion(item));

  Future<void> markCompleted(String id) =>
      _db.planningDao.updateStatus(id, 'completed');

  Future<void> markPlanned(String id) =>
      _db.planningDao.updateStatus(id, 'planned');

  Future<void> delete(String id) =>
      _db.planningDao.deletePlanningItem(id);

  PlanningItem _fromRow(PlanningItemsTableData r) => PlanningItem(
    id:           r.id,
    tripId:       r.tripId,
    placeId:      r.placeId,
    status:       PlanningStatus.values.firstWhere((s) => s.name == r.status,
                    orElse: () => PlanningStatus.planned),
    plannedDate:  r.plannedDate,
    plannedHour:  r.plannedHour,
    plannedMinute:r.plannedMinute,
    priority:     r.priority,
    notes:        r.notes,
    completedAt:  r.completedAt,
    createdAt:    r.createdAt,
  );

  PlanningItemsTableCompanion _toCompanion(PlanningItem i) =>
      PlanningItemsTableCompanion.insert(
    id:           i.id,
    tripId:       i.tripId,
    placeId:      i.placeId,
    status:       Value(i.status.name),
    plannedDate:  Value(i.plannedDate),
    plannedHour:  Value(i.plannedHour),
    plannedMinute:Value(i.plannedMinute),
    priority:     Value(i.priority),
    notes:        Value(i.notes),
    completedAt:  Value(i.completedAt),
    createdAt:    Value(i.createdAt),
  );
}
