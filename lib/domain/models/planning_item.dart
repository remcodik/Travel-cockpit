import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';
import 'place.dart';

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
    required String placeId,   // → Place.id
    @Default(PlanningStatus.planned) PlanningStatus status,
    DateTime? plannedDate,
    int? plannedHour,
    int? plannedMinute,
    int? priority,
    String? notes,
    DateTime? completedAt,
    DateTime? createdAt,
  }) = _PlanningItem;

  factory PlanningItem.create({
    required String tripId,
    required String placeId,
    DateTime? plannedDate,
    int? priority,
    String? notes,
  }) {
    return PlanningItem(
      id: const Uuid().v4(),
      tripId: tripId,
      placeId: placeId,
      plannedDate: plannedDate,
      priority: priority,
      notes: notes,
      createdAt: DateTime.now(),
    );
  }

  factory PlanningItem.fromJson(Map<String, dynamic> json) =>
      _\$PlanningItemFromJson(json);
}

/// Planning item with its Place — used in UI.
class PlanningItemWithPlace {
  final PlanningItem item;
  final Place place;
  const PlanningItemWithPlace({required this.item, required this.place});

  bool get isCompleted => item.status == PlanningStatus.completed;
  bool get isPlanned   => item.status == PlanningStatus.planned;
  String get name      => place.name;
  String get emoji     => place.category.emoji;
}
