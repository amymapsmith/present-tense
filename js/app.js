// ── Config ─────────────────────────────────────────
const DOMAIN_LABELS = {
  wealth: '<i class="iconoir-coins"></i> Wealth',
  mind:   '<i class="iconoir-brain"></i> Mind',
  body:   '<i class="iconoir-heart"></i> Body',
};

const TAG_LABELS = {
  connect: '<i class="iconoir-community"></i> Connect',
  serve:   '<i class="iconoir-hand-card"></i> Serve',
  play:    '<i class="iconoir-music-double-note"></i> Play',
  awe:     '<i class="iconoir-sparks"></i> Awe',
};

const STUDIES = [
  {
    id: 'income',
    domain: 'wealth',
    headline: 'Guarding yourself has a price',
    summary: 'People who agreed that most others will "use unfair means to gain an advantage" went on to earn less than their more trusting peers, in two U.S. panels and a German panel of about 16,000 people. Nine years later, the less cynical Germans were earning roughly <strong>$300 a month more</strong>, even after accounting for Big Five personality traits.',
    why: 'Cynics tend to avoid cooperating, don\'t ask for help, and spend energy guarding against exploitation, all of which cost you at work.',
    method: 'Three longitudinal surveys (U.S. n ≈ 1,146 and 497, followed 9 and 2 years; Germany ≈ 16,000, followed 9 years), plus a comparison across 41 countries.',
    caveat: 'The penalty shrank in countries with high homicide rates and little cooperation, where suspicion is more warranted.',
    cite: 'Stavrova & Ehlebracht (2016). Cynical beliefs about human nature and income: Longitudinal and cross-cultural analyses. Journal of Personality and Social Psychology, 110(1).',
    url: 'https://repository.tilburguniversity.edu/items/aa10b12e-a926-4fe6-8e93-b6be81684b60',
  },
  {
    id: 'genius',
    domain: 'mind',
    headline: 'It isn\'t the smart move it feels like',
    summary: 'In four studies, most people expected cynics to be smarter. Then the authors checked data from <strong>about 200,000 people across 30 countries</strong>: less cynical people generally scored higher on cognitive ability and academic competence tests.',
    why: 'Competent people held contingent views. They were cynical only in places where cynicism was warranted. Blanket cynicism looks more like a default for people who can\'t easily tell who\'s trustworthy.',
    method: 'Four experiments on lay beliefs, then three large datasets (including international adult skills surveys) linking cynicism to test performance.',
    caveat: 'Correlational: it shows cynicism and lower test scores go together, not that one causes the other.',
    cite: 'Stavrova & Ehlebracht (2019; online 2018). The cynical genius illusion: Exploring and debunking lay beliefs about cynicism and competence. Personality and Social Psychology Bulletin, 45(2).',
    url: 'https://research.tilburguniversity.edu/en/publications/the-cynical-genius-illusion-exploring-and-debunking-lay-beliefs-a/',
  },
  {
    id: 'heart',
    domain: 'body',
    headline: 'The body never gets to stand down',
    summary: 'Most people\'s heart rate and blood pressure jump less the second time they face the same stressful task: the body learns it\'s survivable. When <strong>196 people</strong> took the same stress test twice, those higher in cynicism showed a weaker drop-off.',
    why: 'If you expect people to be hostile, every encounter stays a threat. Over years, a cardiovascular system that never stands down may be part of why cynical hostility is tied to heart disease.',
    method: 'Two identical lab visits, each with a public speaking and mental math stress test (the Trier Social Stress Test), measuring cardiovascular reactivity. Hostility was split into cynicism, anger, and aggression.',
    caveat: 'Only the cynicism part predicted this. Anger and aggressive behavior did not. One earlier study found the opposite pattern.',
    cite: 'Tyra, Brindle, Hughes & Ginty (2020). Cynical hostility relates to a lack of habituation of the cardiovascular response to repeated acute stress. Psychophysiology, 57, e13681.',
    url: 'https://research.universityofgalway.ie/en/publications/cynical-hostility-relates-to-a-lack-of-habituation-of-the-cardiov-3/',
  },
  {
    id: 'mortality',
    domain: 'body',
    headline: 'Hard times hit harder',
    summary: 'Over 14 years, Danish men who were both unemployed and high in cynical distrust died at <strong>3.2 times</strong> the rate of employed, trusting men. Each factor added risk on its own, and they stacked.',
    why: 'Losing a job strips away routine, income, and daily contact with people. Distrust makes it harder to lean on the people who are left.',
    method: 'About 7,800 Danish workers surveyed in 2000, followed through national death registers to 2014. Adjusted for education, cohabitation, alcohol, and depression.',
    caveat: 'The two risks added up rather than multiplied. Cynicism alone was a significant risk factor for men but not for women.',
    cite: 'Kriegbaum, Lund, Schmidt, Rod & Christensen (2019). The joint effect of unemployment and cynical hostility on all-cause mortality. BMC Public Health, 19.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6417173/',
    chart: 'hazard',
  },
  {
    id: 'wellbeing',
    domain: 'mind',
    headline: 'It\'s exhausting',
    summary: 'Among <strong>429 South African police officers and paramedics</strong>, more cynicism went with more depression, anxiety, and fatigue. Part of the link ran through fatigue: cynicism is tiring, and exhaustion feeds low mood and worry.',
    why: 'Constant vigilance takes energy. The authors suggest treating cynicism as a mental health factor, alongside rest, workload, and support.',
    method: 'Survey using the Turner Cynicism Scale plus standard fatigue, depression (PHQ-9), and anxiety (GAD-7) measures, analyzed with a structural equation model.',
    caveat: 'A one-time survey in a high-stress job, so it can\'t show direction. The effects are modest.',
    cite: 'Padmanabhanunni & Pretorius (2024). Being cynical is bad for your wellbeing: A structural equation model of the relationship between cynicism and mental health in first responders in South Africa. IJERPH, 21(12), 1684.',
    url: 'https://doi.org/10.3390/ijerph21121684',
    chart: 'path',
  },
];

// Kriegbaum et al. 2019, Table 3 (adjusted HR, 95% CI); reference = employed, not hostile
const HAZARD = {
  men: [
    { label: 'Employed, trusting',  hr: 1,    lo: 1,    hi: 1 },
    { label: 'Cynical only',        hr: 1.47, lo: 1.09, hi: 1.99 },
    { label: 'Unemployed only',     hr: 2.32, lo: 1.46, hi: 3.70 },
    { label: 'Both',                hr: 3.19, lo: 2.22, hi: 4.69 },
  ],
  women: [
    { label: 'Employed, trusting',  hr: 1,    lo: 1,    hi: 1 },
    { label: 'Cynical only',        hr: 1.17, lo: 0.79, hi: 1.74 },
    { label: 'Unemployed only',     hr: 1.78, lo: 1.16, hi: 2.73 },
    { label: 'Both',                hr: 1.97, lo: 1.24, hi: 3.12 },
  ],
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

// ── Research ───────────────────────────────────────
function hazardChart(sex) {
  const rows = HAZARD[sex];
  const max = 5;
  const pct = v => (v / max) * 100;
  return `
    <div class="hz" role="img" aria-label="Hazard ratios for ${sex}">
      ${rows.map(r => `
        <div class="hz-row" data-tip="${r.label}: ${r.hr === 1 ? 'reference (1.0)' : `${r.hr.toFixed(2)}× (95% CI ${r.lo.toFixed(2)}–${r.hi.toFixed(2)})`}">
          <div class="hz-label">${r.label}</div>
          <div class="hz-track" style="--ref:${pct(1)}%">
            <div class="hz-bar${r.hr === 1 ? ' hz-ref' : ''}" style="width:${pct(r.hr)}%"></div>
            ${r.hr === 1 ? '' : `<div class="hz-ci" style="left:${pct(r.lo)}%;width:${pct(r.hi) - pct(r.lo)}%"></div>`}
          </div>
          <div class="hz-val">${r.hr === 1 ? '1.0' : r.hr.toFixed(2)}×</div>
        </div>`).join('')}
    </div>
    <table class="sr-only">
      <caption>Hazard ratio of death, ${sex}</caption>
      <tr><th>Group</th><th>Hazard ratio</th><th>95% CI</th></tr>
      ${rows.map(r => `<tr><td>${r.label}</td><td>${r.hr}</td><td>${r.lo}–${r.hi}</td></tr>`).join('')}
    </table>
  `;
}

function pathChart() {
  return `
    <svg class="path-diagram" viewBox="0 0 420 150" role="img" aria-label="Cynicism links to fatigue, which links to depression and anxiety. Cynicism also has a smaller direct link to each.">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
        </marker>
      </defs>
      <g class="pd-edges">
        <line x1="96" y1="75" x2="166" y2="75" marker-end="url(#arr)"/>
        <line x1="254" y1="68" x2="318" y2="34" marker-end="url(#arr)"/>
        <line x1="254" y1="82" x2="318" y2="116" marker-end="url(#arr)"/>
        <path class="pd-direct" d="M60,58 C120,4 240,4 318,22" marker-end="url(#arr)"/>
        <path class="pd-direct" d="M60,92 C120,146 240,146 318,128" marker-end="url(#arr)"/>
      </g>
      <g class="pd-nodes">
        <rect x="8" y="58" width="88" height="34" rx="6" class="pd-src"/><text x="52" y="80">Cynicism</text>
        <rect x="168" y="58" width="86" height="34" rx="6"/><text x="211" y="80">Fatigue</text>
        <rect x="320" y="12" width="92" height="34" rx="6"/><text x="366" y="34">Depression</text>
        <rect x="320" y="104" width="92" height="34" rx="6"/><text x="366" y="126">Anxiety</text>
      </g>
      <g class="pd-labels">
        <text x="131" y="68">r = .21</text>
        <text x="300" y="58">β .47</text>
        <text x="300" y="100">β .47</text>
        <text x="190" y="20">direct β .12</text>
        <text x="190" y="140">direct β .12</text>
      </g>
    </svg>
    <p class="chart-note">Fatigue partly carries the link: the indirect path through fatigue (β .10) is about as large as the direct one.</p>
  `;
}

function renderStudyChart(s) {
  if (s.chart === 'hazard') {
    return `
      <div class="study-chart">
        <div class="chart-head">
          <span class="chart-title">Risk of death vs. employed, trusting peers</span>
          <nav class="mini-toggle" data-chart="hazard">
            <button class="mini-btn active" data-sex="men">Men</button>
            <button class="mini-btn" data-sex="women">Women</button>
          </nav>
        </div>
        <div class="hz-wrap">${hazardChart('men')}</div>
        <p class="chart-note">Bars show hazard ratios; the thin band is the 95% confidence interval. The dotted line marks 1.0 (no extra risk).</p>
      </div>`;
  }
  if (s.chart === 'path') {
    return `<div class="study-chart"><div class="chart-head"><span class="chart-title">How the pieces connect</span></div>${pathChart()}</div>`;
  }
  return '';
}

function renderResearch() {
  const body = document.getElementById('research-body');
  body.innerHTML = STUDIES.map(s => `
    <article class="study" id="study-${s.id}">
      <div class="study-domain domain-${s.domain}">${DOMAIN_LABELS[s.domain]}</div>
      <h3>${s.headline}</h3>
      <p>${s.summary}</p>
      ${renderStudyChart(s)}
      <details class="study-more">
        <summary>Why, how, and the catch</summary>
        <dl>
          <dt>Why it might happen</dt><dd>${s.why}</dd>
          <dt>How they studied it</dt><dd>${s.method}</dd>
          <dt>The catch</dt><dd>${s.caveat}</dd>
        </dl>
      </details>
      <a class="study-cite" href="${s.url}" target="_blank" rel="noopener">${s.cite} ↗</a>
    </article>
  `).join('');

  body.querySelectorAll('.mini-toggle[data-chart="hazard"]').forEach(nav => {
    nav.querySelectorAll('.mini-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        nav.querySelectorAll('.mini-btn').forEach(b => b.classList.toggle('active', b === btn));
        nav.closest('.study-chart').querySelector('.hz-wrap').innerHTML = hazardChart(btn.dataset.sex);
      });
    });
  });
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

// ── Tooltip ────────────────────────────────────────
function setupTooltip() {
  const tip = document.getElementById('tip');
  document.addEventListener('mousemove', e => {
    const row = e.target.closest && e.target.closest('[data-tip]');
    if (!row) { tip.style.display = 'none'; return; }
    tip.textContent = row.dataset.tip;
    tip.style.left = `${Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8)}px`;
    tip.style.top = `${e.clientY - 32}px`;
    tip.style.display = 'block';
  });
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
  const sectionEls = ['cynics', 'sf']
    .map(s => document.getElementById(`${s}-section`))
    .filter(Boolean);

  function updateActive() {
    const scrollY = window.scrollY + stickyOffset + 8;
    let active = 'cynics';
    for (const el of sectionEls) {
      if (el.offsetTop <= scrollY) active = el.id.replace('-section', '');
    }
    // At the bottom of the page, the last section can't scroll to the top
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) active = 'sf';
    document.querySelectorAll('.snav-link').forEach(a => {
      const isActive = a.dataset.section === active;
      if (isActive && !a.classList.contains('active')) {
        // Keep the active link visible when the nav scrolls sideways on phones
        const nav = a.parentElement;
        nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
      }
      a.classList.toggle('active', isActive);
    });
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
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
  renderResearch();
  setupFilters();
  setupTooltip();
  updateStickyLayout();
  setupSectionNav();
  window.addEventListener('resize', updateStickyLayout, { passive: true });
  await loadEvents();
  renderSF();
}

document.addEventListener('DOMContentLoaded', init);
