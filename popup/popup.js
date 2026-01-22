/**
 * Avails - Main Popup Controller
 * Orchestrates all components and handles user interactions
 */

// Application state
const AppState = {
  localTimezone: null,
  selectedTargetTimezones: [],
  calendarPicker: null,
  timezonePicker: null,
  favoritesManager: null,
  customStartDate: null
};

// DOM Elements
const Elements = {
  // Date selection
  btnThisWeek: null,
  btnNext7: null,
  btnCustom: null,
  customPanel: null,
  calendarContainer: null,
  numDaysSelect: null,
  btnApplyCustom: null,

  // Availability
  availabilityInput: null,

  // Timezone
  localTimezoneDisplay: null,
  selectedTimezonesContainer: null,
  timezoneSearch: null,
  timezoneDropdown: null,
  tzFavoritesList: null,
  tzAllList: null,
  favoriteChips: null,

  // Actions
  actionWithTz: null,
  actionNoTz: null,
  btnCreateSchedule: null,
  quickTzButtons: null,
  otherTzSelect: null,

  // Status
  statusMessage: null
};

/**
 * Initialize the application
 */
async function init() {
  // Cache DOM elements
  cacheElements();

  // Detect local timezone
  AppState.localTimezone = TimezoneManager.getLocalTimezone();
  Elements.localTimezoneDisplay.textContent = TimezoneManager.formatDisplay(AppState.localTimezone);

  // Initialize components
  await initCalendarPicker();
  await initTimezonePicker();
  await initFavoritesManager();

  // Populate other timezone select
  populateOtherTimezoneSelect();

  // Set up event listeners
  attachEventListeners();

  // Update action buttons
  updateActionButtons();
}

/**
 * Cache all DOM element references
 */
function cacheElements() {
  Elements.btnThisWeek = document.getElementById('btn-this-week');
  Elements.btnNext7 = document.getElementById('btn-next-7');
  Elements.btnCustom = document.getElementById('btn-custom');
  Elements.customPanel = document.getElementById('custom-panel');
  Elements.calendarContainer = document.getElementById('calendar-container');
  Elements.numDaysSelect = document.getElementById('num-days');
  Elements.btnApplyCustom = document.getElementById('btn-apply-custom');

  Elements.availabilityInput = document.getElementById('availability-input');

  Elements.localTimezoneDisplay = document.getElementById('local-timezone');
  Elements.selectedTimezonesContainer = document.getElementById('selected-timezones');
  Elements.timezoneSearch = document.getElementById('timezone-search');
  Elements.timezoneDropdown = document.getElementById('timezone-dropdown');
  Elements.tzFavoritesList = document.getElementById('tz-favorites-list');
  Elements.tzAllList = document.getElementById('tz-all-list');
  Elements.favoriteChips = document.getElementById('favorite-chips');

  Elements.actionWithTz = document.getElementById('action-with-tz');
  Elements.actionNoTz = document.getElementById('action-no-tz');
  Elements.btnCreateSchedule = document.getElementById('btn-create-schedule');
  Elements.quickTzButtons = document.getElementById('quick-tz-buttons');
  Elements.otherTzSelect = document.getElementById('other-tz-select');

  Elements.statusMessage = document.getElementById('status-message');
}

/**
 * Initialize the calendar picker component
 */
async function initCalendarPicker() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  AppState.calendarPicker = new CalendarPicker(Elements.calendarContainer, {
    minDate: tomorrow,
    onSelect: (date) => {
      AppState.customStartDate = date;
    }
  });
}

/**
 * Initialize the timezone picker component
 */
async function initTimezonePicker() {
  AppState.timezonePicker = new TimezonePicker({
    searchInput: Elements.timezoneSearch,
    dropdown: Elements.timezoneDropdown,
    favoritesList: Elements.tzFavoritesList,
    allList: Elements.tzAllList,
    selectedContainer: Elements.selectedTimezonesContainer,
    maxSelections: 2,
    onSelect: (selected) => {
      AppState.selectedTargetTimezones = selected;
      updateActionButtons();
    },
    onFavoriteToggle: (favorites) => {
      // Refresh favorites chips and quick buttons
      if (AppState.favoritesManager) {
        AppState.favoritesManager.refresh();
      }
      updateQuickTimezoneButtons();
    }
  });
}

/**
 * Initialize the favorites manager component
 */
async function initFavoritesManager() {
  AppState.favoritesManager = new FavoritesManager({
    container: Elements.favoriteChips,
    maxDisplay: 5,
    onSelect: (tzId) => {
      // Add to selected timezones
      if (!AppState.selectedTargetTimezones.includes(tzId)) {
        if (AppState.selectedTargetTimezones.length >= 2) {
          AppState.selectedTargetTimezones.shift();
        }
        AppState.selectedTargetTimezones.push(tzId);
        AppState.timezonePicker.setSelectedTimezones(AppState.selectedTargetTimezones);
        updateActionButtons();
      }
    }
  });

  // Also set up quick timezone buttons
  updateQuickTimezoneButtons();
}

/**
 * Populate the "Other timezone" select dropdown
 */
function populateOtherTimezoneSelect() {
  const popular = TimezoneManager.getPopularTimezones();
  const allTimezones = TimezoneManager.getAllTimezones();

  let html = '<option value="">Other timezone...</option>';
  html += '<optgroup label="Popular">';

  popular.forEach(tzId => {
    const display = TimezoneManager.formatDisplay(tzId);
    html += `<option value="${tzId}">${display}</option>`;
  });

  html += '</optgroup>';
  html += '<optgroup label="All Timezones">';

  allTimezones.forEach(tzId => {
    if (!popular.includes(tzId)) {
      const display = TimezoneManager.formatDisplay(tzId);
      html += `<option value="${tzId}">${display}</option>`;
    }
  });

  html += '</optgroup>';

  Elements.otherTzSelect.innerHTML = html;
}

/**
 * Update the quick timezone buttons based on favorites
 */
async function updateQuickTimezoneButtons() {
  const topFavorites = await StorageManager.getTopFavorites(3);

  if (topFavorites.length === 0) {
    Elements.quickTzButtons.innerHTML = '<span class="no-quick-tz">Select a timezone above or from "Other"</span>';
    return;
  }

  const html = topFavorites.map(fav => {
    const shortName = TimezoneManager.getShortName(fav.id);
    return `
      <button type="button" class="btn btn-primary quick-tz-btn" data-timezone="${fav.id}">
        Create: ${shortName}
      </button>
    `;
  }).join('');

  Elements.quickTzButtons.innerHTML = html;

  // Attach click handlers
  Elements.quickTzButtons.querySelectorAll('.quick-tz-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tzId = btn.dataset.timezone;
      generateAndCopySchedule([tzId]);
    });
  });
}

/**
 * Update which action buttons are shown
 */
function updateActionButtons() {
  if (AppState.selectedTargetTimezones.length > 0) {
    // Show single "Create Schedule" button
    Elements.actionWithTz.classList.remove('hidden');
    Elements.actionNoTz.classList.add('hidden');
  } else {
    // Show quick timezone buttons
    Elements.actionWithTz.classList.add('hidden');
    Elements.actionNoTz.classList.remove('hidden');
  }
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
  // Date selection buttons
  Elements.btnThisWeek.addEventListener('click', () => generateThisWeekDates());
  Elements.btnNext7.addEventListener('click', () => generateNext7Days());
  Elements.btnCustom.addEventListener('click', () => toggleCustomPanel());
  Elements.btnApplyCustom.addEventListener('click', () => applyCustomDates());

  // Create schedule button
  Elements.btnCreateSchedule.addEventListener('click', () => {
    generateAndCopySchedule(AppState.selectedTargetTimezones);
  });

  // Other timezone select
  Elements.otherTzSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      generateAndCopySchedule([e.target.value]);
      e.target.value = ''; // Reset select
    }
  });
}

/**
 * Generate dates for remaining days this week
 */
function generateThisWeekDates() {
  const dates = DateGenerator.getRemainingWeekDays();

  if (dates.length === 0) {
    showStatus('No business days remaining this week', 'info');
    return;
  }

  const content = DateGenerator.generateDateLines(dates);
  Elements.availabilityInput.value = content;
  Elements.availabilityInput.focus();

  // Update button states
  setActiveButton(Elements.btnThisWeek);
  hideCustomPanel();
}

/**
 * Generate dates for next 7 business days
 */
function generateNext7Days() {
  const dates = DateGenerator.getNextBusinessDays(7);
  const content = DateGenerator.generateDateLines(dates);
  Elements.availabilityInput.value = content;
  Elements.availabilityInput.focus();

  // Update button states
  setActiveButton(Elements.btnNext7);
  hideCustomPanel();
}

/**
 * Toggle the custom date panel
 */
function toggleCustomPanel() {
  const isHidden = Elements.customPanel.classList.contains('hidden');

  if (isHidden) {
    Elements.customPanel.classList.remove('hidden');
    setActiveButton(Elements.btnCustom);
  } else {
    hideCustomPanel();
    clearActiveButtons();
  }
}

/**
 * Hide the custom panel
 */
function hideCustomPanel() {
  Elements.customPanel.classList.add('hidden');
}

/**
 * Apply custom date selection
 */
function applyCustomDates() {
  if (!AppState.customStartDate) {
    showStatus('Please select a start date', 'error');
    return;
  }

  const numDays = parseInt(Elements.numDaysSelect.value, 10);
  const dates = DateGenerator.getCustomDays(AppState.customStartDate, numDays);
  const content = DateGenerator.generateDateLines(dates);

  Elements.availabilityInput.value = content;
  Elements.availabilityInput.focus();
  hideCustomPanel();
}

/**
 * Set the active state on a date button
 */
function setActiveButton(button) {
  clearActiveButtons();
  button.classList.add('active');
}

/**
 * Clear active state from all date buttons
 */
function clearActiveButtons() {
  Elements.btnThisWeek.classList.remove('active');
  Elements.btnNext7.classList.remove('active');
  Elements.btnCustom.classList.remove('active');
}

/**
 * Generate schedule and copy to clipboard
 */
async function generateAndCopySchedule(targetTimezones) {
  const inputContent = Elements.availabilityInput.value.trim();

  if (!inputContent) {
    showStatus('Please enter your availability first', 'error');
    return;
  }

  const result = await OutputFormatter.generateAndCopy(
    inputContent,
    AppState.localTimezone,
    targetTimezones
  );

  if (result.success) {
    showStatus('Copied to clipboard!', 'success');

    // Track usage of target timezones
    for (const tz of targetTimezones) {
      await StorageManager.trackUsage(tz);
    }
  } else {
    showStatus(result.error || 'Failed to generate schedule', 'error');
  }
}

/**
 * Show a status message
 */
function showStatus(message, type = 'info') {
  Elements.statusMessage.textContent = message;
  Elements.statusMessage.className = `status-message ${type}`;
  Elements.statusMessage.classList.remove('hidden');

  // Auto-hide after 3 seconds
  setTimeout(() => {
    Elements.statusMessage.classList.add('hidden');
  }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
