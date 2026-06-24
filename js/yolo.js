let _yoloData = null;
let _yoloHistory = [];
let _yoloMapInstance = null;
let _yoloMainMapPoints = [];
let _yoloDayMaps = []; // array of { map, points }
const _DAY_COLORS = ['#3b82f6','#16a34a','#ea580c','#7c3aed','#dc2626','#0891b2','#d97706','#be185d'];

function cityToSlug(city) {
  return city.toLowerCase().replace(/\s+/g, '-');
}

function setYoloHash(slug) {
  history.replaceState(null, '', `#yolo=${encodeURIComponent(slug)}`);
}

function clearYoloHash() {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

function copyYoloLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.getElementById('yolo-share-btn');
    if (!btn) return;
    btn.textContent = 'copied!';
    btn.classList.add('yolo-share-copied');
    setTimeout(() => {
      btn.textContent = 'copy link';
      btn.classList.remove('yolo-share-copied');
    }, 2000);
  });
}

async function loadYoloData() {
  try {
    const [mainRes, histRes] = await Promise.all([
      fetch('data/yolo.json'),
      fetch('data/yolo-history.json')
    ]);
    if (histRes.ok) {
      const hist = await histRes.json();
      _yoloHistory = hist.destinations || [];
    }
    if (!mainRes.ok) return null;
    const data = await mainRes.json();
    return data.destination ? data : null;
  } catch { return null; }
}

function renderYoloFlights(flights, searchDate) {
  if (!flights || !flights.length) return '';
  const note = searchDate
    ? `<p class="yolo-search-note">Prices searched ${searchDate} — confirm before booking.</p>`
    : '';
  const cards = flights.map(f => `
    <a class="yolo-flight-card" href="${f.url}" target="_blank" rel="noopener">
      <div class="yolo-card-top">
        <span class="yolo-card-name">${f.airline}</span>
        <span class="yolo-card-price">$${f.price_usd}</span>
      </div>
      <div class="yolo-card-meta">${f.outbound_dates}${f.return_dates ? ' · return ' + f.return_dates : ''} · ${f.stops === 0 ? 'nonstop' : f.stops + ' stop'} · ${f.duration}</div>
      ${f.notes ? `<div class="yolo-card-notes">${f.notes}</div>` : ''}
    </a>
  `).join('');
  return `
    <div class="yolo-section">
      <h3 class="yolo-section-title">Flights from DTW</h3>
      ${note}
      <div class="yolo-card-list">${cards}</div>
    </div>`;
}

function renderYoloTransportation(transportation) {
  if (!transportation || !transportation.length) return '';
  const cards = transportation.map(t => `
    <a class="yolo-flight-card" href="${t.url}" target="_blank" rel="noopener">
      <div class="yolo-card-top">
        <span class="yolo-card-name">${t.name}</span>
        <span class="yolo-card-price">from $${t.price_usd}</span>
      </div>
      <div class="yolo-card-meta">${t.description} · ${t.duration}</div>
      ${t.price_note ? `<div class="yolo-card-notes">${t.price_note}</div>` : ''}
      ${t.notes ? `<div class="yolo-card-notes">${t.notes}</div>` : ''}
    </a>
  `).join('');
  return `
    <div class="yolo-section">
      <h3 class="yolo-section-title">Getting there &amp; around</h3>
      <div class="yolo-card-list">${cards}</div>
    </div>`;
}

function renderYoloLodging(lodging) {
  if (!lodging || !lodging.length) return '';
  const cards = lodging.map(l => `
    <a class="yolo-lodging-card" href="${l.url}" target="_blank" rel="noopener">
      <div class="yolo-card-top">
        <span class="yolo-card-name">${l.name}</span>
        <span class="yolo-card-price">$${l.price_per_night_usd}/night</span>
      </div>
      <div class="yolo-card-meta">${l.type} · ${l.neighborhood}</div>
      <div class="yolo-card-notes">${l.highlights}</div>
    </a>
  `).join('');
  return `
    <div class="yolo-section">
      <h3 class="yolo-section-title">Where to stay</h3>
      <div class="yolo-card-list">${cards}</div>
    </div>`;
}

function renderYoloItinerary(itinerary) {
  if (!itinerary) return '';

  const days = (itinerary.days || []).map(d => `
    <div class="yolo-day">
      <h4 class="yolo-day-title">Day ${d.day}${d.title ? ` — ${d.title}` : ''}</h4>
      ${d.morning   ? `<div class="yolo-time-block"><span class="yolo-time-label">Morning</span><span class="yolo-time-text">${d.morning}</span></div>`   : ''}
      ${d.afternoon ? `<div class="yolo-time-block"><span class="yolo-time-label">Afternoon</span><span class="yolo-time-text">${d.afternoon}</span></div>` : ''}
      ${d.evening   ? `<div class="yolo-time-block"><span class="yolo-time-label">Evening</span><span class="yolo-time-text">${d.evening}</span></div>`   : ''}
      ${d.waypoints && d.waypoints.length ? `<div class="yolo-day-map" id="yolo-day-map-${d.day}"></div>` : ''}
    </div>
  `).join('');

  const tips = (itinerary.tips || []).length ? `
    <div class="yolo-tips-block">
      <h4 class="yolo-section-title" style="margin-top:1.5rem">Insider tips</h4>
      <ul class="yolo-tips">${itinerary.tips.map(t => `<li>${t}</li>`).join('')}</ul>
    </div>` : '';

  const sources = (itinerary.sources || []).length ? `
    <div class="yolo-sources">
      Sources: ${itinerary.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>`).join(' · ')}
    </div>` : '';

  return `
    <div class="yolo-section">
      <h3 class="yolo-section-title">${(itinerary.days || []).length} days</h3>
      ${itinerary.overview ? `<p class="yolo-overview">${itinerary.overview}</p>` : ''}
      ${days}
      ${tips}
      ${sources}
    </div>`;
}

function renderYoloMap(destination) {
  if (!destination.lat || !destination.lon) return '';
  return `<div class="yolo-map"><div id="yolo-map-leaf"></div></div>`;
}

function _makeTileLayer() {
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  });
}

function _paddedBounds(points, minExtent = 0.08) {
  const lats = points.map(p => p[0]);
  const lons = points.map(p => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const latPad = Math.max((maxLat - minLat) * 0.25, minExtent);
  const lonPad = Math.max((maxLon - minLon) * 0.25, minExtent);
  return L.latLngBounds([minLat - latPad, minLon - lonPad], [maxLat + latPad, maxLon + lonPad]);
}

function initYoloMap(destination, itinerary) {
  if (!destination || !destination.lat) return;
  const mapEl = document.getElementById('yolo-map-leaf');
  if (!mapEl || typeof L === 'undefined') return;

  if (_yoloMapInstance) { _yoloMapInstance.remove(); _yoloMapInstance = null; }

  const map = L.map('yolo-map-leaf', { scrollWheelZoom: false });
  _yoloMapInstance = map;
  _makeTileLayer().addTo(map);

  const daysWithWaypoints = ((itinerary && itinerary.days) || [])
    .filter(d => d.waypoints && d.waypoints.length);

  if (daysWithWaypoints.length) {
    const allBounds = [];
    daysWithWaypoints.forEach((day, i) => {
      const color = _DAY_COLORS[i % _DAY_COLORS.length];
      day.waypoints.forEach(wp => {
        L.circleMarker([wp.lat, wp.lon], {
          radius: 7, fillColor: color, color: '#fff',
          weight: 2, opacity: 1, fillOpacity: 0.85
        }).bindPopup(`<strong>Day ${day.day}</strong><br>${wp.name}<br><a class="yolo-map-gmaps" href="https://www.google.com/maps?q=${wp.lat},${wp.lon}+(${encodeURIComponent(wp.name)})" target="_blank" rel="noopener">Open in Google Maps →</a>`).addTo(map);
        allBounds.push([wp.lat, wp.lon]);
      });
    });
    _yoloMainMapPoints = allBounds;
    if (allBounds.length) map.fitBounds(_paddedBounds(allBounds, 0.15));
  } else {
    L.circleMarker([destination.lat, destination.lon], {
      radius: 9, fillColor: '#78716c', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
    }).addTo(map).bindPopup(destination.city);
    map.setView([destination.lat, destination.lon], 10);
  }
}

function initYoloDayMaps(itinerary) {
  _yoloDayMaps.forEach(({ map: m }) => m.remove());
  _yoloDayMaps = [];
  if (!itinerary || !itinerary.days || typeof L === 'undefined') return;

  const daysWithWaypoints = itinerary.days.filter(d => d.waypoints && d.waypoints.length);
  daysWithWaypoints.forEach((day, i) => {
    const el = document.getElementById(`yolo-day-map-${day.day}`);
    if (!el) return;

    const map = L.map(el, { scrollWheelZoom: false, attributionControl: false });
    _makeTileLayer().addTo(map);

    const color = _DAY_COLORS[i % _DAY_COLORS.length];
    const points = [];
    day.waypoints.forEach(wp => {
      L.circleMarker([wp.lat, wp.lon], {
        radius: 6, fillColor: color, color: '#fff',
        weight: 2, opacity: 1, fillOpacity: 0.85
      }).bindPopup(`<b>${wp.name}</b><br><a class="yolo-map-gmaps" href="https://www.google.com/maps?q=${wp.lat},${wp.lon}+(${encodeURIComponent(wp.name)})" target="_blank" rel="noopener">Open in Google Maps →</a>`).addTo(map);
      points.push([wp.lat, wp.lon]);
    });
    _yoloDayMaps.push({ map, points });
    if (points.length) map.fitBounds(_paddedBounds(points));
  });
}

function renderYoloPastDestinations(history) {
  if (!history || !history.length) return '';
  const cards = history.map((entry, i) => {
    const d = entry.destination;
    const cheapest = (entry.flights || []).reduce((min, f) => Math.min(min, f.price_usd), Infinity);
    return `
      <button class="yolo-past-card" onclick="showPastDestination(${i})">
        <span class="yolo-past-flag">${d.flag}</span>
        <div class="yolo-past-info">
          <span class="yolo-past-city">${d.city}</span>
          <span class="yolo-past-country">${d.country}</span>
        </div>
        ${isFinite(cheapest) ? `<span class="yolo-past-price">from $${cheapest}</span>` : ''}
      </button>`;
  }).join('');
  return `
    <div class="yolo-section yolo-past-section">
      <h3 class="yolo-section-title">Previous destinations</h3>
      <div class="yolo-past-list">${cards}</div>
    </div>`;
}

function showCurrentDestination() {
  if (!_yoloData) return;
  renderYolo(_yoloData);
  setYoloHash(cityToSlug(_yoloData.destination.city));
}

function showPastDestination(index) {
  const entry = _yoloHistory[index];
  if (!entry) return;
  const currentCity = _yoloData ? _yoloData.destination.city : null;
  const { destination, flights, flight_search_date, lodging, itinerary, transportation } = entry;
  setYoloHash(cityToSlug(destination.city));
  document.getElementById('yolo-content').innerHTML = `
    <div class="yolo-past-nav">
      <button class="yolo-past-back-btn" onclick="showCurrentDestination()">← ${currentCity || 'current'}</button>
    </div>
    <div class="yolo-hero">
      <div class="yolo-flag">${destination.flag}</div>
      <div class="yolo-dest">${destination.city}, ${destination.country}</div>
      ${destination.vibe ? `<p class="yolo-vibe">${destination.vibe}</p>` : ''}
      <button class="yolo-share-btn" id="yolo-share-btn" onclick="copyYoloLink()">copy link</button>
    </div>
    ${renderYoloMap(destination)}
    ${renderYoloFlights(flights, flight_search_date)}
    ${renderYoloTransportation(transportation)}
    ${renderYoloLodging(lodging)}
    ${renderYoloItinerary(itinerary)}
  `;
  initYoloMap(destination, itinerary);
  initYoloDayMaps(itinerary);
  window.scrollTo(0, 0);
}

function renderYolo(data) {
  const { destination, flights, flight_search_date, lodging, itinerary, transportation } = data;
  document.getElementById('yolo-content').innerHTML = `
    <div class="yolo-hero">
      <div class="yolo-flag">${destination.flag}</div>
      <div class="yolo-dest">${destination.city}, ${destination.country}</div>
      ${destination.vibe ? `<p class="yolo-vibe">${destination.vibe}</p>` : ''}
      <button class="yolo-share-btn" id="yolo-share-btn" onclick="copyYoloLink()">copy link</button>
    </div>
    ${renderYoloMap(destination)}
    ${renderYoloFlights(flights, flight_search_date)}
    ${renderYoloTransportation(transportation)}
    ${renderYoloLodging(lodging)}
    ${renderYoloItinerary(itinerary)}
    ${renderYoloPastDestinations(_yoloHistory)}
  `;
  initYoloMap(destination, itinerary);
  initYoloDayMaps(itinerary);
}

function showYolo() {
  if (!_yoloData) {
    document.getElementById('yolo-content').innerHTML =
      '<p class="yolo-empty">Run <code>/yolo</code> in Claude Code to generate your next trip.</p>';
  }
  document.body.classList.add('yolo-active');
  window.scrollTo(0, 0);
  setTimeout(() => {
    if (_yoloMapInstance) {
      _yoloMapInstance.invalidateSize();
      if (_yoloMainMapPoints.length) _yoloMapInstance.fitBounds(_paddedBounds(_yoloMainMapPoints, 0.15));
    }
    _yoloDayMaps.forEach(({ map, points }) => {
      map.invalidateSize();
      if (points.length) map.fitBounds(_paddedBounds(points));
    });
  }, 50);
}

function closeYolo() {
  document.body.classList.remove('yolo-active');
  clearYoloHash();
}

async function initYolo() {
  _yoloData = await loadYoloData();
  if (_yoloData) renderYolo(_yoloData);

  const hash = window.location.hash;
  if (hash.startsWith('#yolo=')) {
    const slug = decodeURIComponent(hash.slice(6));
    const currentSlug = _yoloData ? cityToSlug(_yoloData.destination.city) : null;
    if (slug && slug !== currentSlug) {
      const histIdx = _yoloHistory.findIndex(e => cityToSlug(e.destination.city) === slug);
      if (histIdx >= 0) showPastDestination(histIdx);
    }
    showYolo();
  }

  document.getElementById('yolo-btn').addEventListener('click', () => {
    if (_yoloData) setYoloHash(cityToSlug(_yoloData.destination.city));
    showYolo();
  });
  document.getElementById('yolo-back-btn').addEventListener('click', closeYolo);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeYolo(); });
}

document.addEventListener('DOMContentLoaded', initYolo);
