// ── Config ─────────────────────────────────────────
const CATEGORIES = {
  professional: { label: 'Professional', color: '#1e40af', emoji: '💼' },
  health:       { label: 'Health',       color: '#166534', emoji: '🏃' },
  social:       { label: 'Social',       color: '#92400e', emoji: '👥' },
  culture:      { label: 'Culture',      color: '#581c87', emoji: '🎨' },
};

const TYPE_LABELS = {
  role:        '💼 Open Roles',
  consulting:  '🤝 Consulting',
  cfp:         '🎤 CFPs & Talks',
  teaching:    '📚 Teaching',
  networking:  '🌐 Networking',
};

const EVENT_LABELS = {
  music:   '🎵 Music',
  art:     '🖼 Art',
  dance:   '💃 Dance',
  comedy:  '😄 Comedy',
  bar:     '🍻 Live Music & Bars',
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

function getMonthBounds() {
  const d = new Date();
  return {
    start: new Date(d.getFullYear(), d.getMonth(), 1),
    end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
  };
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

function isThisMonth(dateStr) {
  const { start, end } = getMonthBounds();
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
function renderWeather(weather) {
  const body = document.getElementById('weather-body');
  const updEl = document.getElementById('weather-updated');

  if (!weather.forecast || weather.forecast.length === 0) {
    body.innerHTML = '<p class="empty">Run the skill to populate weather data.</p>';
    return;
  }

  updEl.textContent = weather.updated ? `updated ${weather.updated}` : '';

  const today = weather.forecast[0];
  const tomorrow = weather.forecast[1];

  const recsHtml = (weather.recommendations || []).map(r => `
    <div class="activity-rec rating-${r.rating.toLowerCase()}">
      <span class="rec-activity">${r.activity.replace(/_/g, ' ')}</span>
      <span class="rec-rating">${r.rating}</span>
      <span class="rec-reason">${r.reason}</span>
    </div>
  `).join('');

  body.innerHTML = `
    <div class="weather-today">
      <div class="weather-stat">
        <span class="weather-val">${today.high}° / ${today.low}°</span>
        <span class="weather-lbl">temp</span>
      </div>
      <div class="weather-stat">
        <span class="weather-val">${today.wind_mph} mph</span>
        <span class="weather-lbl">wind</span>
      </div>
      <div class="weather-stat">
        <span class="weather-val">${today.precipitation_pct}%</span>
        <span class="weather-lbl">rain</span>
      </div>
      <div class="weather-stat">
        <span class="weather-val">${today.description}</span>
        <span class="weather-lbl">today</span>
      </div>
    </div>
    <div class="activity-recs">${recsHtml}</div>
    ${tomorrow ? `
      <p class="weather-tomorrow">
        Tomorrow: ${tomorrow.description}, ${tomorrow.high}° / ${tomorrow.low}°, wind ${tomorrow.wind_mph} mph
      </p>
    ` : ''}
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
        <span class="mix-label" style="color:${cat.color}">${cat.emoji} ${cat.label}</span>
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
      <span class="nudge-icon">💡</span>
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
    return !checkDate || isFutureOrToday(checkDate);
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
              ${item.deadline ? `<span>⏰ Deadline ${formatDate(item.deadline)}</span>` : ''}
              ${item.date     ? `<span>📅 ${formatDate(item.date)}</span>` : ''}
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
function renderEvents(events) {
  const body = document.getElementById('events-body');
  const updEl = document.getElementById('events-updated');

  updEl.textContent = events.updated ? `updated ${events.updated}` : '';

  const thisWeek = (events.events || [])
    .filter(e => isThisWeek(e.date))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  if (thisWeek.length === 0) {
    body.innerHTML = '<p class="empty">Run the skill to find events this week.</p>';
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
              <span>📅 ${formatDate(e.date)}${e.time ? ' · ' + e.time : ''}</span>
              ${e.venue ? `<span>📍 ${e.venue}${e.neighborhood ? ', ' + e.neighborhood : ''}</span>` : ''}
            </div>
            ${e.description ? `<div class="item-desc">${e.description}</div>` : ''}
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ── Museums ────────────────────────────────────────
function renderMuseums(museums) {
  const body = document.getElementById('museums-body');
  const updEl = document.getElementById('museums-updated');

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

// ── History ────────────────────────────────────────
let _historyData = { entries: [] };
let _historyPeriod = 'week';

function renderHistory(period) {
  _historyPeriod = period;
  const list = document.getElementById('history-list');
  let entries = [...(_historyData.entries || [])];

  if (period === 'week')  entries = entries.filter(e => isThisWeek(e.date));
  if (period === 'month') entries = entries.filter(e => isThisMonth(e.date));

  entries.sort((a, b) => b.date.localeCompare(a.date));

  if (entries.length === 0) {
    list.innerHTML = '<p class="empty">No entries yet — add activities by telling Claude what you did.</p>';
    return;
  }

  const byDate = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  list.innerHTML = Object.entries(byDate).map(([date, items]) => `
    <div class="history-day">
      <div class="history-date">${formatDate(date)}</div>
      ${items.map(item => {
        const cat = CATEGORIES[item.category] || { color: '#78716c', emoji: '•' };
        return `
          <div class="history-entry">
            <span class="history-cat" style="color:${cat.color}">${cat.emoji} ${item.subcategory || item.category}</span>
            <span class="history-activity">${item.activity}</span>
            <span class="history-meta">
              ${item.duration_hours ? `<span>${item.duration_hours}h</span>` : ''}
              ${item.cost != null && item.cost > 0 ? `<span>$${item.cost}</span>` : ''}
              ${item.location ? `<span>${item.location}</span>` : ''}
            </span>
            ${item.notes ? `<div class="history-notes">${item.notes}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

// ── Filter ─────────────────────────────────────────
function applyFilter(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  document.querySelectorAll('.content-section').forEach(section => {
    if (filter === 'all') {
      section.style.display = '';
    } else {
      const cats = (section.dataset.categories || '').split(',');
      section.style.display = cats.includes(filter) ? '' : 'none';
    }
  });
}

// ── Data loading ───────────────────────────────────
async function loadData() {
  const files = ['gym', 'events', 'museums', 'weather', 'professional', 'history', 'mix'];
  const results = await Promise.allSettled(
    files.map(f => fetch(`data/${f}.json`).then(r => r.json()))
  );
  const data = {};
  files.forEach((f, i) => {
    data[f] = results[i].status === 'fulfilled' ? results[i].value : {};
  });
  return data;
}

// ── Init ───────────────────────────────────────────
async function init() {
  renderWeekLabel();

  const data = await loadData();
  _historyData = data.history || { entries: [] };

  renderWeather(data.weather || {});
  renderMix(data.mix || {}, _historyData);
  renderProfessional(data.professional || {});
  renderGym(data.gym || {});
  renderEvents(data.events || {});
  renderMuseums(data.museums || {});
  renderHistory('week');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  document.querySelectorAll('.history-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.history-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHistory(btn.dataset.period);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
