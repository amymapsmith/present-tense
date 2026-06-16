let _yoloData = null;

async function loadYoloData() {
  try {
    const res = await fetch('data/yolo.json');
    if (!res.ok) return null;
    const data = await res.json();
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
      <h3 class="yolo-section-title">Flights from SFO</h3>
      ${note}
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
      <h3 class="yolo-section-title">72 hours</h3>
      ${itinerary.overview ? `<p class="yolo-overview">${itinerary.overview}</p>` : ''}
      ${days}
      ${tips}
      ${sources}
    </div>`;
}

function renderYoloMap(destination) {
  if (!destination.lat || !destination.lon) return '';
  const { lat, lon, city } = destination;
  const d = 0.08;
  const bbox = `${lon-d},${lat-d},${lon+d},${lat+d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  return `<div class="yolo-map"><iframe src="${src}" title="Map of ${city}" loading="lazy"></iframe></div>`;
}

function renderYolo(data) {
  const { destination, flights, flight_search_date, lodging, itinerary } = data;
  document.getElementById('yolo-content').innerHTML = `
    <div class="yolo-hero">
      <div class="yolo-flag">${destination.flag}</div>
      <div class="yolo-dest">${destination.city}, ${destination.country}</div>
      ${destination.vibe ? `<p class="yolo-vibe">${destination.vibe}</p>` : ''}
    </div>
    ${renderYoloMap(destination)}
    ${renderYoloFlights(flights, flight_search_date)}
    ${renderYoloLodging(lodging)}
    ${renderYoloItinerary(itinerary)}
  `;
}

function showYolo() {
  if (!_yoloData) {
    document.getElementById('yolo-content').innerHTML =
      '<p class="yolo-empty">Run <code>/yolo</code> in Claude Code to generate your next trip.</p>';
  }
  document.body.classList.add('yolo-active');
  window.scrollTo(0, 0);
}

function closeYolo() {
  document.body.classList.remove('yolo-active');
}

async function initYolo() {
  _yoloData = await loadYoloData();
  if (_yoloData) renderYolo(_yoloData);

  document.getElementById('yolo-btn').addEventListener('click', showYolo);
  document.getElementById('yolo-back-btn').addEventListener('click', closeYolo);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeYolo(); });
}

document.addEventListener('DOMContentLoaded', initYolo);
