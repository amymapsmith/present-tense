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

// ── Theme ──────────────────────────────────────────
// Night is the default; the inline script in index.html applies a saved day choice before paint
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  const render = () => {
    const isDay = document.documentElement.dataset.theme === 'light';
    btn.innerHTML = isDay
      ? '<i class="iconoir-half-moon"></i> Night mode'
      : '<i class="iconoir-sun-light"></i> Day mode';
    btn.setAttribute('aria-pressed', String(isDay));
  };
  btn.addEventListener('click', () => {
    const isDay = document.documentElement.dataset.theme === 'light';
    if (isDay) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = 'light';
    try { localStorage.setItem('theme', isDay ? 'dark' : 'light'); } catch (e) {}
    render();
  });
  render();
}

// ── Add to calendar ────────────────────────────────
const EVENT_TZ = 'America/Los_Angeles';
const DEFAULT_DURATION_MIN = 120; // listings only give a start time

// Minutes east of UTC for EVENT_TZ at a given instant (e.g. -420 for PDT)
function tzOffsetMinutes(instant) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: EVENT_TZ, timeZoneName: 'shortOffset' })
    .formatToParts(instant).find(p => p.type === 'timeZoneName').value; // "GMT-7"
  const m = part.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!m) return 0;
  const h = Number(m[1]);
  return h * 60 + Math.sign(h) * Number(m[2] || 0);
}

// Event date + local SF time → UTC Date
function eventStartUTC(e) {
  const [y, mo, d] = e.date.split('-').map(Number);
  const [h, mi] = (e.time || '00:00').split(':').map(Number);
  const asUTC = Date.UTC(y, mo - 1, d, h, mi);
  return new Date(asUTC - tzOffsetMinutes(new Date(asUTC)) * 60000);
}

function icsStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20261101T010000Z
}

function icsEscape(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

function calendarLinks(e) {
  const start = eventStartUTC(e);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60000);
  const location = `${e.venue}, San Francisco, CA`;
  const details = `${e.description}\n\n${e.url}`;
  const q = encodeURIComponent;

  const google = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + `&text=${q(e.title)}&dates=${icsStamp(start)}/${icsStamp(end)}`
    + `&details=${q(details)}&location=${q(location)}`;

  const outlookParams = `subject=${q(e.title)}&startdt=${q(start.toISOString())}&enddt=${q(end.toISOString())}`
    + `&body=${q(details)}&location=${q(location)}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent`;
  const outlook = `https://outlook.live.com/calendar/0/action/compose?${outlookParams}`;
  const office = `https://outlook.office.com/calendar/0/action/compose?${outlookParams}`;

  const yahoo = `https://calendar.yahoo.com/?v=60&title=${q(e.title)}`
    + `&st=${icsStamp(start)}&et=${icsStamp(end)}&desc=${q(details)}&in_loc=${q(location)}`;

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//present tense//SF events//EN', 'BEGIN:VEVENT',
    `UID:${e.date}-${e.title.replace(/\W+/g, '-').toLowerCase()}@present-tense`,
    `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(e.title)}`, `DESCRIPTION:${icsEscape(details)}`,
    `LOCATION:${icsEscape(location)}`, `URL:${e.url}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const icsHref = `data:text/calendar;charset=utf-8,${q(ics)}`;
  const icsName = `${e.date}-${e.title.replace(/\W+/g, '-').toLowerCase()}.ics`;

  return `
    <div class="item-cal">
      <i class="iconoir-calendar-plus"></i> Add to
      <a href="${google}" target="_blank" rel="noopener">Google</a>
      <a href="${icsHref}" download="${icsName}">Apple (.ics)</a>
      <a href="${outlook}" target="_blank" rel="noopener">Outlook</a>
      <a href="${office}" target="_blank" rel="noopener">Office 365</a>
      <a href="${yahoo}" target="_blank" rel="noopener">Yahoo</a>
    </div>`;
}

// ── SF events ──────────────────────────────────────
function costTag(e) {
  if (e.cost == null) return `<span class="tag paid">Paid</span>`; // price not listed
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
            <div class="item-card">
              <div class="item-card-header">
                <a class="item-title" href="${e.url}" target="_blank" rel="noopener">${e.title}</a>
                <span class="item-time">${formatTime(e.time)}</span>
              </div>
              <div class="item-org">${e.venue} · ${e.neighborhood}</div>
              <div class="item-desc">${e.description}</div>
              <div class="item-tags">${costTag(e)}${tagChips(e.tags)}${e.cost_notes && e.cost_notes !== 'Free' ? `<span class="tag note">${e.cost_notes}</span>` : ''}</div>
              ${calendarLinks(e)}
            </div>`).join('')}
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
  setupThemeToggle();
  setupFilters();
  await loadEvents();
  renderSF();
}

document.addEventListener('DOMContentLoaded', init);
