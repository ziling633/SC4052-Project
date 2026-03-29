const canteens = [
  'North Spine Food Court',
  'The Deck Food Court',
  'Canteen 11',
  'Canteen 13',
  'Food Paradise (North Hill)',
  'Canteen 16',
  'Canteen 18',
  'Canteen 9'
];

const REFRESH_WINDOW_MS = 30 * 60 * 1000;

const canteenSelect = document.getElementById('canteenSelect');
const crowdLevelInput = document.getElementById('crowdLevel');
const imageUpload = document.getElementById('imageUpload');
const aiHint = document.getElementById('aiHint');
const reportForm = document.getElementById('reportForm');
const submitBtn = reportForm.querySelector('button[type="submit"]');
const canteenCards = document.getElementById('canteenCards');
const campusMap = document.getElementById('campusMap');
const formFeedback = document.getElementById('formFeedback');
let aiInferenceTimeout = null;

const mapCoordinates = [
  { id: 'North Spine Food Court', top: '20%', left: '30%' },
  { id: 'The Deck Food Court', top: '45%', left: '25%' },
  { id: 'Food Paradise (North Hill)', top: '15%', left: '85%' },
  { id: 'Canteen 9', top: '55%', left: '45%' },
  { id: 'Canteen 11', top: '50%', left: '60%' },
  { id: 'Canteen 13', top: '60%', left: '70%' },
  { id: 'Canteen 16', top: '70%', left: '65%' },
  { id: 'Canteen 18', top: '35%', left: '80%' }
];

function getReports() {
  try {
    const data = localStorage.getItem('ntu-crowd-reports');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem('ntu-crowd-reports', JSON.stringify(reports));
}

function simulateAIClassification(file) {
  if (!file) return null;
  const size = file.size;
  const mod = size % 3;
  if (mod === 0) return 'low';
  if (mod === 1) return 'medium';
  return 'high';
}

function formatRelativeTime(timestamp) {
  const deltaSec = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (deltaSec < 60) return `Updated ${deltaSec} sec ago`;
  const mins = Math.round(deltaSec / 60);
  if (mins < 60) return `Updated ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `Updated ${hrs} hr ago`;
}

function computeCanteenStatus() {
  const reports = getReports();
  const now = Date.now();
  const pivot = now - REFRESH_WINDOW_MS;

  const byCanteen = new Map();
  canteens.forEach((canteen) => byCanteen.set(canteen, []));

  for (const r of reports) {
    if (!r.time || !r.canteen || !r.level) continue;
    byCanteen.has(r.canteen) && byCanteen.get(r.canteen).push(r);
  }

  const statusList = [];

  for (const canteen of canteens) {
    const entries = byCanteen.get(canteen) || [];
    const recent = entries.filter((e) => e.time >= pivot);

    if (recent.length === 0) {
      statusList.push({ canteen, level: 'unknown', updated: null, count: entries.length });
      continue;
    }

    const latest = recent.reduce((a, b) => (a.time > b.time ? a : b));

    statusList.push({
      canteen,
      level: latest.level,
      updated: latest.time,
      count: recent.length,
    });
  }

  return statusList;
}

function createCampusDots() {
  if (!campusMap) return;
  campusMap.innerHTML = '';

  mapPositions.forEach((spot) => {
    const dot = document.createElement('div');
    dot.className = 'campus-dot unknown';
    dot.style.top = spot.top;
    dot.style.left = spot.left;
    dot.dataset.canteen = spot.canteen;
    dot.title = spot.canteen;

    const label = document.createElement('div');
    label.className = 'campus-label';
    label.style.top = `calc(${spot.top} + 16px)`;
    label.style.left = `calc(${spot.left} + 16px)`;
    label.textContent = spot.canteen;

    campusMap.appendChild(dot);
    campusMap.appendChild(label);
  });
}

function updateCampusMap(statusList) {
  if (!campusMap) return;

  statusList.forEach((info) => {
    const safeName = info.canteen.replace(/"/g, '\\"');
    const dot = campusMap.querySelector(`[data-canteen="${safeName}"]`);
    if (!dot) return;
    dot.classList.remove('low', 'medium', 'high', 'unknown');
    dot.classList.add(info.level || 'unknown');
  });
}

function renderMap(statusList) {
  const container = document.getElementById('campus-map-container');
  if (!container) return;

  container.innerHTML = '';

  mapCoordinates.forEach((point) => {
    const statusInfo = statusList.find((s) => s.canteen === point.id);
    const level = statusInfo?.level || 'unknown';

    const node = document.createElement('div');
    node.className = 'map-node ' + level;
    node.style.top = point.top;
    node.style.left = point.left;

    const colorMap = {
      low: 'var(--low)',
      medium: 'var(--medium)',
      high: 'var(--high)',
      unknown: 'var(--unknown)'
    };

    node.style.backgroundColor = colorMap[level] || colorMap.unknown;

    const tooltip = document.createElement('div');
    tooltip.className = 'map-tooltip';
    tooltip.innerHTML = `<strong>${point.id}</strong><span>${level === 'unknown' ? 'No recent data' : level.charAt(0).toUpperCase() + level.slice(1)}</span>`;

    node.appendChild(tooltip);
    container.appendChild(node);
  });
}

function updateAdminAnalytics() {
  const reports = getReports();
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();

  const totalToday = reports.filter((r) => r.time >= todayTs).length;
  const counts = new Map();
  canteens.forEach((c) => counts.set(c, 0));

  reports.forEach((r) => {
    if (counts.has(r.canteen)) counts.set(r.canteen, counts.get(r.canteen) + 1);
  });

  const sorted = [...counts.entries()].sort((a,b) => b[1] - a[1]);
  const top = sorted[0] && sorted[0][1] > 0 ? `${sorted[0][0]} (${sorted[0][1]})` : 'None';

  document.getElementById('totalReportsToday').textContent = totalToday;
  document.getElementById('topCanteen').textContent = top;

  const tbody = document.querySelector('#canteenReportTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  sorted.forEach(([canteen, count]) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${canteen}</td><td>${count}</td>`;
    tbody.appendChild(row);
  });
}

function buildCards() {
  const status = computeCanteenStatus();
  canteenCards.innerHTML = '';

  for (const info of status) {
    const card = document.createElement('article');
    card.className = 'card';

    const levelName = info.level === 'unknown' ? 'Unknown' : info.level.charAt(0).toUpperCase() + info.level.slice(1);
    const timeText = info.updated ? formatRelativeTime(info.updated) : 'No recent data';
    const colorClass = info.level;

    card.innerHTML = `
      <h3>${info.canteen}</h3>
      <p class="status ${colorClass}"><span class="badge"></span>${levelName}</p>
      <p class="muted">${timeText}</p>
      <p class="muted">Reports in window: ${info.count}</p>
    `;

    canteenCards.appendChild(card);
  }

  updateCampusMap(status);
  renderMap(status);
  updateAdminAnalytics();
}

function populateCanteenSelect() {
  canteens.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    canteenSelect.appendChild(option);
  });
}

function setupNavigation() {
  const links = document.querySelectorAll('.nav-link');
  const buttons = document.querySelectorAll('[data-target]');

  function showPage(id) {
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('page--active'));
    document.getElementById(id).classList.add('page--active');
    links.forEach((link) => {
      link.classList.toggle('active', link.dataset.target === id);
    });
    window.location.hash = id;
  }

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.dataset.target);
    });
  });

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      if (target) showPage(target);
    });
  });

  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    showPage(hash);
  }
}

reportForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const canteen = canteenSelect.value;
  let level = crowdLevelInput.value;
  const file = imageUpload.files[0];

  if (!canteen) {
    formFeedback.textContent = 'Please select a canteen.';
    return;
  }

  if (!level && file) {
    level = simulateAIClassification(file);
  }

  if (!level) {
    formFeedback.textContent = 'Please select a crowd level or upload an image for AI suggestion.';
    return;
  }

  const reports = getReports();
  const entry = {
    canteen,
    level,
    time: Date.now(),
    imageName: file ? file.name : null,
    source: file ? 'image-AI' : 'manual',
  };

  reports.push(entry);
  saveReports(reports);
  buildCards();

  reportForm.reset();
  aiHint.textContent = 'Submit successful. Dashboard updated automatically.';
  formFeedback.textContent = 'Report submitted successfully.';
});

imageUpload.addEventListener('change', () => {
  const file = imageUpload.files[0];

  if (!file) {
    if (aiInferenceTimeout) {
      clearTimeout(aiInferenceTimeout);
      aiInferenceTimeout = null;
    }
    submitBtn.disabled = false;
    aiHint.textContent = 'AI inference currently off. Choose a level or upload image for auto suggestion.';
    return;
  }

  submitBtn.disabled = true;
  aiHint.innerHTML = '<span class="loading-spinner"></span>🧠 Analysing image density...';

  if (aiInferenceTimeout) {
    clearTimeout(aiInferenceTimeout);
    aiInferenceTimeout = null;
  }

  aiInferenceTimeout = setTimeout(() => {
    const predicted = simulateAIClassification(file);
    crowdLevelInput.value = predicted;
    submitBtn.disabled = false;
    aiHint.textContent = `✅ AI Suggestion applied: ${predicted.toUpperCase()}`;
    aiInferenceTimeout = null;
  }, 1500);
});

function init() {
  populateCanteenSelect();
  setupNavigation();
  createCampusDots();
  buildCards();
  setInterval(buildCards, 30 * 1000);
}

init();
