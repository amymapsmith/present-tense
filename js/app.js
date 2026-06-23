// ── Config ─────────────────────────────────────────
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

function windSparkline(day) {
  const hourly = day.wind_hourly;
  if (!hourly || hourly.length < 2) {
    return `<div class="wc-wind">${day.wind_mph}mph</div>`;
  }
  const max = Math.max(...hourly);
  const min = Math.min(...hourly);
  const avg = Math.round(hourly.reduce((a, b) => a + b, 0) / hourly.length);
  const range = max - min || 1;
  const n = hourly.length;
  const W = 100, H = 30, pad = 2;
  const pts = hourly.map((v, i) => {
    const x = pad + (i / (n - 1)) * (W - 2 * pad);
    const y = pad + (1 - (v - min) / range) * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `
    <svg class="wc-sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect class="wc-sparkline-overlay" x="0" y="0" width="${W}" height="${H}" fill="transparent" data-wind='${JSON.stringify(hourly)}'/>
    </svg>
    <div class="wc-wind-stats">
      <span><i class="iconoir-wind"></i> ${min}–${max} mph</span>
      <span class="wc-wind-avg">avg ${avg} mph</span>
    </div>
  `;
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
        return `
          <div class="wc-day${isToday ? ' wc-today' : ''}" title="${day.description}">
            <div class="wc-name">${dayShort}</div>
            <div class="wc-date">${dateLabel}</div>
            <div class="wc-sky">${sky}</div>
            <div class="wc-temp">${day.high}°/${day.low}°</div>
            <div class="wc-rain">${day.precipitation_pct}%</div>
            ${windSparkline(day)}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── Card helpers ───────────────────────────────────
function opportunityCard(item) {
  return `
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
  `;
}

function eventCard(e) {
  return `
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
  `;
}

function venueItems(venues, includedEvents) {
  const todayName = getDayName();
  return (venues || []).map(venue => {
    const h = venue.hours?.[todayName];
    const hoursStr = h ? `${h.open} – ${h.close}` : null;
    const upcoming = includedEvents
      ? (venue.events || []).filter(e => isFutureOrToday(e.date))
      : [];
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
        ${upcoming.length ? `
          <div class="museum-events">
            <h4>Upcoming</h4>
            ${upcoming.map(e => `
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
}

// ── Work ───────────────────────────────────────────
function renderWork(professional, filter = 'all') {
  const body = document.getElementById('work-body');
  const updEl = document.getElementById('work-updated');
  updEl.textContent = professional.updated ? `updated ${professional.updated}` : '';

  const items = (professional.opportunities || []).filter(o => {
    const checkDate = o.deadline || o.date;
    if (checkDate && !isFutureOrToday(checkDate)) return false;
    const loc = o.location || 'any';
    return loc === 'any' || loc === currentLocation;
  });

  if (!items.length) {
    body.innerHTML = '<p class="empty">Run the skill to find professional opportunities.</p>';
    return;
  }

  const LISTING_TYPES = ['role', 'consulting', 'cfp', 'teaching'];
  const listings = items.filter(o => LISTING_TYPES.includes(o.type));
  const networking = items.filter(o => o.type === 'networking');

  const showListings  = filter === 'all' || filter === 'listings';
  const showNetworking = filter === 'all' || filter === 'networking';

  let listingsHtml = '';
  if (showListings && listings.length) {
    const byType = {};
    for (const item of listings) {
      if (!byType[item.type]) byType[item.type] = [];
      byType[item.type].push(item);
    }
    const sortedTypes = LISTING_TYPES.filter(t => byType[t]);
    listingsHtml = `
      <h3 class="work-sub-label">Job listings</h3>
      ${sortedTypes.map(type => `
        <div class="opportunity-group">
          <h3>${TYPE_LABELS[type] || type}</h3>
          <div class="card-grid">${byType[type].map(opportunityCard).join('')}</div>
        </div>
      `).join('')}
    `;
  }

  let networkingHtml = '';
  if (showNetworking && networking.length) {
    networkingHtml = `
      <h3 class="work-sub-label${listingsHtml ? ' work-sub-label--sep' : ''}">Networking</h3>
      <div class="card-grid">${networking.map(opportunityCard).join('')}</div>
    `;
  }

  body.innerHTML = listingsHtml + networkingHtml || '<p class="empty">Nothing here for this filter.</p>';
}

// ── Wealth ─────────────────────────────────────────
function renderWealth(gym, eventsData, filter = 'all') {
  const body = document.getElementById('wealth-body');
  const updEl = document.getElementById('wealth-updated');
  updEl.textContent = eventsData.updated ? `updated ${eventsData.updated}` : '';

  const todayName = getDayName();
  const dateFilter = currentLocation === 'sf' ? isThisWeek : isFutureOrToday;
  const showGym     = currentLocation === 'sf' && (filter === 'all' || filter === 'gym');
  const showDance   = filter === 'all' || filter === 'dance';
  const showRunning = currentLocation === 'ann-arbor' && (filter === 'all' || filter === 'running');

  const gymHtml = showGym ? (gym.locations || []).map(loc => {
    const h = loc.hours?.[todayName];
    const hoursStr = h ? `${h.open} – ${h.close}` : 'Closed today';
    return `
      <div class="gym-location">
        <div class="gym-location-header">
          <span class="gym-name">
            <a href="${loc.url || '#'}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${loc.name}</a>
          </span>
          <span class="gym-hours">${hoursStr}</span>
        </div>
        ${loc.address ? `<div class="gym-address">${loc.address}</div>` : ''}
      </div>
    `;
  }).join('') : '';

  let danceHtml = '';
  if (showDance) {
    const danceEvents = (eventsData.events || [])
      .filter(e => e.category === 'dance' && dateFilter(e.date))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    if (danceEvents.length) {
      danceHtml = `
        <div class="event-group${gymHtml ? ' event-group--sep' : ''}">
          <h3>${EVENT_LABELS.dance}</h3>
          <div class="card-grid">${danceEvents.map(eventCard).join('')}</div>
        </div>
      `;
    }
  }

  let runningHtml = '';
  if (showRunning) {
    const runs = eventsData.group_runs || [];
    if (runs.length) {
      const runsMarkup = runs.map(r => {
        const isToday = r.day.toLowerCase() === todayName;
        return `
          <div class="gym-location${isToday ? ' gym-location--today' : ''}">
            <div class="gym-location-header">
              <span class="gym-name">
                <a href="${r.url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${r.day} · ${r.display_time}</a>
              </span>
              <span class="gym-hours">${isToday ? 'today' : ''}</span>
            </div>
            <div class="gym-address">${r.title} @ ${r.location}</div>
            <div class="gym-address" style="opacity:0.7">${r.distance}</div>
          </div>
        `;
      }).join('');
      const sep = (gymHtml || danceHtml) ? ' event-group--sep' : '';
      runningHtml = `<div class="event-group${sep}"><h3><i class="iconoir-gym"></i> Group Runs · AARC</h3>${runsMarkup}</div>`;
    }
  }

  body.innerHTML = gymHtml + danceHtml + runningHtml || '<p class="empty">Nothing here for this filter.</p>';
}

// ── Whimsy ─────────────────────────────────────────
function renderWhimsy(eventsData, venuesData, filter = 'all') {
  const body = document.getElementById('whimsy-body');
  const updEl = document.getElementById('whimsy-updated');
  updEl.textContent = eventsData.updated ? `updated ${eventsData.updated}` : '';

  const dateFilter = currentLocation === 'sf' ? isThisWeek : isFutureOrToday;

  const CAT_MAP = { music: ['music', 'bar'], comedy: ['comedy'], art: ['art'] };
  const allowedCats = filter === 'all' ? ['music', 'bar', 'comedy', 'art'] : (CAT_MAP[filter] || []);
  const showVenues  = filter === 'all' || filter === 'museums';

  const events = (eventsData.events || [])
    .filter(e => allowedCats.includes(e.category) && dateFilter(e.date))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  const byCat = {};
  for (const e of events) {
    if (!byCat[e.category]) byCat[e.category] = [];
    byCat[e.category].push(e);
  }
  const sortedCats = ['music', 'bar', 'comedy', 'art'].filter(c => byCat[c]);

  const eventsHtml = sortedCats.map(cat => `
    <div class="event-group">
      <h3>${EVENT_LABELS[cat] || cat}</h3>
      <div class="card-grid">${byCat[cat].map(eventCard).join('')}</div>
    </div>
  `).join('');

  let venuesHtml = '';
  if (showVenues) {
    const venues = venueItems(venuesData?.venues, currentLocation === 'sf');
    if (venues) {
      venuesHtml = `
        <div class="event-group${eventsHtml ? ' event-group--sep' : ''}">
          <h3>${currentLocation === 'sf' ? 'Museums' : 'Venues'}</h3>
          ${venues}
        </div>
      `;
    }
  }

  body.innerHTML = eventsHtml + venuesHtml || '<p class="empty">Nothing here for this filter.</p>';
}

// ── Location state ─────────────────────────────────
let currentLocation = 'sf';
let _sfData = {};
let _aaData = {};

// ── Data loading ───────────────────────────────────
async function loadData() {
  const sfFiles  = ['gym', 'events', 'museums', 'weather', 'professional'];
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
  };
  _aaData = {
    events:  data['aa-events'],
    weather: data['aa-weather'],
    venues:  data['aa-venues'],
  };

  return data;
}

// ── Section filters ────────────────────────────────
const sectionFilters = { work: 'all', wealth: 'all', whimsy: 'all' };

function rerenderSection(section) {
  const f = sectionFilters[section];
  if (section === 'work') {
    renderWork(_sfData.professional || {}, f);
  } else if (section === 'wealth') {
    const ev = (currentLocation === 'sf' ? _sfData.events : _aaData.events) || { events: [] };
    renderWealth(currentLocation === 'sf' ? _sfData.gym || {} : {}, ev, f);
  } else if (section === 'whimsy') {
    const ev = (currentLocation === 'sf' ? _sfData.events : _aaData.events) || { events: [] };
    const vn = (currentLocation === 'sf' ? _sfData.museums : _aaData.venues) || {};
    renderWhimsy(ev, vn, f);
  }
}

// ── Sticky layout ──────────────────────────────────
let stickyOffset = 56;

function updateStickyLayout() {
  const header = document.querySelector('.site-header');
  const snav   = document.querySelector('.section-nav');
  if (!header || !snav) return;
  const hh = header.offsetHeight;
  const nh = snav.offsetHeight;
  document.documentElement.style.setProperty('--header-h',  `${hh}px`);
  document.documentElement.style.setProperty('--scroll-pad', `${hh + nh}px`);
  stickyOffset = hh + nh;
}

// ── Section nav ────────────────────────────────────
function setupSectionNav() {
  const sectionEls = ['weather', 'work', 'wealth', 'whimsy']
    .map(s => document.getElementById(`${s}-section`))
    .filter(Boolean);

  function updateActive() {
    const scrollY = window.scrollY + stickyOffset + 8;
    let active = 'weather';
    for (const el of sectionEls) {
      if (el.offsetTop <= scrollY) active = el.id.replace('-section', '');
    }
    document.querySelectorAll('.snav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.section === active);
    });
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
}

// ── Location switch ────────────────────────────────
function switchLocation(loc) {
  currentLocation = loc;
  document.querySelectorAll('.loc-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.loc === loc);
  });

  // Reset section filters
  Object.keys(sectionFilters).forEach(k => { sectionFilters[k] = 'all'; });
  document.querySelectorAll('.sfilt-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });

  // Gym filter only relevant in SF; Run filter only relevant in AA
  document.querySelectorAll('.sfilt-btn[data-filter="gym"]').forEach(b => {
    b.style.display = loc === 'sf' ? '' : 'none';
  });
  document.querySelectorAll('.sfilt-btn[data-filter="running"]').forEach(b => {
    b.style.display = loc === 'ann-arbor' ? '' : 'none';
  });

  const eventsData = (loc === 'sf' ? _sfData.events : _aaData.events) || { events: [] };
  const venuesData = (loc === 'sf' ? _sfData.museums : _aaData.venues) || {};
  renderWeather(loc === 'sf' ? _sfData.weather : _aaData.weather || {});
  renderWork(_sfData.professional || {});
  renderWealth(loc === 'sf' ? _sfData.gym || {} : {}, eventsData);
  renderWhimsy(eventsData, venuesData);
}

// ── Init ───────────────────────────────────────────
function setupSparklineTooltips() {
  const tip = document.createElement('div');
  tip.id = 'wind-tip';
  tip.className = 'wind-tip';
  document.body.appendChild(tip);

  function fmtHour(h) {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  }

  document.addEventListener('mousemove', e => {
    const overlay = e.target.closest && e.target.closest('.wc-sparkline-overlay');
    if (!overlay) { tip.style.display = 'none'; return; }
    const hourly = JSON.parse(overlay.dataset.wind);
    const svg = overlay.closest('svg');
    const svgRect = svg.getBoundingClientRect();
    const relX = (e.clientX - svgRect.left) / svgRect.width;
    const i = Math.min(hourly.length - 1, Math.max(0, Math.round(relX * (hourly.length - 1))));
    tip.textContent = `${fmtHour(i)}  ${hourly[i]} mph`;
    tip.style.left = `${e.clientX + 12}px`;
    tip.style.top = `${e.clientY - 28}px`;
    tip.style.display = 'block';
  });
}

async function init() {
  renderWeekLabel();
  await loadData();
  // Run filter is AA-only; hide on initial SF load
  document.querySelectorAll('.sfilt-btn[data-filter="running"]').forEach(b => { b.style.display = 'none'; });
  renderWeather(_sfData.weather || {});
  renderWork(_sfData.professional || {});
  renderWealth(_sfData.gym || {}, _sfData.events || { events: [] });
  renderWhimsy(_sfData.events || { events: [] }, _sfData.museums || {});
  setupSparklineTooltips();
  updateStickyLayout();
  setupSectionNav();
  window.addEventListener('resize', updateStickyLayout, { passive: true });

  document.querySelectorAll('.section-filter').forEach(nav => {
    const section = nav.dataset.section;
    nav.querySelectorAll('.sfilt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        nav.querySelectorAll('.sfilt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sectionFilters[section] = btn.dataset.filter;
        rerenderSection(section);
      });
    });
  });

  document.querySelectorAll('.loc-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLocation(btn.dataset.loc));
  });
}

document.addEventListener('DOMContentLoaded', init);
