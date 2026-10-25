// ── Config ─────────────────────────────────────────
const TAG_LABELS = {
  connect: '<i class="iconoir-community"></i> Connect',
  serve:   '<i class="iconoir-hand-card"></i> Serve',
  play:    '<i class="iconoir-music-double-note"></i> Play',
  awe:     '<i class="iconoir-sparks"></i> Awe',
};

const filters = { sf: 'all' };
let _events = { events: [], standing: [] };

// ── Date utils ─────────────────────────────────────
function getWeekBounds() {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay()); // Sunday
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function parseDate(str) {
  return new Date(str + 'T12:00:00');
}

function formatDate(str) {
  return parseDate(str).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')}${suffix}` : `${h12}${suffix}`;
}

function isFutureOrToday(dateStr) {
  const d = parseDate(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
}

// ── Week label ─────────────────────────────────────
function renderWeekLabel() {
  const { start, end } = getWeekBounds();
  const opts = { month: 'short', day: 'numeric' };
  const label = `Week of ${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  document.getElementById('week-label').textContent = label;
}

// ── SF events ──────────────────────────────────────
function costTag(e) {
  if (e.cost === 0) return `<span class="tag free">Free</span>`;
  if (e.cost <= 20) return `<span class="tag cheap">$${e.cost}</span>`;
  return `<span class="tag paid">$${e.cost}</span>`;
}

function tagChips(tags) {
  return tags.map(t => `<span class="tag generic">${TAG_LABELS[t] || t}</span>`).join('');
}

function matchesTag(item) {
  return filters.sf === 'all' || (item.tags || []).includes(filters.sf);
}

function renderSF() {
  const body = document.getElementById('sf-body');
  const standing = document.getElementById('sf-standing');
  document.getElementById('sf-updated').textContent = _events.updated ? `updated ${_events.updated}` : '';

  const upcoming = (_events.events || [])
    .filter(e => isFutureOrToday(e.date) && matchesTag(e))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  if (upcoming.length === 0) {
    body.innerHTML = `<p class="empty">No upcoming events${filters.sf === 'all' ? '' : ' with this tag'}. Check the anytime list below.</p>`;
  } else {
    const byDate = {};
    upcoming.forEach(e => { (byDate[e.date] = byDate[e.date] || []).push(e); });
    body.innerHTML = Object.entries(byDate).map(([date, evs], i) => `
      <div class="event-group${i ? ' event-group--sep' : ''}">
        <h3>${formatDate(date)}</h3>
        <div class="card-grid">
          ${evs.map(e => `
            <a class="item-card" href="${e.url}" target="_blank" rel="noopener">
              <div class="item-card-header">
                <span class="item-title">${e.title}</span>
                <span class="item-time">${formatTime(e.time)}</span>
              </div>
              <div class="item-org">${e.venue} · ${e.neighborhood}</div>
              <div class="item-desc">${e.description}</div>
              <div class="item-tags">${costTag(e)}${tagChips(e.tags)}${e.cost_notes && e.cost_notes !== 'Free' ? `<span class="tag note">${e.cost_notes}</span>` : ''}</div>
            </a>`).join('')}
        </div>
      </div>
    `).join('');
  }

  const anytime = (_events.standing || []).filter(matchesTag);
  standing.innerHTML = anytime.length ? anytime.map(s => `
    <a class="item-card" href="${s.url}" target="_blank" rel="noopener">
      <div class="item-card-header">
        <span class="item-title">${s.title}</span>
        <span class="item-time">${s.when}</span>
      </div>
      <div class="item-desc">${s.description}</div>
      <div class="item-tags">${tagChips(s.tags)}</div>
    </a>`).join('') : `<p class="empty">Nothing here with this tag.</p>`;
}

// ── Filters ────────────────────────────────────────
function setFilter(section, value) {
  filters[section] = value;
  document.querySelectorAll(`#${section}-filter .sfilt-btn`).forEach(b => {
    b.classList.toggle('active', b.dataset.filter === value);
  });
  if (section === 'sf') renderSF();
}

function setupFilters() {
  ['sf'].forEach(section => {
    document.querySelectorAll(`#${section}-filter .sfilt-btn`).forEach(btn => {
      btn.addEventListener('click', () => setFilter(section, btn.dataset.filter));
    });
  });
}

// ── Init ───────────────────────────────────────────
async function loadEvents() {
  try {
    const res = await fetch('data/sf-events.json');
    if (res.ok) _events = await res.json();
  } catch (e) {
    console.warn('Could not load SF events', e);
  }
}

async function init() {
  renderWeekLabel();
  setupFilters();
  await loadEvents();
  renderSF();
}

document.addEventListener('DOMContentLoaded', init);
