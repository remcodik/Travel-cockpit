import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';

part 'trip.freezed.dart';
part 'trip.g.dart';

enum TripStatus { planned, active, completed }

@freezed
class Trip with _$Trip {
  const factory Trip({
    required String id,
    required String name,
    required String countryCode,
    required String countryFlag,
    required DateTime startDate,
    required DateTime endDate,
    @Default(TripStatus.planned) TripStatus status,
    @Default(false) bool isActive,
    String? description,
    String? coverPhotoPath,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _Trip;

  factory Trip.create({
    required String name,
    required String countryCode,
    required String countryFlag,
    required DateTime startDate,
    required DateTime endDate,
    String? description,
  }) {
    return Trip(
      id: const Uuid().v4(),
      name: name,
      countryCode: countryCode,
      countryFlag: countryFlag,
      startDate: startDate,
      endDate: endDate,
      description: description,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  factory Trip.fromJson(Map<String, dynamic> json) => _$TripFromJson(json);
}
