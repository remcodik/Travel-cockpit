// ═══════════════════════════════════════════════════════════
// export.js — Reisdata exporteren als JSON (N6)
// Er is geen account-systeem en Firestore-rules zijn bewust alleen
// schema-validatie, geen echte toegangscontrole — dit is een goedkope
// verzekering tegen dataverlies, geen vervanging daarvan.
// ═══════════════════════════════════════════════════════════

async function exportAllTripsAsJson() {
  const exportData = { exportedAt: new Date().toISOString(), trips: [] };
  for (const trip of AppState.trips) {
    const [accommodations, activities, tickets] = await Promise.all([
      dbLoadAccommodations(trip.id),
      dbLoadActivitiesForTrip(trip.id),
      dbLoadTicketsForTrip(trip.id),
    ]);
    exportData.trips.push({
      id: trip.id,
      name: trip.name,
      country: trip.country,
      countryFlag: trip.countryFlag,
      startDate: trip.startDate ? trip.startDate.toISOString() : null,
      endDate: trip.endDate ? trip.endDate.toISOString() : null,
      isActive: !!trip.isActive,
      accommodations: accommodations || [],
      activities: activities || [],
      // Ticket-foto's staan bewust nooit in Firestore (1MB-limiet, zie
      // dbSaveTicket()) — die staan alleen lokaal op het toestel dat ze
      // uploadde, dus die zitten hier niet in.
      tickets: tickets || [],
    });
  }
  return exportData;
}

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function handleExportAllTrips() {
  showToast('Reisdata verzamelen…');
  try {
    const data = await exportAllTripsAsJson();
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(data, `travel-cockpit-backup-${dateStr}.json`);
    showToast('✓ Backup gedownload');
  } catch (err) {
    console.error('Export mislukt:', err);
    showToast('⚠️ Export mislukt: ' + (err.message || err), 6000);
  }
}
