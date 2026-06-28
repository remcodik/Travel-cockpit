import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';
import 'place.dart';

part 'accommodation.freezed.dart';
part 'accommodation.g.dart';

/// Accommodation extends Place — DL-003.
/// Not a separate location model, but specialised Place data.
@freezed
class Accommodation with _$Accommodation {
  const factory Accommodation({
    required String id,
    required String placeId,   // → Place.id
    required String tripId,
    required DateTime checkInDate,
    required DateTime checkOutDate,
    required int orderInTrip,
    Time? checkInTime,
    Time? checkOutTime,
    String? confirmationNumber,
    String? contactName,
    String? contactPhone,
    @Default(false) bool isActive,
    DateTime? createdAt,
  }) = _Accommodation;

  factory Accommodation.create({
    required String placeId,
    required String tripId,
    required DateTime checkInDate,
    required DateTime checkOutDate,
    required int orderInTrip,
    String? confirmationNumber,
    String? contactName,
    String? contactPhone,
  }) {
    return Accommodation(
      id: const Uuid().v4(),
      placeId: placeId,
      tripId: tripId,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      orderInTrip: orderInTrip,
      confirmationNumber: confirmationNumber,
      contactName: contactName,
      contactPhone: contactPhone,
      createdAt: DateTime.now(),
    );
  }

  factory Accommodation.fromJson(Map<String, dynamic> json) =>
      _\$AccommodationFromJson(json);
}

/// Simple time value — hours and minutes only.
@freezed
class Time with _$Time {
  const factory Time({
    required int hour,
    required int minute,
  }) = _Time;

  factory Time.fromJson(Map<String, dynamic> json) => _\$TimeFromJson(json);

  factory Time.parse(String s) {
    final parts = s.split(':');
    return Time(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }
}

extension TimeX on Time {
  String get display => '\${hour.toString().padLeft(2,'0')}:\${minute.toString().padLeft(2,'0')}';
}

/// Full accommodation with its Place data — used in UI.
class AccommodationWithPlace {
  final Accommodation accommodation;
  final Place place;

  const AccommodationWithPlace({
    required this.accommodation,
    required this.place,
  });

  String get name       => place.name;
  double get latitude   => place.latitude;
  double get longitude  => place.longitude;
  String? get address   => place.address;
  int get nights        =>
      accommodation.checkOutDate.difference(accommodation.checkInDate).inDays;
  bool get isActive     => accommodation.isActive;
}
