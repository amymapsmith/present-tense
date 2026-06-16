// ── Config ─────────────────────────────────────────
const CATEGORIES = {
  professional: { label: 'Professional', color: '#1e40af', icon: '<i class="iconoir-suitcase"></i>' },
  health:       { label: 'Health',       color: '#166534', icon: '<i class="iconoir-running"></i>' },
  social:       { label: 'Social',       color: '#92400e', icon: '<i class="iconoir-community"></i>' },
  culture:      { label: 'Culture',      color: '#581c87', icon: '<i class="iconoir-palette"></i>' },
};

const TYPE_LABELS = {
  role:        '<i class="iconoir-suitcase"></i> Open Roles',
  consulting:  '<i class="iconoir-network"></i> Consulting',
  cfp:         '<i class="iconoir-microphone-speaking"></i> CFPs & Talks',
  teaching:    '<i class="iconoir-book"></i> Teaching',
  networking:  '<i class="iconoir-community"></i> Networking',
};

const EVENT_LABELS = {
  music:   '<i class="iconoir-music-note"></i> Music',
  art:     '<i class="iconoir-palette"></i> Art',
  dance:   '<i class="iconoir-music-double-note"></i> Dance',
  comedy:  '<i class="iconoir-emoji-satisfied"></i> Comedy',
  bar:     '<i class="iconoir-community"></i> Live Music & Bars',
};

// Which event categories to show for each filter tab
const EVENT_FILTER_CATS = {
  dance:  ['dance'],
  music:  ['music', 'bar'],
  comedy: ['comedy'],
  art:    ['art'],
};

// ── Date utils ─────────────────────────────────────
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

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
  return parseDate(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDayName(d = new Date()) {
  return d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function isThisWeek(dateStr) {
  const { start, end } = getWeekBounds();
  const d = parseDate(dateStr);
  return d >= start && d <= end;
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

// ── Mix computation ────────────────────────────────
function computeMix(entries, filterFn) {
  const filtered = entries.filter(e => filterFn(e.date));
  const totals = { professional: 0, health: 0, social: 0, culture: 0 };
  let grandTotal = 0;
  for (const e of filtered) {
    const h = e.duration_hours || 1;
    if (totals[e.category] !== undefined) {
      totals[e.category] += h;
      grandTotal += h;
    }
  }
  const pct = {};
  for (const cat of Object.keys(totals)) {
    pct[cat] = grandTotal > 0 ? totals[cat] / grandTotal : 0;
  }
  return { pct, totalHours: grandTotal, count: filtered.length };
}

// ── Weather ────────────────────────────────────────
function getSkyIcon(description) {
  const d = (description || '').toLowerCase();
  if (d.includes('rain') || d.includes('shower') || d.includes('storm')) return '<i class="iconoir-heavy-rain"></i>';
  if (d.includes('fog') || d.includes('mist')) return '<i class="iconoir-cloud"></i>';
  if (d.includes('mostly cloudy') || d.includes('overcast')) return '<i class="iconoir-cloud"></i>';
  if (d.includes('partly cloudy') || d.includes('partly sunny')) return '<i class="iconoir-cloud-sunny"></i>';
  if (d.includes('mostly sunny') || d.includes('mostly clear')) return '<i class="iconoir-cloud-sunny"></i>';
  if (d.includes('sunny') || d.includes('clear')) return '<i class="iconoir-sun-light"></i>';
  return '<i class="iconoir-cloud-sunny"></i>';
}

function getTimeOfDayRecs(day) {
  const { high, low, wind_mph, precipitation_pct, description } = day;
  const foggy = /fog|mist|overcast|cloudy/i.test(description || '');
  const rainy  = precipitation_pct > 40;
  const windy  = wind_mph > 12;
  const mornT  = low + (high - low) * 0.2;
  const midT   = (high + low) / 2;

  function outdoorRec(temp, w) {
    if (rainy) return { icon: '<i class="iconoir-gym"></i>', label: 'indoor' };
    if (temp >= 55 && w <= 12 && !foggy) return { icon: '<i class="iconoir-cycling"></i>', label: 'cycling' };
    if (temp >= 45 && w <= 20)           return { icon: '<i class="iconoir-running"></i>', label: 'run' };
    return { icon: '<i class="iconoir-swimming"></i>', label: 'swim / gym' };
  }

  const afternoon = rainy
    ? { icon: '<i class="iconoir-gym"></i>',       label: 'indoor' }
    : (windy || foggy)
    ? { icon: '<i class="iconoir-community"></i>', label: 'social / indoor' }
    : { icon: '<i class="iconoir-community"></i>', label: 'social / walk' };

  return [
    { time: 'Morning',   ...outdoorRec(mornT, wind_mph * 0.6) },
    { time: 'Midday',    ...outdoorRec(midT,  wind_mph) },
    { time: 'Afternoon', ...afternoon },
  ];
}

function renderWeather(weather) {
  const body = document.getElementById('weather-body');
  const updEl = document.getElementById('weather-updated');

  if (!weather.forecast || weather.forecast.length === 0) {
    body.innerHTML = '<p class="empty">Run the skill to populate weather data.</p>';
    return;
  }

  updEl.textContent = weather.updated ? `updated ${weather.updated}` : '';

  const todayStr = today();

  body.innerHTML = `
    <div class="weather-cal">
      ${weather.forecast.slice(0, 7).map(day => {
        const isToday = day.date === todayStr;
        const [, m, d] = day.date.split('-');
        const dateLabel = `${parseInt(m)}/${parseInt(d)}`;
        const dayShort = (day.day || '').slice(0, 3).toUpperCase();
        const sky = getSkyIcon(day.description);
        const recs = getTimeOfDayRecs(day);
        return `
          <div class="wc-day${isToday ? ' wc-today' : ''}" title="${day.description}">
            <div class="wc-name">${dayShort}</div>
            <div class="wc-date">${dateLabel}</div>
            <div class="wc-sky">${sky}</div>
            <div class="wc-tod">
              ${recs.map(r => `<span class="wc-tod-icon" title="${r.time}: ${r.label}">${r.icon}</span>`).join('')}
            </div>
            <div class="wc-temp">${day.high}°/${day.low}°</div>
            <div class="wc-rain">${day.precipitation_pct}%</div>
            <div class="wc-wind">${day.wind_mph}mph</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── Mix tracker ────────────────────────────────────
function renderMix(mix, history) {
  const body = document.getElementById('mix-body');
  const hoursEl = document.getElementById('mix-hours');

  const targets = mix.targets || { professional: 0.30, health: 0.30, social: 0.25, culture: 0.15 };
  const { pct: weekPct, totalHours } = computeMix(history.entries || [], isThisWeek);

  hoursEl.textContent = `${totalHours.toFixed(1)}h logged this week`;

  const barsHtml = Object.entries(CATEGORIES).map(([key, cat]) => {
    const target = Math.round((targets[key] || 0) * 100);
    const actual = Math.round((weekPct[key] || 0) * 100);
    const diff = actual - target;
    const diffLabel = diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '✓';
    const diffClass = diff > 8 ? 'over' : diff < -8 ? 'under' : 'on';

    return `
      <div class="mix-row">
        <span class="mix-label" style="color:${cat.color}">${cat.icon} ${cat.label}</span>
        <div class="mix-bar-bg">
          <div class="mix-bar-actual" style="width:${actual}%; background:${cat.color}"></div>
          <div class="mix-bar-target-marker" style="left:${target}%" title="Target: ${target}%"></div>
        </div>
        <span class="mix-pct">${actual}%</span>
        <span class="mix-diff ${diffClass}">${diffLabel}</span>
      </div>
    `;
  }).join('');

  const rec = mix.recommendation;
  const nudgeHtml = rec && rec.summary ? `
    <div class="mix-nudge">
      <span class="nudge-icon"><i class="iconoir-light-bulb"></i></span>
      <p>${rec.summary}</p>
    </div>
  ` : '';

  body.innerHTML = `<div class="mix-track">${barsHtml}</div>${nudgeHtml}`;
}

// ── Professional ───────────────────────────────────
function renderProfessional(professional) {
  const body = document.getElementById('professional-body');
  const updEl = document.getElementById('professional-updated');

  updEl.textContent = professional.updated ? `updated ${professional.updated}` : '';

  const items = (professional.opportunities || []).filter(o => {
    const checkDate = o.deadline || o.date;
    if (checkDate && !isFutureOrToday(checkDate)) return false;
    const loc = o.location || 'any';
    if (loc !== 'any' && loc !== currentLocation) return false;
    return true;
  });

  if (items.length === 0) {
    body.innerHTML = '<p class="empty">Run the skill to find professional opportunities.</p>';
    return;
  }

  const byType = {};
  for (const item of items) {
    const t = item.type || 'other';
    if (!byType[t]) byType[t] = [];
    byType[t].push(item);
  }

  const typeOrder = ['role', 'consulting', 'cfp', 'teaching', 'networking'];
  const sortedTypes = [
    ...typeOrder.filter(t => byType[t]),
    ...Object.keys(byType).filter(t => !typeOrder.includes(t)),
  ];

  body.innerHTML = sortedTypes.map(type => `
    <div class="opportunity-group">
      <h3>${TYPE_LABELS[type] || type}</h3>
      <div class="card-grid">
        ${byType[type].map(item => `
          <a class="item-card" href="${item.url || '#'}" target="_blank" rel="noopener">
            <div class="item-card-header">
              <span class="item-title">${item.title}</span>
              ${item.paid !== undefined
                ? `<span class="tag ${item.paid ? 'paid' : 'unpaid'}">${item.paid ? 'paid' : 'unpaid'}</span>`
                : ''}
            </div>
            ${item.organization ? `<div class="item-org">${item.organization}</div>` : ''}
            <div class="item-meta">
              ${item.deadline ? `<span><i class="iconoir-alarm"></i> Deadline ${formatDate(item.deadline)}</span>` : ''}
              ${item.date     ? `<span><i class="iconoir-calendar"></i> ${formatDate(item.date)}</span>` : ''}
              ${item.source   ? `<span>via ${item.source}</span>` : ''}
            </div>
            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
            ${item.tags?.length ? `
              <div class="item-tags">
                ${item.tags.map(t => `<span class="tag generic">${t}</span>`).join('')}
              </div>
            ` : ''}
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ── Gym ────────────────────────────────────────────
function renderGym(gym) {
  const body = document.getElementById('gym-body');
  const updEl = document.getElementById('gym-updated');

  updEl.textContent = gym.updated ? `updated ${gym.updated}` : '';

  const todayName = getDayName();

  const html = (gym.locations || []).map(loc => {
    const h = loc.hours?.[todayName];
    const hoursStr = h ? `${h.open} – ${h.close}` : 'Closed today';
    const events = (loc.events || []).filter(e => isThisWeek(e.date));

    return `
      <div class="gym-location">
        <div class="gym-location-header">
          <span class="gym-name">
            <a href="${loc.url || '#'}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${loc.name}</a>
          </span>
          <span class="gym-hours">${hoursStr}</span>
        </div>
        ${loc.address ? `<div class="gym-address">${loc.address}</div>` : ''}
        ${events.length ? `
          <div class="gym-events">
            ${events.map(e => `
              <div class="gym-event">
                <span class="gym-event-date">${formatDate(e.date)}${e.time ? ' · ' + e.time : ''}</span>
                <span class="gym-event-title">${e.title}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  body.innerHTML = html || '<p class="empty">Run the skill to update gym hours.</p>';
}

// ── Events ─────────────────────────────────────────
let _eventsData = { events: [] };

function renderEvents(activeFilter = 'all') {
  const body = document.getElementById('events-body');
  const updEl = document.getElementById('events-updated');

  updEl.textContent = _eventsData.updated ? `updated ${_eventsData.updated}` : '';

  const allowedCats = EVENT_FILTER_CATS[activeFilter] || null;

  const dateFilter = currentLocation === 'sf' ? isThisWeek : isFutureOrToday;

  const thisWeek = (_eventsData.events || [])
    .filter(e => dateFilter(e.date))
    .filter(e => !allowedCats || allowedCats.includes(e.category))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  if (thisWeek.length === 0) {
    body.innerHTML = '<p class="empty">No events found for this filter — try another category.</p>';
    return;
  }

  const byCat = {};
  for (const e of thisWeek) {
    const c = e.category || 'other';
    if (!byCat[c]) byCat[c] = [];
    byCat[c].push(e);
  }

  const catOrder = ['music', 'dance', 'comedy', 'art', 'bar'];
  const sortedCats = [
    ...catOrder.filter(c => byCat[c]),
    ...Object.keys(byCat).filter(c => !catOrder.includes(c)),
  ];

  body.innerHTML = sortedCats.map(cat => `
    <div class="event-group">
      <h3>${EVENT_LABELS[cat] || cat}</h3>
      <div class="card-grid">
        ${byCat[cat].map(e => `
          <a class="item-card" href="${e.url || '#'}" target="_blank" rel="noopener">
            <div class="item-card-header">
              <span class="item-title">${e.title}</span>
              <span class="tag ${e.cost === 0 ? 'free' : 'cheap'}">${e.cost === 0 ? 'free' : '$' + e.cost}</span>
            </div>
            <div class="item-meta">
              <span><i class="iconoir-calendar"></i> ${formatDate(e.date)}${e.time ? ' · ' + e.time : ''}</span>
              ${e.venue ? `<span><i class="iconoir-map-pin"></i> ${e.venue}${e.neighborhood ? ', ' + e.neighborhood : ''}</span>` : ''}
            </div>
            ${e.description ? `<div class="item-desc">${e.description}</div>` : ''}
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ── Museums / Ann Arbor venues ─────────────────────
function renderMuseums(museums, bodyId = 'museums-body', updId = 'museums-updated') {
  const body = document.getElementById(bodyId);
  const updEl = document.getElementById(updId);

  updEl.textContent = museums.updated ? `updated ${museums.updated}` : '';

  const todayName = getDayName();

  const html = (museums.venues || []).map(venue => {
    const h = venue.hours?.[todayName];
    const hoursStr = h ? `${h.open} – ${h.close}` : null;
    const upcomingEvents = (venue.events || []).filter(e => isThisWeek(e.date));

    return `
      <div class="museum-venue">
        <div class="museum-header">
          <span class="museum-name">
            <a href="${venue.url || '#'}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${venue.name}</a>
          </span>
          ${hoursStr
            ? `<span class="museum-hours">${hoursStr}</span>`
            : `<span class="museum-closed">Closed today</span>`}
        </div>
        ${venue.current_exhibitions?.length ? `
          <div class="exhibitions">
            <h4>On view</h4>
            ${venue.current_exhibitions.map(ex => `
              <div class="exhibition">
                <a href="${ex.url || '#'}" target="_blank" rel="noopener">${ex.title}</a>
                ${ex.through ? `<span class="through">through ${formatDate(ex.through)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${upcomingEvents.length ? `
          <div class="museum-events">
            <h4>This week</h4>
            ${upcomingEvents.map(e => `
              <div class="museum-event">
                <span class="museum-event-date">${formatDate(e.date)}${e.time ? ' · ' + e.time : ''}</span>
                <a href="${e.url || '#'}" target="_blank" rel="noopener">${e.title}</a>
                <span class="tag ${e.cost === 0 ? 'free' : 'cheap'}">${e.cost === 0 ? 'included' : '$' + e.cost}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  body.innerHTML = html || '<p class="empty">Run the skill to update museum info.</p>';
}

// ── Filter ─────────────────────────────────────────
function applyFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  document.querySelectorAll('.content-section').forEach(section => {
    // Respect location: hide sections belonging to the other location
    const secLoc = section.dataset.loc;
    if (secLoc && secLoc !== currentLocation) {
      section.style.display = 'none';
      return;
    }
    if (filter === 'all') {
      section.style.display = '';
    } else {
      const cats = (section.dataset.categories || '').split(',');
      section.style.display = cats.includes(filter) ? '' : 'none';
    }
  });
  // Re-render events with category filter applied within the section
  renderEvents(filter);
}

// ── Location state ─────────────────────────────────
let currentLocation = 'sf';
let _sfData = {};
let _aaData = {};

// ── Data loading ───────────────────────────────────
async function loadData() {
  const sfFiles  = ['gym', 'events', 'museums', 'weather', 'professional', 'history', 'mix'];
  const aaFiles  = ['aa-events', 'aa-weather', 'aa-venues'];
  const allFiles = [...sfFiles, ...aaFiles];

  const results = await Promise.allSettled(
    allFiles.map(f => fetch(`data/${f}.json`).then(r => r.json()))
  );

  const data = {};
  allFiles.forEach((f, i) => {
    data[f] = results[i].status === 'fulfilled' ? results[i].value : {};
  });

  _sfData = {
    gym:          data['gym'],
    events:       data['events'],
    museums:      data['museums'],
    weather:      data['weather'],
    professional: data['professional'],
    history:      data['history'],
    mix:          data['mix'],
  };
  _aaData = {
    events:  data['aa-events'],
    weather: data['aa-weather'],
    venues:  data['aa-venues'],
  };

  return data;
}

// ── Location switch ────────────────────────────────
function switchLocation(loc) {
  currentLocation = loc;

  document.querySelectorAll('.loc-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.loc === loc);
  });
  document.getElementById('events-heading').textContent = loc === 'sf' ? 'Events this week' : 'Events in Ann Arbor';

  // Show/hide location-specific sections (use section[data-loc] to avoid matching loc-btn elements)
  document.querySelectorAll('section[data-loc]').forEach(s => {
    s.style.display = s.dataset.loc === loc ? '' : 'none';
  });

  // Swap event data and weather
  _eventsData = (loc === 'sf' ? _sfData.events : _aaData.events) || { events: [] };
  renderWeather(loc === 'sf' ? _sfData.weather : _aaData.weather || {});

  if (loc === 'sf') {
    renderMuseums(_sfData.museums || {}, 'museums-body', 'museums-updated');
  } else {
    renderMuseums(_aaData.venues || {}, 'aa-venues-body', 'aa-venues-updated');
  }

  renderProfessional(_sfData.professional || {});

  // Reset filter to all
  applyFilter('all');
}

// ── Init ───────────────────────────────────────────
async function init() {
  renderWeekLabel();

  await loadData();
  _eventsData = _sfData.events || { events: [] };

  renderWeather(_sfData.weather || {});
  renderMix(_sfData.mix || {}, _sfData.history || { entries: [] });
  renderProfessional(_sfData.professional || {});
  renderGym(_sfData.gym || {});
  renderEvents('all');
  renderMuseums(_sfData.museums || {}, 'museums-body', 'museums-updated');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  document.querySelectorAll('.loc-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLocation(btn.dataset.loc));
  });
}

document.addEventListener('DOMContentLoaded', init);
