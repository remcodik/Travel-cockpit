import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';

part 'place.freezed.dart';
part 'place.g.dart';

/// Place is the central domain object — DL-002.
/// Every physical location in Travel Cockpit is a Place.
enum PlaceCategory {
  @JsonValue('accommodation') accommodation,
  @JsonValue('activity')      activity,
  @JsonValue('restaurant')    restaurant,
  @JsonValue('cafe')          cafe,
  @JsonValue('ev_charging')   evCharging,
  @JsonValue('fuel_station')  fuelStation,
  @JsonValue('supermarket')   supermarket,
  @JsonValue('pharmacy')      pharmacy,
  @JsonValue('parking')       parking,
  @JsonValue('other')         other,
}

enum PlaceSource {
  @JsonValue('manual')        manual,
  @JsonValue('ai')            ai,
  @JsonValue('google_places') googlePlaces,
}

@freezed
class Place with _$Place {
  const factory Place({
    required String id,
    required String tripId,
    required String name,
    required PlaceCategory category,
    required double latitude,
    required double longitude,
    @Default(PlaceSource.manual) PlaceSource source,
    String? address,
    String? description,
    String? websiteUrl,
    String? phone,
    String? openingHours,
    double? rating,
    int? ratingCount,
    double? distanceFromAccommodationKm,
    @Default([]) List<String> photoUrls,
    String? notes,
    @Default(true) bool isOfflineAvailable,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _Place;

  factory Place.create({
    required String tripId,
    required String name,
    required PlaceCategory category,
    required double latitude,
    required double longitude,
    PlaceSource source = PlaceSource.manual,
    String? address,
    String? description,
    String? notes,
  }) {
    return Place(
      id: const Uuid().v4(),
      tripId: tripId,
      name: name,
      category: category,
      latitude: latitude,
      longitude: longitude,
      source: source,
      address: address,
      description: description,
      notes: notes,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  factory Place.fromJson(Map<String, dynamic> json) => _$PlaceFromJson(json);
}

extension PlaceCategoryX on PlaceCategory {
  String get label {
    switch (this) {
      case PlaceCategory.accommodation: return 'Accommodatie';
      case PlaceCategory.activity:      return 'Activiteit';
      case PlaceCategory.restaurant:    return 'Restaurant';
      case PlaceCategory.cafe:          return 'Caf\u00e9';
      case PlaceCategory.evCharging:    return 'Laadstation';
      case PlaceCategory.fuelStation:   return 'Tankstation';
      case PlaceCategory.supermarket:   return 'Supermarkt';
      case PlaceCategory.pharmacy:      return 'Apotheek';
      case PlaceCategory.parking:       return 'Parkeren';
      case PlaceCategory.other:         return 'Overig';
    }
  }

  String get emoji {
    switch (this) {
      case PlaceCategory.accommodation: return '\U0001f3e1';
      case PlaceCategory.activity:      return '\U0001f3d4\ufe0f';
      case PlaceCategory.restaurant:    return '\U0001f37d\ufe0f';
      case PlaceCategory.cafe:          return '\u2615';
      case PlaceCategory.evCharging:    return '\u26a1';
      case PlaceCategory.fuelStation:   return '\u26fd';
      case PlaceCategory.supermarket:   return '\U0001f6d2';
      case PlaceCategory.pharmacy:      return '\U0001f48a';
      case PlaceCategory.parking:       return '\U0001f17f\ufe0f';
      case PlaceCategory.other:         return '\U0001f4cd';
    }
  }
}
