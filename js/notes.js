// ═══════════════════════════════════════════════════════════
// notes.js — Notities voor dag, verblijf en activiteit
// Persistent opgeslagen in Firestore, gedeeld via reislink.
// Bewerkscherm opent als apart (full-screen) scherm zodat
// typen op de telefoon comfortabel is zonder kleine sheet.
// ═══════════════════════════════════════════════════════════

// ── Firestore helpers ─────────────────────────────────────
// Elke notitie heeft een type ('day'/'accommodation'/'activity')
// en een context-ID (datumstring/accId/activityId) als sleutel.

async function dbSaveNote(type, contextId, text) {
  const ref = tripRef('notes');
  if (!ref) {
    // Offline fallback: localStorage
    try {
      localStorage.setItem(`tc_note_${type}_${contextId}`, JSON.stringify({ text, savedAt: Date.now() }));
    } catch (e) {}
    return;
  }
  const docId = `${type}_${String(contextId).replace(/[^a-zA-Z0-9-]/g, '_')}`;
  try {
    if (text.trim() === '') {
      await ref.doc(docId).delete();
      try { localStorage.removeItem(`tc_note_${type}_${contextId}`); } catch (e) {}
    } else {
      await ref.doc(docId).set({
        type, contextId: String(contextId), text,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      try { localStorage.setItem(`tc_note_${type}_${contextId}`, JSON.stringify({ text, savedAt: Date.now() })); } catch (e) {}
    }
  } catch (err) {
    console.error('Notitie opslaan mislukt:', err);
    try { localStorage.setItem(`tc_note_${type}_${contextId}`, JSON.stringify({ text, savedAt: Date.now() })); } catch (e) {}
  }
}

async function dbLoadNote(type, contextId) {
  const ref = tripRef('notes');
  const docId = `${type}_${String(contextId).replace(/[^a-zA-Z0-9-]/g, '_')}`;

  // Probeer Firestore
  if (ref) {
    try {
      const doc = await ref.doc(docId).get();
      if (doc.exists) return doc.data().text || '';
    } catch (err) {
      console.error('Notitie laden mislukt (Firestore):', err);
    }
  }

  // Fallback naar localStorage
  try {
    const raw = localStorage.getItem(`tc_note_${type}_${contextId}`);
    if (raw) return JSON.parse(raw).text || '';
  } catch (e) {}
  return '';
}

// ── Notitie-scherm (apart bewerkscherm) ───────────────────
// Staat: welke notitie wordt nu bewerkt
let _noteType = null;
let _noteContextId = null;
let _noteTitle = '';
let _noteSaveTimer = null;

// Opent het notitie-bewerkscherm voor een dag, verblijf of activiteit.
// type: 'day' | 'accommodation' | 'activity'
// contextId: datumstring (ISO) | accId | activityId
// title: de naam die bovenaan het scherm verschijnt
async function openNoteScreen(type, contextId, title) {
  _noteType = type;
  _noteContextId = contextId;
  _noteTitle = title;

  document.getElementById('note-screen-title').textContent = title;
  document.getElementById('note-textarea').value = 'Laden…';
  document.getElementById('note-screen-title').textContent = title;

  const savedEl = document.getElementById('note-saved-indicator');
  if (savedEl) savedEl.textContent = '';

  navigateTo('notes');

  const existing = await dbLoadNote(type, contextId);
  document.getElementById('note-textarea').value = existing;
  document.getElementById('note-textarea').focus();
}

function renderNotesScreen() {
  // Scherm is al correct gevuld door openNoteScreen()
  // Alleen de terugknop-label bijwerken
  const backLabel = document.getElementById('note-back-label');
  if (backLabel) {
    const labels = {
      day: 'Dag',
      accommodation: 'Verblijf',
      activity: 'Activiteit',
    };
    backLabel.textContent = labels[_noteType] || 'Terug';
  }
}

// Automatisch opslaan terwijl de gebruiker typt (debounced, 800ms).
// Expliciete "Opslaan"-knop bestaat ook voor zekerheid.
function handleNoteInput() {
  const savedEl = document.getElementById('note-saved-indicator');
  if (savedEl) savedEl.textContent = '…';
  clearTimeout(_noteSaveTimer);
  _noteSaveTimer = setTimeout(saveCurrentNote, 800);
}

async function saveCurrentNote() {
  if (!_noteType || _noteContextId === null) return;
  const text = document.getElementById('note-textarea').value;
  await dbSaveNote(_noteType, _noteContextId, text);
  const savedEl = document.getElementById('note-saved-indicator');
  if (savedEl) savedEl.textContent = '✓ Opgeslagen';
  setTimeout(() => { if (savedEl) savedEl.textContent = ''; }, 2000);
}

async function saveNoteAndGoBack() {
  await saveCurrentNote();
  goBack();
}

// ── Notitie-preview (één regel, voor in rijen) ─────────────
// Laadt synchroon uit localStorage (snel, geen Firestore-wacht)
// voor gebruik in lijstweergaven.
function getNotePreviewSync(type, contextId) {
  try {
    const raw = localStorage.getItem(`tc_note_${type}_${contextId}`);
    if (!raw) return '';
    const text = JSON.parse(raw).text || '';
    return text.length > 60 ? text.slice(0, 57) + '…' : text;
  } catch (e) {
    return '';
  }
}

// ── Notitie-knop voor in activiteitenrijen ─────────────────
// Kleine ✎-knop die rechtstreeks het notitie-scherm opent voor
// een activiteit, zonder eerst de detail-sheet te openen.
function renderNoteButton(type, contextId, title, color) {
  const hasNote = !!getNotePreviewSync(type, contextId);
  return `<button onclick="event.stopPropagation();openNoteScreen('${type}','${String(contextId)}','${escapeHtml(title).replace(/'/g, "\\'")}')"
    style="width:30px;height:30px;border-radius:8px;border:1.5px solid ${hasNote ? color : 'var(--line)'};background:${hasNote ? color + '15' : 'transparent'};cursor:pointer;font-size:13px;color:${hasNote ? color : 'var(--ink-faint)'};flex-shrink:0;display:flex;align-items:center;justify-content:center"
    title="Notitie">✎</button>`;
}
