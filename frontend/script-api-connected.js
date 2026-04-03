// Campus-Flow Frontend - Connected to Backend API
const API_BASE = 'http://localhost:8000/api/v1';

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

const REFRESH_INTERVAL_MS = 30 * 1000; // Refresh every 30 seconds

const canteenSelect = document.getElementById('canteenSelect');
const crowdLevelInput = document.getElementById('crowdLevel');
const imageUpload = document.getElementById('imageUpload');
const aiHint = document.getElementById('aiHint');
const reportForm = document.getElementById('reportForm');
const submitBtn = reportForm.querySelector('button[type="submit"]');
const canteenCards = document.getElementById('canteenCards');
const campusMap = document.getElementById('campusMap');
const formFeedback = document.getElementById('formFeedback');

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

// ============================================
// BACKEND API FUNCTIONS
// ============================================

/**
 * Submit a crowd report to the backend
 */
async function submitReport(canteenId, crowdLevel) {
    try {
        const response = await fetch(`${API_BASE}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                canteen_id: canteenId,
                crowd_level: crowdLevel,
                source: 'manual'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Report submitted:', data);
        return data;
    } catch (error) {
        console.error('❌ Submit report error:', error);
        throw error;
    }
}

/**
 * Fetch all canteens' crowd status from backend
 */
async function fetchAllCanteensStatus() {
    try {
        const response = await fetch(`${API_BASE}/canteens/status`);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);

        const data = await response.json();
        return data.data || []; // Returns array of canteen status objects
    } catch (error) {
        console.error('❌ Fetch canteens status error:', error);
        return []; // Return empty array on error
    }
}

/**
 * Fetch single canteen details from backend
 */
async function fetchCanteenDetails(canteenId) {
    try {
        const response = await fetch(`${API_BASE}/canteens/${canteenId}`);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`❌ Fetch canteen ${canteenId} error:`, error);
        return null;
    }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Convert backend status level to display format
 */
function normalizeLevel(level) {
    if (!level) return 'unknown';
    const normalized = level.toLowerCase();
    if (['low', 'medium', 'high'].includes(normalized)) return normalized;
    return 'unknown';
}

/**
 * Format relative time
 */
function formatRelativeTime(isoString) {
    if (!isoString || isoString === 'Never') return 'No data';

    try {
        const date = new Date(isoString);
        const now = new Date();
        const deltaSec = Math.max(0, Math.round((now - date) / 1000));

        if (deltaSec < 60) return `${deltaSec}s ago`;
        const mins = Math.round(deltaSec / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.round(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.round(hrs / 24)}d ago`;
    } catch {
        return 'Unknown';
    }
}

/**
 * Map canteen name to ID
 */
function getCanteenId(canteenName) {
    const index = canteens.indexOf(canteenName);
    return index >= 0 ? String(index + 1) : null;
}

/**
 * Get canteen name by ID
 */
function getCanteenName(canteenId) {
    const index = parseInt(canteenId) - 1;
    return canteens[index] || null;
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Render canteen status cards
 */
function renderCanteenCards(statusArray) {
    if (!canteenCards) return;

    canteenCards.innerHTML = '';

    statusArray.forEach((status) => {
        const card = document.createElement('div');
        card.className = `canteen-card ${normalizeLevel(status.current_status)}`;

        const confidence = Math.round((status.confidence || 0) * 100);
        const timeStr = formatRelativeTime(status.last_updated);

        card.innerHTML = `
      <div class="card-header">
        <h3>${status.name}</h3>
        <span class="status-badge ${normalizeLevel(status.current_status)}">
          ${(status.current_status || 'Unknown').toUpperCase()}
        </span>
      </div>
      <div class="card-body">
        <div class="stat">
          <span class="label">Confidence:</span>
          <span class="value">${confidence}%</span>
        </div>
        <div class="stat">
          <span class="label">Reports:</span>
          <span class="value">${status.report_count || 0}</span>
        </div>
        <div class="stat">
          <span class="label">Last Updated:</span>
          <span class="value">${timeStr}</span>
        </div>
      </div>
    `;

        canteenCards.appendChild(card);
    });
}

/**
 * Render campus map
 */
function renderCampusMap(statusArray) {
    if (!campusMap) return;

    campusMap.innerHTML = '';

    mapCoordinates.forEach((point) => {
        const status = statusArray.find((s) => s.name === point.id);
        const level = normalizeLevel(status?.current_status || 'unknown');

        const dot = document.createElement('div');
        dot.className = `campus-dot ${level}`;
        dot.style.top = point.top;
        dot.style.left = point.left;
        dot.title = point.id;

        const label = document.createElement('div');
        label.className = 'campus-label';
        label.style.top = `calc(${point.top} + 16px)`;
        label.style.left = `calc(${point.left} + 16px)`;
        label.textContent = point.id.substring(0, 15) + (point.id.length > 15 ? '...' : '');

        campusMap.appendChild(dot);
        campusMap.appendChild(label);
    });
}

/**
 * Update admin analytics
 */
function updateAdminAnalytics(statusArray) {
    const totalReportsDiv = document.getElementById('totalReportsToday');
    const topCanteenDiv = document.getElementById('topCanteen');
    const tbody = document.querySelector('#canteenReportTable tbody');

    if (totalReportsDiv) {
        const totalReports = statusArray.reduce((sum, s) => sum + (s.report_count || 0), 0);
        totalReportsDiv.textContent = totalReports;
    }

    if (topCanteenDiv) {
        const topCanteen = statusArray.reduce((max, s) =>
            (s.report_count || 0) > (max.report_count || 0) ? s : max
        );
        topCanteenDiv.textContent = topCanteen && topCanteen.report_count > 0
            ? `${topCanteen.name} (${topCanteen.report_count})`
            : 'None';
    }

    if (tbody) {
        tbody.innerHTML = '';
        const sorted = [...statusArray].sort((a, b) => (b.report_count || 0) - (a.report_count || 0));

        sorted.forEach((status) => {
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${status.name}</td>
        <td>${status.report_count || 0}</td>
        <td>${normalizeLevel(status.current_status)}</td>
      `;
            tbody.appendChild(row);
        });
    }
}

/**
 * Refresh dashboard
 */
async function refreshDashboard() {
    console.log('🔄 Refreshing dashboard...');
    const statusArray = await fetchAllCanteensStatus();

    if (statusArray.length > 0) {
        renderCanteenCards(statusArray);
        renderCampusMap(statusArray);
        updateAdminAnalytics(statusArray);
    } else {
        console.warn('⚠️ No canteen data returned');
    }
}

// ============================================
// FORM HANDLING
// ============================================

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!canteenSelect.value || !crowdLevelInput.value) {
        showFeedback('Please select a canteen and crowd level', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const canteenId = getCanteenId(canteenSelect.value);
        const crowdLevel = crowdLevelInput.value.charAt(0).toUpperCase() +
            crowdLevelInput.value.slice(1);

        await submitReport(canteenId, crowdLevel);

        showFeedback('Report submitted successfully!', 'success');
        reportForm.reset();

        // Refresh dashboard after a short delay
        setTimeout(refreshDashboard, 1000);
    } catch (error) {
        showFeedback(`Error: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Report';
    }
}

/**
 * Show form feedback
 */
function showFeedback(message, type) {
    if (!formFeedback) return;

    formFeedback.textContent = message;
    formFeedback.className = `form-feedback ${type} show`;

    setTimeout(() => {
        formFeedback.classList.remove('show');
    }, 4000);
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize form
 */
function initializeForm() {
    if (canteenSelect) {
        canteenSelect.innerHTML = '<option value="">Select a canteen...</option>';
        canteens.forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            canteenSelect.appendChild(option);
        });
    }

    if (reportForm) {
        reportForm.addEventListener('submit', handleFormSubmit);
    }
}

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    initializeForm();
    refreshDashboard();

    // Auto-refresh every 30 seconds
    setInterval(refreshDashboard, REFRESH_INTERVAL_MS);
}

// Handle page navigation
function navigateTo(pageName) {
    const pages = document.querySelectorAll('[id$="Page"]');
    pages.forEach((page) => {
        page.style.display = page.id === `${pageName}Page` ? 'block' : 'none';
    });

    // Initialize dashboard when navigating to dashboard page
    if (pageName === 'dashboard') {
        initializeDashboard();
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Frontend initialized, connected to:', API_BASE);

    // Setup navigation buttons
    const navButtons = document.querySelectorAll('[data-page]');
    navButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(btn.dataset.page);
        });
    });

    // Initialize on landing page
    navigateTo('landing');
});

// Export for testing
window.campusFlow = {
    submitReport,
    fetchAllCanteensStatus,
    fetchCanteenDetails,
    refreshDashboard,
    navigateTo
};
