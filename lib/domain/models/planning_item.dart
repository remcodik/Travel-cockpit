import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';

part 'planning_item.freezed.dart';
part 'planning_item.g.dart';

/// Only confirmed decisions are in planning — DL-006.
enum PlanningStatus {
  @JsonValue('planned')     planned,
  @JsonValue('in_progress') inProgress,
  @JsonValue('completed')   completed,
  @JsonValue('skipped')     skipped,
  @JsonValue('cancelled')   cancelled,
}

@freezed
class PlanningItem with _$PlanningItem {
  const factory PlanningItem({
    required String id,
    required String tripId,
    required String placeId,
    @Default(PlanningStatus.planned) PlanningStatus status,
    DateTime? plannedDate,
    int? plannedHour,
    int? plannedMinute,
    int? priority,
    String? notes,
    DateTime? completedAt,
    DateTime? createdAt,
  }) = _PlanningItem;

  const PlanningItem._();

  bool get isCompleted => status == PlanningStatus.completed;
  bool get isPlanned   => status == PlanningStatus.planned;
  bool get isActive    => status == PlanningStatus.inProgress;

  factory PlanningItem.create({
    required String tripId,
    required String placeId,
    DateTime? plannedDate,
    int? priority,
    String? notes,
  }) {
    return PlanningItem(
      id:          const Uuid().v4(),
      tripId:      tripId,
      placeId:     placeId,
      plannedDate: plannedDate,
      priority:    priority,
      notes:       notes,
      createdAt:   DateTime.now(),
    );
  }

  factory PlanningItem.fromJson(Map<String, dynamic> json) =>
      _\$PlanningItemFromJson(json);
}
