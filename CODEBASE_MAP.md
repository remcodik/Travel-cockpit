# Codebase Map — Travel-cockpit

Gegenereerd door `map_codebase.py`. 0 Python-bestand(en), 21 JS/TS-bestand(en).


## JavaScript / TypeScript

### `api/charging-stations.js`


**Functies:**
- `handler(req, res)`
- `fetchStationsNear(lat, lng, distanceKm, apiKey)`

**Default export:** `async`

### `api/suggestions.js`


**Functies:**
- `handler(req, res)`

**Default export:** `async`

### `js/charging.js`


**Functies:**
- `openGoogleMapsPlace(name, lat, lng)`
- `fetchChargingStationsNear(lat, lng, distanceKm)`
- `fetchChargingStationsAlongRoute()`
- `isDcStation(station)`
- `renderChargingStationCard(station)`
- `openChargingStationsSheet()`
- `handleSearchChargingAlongRoute()`
- `setChargingFilter(filter)`
- `setChargingFilterChips(filter)`
- `renderChargingList()`

### `js/data.js`


### `js/export.js`


**Functies:**
- `exportAllTripsAsJson()`
- `downloadJsonFile(data, filename)`
- `handleExportAllTrips()`

### `js/firebase.js`


**Functies:**
- `onDbReady(fn)`
- `initFirebase()`
- `tripRef(collection)`
- `getCurrentTripId()`
- `setCurrentTripId(newTripId)`
- `getTripShareUrl()`
- `copyTripShareUrl()`
- `dbSaveActivity(activity)`
- `dbDeleteActivity(id)`
- `dbLoadActivities()`
- `dbWatchActivities(callback)`
- `dbSaveTicket(ticket)`
- `dbDeleteTicket(ticketId)`
- `dbLoadTickets()`
- `dbWatchTickets(callback)`
- `dbSaveAiSuggestions(accId, suggestions)`
- `dbLoadAiSuggestions(accId)`
- `allTripsRef()`
- `dbLoadAllTrips()`
- `dbWatchAllTrips(callback)`
- `dbSaveTripMeta(trip)`
- `dbSetActiveTrip(newActiveTripId, allTripIds)`
- `dbDeleteTripMeta(tripIdToDelete)`
- `dbLoadActivitiesForTrip(forTripId)`
- `dbLoadTicketsForTrip(forTripId)`
- `dbLoadAccommodations(forTripId)`
- `dbSaveAccommodation(forTripId, acc)`
- `dbDeleteAccommodation(forTripId, accId)`

### `js/gps.js`


**Functies:**
- `isGpsActive()`
- `startGpsTracking(screenId, onUpdate, onStop)`
- `stopGpsTracking()`
- `stopGpsIfLeavingOwner(newScreenId)`
- `updateGpsIndicator()`

### `js/navigation.js`


**Functies:**
- `showToast(message, duration, onAction)`
- `navigateTo(screenId)`
- `goBack()`
- `closeSheet(sheetId)`
- `openSheet(sheetId)`

### `js/notes.js`


**Functies:**
- `dbSaveNote(type, contextId, text)`
- `dbLoadNote(type, contextId)`
- `openNoteScreen(type, contextId, title)`
- `renderNotesScreen()`
- `handleNoteInput()`
- `saveCurrentNote()`
- `saveNoteAndGoBack()`
- `getNotePreviewSync(type, contextId)`
- `renderNoteButton(type, contextId, title, color)`

### `js/offline.js`


**Functies:**
- `updateOfflineBanner()`
- `recalculateTopBannerSpace()`
- `showSwUpdateBanner(worker)`
- `applySwUpdate()`

### `js/screen-accommodation.js`


**Functies:**
- `renderAccommodationScreen(accId)`
- `openMapsForAccommodation(accId)`
- `openEditAccommodationSheet(accId)`
- `openAddAccommodationSheet()`
- `readAccommodationFormFields()`
- `saveAccommodationEdit(accId)`
- `saveAccommodationCreate()`
- `openDeleteAccommodationSheet(accId)`
- `confirmDeleteAccommodation(accId, alsoDeleteActivities)`

### `js/screen-discover.js`


**Functies:**
- `getDiscoverBaseLocation(acc)`
- `openDiscoverNearActivity(act)`
- `renderDiscoverScreen()`
- `updateDiscoverHeader(acc)`
- `loadCachedSuggestions(acc)`
- `saveSuggestionsToCache(accId, suggestions)`
- `setDiscoverMode(mode, btnEl)`
- `setDiscoverFilter(chipEl, category)`
- `handleLoadMoreSuggestions()`
- `updateRefreshButtonState()`
- `showLoadingState()`
- `showOfflineState()`
- `showErrorState(message)`
- `showEmptyDiscoverState(title, sub)`
- `renderSuggestionList()`
- `renderSuggestionCard(suggestion, acc)`
- `openRouteOptionsSheet(name, mapsQuery)`
- `handleAddSuggestion(name, accId, category)`

### `js/screen-home.js`


**Functies:**
- `renderHomeScreen()`
- `renderTripPhaseBanner()`
- `renderActivityRow(act, index, total)`
- `renderElevationTag(elevation, color)`
- `checkmarkSvg()`
- `escapeHtml(str)`
- `handleToggleActivity(id)`

### `js/screen-map.js`


**Functies:**
- `initMap()`
- `reportMapError(e)`
- `renderMapFilterChips()`
- `renderMapMarkers()`
- `renderPdHero(act, acc)`
- `setMapFilter(accId)`
- `toggleFullRoute()`
- `toggleGPS()`

### `js/screen-planning.js`


**Functies:**
- `renderPlanningScreen()`
- `togglePlanningFilter(btn)`
- `buildDayTabs()`
- `selectPlanningDay(isoString)`
- `renderPlanningDay()`
- `renderPlanningActivityRow(act, index, total)`
- `renderUnscheduledRow(act, index, total)`
- `openActivityDetailSheet(id)`
- `openEditActivitySheet(id)`
- `saveActivityEdit(id)`
- `openMoveActivitySheet(id)`
- `saveMoveActivity(id)`
- `handleDeleteActivity(id)`
- `openAiEnrichSheet(id)`
- `applyAiEnrichment(id, enriched)`
- `openAddActivitySheetForCurrentDay()`
- `openAddActivitySheet()`
- `setActivityCategory(chipEl, category)`
- `saveActivity()`

### `js/screen-roadtrip.js`


**Functies:**
- `renderRoadtripScreen()`
- `toggleRoadtripGPS()`
- `openMapsForCoords(lat, lng, label)`
- `toggleRoadtripMiniMap()`

### `js/screen-tickets.js`


**Functies:**
- `renderTicketsScreen()`
- `renderTicketRow(ticket, isArchived)`
- `renderTicketFilePreview(ticket)`
- `handleRemoveTicket(ticketId)`
- `handleArchiveTicket(ticketId)`
- `handleUnarchiveTicket(ticketId)`
- `openAddTicketSheet()`
- `openEditTicketSheet(ticketId)`
- `handleTicketFileSelect(input)`
- `updateTicketFileUploadUI()`
- `resetTicketFileUpload()`
- `saveTicket()`
- `renderTripsScreen()`
- `renderTripCard(trip, isActive)`
- `openEditTripSheet(tripId)`
- `saveTripEdit(tripId)`
- `handleActivateTrip(tripId)`
- `handleDeleteTrip(tripId, name)`
- `openPickActiveTripSheet()`
- `handlePickActiveTrip(tripId)`
- `openAddTripSheet()`
- `renderTripAccommodationFields()`
- `addAnotherTripAccommodation()`
- `saveTrip()`
- `renderSettingsScreen()`
- `setSwitchState(switchEl, on)`
- `selectVehicleType(type)`
- `toggleTravelStyle(chipEl, style)`
- `toggleAiEnabled(switchEl)`
- `toggleWeatherSuggestions(switchEl)`
- `setLanguage(chipEl, lang)`

### `js/state.js`


**Functies:**
- `loadSettingsFromStorage()`
- `saveSettingsToStorage()`
- `getToday()`
- `getTripPhase()`
- `getDayNumber(date)`
- `getAccommodationForDate(date)`
- `getActiveAccommodation()`
- `getAllTripDays()`
- `formatShortDate(date)`
- `getNextAccommodation(currentAccId)`
- `getActivitiesForDate(date)`
- `getUnscheduledForAccommodation(accId)`
- `idsMatch(a, b)`
- `toggleActivityStatus(id)`
- `addActivity({ name, accId, date, emoji = '📍', desc = '', level = 'Makkelijk' })`
- `updateActivity(id, changes)`
- `deleteActivity(id)`
- `getProgress()`
- `getActiveTrip()`
- `applyTripData(trip, accommodations)`
- `switchToTrip(tripId)`
- `createTrip({ name, country, countryFlag, startDate, endDate, accommodations })`
- `updateTripMeta(tripId, changes)`
- `deleteTrip(tripId)`
- `createAccommodationForTrip(fields)`
- `updateAccommodation(accId, changes)`
- `recalculateTripDates()`
- `deleteAccommodationWithChoice(accId, alsoDeleteActivities)`
- `startFirebaseSync()`
- `updateMeerSummary()`
- `refreshAllScreens()`
- `initAppState()`

### `js/topo.js`


**Functies:**
- `seededRandom(seed)`
- `generateTopoLines(seed, elevationM)`
- `topoSeedForLocation(lat, lng, elevationM)`
- `initAllTopoPanels()`

### `js/weather.js`


**Functies:**
- `describeWeatherCode(code)`
- `weatherCacheKey(lat, lng)`
- `fetchWeatherForLocation(lat, lng)`
- `getWeatherForDate(lat, lng, date)`
- `formatISODate(date)`
- `fillWeatherBadge(containerId, lat, lng, date)`
- `fillRoadtripWeather(lat, lng, date)`
- `fillWeatherStrip(containerId, lat, lng, days = 5)`
- `showWeatherDetailForActiveAccommodation()`

### `sw.js`



## Samenvatting

- Bestanden geanalyseerd: 21
- Classes totaal: 0
- Functies totaal: 208

---
*Gebruik dit rapport als eerste oriëntatie. Lees pas de ruwe bestanden als je details nodig hebt die hier niet in staan.*