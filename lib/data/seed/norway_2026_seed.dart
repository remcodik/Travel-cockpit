import '../../domain/models/trip.dart';
import '../../domain/models/place.dart';
import '../../domain/models/accommodation.dart';
import '../../domain/models/planning_item.dart';

/// Seed data: Noorwegen Zomerreis 2026 (15–30 juni)
/// Gebaseerd op echte reisplanning van Remco.
/// Wordt geladen bij eerste app-start als er geen data is.
class NorwaySeed {

  static Trip get trip => Trip.create(
    name:        'Noorwegen 2026',
    countryCode: 'NO',
    countryFlag: '🇳🇴',
    startDate:   DateTime(2026, 6, 15),
    endDate:     DateTime(2026, 6, 30),
    description: 'Noorwegen Zomerreis 2026 · 15–30 juni · Bergen, Sogndal, Skjåk, Valdres, Gjerstad',
  );

  static List<AccommodationSeedData> accommodations(String tripId) => [
    AccommodationSeedData(
      place: Place.create(
        tripId:      tripId,
        name:        'Sogndal',
        category:    PlaceCategory.accommodation,
        latitude:    61.219,
        longitude:   7.158,
        address:     'Årøyvegen 202, 6857 Sogndal, Norway',
        description: 'Uitvalsbasis voor Lustrafjord, Urnes, Molden en gletsjers.',
      ),
      checkIn:  DateTime(2026, 6, 16),
      checkOut: DateTime(2026, 6, 19),
      order:    1,
      checkInTime:   const Time(hour: 15, minute: 0),
      checkOutTime:  const Time(hour: 11, minute: 0),
    ),
    AccommodationSeedData(
      place: Place.create(
        tripId:      tripId,
        name:        'Skjåk Solside',
        category:    PlaceCategory.accommodation,
        latitude:    61.913,
        longitude:   8.275,
        address:     'Skjåk Solside 799, 2690 Skjåk, Innlandet, Norway',
        description: 'Skjåk is een droog bergdal, handig voor Lom, Dønfoss en Juvasshytta.',
      ),
      checkIn:  DateTime(2026, 6, 19),
      checkOut: DateTime(2026, 6, 23),
      order:    2,
      checkInTime:   const Time(hour: 15, minute: 0),
      checkOutTime:  const Time(hour: 11, minute: 0),
    ),
    AccommodationSeedData(
      place: Place.create(
        tripId:      tripId,
        name:        'Valdres / Noord-Aurdal',
        category:    PlaceCategory.accommodation,
        latitude:    60.985,
        longitude:   9.236,
        address:     'Førsøddin 30, 2920 Leira i Valdres, Innlandet, Norway',
        description: 'Valdres: Bygdin, Besseggen, Mjølkevegen en rustige bergwegen.',
      ),
      checkIn:  DateTime(2026, 6, 23),
      checkOut: DateTime(2026, 6, 27),
      order:    3,
      checkInTime:   const Time(hour: 14, minute: 0),
      checkOutTime:  const Time(hour: 11, minute: 0),
    ),
    AccommodationSeedData(
      place: Place.create(
        tripId:      tripId,
        name:        'Gjerstad',
        category:    PlaceCategory.accommodation,
        latitude:    58.880,
        longitude:   9.020,
        address:     'Løyteveien 14, 4980 Gjerstad, Agder, Norway',
        description: 'Rustige stop richting Sørlandet en ferry. Risør is de beste avondoptie.',
      ),
      checkIn:  DateTime(2026, 6, 27),
      checkOut: DateTime(2026, 6, 29),
      order:    4,
      checkInTime:   const Time(hour: 14, minute: 0),
      checkOutTime:  const Time(hour: 10, minute: 0),
    ),
  ];

  static List<Place> activities(String tripId) => [
    // ── Sogndal ──────────────────────────────────────────
    Place.create(
      tripId:      tripId,
      name:        'Molden hike',
      category:    PlaceCategory.activity,
      latitude:    61.333,
      longitude:   7.313,
      source:      PlaceSource.manual,
      description: 'Uitzichtwandeling boven Lustrafjord. ±7 km · 3–4 uur · gemiddeld. Mooie hoofdactiviteit bij goed weer.',
      notes:       'Gedaan op 18 juni. Highlight van Sogndal.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Solvorn',
      category:    PlaceCategory.activity,
      latitude:    61.293,
      longitude:   7.244,
      description: 'Fjorddorpje met houten huizen, haven en ferry naar Urnes. 1–2 uur · makkelijk.',
      notes:       'Combineren met Urnes Stavkerk en Bøyabreen.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Urnes Stavkerk',
      category:    PlaceCategory.activity,
      latitude:    61.298,
      longitude:   7.323,
      description: 'UNESCO-staafkerk. Beste als rustige fjorddag met Solvorn. 1–2 uur · makkelijk.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Bøyabreen gletsjer',
      category:    PlaceCategory.activity,
      latitude:    61.483,
      longitude:   6.813,
      description: 'Korte gletsjerstop met veel resultaat. 30–60 min · makkelijk. Goede keuze zonder lange rit.',
    ),
    // ── Skjåk ─────────────────────────────────────────────
    Place.create(
      tripId:      tripId,
      name:        'Lom centrum',
      category:    PlaceCategory.activity,
      latitude:    61.837,
      longitude:   8.568,
      description: 'Rustig rondwandelen in Lom. Goede basis voor koffie, lunch en staafkerk.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Bakeriet i Lom',
      category:    PlaceCategory.cafe,
      latitude:    61.837,
      longitude:   8.567,
      description: 'Bekende bakkerij en beste koffie/lunchstop in Lom. Kan druk zijn, de moeite waard.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Lom Stavkyrkje',
      category:    PlaceCategory.activity,
      latitude:    61.837,
      longitude:   8.568,
      description: 'Historische staafkerk midden in Lom. Logisch te combineren met Bakeriet. 30–45 min.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Klimapark 2469 / Mimisbrunnr',
      category:    PlaceCategory.activity,
      latitude:    61.677,
      longitude:   8.367,
      description: 'Topervaring met ijstunnel/permafrost bij Juvasshytta. ±3 uur tour · begeleid. Ticket vooraf boeken.',
      notes:       'Gedaan op 21 juni. Absoluut een hoogtepunt.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Vegaskjelet rondtocht',
      category:    PlaceCategory.activity,
      latitude:    61.839,
      longitude:   8.569,
      description: 'Rondwandeling vanuit Lom Stavkyrkje. ±4–6 km · 1,5–2,5 uur · makkelijk.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Dønfoss',
      category:    PlaceCategory.activity,
      latitude:    61.928,
      longitude:   8.083,
      description: 'Waterval/rivierstop dichtbij Skjåk. 30–60 min · makkelijk. Logisch als rustige natuurdag.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Gjelbrue / Tundragjelet',
      category:    PlaceCategory.activity,
      latitude:    61.920,
      longitude:   8.070,
      description: 'Kloof/rivierwandeling. ±1–2 uur · middel. Combineert goed met Dønfoss.',
    ),
    // ── Valdres ─────────────────────────────────────────────
    Place.create(
      tripId:      tripId,
      name:        'Besseggen',
      category:    PlaceCategory.activity,
      latitude:    61.492,
      longitude:   8.810,
      description: 'Topwandeling Noorwegen. 14–18 km · 6–8 uur · zwaar. Alleen bij stabiel weer.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Bygdin / M/S Bitihorn',
      category:    PlaceCategory.activity,
      latitude:    61.370,
      longitude:   8.813,
      description: 'Bergmeerboot en hooglandervaring. 2–4 uur · makkelijk. Check tijden vooraf.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Mjølkevegen',
      category:    PlaceCategory.activity,
      latitude:    61.100,
      longitude:   9.000,
      description: 'Mooie fiets-/stølsroute. Halve dag · middel. Kies compact deeltraject.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Gomobu – Snøhetta-top',
      category:    PlaceCategory.activity,
      latitude:    60.938,
      longitude:   9.245,
      description: 'Rondwandeling vanaf Gomobu Fjellstue naar Snøhetta-top (1127 m). 2–3 uur · middel.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Syndin / Bergsjøområdet',
      category:    PlaceCategory.activity,
      latitude:    61.115,
      longitude:   8.892,
      description: 'Lokale bergmeren en rustige wandelopties. 2–4 uur · makkelijk-middel. Minder massaal dan Besseggen.',
    ),
    // ── Gjerstad ──────────────────────────────────────────
    Place.create(
      tripId:      tripId,
      name:        'Solhomfjell',
      category:    PlaceCategory.activity,
      latitude:    58.970,
      longitude:   8.995,
      description: 'Mooie wandeling in bos/berglandschap bij Gjerstad. ±11 km · 3 uur · middel.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Risør',
      category:    PlaceCategory.activity,
      latitude:    58.720,
      longitude:   9.234,
      description: 'Wit kustplaatsje met haven. 2–3 uur · makkelijk. Beste avond/middagstop bij Gjerstad.',
    ),
    Place.create(
      tripId:      tripId,
      name:        'Tvedestrand',
      category:    PlaceCategory.activity,
      latitude:    58.622,
      longitude:   8.930,
      description: 'Rustiger kustplaatsje voor koffie en havenwandeling. 1–2 uur · makkelijk.',
    ),
  ];

  /// Planning items met datums en statussen uit de echte reisplanning.
  static List<PlanningItemSeed> planningItems(
      String tripId, List<Place> places) {
    Place? find(String name) {
      try {
        return places.firstWhere(
            (p) => p.name.toLowerCase().contains(name.toLowerCase()));
      } catch (_) {
        return null;
      }
    }

    final seeds = <PlanningItemSeed>[];

    void add(String name, String status, {DateTime? date, int priority = 99}) {
      final p = find(name);
      if (p == null) return;
      seeds.add(PlanningItemSeed(
        tripId:   tripId,
        placeId:  p.id,
        status:   status,
        date:     date,
        priority: priority,
      ));
    }

    // Gedaan (done)
    add('Molden',     'completed', date: DateTime(2026,6,18), priority: 1);
    add('Solvorn',    'completed', date: DateTime(2026,6,19), priority: 1);
    add('Urnes',      'completed', date: DateTime(2026,6,19), priority: 2);
    add('Bøyabreen',  'completed', date: DateTime(2026,6,19), priority: 3);
    add('Lom centrum','completed', date: DateTime(2026,6,20), priority: 1);
    add('Bakeriet',   'completed', date: DateTime(2026,6,20), priority: 2);
    add('Lom Stavkyrkje', 'completed', date: DateTime(2026,6,20), priority: 3);
    add('Klimapark',  'completed', date: DateTime(2026,6,21), priority: 1);
    add('Vegaskjelet','completed', date: DateTime(2026,6,21), priority: 2);

    // Gepland (planned)
    add('Dønfoss',    'planned', date: DateTime(2026,6,22), priority: 1);
    add('Gjelbrue',   'planned', date: DateTime(2026,6,22), priority: 2);

    // Nog te plannen (todo)
    add('Besseggen',  'planned');
    add('Bygdin',     'planned');
    add('Mjølkevegen','planned');
    add('Gomobu',     'planned', date: DateTime(2026,6,24), priority: 1);
    add('Syndin',     'planned', date: DateTime(2026,6,24), priority: 2);
    add('Solhomfjell','planned');
    add('Risør',      'planned');
    add('Tvedestrand','planned');

    return seeds;
  }
}

/// Helper classes for seed data
class AccommodationSeedData {
  final Place place;
  final DateTime checkIn;
  final DateTime checkOut;
  final int order;
  final Time? checkInTime;
  final Time? checkOutTime;

  const AccommodationSeedData({
    required this.place,
    required this.checkIn,
    required this.checkOut,
    required this.order,
    this.checkInTime,
    this.checkOutTime,
  });
}

class PlanningItemSeed {
  final String tripId;
  final String placeId;
  final String status;
  final DateTime? date;
  final int priority;

  const PlanningItemSeed({
    required this.tripId,
    required this.placeId,
    required this.status,
    this.date,
    this.priority = 99,
  });
}
