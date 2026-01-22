/**
 * Avails - Side Panel Controller
 * Comprehensive update with favorites, date-based persistence, and improved UX
 */

// Application State
const AppState = {
  localTimezone: null,
  favoriteTimezones: [],         // User's favorite timezones (persisted)
  selectedTimezones: [],         // Currently selected additional timezones
  currentDates: [],
  savedInputsByDate: {},         // Persist inputs by date string: { "2026-01-15": "10-11 AM" }
  generatedOutput: null,
  currentMode: '5-days',         // '5-days', '10-days', 'custom'
  customStartDate: null,
  customEndDate: null,
  showFavoritesEditor: false,
  showMyTimezoneEditor: false,
  // Calendar state
  startCalendarMonth: new Date(),  // Current month being shown in start calendar
  endCalendarMonth: new Date(),    // Current month being shown in end calendar
  activeCalendar: null             // 'start' or 'end' - which calendar is open
};

// Major global timezones for dropdown (city name, timezone ID, searchable terms)
const GLOBAL_TIMEZONES = [
  // US Timezones (with region names for favorites display)
  { city: 'New York', id: 'America/New_York', region: 'Americas', regionName: 'Eastern', searchTerms: ['eastern', 'est', 'edt', 'et', 'new york', 'nyc', 'boston', 'miami', 'atlanta'] },
  { city: 'Chicago', id: 'America/Chicago', region: 'Americas', regionName: 'Central', searchTerms: ['central', 'cst', 'cdt', 'ct', 'chicago', 'dallas', 'houston'] },
  { city: 'Denver', id: 'America/Denver', region: 'Americas', regionName: 'Mountain', searchTerms: ['mountain', 'mst', 'mdt', 'mt', 'denver', 'salt lake'] },
  { city: 'Los Angeles', id: 'America/Los_Angeles', region: 'Americas', regionName: 'Pacific', searchTerms: ['pacific', 'pst', 'pdt', 'pt', 'los angeles', 'la', 'san francisco', 'seattle'] },
  { city: 'Phoenix', id: 'America/Phoenix', region: 'Americas', regionName: 'Arizona', searchTerms: ['arizona', 'mst', 'phoenix'] },
  // Other Americas
  { city: 'Toronto', id: 'America/Toronto', region: 'Americas', searchTerms: ['toronto', 'canada', 'ontario'] },
  { city: 'Vancouver', id: 'America/Vancouver', region: 'Americas', searchTerms: ['vancouver', 'canada', 'bc'] },
  { city: 'Mexico City', id: 'America/Mexico_City', region: 'Americas', searchTerms: ['mexico', 'cdmx'] },
  { city: 'São Paulo', id: 'America/Sao_Paulo', region: 'Americas', searchTerms: ['sao paulo', 'brazil', 'brasil'] },
  { city: 'Buenos Aires', id: 'America/Argentina/Buenos_Aires', region: 'Americas', searchTerms: ['buenos aires', 'argentina'] },
  // Europe
  { city: 'London', id: 'Europe/London', region: 'Europe', searchTerms: ['london', 'uk', 'gmt', 'bst', 'britain', 'england'] },
  { city: 'Paris', id: 'Europe/Paris', region: 'Europe', searchTerms: ['paris', 'france', 'cet', 'cest'] },
  { city: 'Berlin', id: 'Europe/Berlin', region: 'Europe', searchTerms: ['berlin', 'germany', 'cet', 'cest'] },
  { city: 'Amsterdam', id: 'Europe/Amsterdam', region: 'Europe', searchTerms: ['amsterdam', 'netherlands', 'holland'] },
  { city: 'Madrid', id: 'Europe/Madrid', region: 'Europe', searchTerms: ['madrid', 'spain'] },
  { city: 'Rome', id: 'Europe/Rome', region: 'Europe', searchTerms: ['rome', 'italy'] },
  { city: 'Zurich', id: 'Europe/Zurich', region: 'Europe', searchTerms: ['zurich', 'switzerland'] },
  { city: 'Stockholm', id: 'Europe/Stockholm', region: 'Europe', searchTerms: ['stockholm', 'sweden'] },
  { city: 'Dublin', id: 'Europe/Dublin', region: 'Europe', searchTerms: ['dublin', 'ireland'] },
  { city: 'Lisbon', id: 'Europe/Lisbon', region: 'Europe', searchTerms: ['lisbon', 'portugal'] },
  { city: 'Moscow', id: 'Europe/Moscow', region: 'Europe', searchTerms: ['moscow', 'russia'] },
  // Asia & Middle East
  { city: 'Dubai', id: 'Asia/Dubai', region: 'Asia', searchTerms: ['dubai', 'uae', 'emirates'] },
  { city: 'Mumbai', id: 'Asia/Kolkata', region: 'Asia', searchTerms: ['mumbai', 'india', 'ist', 'delhi', 'bangalore'] },
  { city: 'Singapore', id: 'Asia/Singapore', region: 'Asia', searchTerms: ['singapore', 'sgt'] },
  { city: 'Hong Kong', id: 'Asia/Hong_Kong', region: 'Asia', searchTerms: ['hong kong', 'hkt'] },
  { city: 'Shanghai', id: 'Asia/Shanghai', region: 'Asia', searchTerms: ['shanghai', 'china', 'beijing', 'cst'] },
  { city: 'Tokyo', id: 'Asia/Tokyo', region: 'Asia', searchTerms: ['tokyo', 'japan', 'jst'] },
  { city: 'Seoul', id: 'Asia/Seoul', region: 'Asia', searchTerms: ['seoul', 'korea', 'kst'] },
  { city: 'Bangkok', id: 'Asia/Bangkok', region: 'Asia', searchTerms: ['bangkok', 'thailand'] },
  { city: 'Jakarta', id: 'Asia/Jakarta', region: 'Asia', searchTerms: ['jakarta', 'indonesia'] },
  { city: 'Tel Aviv', id: 'Asia/Tel_Aviv', region: 'Asia', searchTerms: ['tel aviv', 'israel', 'jerusalem'] },
  // Oceania
  { city: 'Sydney', id: 'Australia/Sydney', region: 'Oceania', searchTerms: ['sydney', 'australia', 'aest', 'aedt'] },
  { city: 'Melbourne', id: 'Australia/Melbourne', region: 'Oceania', searchTerms: ['melbourne', 'australia'] },
  { city: 'Auckland', id: 'Pacific/Auckland', region: 'Oceania', searchTerms: ['auckland', 'new zealand', 'nzst', 'nzdt'] },
  { city: 'Perth', id: 'Australia/Perth', region: 'Oceania', searchTerms: ['perth', 'australia', 'awst'] },
  // Africa
  { city: 'Johannesburg', id: 'Africa/Johannesburg', region: 'Africa', searchTerms: ['johannesburg', 'south africa'] },
  { city: 'Cairo', id: 'Africa/Cairo', region: 'Africa', searchTerms: ['cairo', 'egypt'] },
  { city: 'Lagos', id: 'Africa/Lagos', region: 'Africa', searchTerms: ['lagos', 'nigeria'] }
];

// All major US timezones (for generating defaults)
const US_TIMEZONES = [
  'America/Los_Angeles',  // Pacific (PT)
  'America/Denver',       // Mountain (MT)
  'America/Chicago',      // Central (CT)
  'America/New_York'      // Eastern (ET)
];

/**
 * Get default favorites for a user based on their local timezone
 * US users: get the other 3 US timezones (excluding their local)
 * International users: no default favorites
 */
function getDefaultFavorites(localTimezone) {
  if (isUSTimezone(localTimezone)) {
    // Find which US timezone matches the user's local timezone
    const matchingUSZone = US_TIMEZONES.find(tz => {
      // Check if local timezone matches or is equivalent
      if (tz === localTimezone) return true;
      // Check by offset for edge cases like America/Detroit = America/New_York
      const localOffset = TimezoneManager.getOffsetMinutes(localTimezone, new Date());
      const usOffset = TimezoneManager.getOffsetMinutes(tz, new Date());
      return localOffset === usOffset;
    });

    // Return the other 3 US timezones (excluding the matching one)
    if (matchingUSZone) {
      return US_TIMEZONES.filter(tz => tz !== matchingUSZone);
    }

    // If no exact match, just return all 4 and let the display filter out local
    return [...US_TIMEZONES];
  }

  // International users: no default favorites
  return [];
}

// Business hours (for warnings)
const BUSINESS_HOURS = { start: 9, end: 17 }; // 9 AM to 5 PM

// Maximum favorites
const MAX_FAVORITES = 3;

// DOM Elements
const Elements = {};

/**
 * Sort timezones from west to east (most negative offset to most positive)
 * This puts earliest times first (e.g., PT before MT before CT before ET)
 */
function sortTimezonesWestToEast(timezones, date = new Date()) {
  return [...timezones].sort((a, b) => {
    const offsetA = TimezoneManager.getOffsetMinutes(a, date);
    const offsetB = TimezoneManager.getOffsetMinutes(b, date);
    // Sort from most negative (west) to most positive (east)
    return offsetA - offsetB;
  });
}

/**
 * Initialize the application
 */
async function init() {
  cacheElements();
  detectLocalTimezone();
  await loadSavedData();
  updateMyTimezoneDisplay();
  renderFavoriteChips();
  setupMyTimezoneDropdown();
  setupSearchableDropdown();
  attachEventListeners();
  initializeCalendarMonths();

  // Auto-load "Next 5 Days" on start
  selectDateRange(5);
}

/**
 * Cache DOM elements
 */
function cacheElements() {
  // Header - My Timezone dropdown
  Elements.myTzMultiSelect = document.getElementById('my-tz-multi-select');
  Elements.myTimezoneDisplay = document.getElementById('my-timezone-display');
  Elements.myTzSearchInput = document.getElementById('my-tz-search-input');
  Elements.myTzDropdownList = document.getElementById('my-tz-dropdown-list');

  // Segment buttons
  Elements.btn5Days = document.getElementById('btn-5-days');
  Elements.btn10Days = document.getElementById('btn-10-days');
  Elements.btnCustom = document.getElementById('btn-custom');

  // Custom date panel
  Elements.customPanel = document.getElementById('custom-panel');
  Elements.customError = document.getElementById('custom-error');
  Elements.startDateDisplay = document.getElementById('start-date-display');
  Elements.startDateCalendar = document.getElementById('start-date-calendar');
  Elements.endDateDisplay = document.getElementById('end-date-display');
  Elements.endDateCalendar = document.getElementById('end-date-calendar');

  // Date rows
  Elements.dateRows = document.getElementById('date-rows');
  Elements.validationMessages = document.getElementById('validation-messages');

  // Clear Times button and popup
  Elements.clearTimesBtn = document.getElementById('clear-times-btn');
  Elements.clearTimesPopup = document.getElementById('clear-times-popup');
  Elements.clearConfirmYes = document.getElementById('clear-confirm-yes');
  Elements.clearConfirmNo = document.getElementById('clear-confirm-no');

  // Favorites section
  Elements.favoritesSection = document.getElementById('favorites-section');
  Elements.favoriteChips = document.getElementById('favorite-chips');
  Elements.editFavoritesBtn = document.getElementById('edit-favorites-btn');

  // Additional timezones
  Elements.tzSelectedTags = document.getElementById('tz-selected-tags');
  Elements.tzSearchInput = document.getElementById('tz-search-input');
  Elements.tzDropdownList = document.getElementById('tz-dropdown-list');

  // Footer
  Elements.btnGenerate = document.getElementById('btn-generate');
  Elements.outputSection = document.getElementById('output-section');
  Elements.outputPreview = document.getElementById('output-preview');
  Elements.btnCopy = document.getElementById('btn-copy');
  Elements.statusMessage = document.getElementById('status-message');

  // Favorites editor modal
  Elements.favoritesEditor = document.getElementById('favorites-editor');
  Elements.favoritesEditorList = document.getElementById('favorites-editor-list');
  Elements.closeFavoritesEditor = document.getElementById('close-favorites-editor');
  Elements.favoritesSearchInput = document.getElementById('favorites-search-input');
}

/**
 * Detect local timezone
 */
function detectLocalTimezone() {
  AppState.localTimezone = TimezoneManager.getLocalTimezone();
}

/**
 * Check if user is in a US timezone
 */
function isUSTimezone(tzId) {
  const usZones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                   'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Detroit',
                   'America/Indianapolis', 'America/Boise'];
  return usZones.some(uz => tzId && tzId.includes(uz.split('/')[1]));
}

/**
 * Load saved data from chrome.storage
 */
async function loadSavedData() {
  try {
    const result = await chrome.storage.sync.get(['favoriteTimezones', 'savedInputsByDate', 'localTimezone', 'hasInitializedFavorites']);

    if (result.favoriteTimezones && Array.isArray(result.favoriteTimezones)) {
      // Filter to only valid string timezone IDs
      AppState.favoriteTimezones = result.favoriteTimezones.filter(
        tz => typeof tz === 'string' && tz.length > 0
      );
    }

    if (result.savedInputsByDate && typeof result.savedInputsByDate === 'object') {
      AppState.savedInputsByDate = result.savedInputsByDate;
    }

    if (result.localTimezone && typeof result.localTimezone === 'string') {
      AppState.localTimezone = result.localTimezone;
    }

    // Set default favorites for first-time users based on their location
    if (!result.hasInitializedFavorites) {
      AppState.favoriteTimezones = getDefaultFavorites(AppState.localTimezone);
      await chrome.storage.sync.set({
        favoriteTimezones: AppState.favoriteTimezones,
        hasInitializedFavorites: true
      });
    }
  } catch (err) {
    console.log('Storage not available, using defaults');
    // Still set defaults based on location even without storage
    AppState.favoriteTimezones = getDefaultFavorites(AppState.localTimezone);
  }
}

/**
 * Save data to chrome.storage
 */
async function saveData() {
  try {
    await chrome.storage.sync.set({
      favoriteTimezones: AppState.favoriteTimezones,
      savedInputsByDate: AppState.savedInputsByDate,
      localTimezone: AppState.localTimezone
    });
  } catch (err) {
    console.log('Could not save to storage');
  }
}

/**
 * Update "My Timezone" display text
 */
function updateMyTimezoneDisplay() {
  const tzInfo = GLOBAL_TIMEZONES.find(tz => tz.id === AppState.localTimezone);
  const displayName = tzInfo ? (tzInfo.regionName || tzInfo.city) : AppState.localTimezone.split('/').pop().replace(/_/g, ' ');
  const shortName = getTimezoneAbbreviation(AppState.localTimezone);
  Elements.myTimezoneDisplay.textContent = `${displayName} (${shortName})`;
}

/**
 * Setup My Timezone dropdown
 */
function setupMyTimezoneDropdown() {
  // Click on input area focuses search
  Elements.myTzMultiSelect.addEventListener('click', () => {
    Elements.myTzSearchInput.focus();
  });

  // Search input handlers
  Elements.myTzSearchInput.addEventListener('focus', () => showMyTzDropdown());
  Elements.myTzSearchInput.addEventListener('input', (e) => filterMyTzDropdown(e.target.value));

  // Enter key selects first visible item
  Elements.myTzSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstItem = Elements.myTzDropdownList.querySelector('.my-tz-dropdown-item');
      if (firstItem) {
        selectMyTimezone(firstItem.dataset.tz);
      }
    } else if (e.key === 'Escape') {
      hideMyTzDropdown();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.my-tz-dropdown-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      hideMyTzDropdown();
    }
  });
}

/**
 * Show My Timezone dropdown
 */
function showMyTzDropdown() {
  Elements.myTzDropdownList.classList.remove('hidden');
  filterMyTzDropdown(Elements.myTzSearchInput.value);
}

/**
 * Hide My Timezone dropdown
 */
function hideMyTzDropdown() {
  Elements.myTzDropdownList.classList.add('hidden');
  Elements.myTzSearchInput.value = '';
}

/**
 * Filter My Timezone dropdown
 */
function filterMyTzDropdown(query) {
  populateMyTzDropdown(query.toLowerCase().trim());
}

/**
 * Populate My Timezone dropdown
 */
function populateMyTzDropdown(query) {
  const filtered = searchTimezones(query);

  if (filtered.length === 0) {
    Elements.myTzDropdownList.innerHTML = '<div class="my-tz-dropdown-empty">No timezones found</div>';
    return;
  }

  const html = filtered.map(tz => {
    const displayName = tz.regionName || tz.city;
    const shortName = getTimezoneAbbreviation(tz.id);
    const offset = TimezoneManager.getOffset(tz.id);
    const isCurrent = tz.id === AppState.localTimezone;

    return `
      <div class="my-tz-dropdown-item ${isCurrent ? 'is-current' : ''}" data-tz="${tz.id}">
        <div class="my-tz-dropdown-item-left">
          <span class="my-tz-dropdown-item-name">${displayName}</span>
          <span class="my-tz-dropdown-item-offset">${tz.city} - ${shortName} (${offset})</span>
        </div>
      </div>
    `;
  }).join('');

  Elements.myTzDropdownList.innerHTML = html;

  // Attach click handlers
  Elements.myTzDropdownList.querySelectorAll('.my-tz-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      selectMyTimezone(item.dataset.tz);
    });
  });
}

/**
 * Select a timezone as "My Timezone"
 */
function selectMyTimezone(tzId) {
  AppState.localTimezone = tzId;
  updateMyTimezoneDisplay();
  renderFavoriteChips();
  saveData();
  hideMyTzDropdown();
  updateGenerateButtonState();
}

/**
 * Get timezone abbreviation (like EST, CST, PST) - never GMT offset
 * Falls back to region name or city if no abbreviation available
 */
function getTimezoneAbbreviation(tzId, date = new Date()) {
  // First try to get from our known timezone data
  const tzInfo = GLOBAL_TIMEZONES.find(tz => tz.id === tzId);

  // Get the Intl short name
  const intlShortName = TimezoneManager.getShortName(tzId, date);

  // If it's a proper abbreviation (letters only, 2-5 chars), use it
  if (/^[A-Z]{2,5}$/.test(intlShortName)) {
    return intlShortName;
  }

  // If it's a GMT offset like "GMT-5", try to find a better name
  if (tzInfo) {
    // Use region name if available (for US timezones)
    if (tzInfo.regionName) {
      // Map region names to common abbreviations based on DST
      const isDST = isDaylightSavingTime(tzId, date);
      const abbrevMap = {
        'Eastern': isDST ? 'EDT' : 'EST',
        'Central': isDST ? 'CDT' : 'CST',
        'Mountain': isDST ? 'MDT' : 'MST',
        'Pacific': isDST ? 'PDT' : 'PST',
        'Arizona': 'MST' // Arizona doesn't observe DST
      };
      if (abbrevMap[tzInfo.regionName]) {
        return abbrevMap[tzInfo.regionName];
      }
    }

    // Try to get from search terms (abbreviations are usually there)
    if (tzInfo.searchTerms) {
      const abbrevTerms = tzInfo.searchTerms.filter(t => /^[a-z]{2,4}t?$/i.test(t));
      if (abbrevTerms.length > 0) {
        // Return the first abbreviation-like term, uppercase
        return abbrevTerms[0].toUpperCase();
      }
    }

    // Use city name as last resort
    return tzInfo.city;
  }

  // If all else fails, extract city from timezone ID
  if (tzId.includes('/')) {
    return tzId.split('/').pop().replace(/_/g, ' ');
  }

  return intlShortName;
}

/**
 * Check if a timezone is currently in daylight saving time
 */
function isDaylightSavingTime(tzId, date = new Date()) {
  // Get the offset for January (standard time) and July (daylight time)
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);

  const janOffset = TimezoneManager.getOffsetMinutes(tzId, jan);
  const julOffset = TimezoneManager.getOffsetMinutes(tzId, jul);
  const currentOffset = TimezoneManager.getOffsetMinutes(tzId, date);

  // Northern hemisphere: July has larger (more positive) offset during DST
  // Southern hemisphere: January has larger offset during DST
  const standardOffset = Math.min(janOffset, julOffset);

  return currentOffset !== standardOffset;
}

/**
 * Get display name for a timezone (region name if available, otherwise city)
 */
function getTimezoneDisplayName(tzId) {
  const tzInfo = GLOBAL_TIMEZONES.find(tz => tz.id === tzId);
  if (tzInfo && tzInfo.regionName) {
    return tzInfo.regionName;
  }
  if (tzInfo) {
    return tzInfo.city;
  }
  return tzId.includes('/') ? tzId.split('/').pop().replace(/_/g, ' ') : tzId;
}

/**
 * Render favorite timezone chips
 */
function renderFavoriteChips() {
  // Filter to only valid string timezone IDs
  const validFavorites = AppState.favoriteTimezones.filter(tz => typeof tz === 'string' && tz.length > 0);

  if (validFavorites.length === 0) {
    Elements.favoriteChips.innerHTML = '<span class="no-favorites">No favorites yet - click Edit to add</span>';
    return;
  }

  // Filter out local timezone from display
  const displayFavorites = validFavorites.filter(tz => tz !== AppState.localTimezone);

  if (displayFavorites.length === 0) {
    Elements.favoriteChips.innerHTML = '<span class="no-favorites">No favorites yet - click Edit to add</span>';
    return;
  }

  // Sort favorites west to east (for consistent display order)
  const sortedFavorites = sortTimezonesWestToEast(displayFavorites);

  const html = sortedFavorites.map(tzId => {
    const displayName = getTimezoneDisplayName(tzId);
    const shortName = getTimezoneAbbreviation(tzId);
    const isSelected = AppState.selectedTimezones.includes(tzId);

    return `<button type="button" class="tz-chip ${isSelected ? 'active' : ''}" data-tz="${tzId}">${displayName} (${shortName})</button>`;
  }).join('');

  Elements.favoriteChips.innerHTML = html;

  // Attach handlers
  Elements.favoriteChips.querySelectorAll('.tz-chip').forEach(chip => {
    chip.addEventListener('click', () => toggleSelectedTimezone(chip.dataset.tz, chip));
  });
}

/**
 * Toggle a timezone selection
 */
function toggleSelectedTimezone(tzId, chipElement = null) {
  const index = AppState.selectedTimezones.indexOf(tzId);

  if (index > -1) {
    // Removing - no duplicate check needed
    AppState.selectedTimezones.splice(index, 1);
    if (chipElement) chipElement.classList.remove('active');
  } else {
    // Adding - check for duplicate offset
    const duplicateTz = findDuplicateTimezoneByOffset(tzId);
    if (duplicateTz) {
      const duplicateName = getTimezoneShortDisplay(duplicateTz);
      const newName = getTimezoneShortDisplay(tzId);
      showStatus(`${newName} has the same timezone as ${duplicateName}`, 'info');
      return;
    }

    AppState.selectedTimezones.push(tzId);
    if (chipElement) chipElement.classList.add('active');
  }

  renderSelectedTags();
  updateGenerateButtonState();
  revalidateAllInputs(); // Re-check business hours warnings
}

/**
 * Setup searchable multi-select dropdown
 */
function setupSearchableDropdown() {
  // Click on input area focuses search
  document.getElementById('tz-multi-select').addEventListener('click', () => {
    Elements.tzSearchInput.focus();
  });

  // Search input handlers
  Elements.tzSearchInput.addEventListener('focus', () => showDropdown());
  Elements.tzSearchInput.addEventListener('input', (e) => filterDropdown(e.target.value));

  // Enter key selects first visible item
  Elements.tzSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstItem = Elements.tzDropdownList.querySelector('.tz-dropdown-item');
      if (firstItem) {
        selectDropdownTimezone(firstItem.dataset.tz);
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.tz-dropdown-wrapper');
    if (!wrapper.contains(e.target)) {
      hideDropdown();
    }
  });

  // Initial population
  populateDropdown('');
}

/**
 * Show the dropdown
 */
function showDropdown() {
  Elements.tzDropdownList.classList.remove('hidden');
  filterDropdown(Elements.tzSearchInput.value);
}

/**
 * Hide the dropdown
 */
function hideDropdown() {
  Elements.tzDropdownList.classList.add('hidden');
}

/**
 * Filter dropdown based on search
 */
function filterDropdown(query) {
  populateDropdown(query.toLowerCase().trim());
}

/**
 * Search timezones by query (city, timezone ID, abbreviation, or search terms)
 * Uses exact matching for short abbreviations (2-4 chars) to avoid false positives
 */
function searchTimezones(query, timezones = GLOBAL_TIMEZONES) {
  if (!query) return timezones;

  const lowerQuery = query.toLowerCase().trim();
  const isShortQuery = lowerQuery.length <= 4;

  return timezones.filter(tz => {
    // Match city name (always substring match)
    if (tz.city.toLowerCase().includes(lowerQuery)) return true;

    // Match timezone ID (always substring match)
    if (tz.id.toLowerCase().includes(lowerQuery)) return true;

    // Match region name (always substring match)
    if (tz.regionName && tz.regionName.toLowerCase().includes(lowerQuery)) return true;

    // For short queries (likely abbreviations), use exact word matching
    if (isShortQuery) {
      // Match abbreviation exactly
      const abbrev = getTimezoneAbbreviation(tz.id).toLowerCase();
      if (abbrev === lowerQuery) return true;

      // Match search terms exactly (for abbreviations like 'est', 'pst', etc.)
      if (tz.searchTerms) {
        // Only match if the search term equals the query exactly
        if (tz.searchTerms.some(term => term === lowerQuery)) return true;
      }
    } else {
      // For longer queries, use substring matching
      const abbrev = getTimezoneAbbreviation(tz.id).toLowerCase();
      if (abbrev.includes(lowerQuery)) return true;

      if (tz.searchTerms && tz.searchTerms.some(term => term.includes(lowerQuery))) return true;
    }

    return false;
  });
}

/**
 * Populate dropdown with timezone options
 */
function populateDropdown(query) {
  // Filter timezones based on query
  const filtered = searchTimezones(query);

  // Exclude already selected timezones and local timezone
  const excludeIds = [AppState.localTimezone, ...AppState.selectedTimezones];
  const available = filtered.filter(tz => !excludeIds.includes(tz.id));

  if (available.length === 0) {
    Elements.tzDropdownList.innerHTML = '<div class="tz-dropdown-empty">No timezones found</div>';
    return;
  }

  const html = available.map(tz => {
    const shortName = getTimezoneAbbreviation(tz.id);
    const offset = TimezoneManager.getOffset(tz.id);
    const isFavorite = AppState.favoriteTimezones.includes(tz.id);

    return `
      <div class="tz-dropdown-item" data-tz="${tz.id}">
        <div class="tz-dropdown-item-left">
          <span class="tz-dropdown-item-name">${tz.city}</span>
          <span class="tz-dropdown-item-offset">${shortName} (${offset})</span>
        </div>
        <button type="button" class="tz-star-btn ${isFavorite ? 'active' : ''}" data-tz="${tz.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
          ${isFavorite ? '★' : '☆'}
        </button>
      </div>
    `;
  }).join('');

  Elements.tzDropdownList.innerHTML = html;

  // Attach click handlers for selection
  Elements.tzDropdownList.querySelectorAll('.tz-dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't select if clicking the star
      if (e.target.classList.contains('tz-star-btn')) return;
      selectDropdownTimezone(item.dataset.tz);
    });
  });

  // Attach click handlers for stars
  Elements.tzDropdownList.querySelectorAll('.tz-star-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.tz);
    });
  });
}

/**
 * Toggle a timezone as favorite
 */
function toggleFavorite(tzId) {
  const index = AppState.favoriteTimezones.indexOf(tzId);

  if (index > -1) {
    // Remove from favorites
    AppState.favoriteTimezones.splice(index, 1);
    clearFavoritesWarning();
  } else {
    // Add to favorites (check limit - max 3 NOT including local timezone)
    const nonLocalFavorites = AppState.favoriteTimezones.filter(tz => tz !== AppState.localTimezone);
    if (nonLocalFavorites.length >= MAX_FAVORITES) {
      showFavoritesWarning(tzId);
      return;
    }
    AppState.favoriteTimezones.push(tzId);
    clearFavoritesWarning();
  }

  saveData();
  renderFavoriteChips();
  filterDropdown(Elements.tzSearchInput.value); // Refresh dropdown

  if (AppState.showFavoritesEditor) {
    renderFavoritesEditor();
  }
}

/**
 * Show max favorites warning inline above the star
 */
function showFavoritesWarning(tzId) {
  // Clear any existing warning
  clearFavoritesWarning();

  // Find the item and add warning
  const item = Elements.favoritesEditorList.querySelector(`.favorites-editor-star[data-tz="${tzId}"]`);
  if (item) {
    const parent = item.closest('.favorites-editor-item');
    if (parent) {
      const warning = document.createElement('div');
      warning.className = 'favorites-warning';
      warning.textContent = `Max ${MAX_FAVORITES} favorites`;
      parent.insertBefore(warning, item);

      // Auto-clear after 3 seconds
      setTimeout(() => clearFavoritesWarning(), 3000);
    }
  }
}

/**
 * Clear favorites warning
 */
function clearFavoritesWarning() {
  const existing = Elements.favoritesEditorList.querySelector('.favorites-warning');
  if (existing) existing.remove();
}

/**
 * Check if a timezone with the same UTC offset is already selected
 * Returns the existing timezone ID if duplicate found, null otherwise
 */
function findDuplicateTimezoneByOffset(tzId) {
  const newOffset = TimezoneManager.getOffsetMinutes(tzId, new Date());

  // Check against local timezone
  const localOffset = TimezoneManager.getOffsetMinutes(AppState.localTimezone, new Date());
  if (newOffset === localOffset) {
    return AppState.localTimezone;
  }

  // Check against already selected timezones
  for (const selectedTz of AppState.selectedTimezones) {
    const selectedOffset = TimezoneManager.getOffsetMinutes(selectedTz, new Date());
    if (newOffset === selectedOffset) {
      return selectedTz;
    }
  }

  return null;
}

/**
 * Get display name for timezone (for user-friendly messages)
 */
function getTimezoneShortDisplay(tzId) {
  const tzInfo = GLOBAL_TIMEZONES.find(tz => tz.id === tzId);
  const displayName = tzInfo ? (tzInfo.regionName || tzInfo.city) : tzId.split('/').pop().replace(/_/g, ' ');
  const shortName = getTimezoneAbbreviation(tzId);
  return `${displayName} (${shortName})`;
}

/**
 * Select a timezone from dropdown
 */
function selectDropdownTimezone(tzId) {
  if (!AppState.selectedTimezones.includes(tzId)) {
    // Check for duplicate offset
    const duplicateTz = findDuplicateTimezoneByOffset(tzId);
    if (duplicateTz) {
      const duplicateName = getTimezoneShortDisplay(duplicateTz);
      const newName = getTimezoneShortDisplay(tzId);
      showStatus(`${newName} has the same timezone as ${duplicateName}`, 'info');
      Elements.tzSearchInput.value = '';
      hideDropdown();
      return;
    }

    AppState.selectedTimezones.push(tzId);
    renderSelectedTags();
    renderFavoriteChips(); // Update chip active states
    Elements.tzSearchInput.value = '';
    hideDropdown();
    updateGenerateButtonState();
    revalidateAllInputs(); // Re-check business hours warnings
  }
}

/**
 * Remove a timezone from selection
 */
function removeSelectedTimezone(tzId) {
  AppState.selectedTimezones = AppState.selectedTimezones.filter(tz => tz !== tzId);
  renderSelectedTags();
  renderFavoriteChips(); // Update chip active states
  updateGenerateButtonState();
  revalidateAllInputs(); // Re-check business hours warnings
}

/**
 * Re-validate all inputs (for when timezones change)
 */
function revalidateAllInputs() {
  const inputs = Elements.dateRows.querySelectorAll('.time-input');
  inputs.forEach(input => {
    if (input.value.trim()) {
      validateSingleInput(input);
    }
  });
}

/**
 * Render selected timezone tags
 */
function renderSelectedTags() {
  // Only show tags for non-favorite selected timezones, filter for valid strings
  const nonFavoriteSelected = AppState.selectedTimezones.filter(
    tz => typeof tz === 'string' && tz.length > 0 && !AppState.favoriteTimezones.includes(tz)
  );

  if (nonFavoriteSelected.length === 0) {
    Elements.tzSelectedTags.innerHTML = '';
    return;
  }

  const html = nonFavoriteSelected.map(tzId => {
    const tzInfo = GLOBAL_TIMEZONES.find(tz => tz.id === tzId);
    const cityName = tzInfo ? tzInfo.city : (tzId.includes('/') ? tzId.split('/').pop().replace(/_/g, ' ') : tzId);
    const shortName = getTimezoneAbbreviation(tzId);

    return `
      <span class="tz-tag" data-tz="${tzId}">
        ${cityName} (${shortName})
        <span class="tz-tag-remove" data-tz="${tzId}">&times;</span>
      </span>
    `;
  }).join('');

  Elements.tzSelectedTags.innerHTML = html;

  // Attach remove handlers
  Elements.tzSelectedTags.querySelectorAll('.tz-tag-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeSelectedTimezone(btn.dataset.tz);
    });
  });
}

/**
 * Show favorites editor modal
 */
function showFavoritesEditor() {
  AppState.showFavoritesEditor = true;
  Elements.favoritesEditor.classList.remove('hidden');

  // Clear and focus search
  if (Elements.favoritesSearchInput) {
    Elements.favoritesSearchInput.value = '';
    Elements.favoritesSearchInput.focus();
  }

  renderFavoritesEditor();
}

/**
 * Hide favorites editor modal
 */
function hideFavoritesEditor() {
  AppState.showFavoritesEditor = false;
  Elements.favoritesEditor.classList.add('hidden');
}

/**
 * Render favorites editor content
 */
function renderFavoritesEditor(searchQuery = '') {
  const filtered = searchTimezones(searchQuery);

  if (filtered.length === 0) {
    Elements.favoritesEditorList.innerHTML = '<div class="favorites-editor-empty">No timezones match your search</div>';
    return;
  }

  const html = filtered.map(tz => {
    const displayName = tz.regionName || tz.city;
    const shortName = getTimezoneAbbreviation(tz.id);
    const offset = TimezoneManager.getOffset(tz.id);
    const isFavorite = AppState.favoriteTimezones.includes(tz.id);
    const isLocal = tz.id === AppState.localTimezone;

    return `
      <div class="favorites-editor-item ${isLocal ? 'is-local' : ''}">
        <div class="favorites-editor-item-info">
          <span class="favorites-editor-item-city">${displayName}</span>
          <span class="favorites-editor-item-tz">${tz.city} - ${shortName} (${offset})</span>
          ${isLocal ? '<span class="local-badge">Your timezone</span>' : ''}
        </div>
        <button type="button" class="favorites-editor-star ${isFavorite ? 'active' : ''}"
                data-tz="${tz.id}" ${isLocal ? 'disabled' : ''}>
          ${isFavorite ? '★' : '☆'}
        </button>
      </div>
    `;
  }).join('');

  Elements.favoritesEditorList.innerHTML = html;

  // Attach handlers
  Elements.favoritesEditorList.querySelectorAll('.favorites-editor-star:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => toggleFavorite(btn.dataset.tz));
  });
}

/**
 * Handle favorites editor search
 */
function handleFavoritesSearch(query) {
  renderFavoritesEditor(query);
}

/**
 * Attach main event listeners
 */
function attachEventListeners() {
  // Segment buttons
  Elements.btn5Days.addEventListener('click', () => {
    saveCurrentInputs();
    setActiveSegment(Elements.btn5Days);
    hideCustomPanel();
    AppState.currentMode = '5-days';
    selectDateRange(5);
  });

  Elements.btn10Days.addEventListener('click', () => {
    saveCurrentInputs();
    setActiveSegment(Elements.btn10Days);
    hideCustomPanel();
    AppState.currentMode = '10-days';
    selectDateRange(10);
  });

  Elements.btnCustom.addEventListener('click', () => {
    saveCurrentInputs();
    setActiveSegment(Elements.btnCustom);
    AppState.currentMode = 'custom';
    showCustomPanel();
  });

  // Custom date calendar clicks
  Elements.startDateDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    if (AppState.activeCalendar === 'start') {
      closeCalendar('start');
    } else {
      openCalendar('start');
    }
  });

  Elements.endDateDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    if (AppState.activeCalendar === 'end') {
      closeCalendar('end');
    } else {
      openCalendar('end');
    }
  });

  // Close calendar when clicking outside
  document.addEventListener('click', (e) => {
    // Check if click is outside both calendar wrappers
    const startWrapper = Elements.startDateDisplay.closest('.date-input-wrapper');
    const endWrapper = Elements.endDateDisplay.closest('.date-input-wrapper');

    if (startWrapper && !startWrapper.contains(e.target) &&
        endWrapper && !endWrapper.contains(e.target)) {
      closeAllCalendars();
    }

    // Close clear times popup when clicking outside
    const clearSection = document.getElementById('clear-times-section');
    if (clearSection && !clearSection.contains(e.target)) {
      hideClearTimesPopup();
    }
  });

  // Generate button
  Elements.btnGenerate.addEventListener('click', generateSchedule);

  // Copy button
  Elements.btnCopy.addEventListener('click', copySchedule);

  // Clear Times button and popup
  Elements.clearTimesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleClearTimesPopup();
  });

  Elements.clearConfirmYes.addEventListener('click', () => {
    clearAllEntries();
    hideClearTimesPopup();
  });

  Elements.clearConfirmNo.addEventListener('click', () => {
    hideClearTimesPopup();
  });

  // Edit favorites button
  Elements.editFavoritesBtn.addEventListener('click', showFavoritesEditor);

  // Close favorites editor
  Elements.closeFavoritesEditor.addEventListener('click', hideFavoritesEditor);

  // Close editor when clicking backdrop
  Elements.favoritesEditor.addEventListener('click', (e) => {
    if (e.target === Elements.favoritesEditor) {
      hideFavoritesEditor();
    }
  });

  // Favorites search input
  if (Elements.favoritesSearchInput) {
    Elements.favoritesSearchInput.addEventListener('input', (e) => {
      handleFavoritesSearch(e.target.value);
    });

    // Enter key toggles first visible item's favorite status
    Elements.favoritesSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstStar = Elements.favoritesEditorList.querySelector('.favorites-editor-star:not([disabled])');
        if (firstStar) {
          toggleFavorite(firstStar.dataset.tz);
          Elements.favoritesSearchInput.value = '';
          renderFavoritesEditor();
        }
      } else if (e.key === 'Escape') {
        hideFavoritesEditor();
      }
    });
  }
}

/**
 * Set active segment
 */
function setActiveSegment(activeBtn) {
  Elements.btn5Days.classList.remove('active');
  Elements.btn10Days.classList.remove('active');
  Elements.btnCustom.classList.remove('active');
  activeBtn.classList.add('active');
}

/**
 * Initialize calendar months to current month
 */
function initializeCalendarMonths() {
  const today = new Date();
  AppState.startCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  AppState.endCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
}

/**
 * Render a calendar for a specific month
 */
function renderCalendar(containerEl, month, calendarType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = month.getFullYear();
  const monthNum = month.getMonth();

  // First day of month and number of days
  const firstDay = new Date(year, monthNum, 1);
  const lastDay = new Date(year, monthNum + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  let html = `
    <div class="calendar-header">
      <button type="button" class="calendar-nav-btn" data-action="prev">&lt;</button>
      <span class="calendar-title">${monthNames[monthNum]} ${year}</span>
      <button type="button" class="calendar-nav-btn" data-action="next">&gt;</button>
    </div>
    <div class="calendar-weekdays">
      <span class="calendar-weekday">Su</span>
      <span class="calendar-weekday">Mo</span>
      <span class="calendar-weekday">Tu</span>
      <span class="calendar-weekday">We</span>
      <span class="calendar-weekday">Th</span>
      <span class="calendar-weekday">Fr</span>
      <span class="calendar-weekday">Sa</span>
    </div>
    <div class="calendar-days">
  `;

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<span class="calendar-day empty"></span>';
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum, day);
    date.setHours(0, 0, 0, 0);
    const dateStr = formatDateForInput(date);

    let classes = ['calendar-day'];

    // Is this day disabled (before today)?
    if (date < today) {
      classes.push('disabled');
    }

    // Is this today?
    if (date.getTime() === today.getTime()) {
      classes.push('today');
    }

    // Is this the selected start date?
    if (AppState.customStartDate === dateStr) {
      classes.push('start-date');
    }

    // Is this the selected end date?
    if (AppState.customEndDate === dateStr) {
      classes.push('end-date');
    }

    // Is this in range between start and end?
    if (AppState.customStartDate && AppState.customEndDate) {
      const startDate = new Date(AppState.customStartDate + 'T00:00:00');
      const endDate = new Date(AppState.customEndDate + 'T00:00:00');
      if (date > startDate && date < endDate) {
        classes.push('in-range');
      }
    }

    const disabled = date < today ? 'disabled' : '';
    html += `<button type="button" class="${classes.join(' ')}" data-date="${dateStr}" ${disabled}>${day}</button>`;
  }

  html += '</div>';
  containerEl.innerHTML = html;

  // Attach navigation handlers
  containerEl.querySelectorAll('.calendar-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateCalendar(calendarType, btn.dataset.action);
    });
  });

  // Attach day click handlers
  containerEl.querySelectorAll('.calendar-day:not(.disabled):not(.empty)').forEach(dayBtn => {
    dayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectCalendarDate(calendarType, dayBtn.dataset.date);
    });
  });
}

/**
 * Navigate calendar month
 */
function navigateCalendar(calendarType, action) {
  const monthKey = calendarType === 'start' ? 'startCalendarMonth' : 'endCalendarMonth';
  const containerEl = calendarType === 'start' ? Elements.startDateCalendar : Elements.endDateCalendar;

  const current = AppState[monthKey];
  if (action === 'prev') {
    AppState[monthKey] = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  } else {
    AppState[monthKey] = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  renderCalendar(containerEl, AppState[monthKey], calendarType);
}

/**
 * Select a date from calendar
 */
function selectCalendarDate(calendarType, dateStr) {
  if (calendarType === 'start') {
    AppState.customStartDate = dateStr;
    // If end date is before start date, clear it
    if (AppState.customEndDate && AppState.customEndDate < dateStr) {
      AppState.customEndDate = null;
    }
    updateDateDisplays();
    closeCalendar('start');
    // Auto-open end calendar if no end date
    if (!AppState.customEndDate) {
      setTimeout(() => openCalendar('end'), 100);
    }
  } else {
    // Validate end date is after start date
    if (AppState.customStartDate && dateStr < AppState.customStartDate) {
      showCustomError('End date must be after start date');
      return;
    }
    AppState.customEndDate = dateStr;
    updateDateDisplays();
    closeCalendar('end');
  }

  hideCustomError();
  updateCustomDates();
}

/**
 * Open a calendar dropdown
 */
function openCalendar(calendarType) {
  // Close the other calendar if open
  if (calendarType === 'start') {
    Elements.endDateCalendar.classList.add('hidden');
    Elements.endDateDisplay.classList.remove('active');
  } else {
    Elements.startDateCalendar.classList.add('hidden');
    Elements.startDateDisplay.classList.remove('active');
  }

  const containerEl = calendarType === 'start' ? Elements.startDateCalendar : Elements.endDateCalendar;
  const displayEl = calendarType === 'start' ? Elements.startDateDisplay : Elements.endDateDisplay;
  const monthKey = calendarType === 'start' ? 'startCalendarMonth' : 'endCalendarMonth';

  // If there's a selected date, show that month
  const selectedDate = calendarType === 'start' ? AppState.customStartDate : AppState.customEndDate;
  if (selectedDate) {
    const date = new Date(selectedDate + 'T00:00:00');
    AppState[monthKey] = new Date(date.getFullYear(), date.getMonth(), 1);
  }

  renderCalendar(containerEl, AppState[monthKey], calendarType);
  containerEl.classList.remove('hidden');
  displayEl.classList.add('active');
  AppState.activeCalendar = calendarType;
}

/**
 * Close a calendar dropdown
 */
function closeCalendar(calendarType) {
  const containerEl = calendarType === 'start' ? Elements.startDateCalendar : Elements.endDateCalendar;
  const displayEl = calendarType === 'start' ? Elements.startDateDisplay : Elements.endDateDisplay;

  containerEl.classList.add('hidden');
  displayEl.classList.remove('active');

  if (AppState.activeCalendar === calendarType) {
    AppState.activeCalendar = null;
  }
}

/**
 * Close any open calendar
 */
function closeAllCalendars() {
  closeCalendar('start');
  closeCalendar('end');
}

/**
 * Update date display text
 */
function updateDateDisplays() {
  // Start date display
  if (AppState.customStartDate) {
    const date = new Date(AppState.customStartDate + 'T00:00:00');
    Elements.startDateDisplay.innerHTML = `
      <span class="date-text">${formatDateShort(date)}</span>
      <span class="date-icon">▼</span>
    `;
  } else {
    Elements.startDateDisplay.innerHTML = `
      <span class="date-placeholder">Select start date</span>
      <span class="date-icon">▼</span>
    `;
  }

  // End date display
  if (AppState.customEndDate) {
    const date = new Date(AppState.customEndDate + 'T00:00:00');
    Elements.endDateDisplay.innerHTML = `
      <span class="date-text">${formatDateShort(date)}</span>
      <span class="date-icon">▼</span>
    `;
  } else {
    Elements.endDateDisplay.innerHTML = `
      <span class="date-placeholder">Select end date</span>
      <span class="date-icon">▼</span>
    `;
  }

  // Re-render calendars to update highlighting
  if (!Elements.startDateCalendar.classList.contains('hidden')) {
    renderCalendar(Elements.startDateCalendar, AppState.startCalendarMonth, 'start');
  }
  if (!Elements.endDateCalendar.classList.contains('hidden')) {
    renderCalendar(Elements.endDateCalendar, AppState.endCalendarMonth, 'end');
  }
}

/**
 * Format date for short display (e.g., "Jan 15, 2026")
 */
function formatDateShort(date) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Show custom panel
 */
function showCustomPanel() {
  Elements.customPanel.classList.remove('hidden');
  hideCustomError();

  // Set default dates if not already set
  if (!AppState.customStartDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    AppState.customStartDate = formatDateForInput(tomorrow);

    // Set default end date to 5 days from start
    const endDate = new Date(tomorrow);
    endDate.setDate(endDate.getDate() + 4);
    AppState.customEndDate = formatDateForInput(endDate);
  }

  updateDateDisplays();
  updateCustomDates();
}

/**
 * Hide custom panel
 */
function hideCustomPanel() {
  Elements.customPanel.classList.add('hidden');
  hideCustomError();
  closeAllCalendars();
}

/**
 * Validate custom date selection
 */
function validateCustomDates() {
  if (!AppState.customStartDate || !AppState.customEndDate) {
    hideCustomError();
    return true;
  }

  const startDate = new Date(AppState.customStartDate + 'T00:00:00');
  const endDate = new Date(AppState.customEndDate + 'T00:00:00');

  if (endDate < startDate) {
    showCustomError('End date must be after start date');
    return false;
  }

  hideCustomError();
  return true;
}

/**
 * Toggle Clear Times popup
 */
function toggleClearTimesPopup() {
  const isHidden = Elements.clearTimesPopup.classList.contains('hidden');
  if (isHidden) {
    showClearTimesPopup();
  } else {
    hideClearTimesPopup();
  }
}

/**
 * Show Clear Times popup
 */
function showClearTimesPopup() {
  Elements.clearTimesPopup.classList.remove('hidden');
}

/**
 * Hide Clear Times popup
 */
function hideClearTimesPopup() {
  Elements.clearTimesPopup.classList.add('hidden');
}

/**
 * Show custom date error
 */
function showCustomError(message) {
  Elements.customError.textContent = message;
  Elements.customError.classList.remove('hidden');
}

/**
 * Hide custom date error
 */
function hideCustomError() {
  Elements.customError.classList.add('hidden');
}

/**
 * Format date for input
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date key for storage (YYYY-MM-DD)
 */
function getDateKey(date) {
  return formatDateForInput(date);
}

/**
 * Save current inputs by date
 */
function saveCurrentInputs() {
  const inputs = Elements.dateRows.querySelectorAll('.time-input');
  inputs.forEach((input, index) => {
    const date = AppState.currentDates[index];
    if (date) {
      const key = getDateKey(date);
      if (input.value.trim()) {
        AppState.savedInputsByDate[key] = input.value;
      } else {
        delete AppState.savedInputsByDate[key];
      }
    }
  });
  saveData();
}

/**
 * Restore saved inputs for current dates
 */
function restoreSavedInputs() {
  const inputs = Elements.dateRows.querySelectorAll('.time-input');
  inputs.forEach((input, index) => {
    const date = AppState.currentDates[index];
    if (date) {
      const key = getDateKey(date);
      if (AppState.savedInputsByDate[key]) {
        input.value = AppState.savedInputsByDate[key];
      }
    }
  });
}

/**
 * Select preset date range
 */
function selectDateRange(numDays) {
  const dates = DateGenerator.getNextBusinessDays(numDays);
  AppState.currentDates = dates;
  renderDateRows(dates);
  restoreSavedInputs();
  updateGenerateButtonState();
}

/**
 * Update custom dates
 */
function updateCustomDates() {
  if (!AppState.customStartDate || !AppState.customEndDate) {
    Elements.dateRows.innerHTML = '<p class="helper-text">Select both start and end dates</p>';
    return;
  }

  if (!validateCustomDates()) {
    return;
  }

  const startDate = new Date(AppState.customStartDate + 'T00:00:00');
  const endDate = new Date(AppState.customEndDate + 'T00:00:00');

  const dates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  AppState.currentDates = dates;
  renderDateRows(dates);
  restoreSavedInputs();
  updateGenerateButtonState();
}

/**
 * Render date input rows
 */
function renderDateRows(dates) {
  const html = dates.map((date, index) => {
    const label = formatDateLabel(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    return `
      <div class="date-row-wrapper ${isWeekend ? 'weekend' : ''}">
        <div class="date-row">
          <label class="date-label">${label}:</label>
          <input
            type="text"
            class="time-input"
            data-date-index="${index}"
            placeholder=""
            autocomplete="off"
          >
        </div>
        <div class="date-row-error hidden" data-error-index="${index}"></div>
      </div>
    `;
  }).join('');

  Elements.dateRows.innerHTML = html;

  // Attach input listeners - only validate on blur, not on every keystroke
  Elements.dateRows.querySelectorAll('.time-input').forEach(input => {
    input.addEventListener('blur', () => {
      validateSingleInput(input);
      saveCurrentInputs();
      updateGenerateButtonState();
    });

    input.addEventListener('input', () => {
      // Clear error styling and message while typing
      const index = input.dataset.dateIndex;
      input.classList.remove('has-error', 'has-warning');
      clearInlineError(index);
      updateGenerateButtonState();
    });
  });

  // Focus first input
  const firstInput = Elements.dateRows.querySelector('.time-input');
  if (firstInput) {
    firstInput.focus();
  }
}

/**
 * Show inline error message for a date row
 */
function showInlineError(index, message, type = 'error') {
  const errorEl = document.querySelector(`[data-error-index="${index}"]`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.className = `date-row-error ${type}`;
  }
}

/**
 * Clear inline error message for a date row
 */
function clearInlineError(index) {
  const errorEl = document.querySelector(`[data-error-index="${index}"]`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.className = 'date-row-error hidden';
  }
}

/**
 * Format date label
 */
function formatDateLabel(date) {
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Validate a single input field
 */
function validateSingleInput(input) {
  const value = input.value.trim();
  const index = parseInt(input.dataset.dateIndex, 10);
  const date = AppState.currentDates[index];

  input.classList.remove('has-error', 'has-warning');
  clearInlineError(index);

  if (!value) return { valid: true };

  const dateLabel = formatDateLabel(date);
  const parsedLine = TimeParser.parseLine(`${dateLabel}: ${value}`);

  // Check for ambiguous hour error
  if (parsedLine.slots.some(slot => slot && slot.error === 'ambiguous_hour')) {
    const ambiguousSlot = parsedLine.slots.find(slot => slot && slot.error === 'ambiguous_hour');
    input.classList.add('has-error');
    showInlineError(index, `Please specify AM/PM for ${ambiguousSlot.hour}`, 'error');
    return { valid: false, error: `Please specify AM/PM` };
  }

  if (parsedLine.slots.length === 0) {
    input.classList.add('has-error');
    showInlineError(index, 'Invalid time format. Try: 10-11 AM, 2-3 PM, or 11 AM - 1 PM', 'error');
    return { valid: false, error: `Invalid time format` };
  }

  // Check for business hours warnings
  const businessHoursWarning = checkBusinessHoursWarning(parsedLine.slots, date);
  if (businessHoursWarning) {
    input.classList.add('has-warning');
    showInlineError(index, businessHoursWarning, 'warning');
    return { valid: true, warning: businessHoursWarning };
  }

  return { valid: true };
}

/**
 * Validate all inputs (called on generate)
 */
function validateAllInputs() {
  const inputs = Elements.dateRows.querySelectorAll('.time-input');
  const errors = [];
  const warnings = [];
  let hasValidInput = false;

  inputs.forEach((input) => {
    const value = input.value.trim();
    const index = parseInt(input.dataset.dateIndex, 10);

    input.classList.remove('has-error', 'has-warning');
    clearInlineError(index);

    if (!value) return;

    const date = AppState.currentDates[index];
    const dateLabel = formatDateLabel(date);
    const parsedLine = TimeParser.parseLine(`${dateLabel}: ${value}`);

    // Check for ambiguous hour error
    const ambiguousSlot = parsedLine.slots.find(slot => slot && slot.error === 'ambiguous_hour');
    if (ambiguousSlot) {
      errors.push({ index, message: `${dateLabel}: Please specify AM/PM for ${ambiguousSlot.hour}` });
      input.classList.add('has-error');
      showInlineError(index, `Please specify AM/PM for ${ambiguousSlot.hour}`, 'error');
    } else if (parsedLine.slots.length === 0) {
      errors.push({ index, message: `${dateLabel}: Invalid time format` });
      input.classList.add('has-error');
      showInlineError(index, 'Invalid time format. Try: 10-11 AM, 2-3 PM, or 11 AM - 1 PM', 'error');
    } else {
      hasValidInput = true;

      const businessHoursWarning = checkBusinessHoursWarning(parsedLine.slots, date);
      if (businessHoursWarning) {
        warnings.push({ index, message: `${dateLabel}: ${businessHoursWarning}` });
        input.classList.add('has-warning');
        showInlineError(index, businessHoursWarning, 'warning');
      }
    }
  });

  // Hide the global validation messages area since we now show inline errors
  Elements.validationMessages.classList.add('hidden');
  Elements.validationMessages.innerHTML = '';

  return { hasValidInput, hasErrors: errors.length > 0 };
}

/**
 * Update generate button state
 */
function updateGenerateButtonState() {
  const inputs = Elements.dateRows.querySelectorAll('.time-input');
  let hasAnyInput = false;

  inputs.forEach(input => {
    if (input.value.trim()) {
      hasAnyInput = true;
    }
  });

  Elements.btnGenerate.disabled = !hasAnyInput;
}

/**
 * Check if times fall outside business hours in any selected timezone
 * Only warns when LOCAL time IS within business hours (9-5) but TARGET time is outside
 */
function checkBusinessHoursWarning(slots, date) {
  const allTimezones = getAllSelectedTimezones();

  // No additional timezones selected, no warning needed
  if (allTimezones.length === 0) return null;

  for (const slot of slots) {
    // Skip error slots or slots without proper start time
    if (slot.error || !slot.start) continue;

    // For single hour slots, just check the start time
    const endHour24 = slot.end ? slot.end.hour24 : slot.start.hour24;

    // First check if LOCAL time is within business hours (9 AM - 5 PM)
    // For single hours, we just need start to be within range
    const localStartInBizHours = slot.start.hour24 >= BUSINESS_HOURS.start && slot.start.hour24 < BUSINESS_HOURS.end;
    const localEndInBizHours = slot.singleHour ? localStartInBizHours : (endHour24 >= BUSINESS_HOURS.start && endHour24 <= BUSINESS_HOURS.end);

    // Only check target timezone if local time IS in business hours
    if (localStartInBizHours && localEndInBizHours) {
      for (const tz of allTimezones) {
        if (tz === AppState.localTimezone) continue;

        const convertedStart = TimezoneManager.convertTime(
          date,
          slot.start.hour24,
          slot.start.minute,
          AppState.localTimezone,
          tz
        );

        // For single hour slots, use start time as end time
        const slotEndHour24 = slot.end ? slot.end.hour24 : slot.start.hour24;
        const slotEndMinute = slot.end ? slot.end.minute : slot.start.minute;

        const convertedEnd = TimezoneManager.convertTime(
          date,
          slotEndHour24,
          slotEndMinute,
          AppState.localTimezone,
          tz
        );

        // Check if target time is outside business hours (before 9 AM or after 5 PM)
        const targetStartOutside = convertedStart.hour24 < BUSINESS_HOURS.start || convertedStart.hour24 >= BUSINESS_HOURS.end;
        const targetEndOutside = slot.singleHour ? targetStartOutside : (convertedEnd.hour24 < BUSINESS_HOURS.start || convertedEnd.hour24 > BUSINESS_HOURS.end);

        if (targetStartOutside || targetEndOutside) {
          const tzShort = getTimezoneAbbreviation(tz, date);
          return `Outside business hours in ${tzShort}`;
        }
      }
    }
  }

  return null;
}

/**
 * Display validation messages
 */
function displayValidationMessages(errors, warnings) {
  if (errors.length === 0 && warnings.length === 0) {
    Elements.validationMessages.classList.add('hidden');
    Elements.validationMessages.innerHTML = '';
    return;
  }

  let html = '';

  errors.forEach(err => {
    html += `
      <div class="validation-msg error">
        <span class="validation-icon">⚠</span>
        <span>${err.message}</span>
      </div>
    `;
  });

  warnings.forEach(warn => {
    html += `
      <div class="validation-msg warning">
        <span class="validation-icon">⏰</span>
        <span>${warn.message}</span>
      </div>
    `;
  });

  Elements.validationMessages.innerHTML = html;
  Elements.validationMessages.classList.remove('hidden');
}

/**
 * Get all selected timezones
 */
function getAllSelectedTimezones() {
  return AppState.selectedTimezones;
}

/**
 * Get all timezones for output (local + selected), sorted west to east (earliest times first)
 */
function getAllTimezonesForOutput() {
  const all = [AppState.localTimezone, ...getAllSelectedTimezones()];
  const unique = [...new Set(all)];

  // Sort west to east (most negative to most positive offset)
  // This puts earliest times first: PT → MT → CT → ET
  return sortTimezonesWestToEast(unique);
}

/**
 * Generate schedule output
 */
function generateSchedule() {
  saveCurrentInputs();

  // Validate all inputs
  const validation = validateAllInputs();

  if (!validation.hasValidInput) {
    showStatus('Please enter availability for at least one day', 'error');
    return;
  }

  if (validation.hasErrors) {
    showStatus('Please fix the errors before generating', 'error');
    return;
  }

  const inputs = Elements.dateRows.querySelectorAll('.time-input');
  const entries = [];

  inputs.forEach((input, index) => {
    const timeValue = input.value.trim();
    if (timeValue) {
      const date = AppState.currentDates[index];
      const parsedLine = TimeParser.parseLine(`${formatDateLabel(date)}: ${timeValue}`);

      if (parsedLine.slots.length > 0) {
        entries.push({
          date: date,
          dateLabel: formatDateLabel(date),
          slots: parsedLine.slots
        });
      }
    }
  });

  // Get sorted timezones (east to west = earliest times first)
  const sortedTimezones = getAllTimezonesForOutput();
  const outputLines = [];

  for (const entry of entries) {
    const slotStrings = entry.slots.map(slot => {
      const conversions = sortedTimezones.map(targetTz => {
        const converted = convertSlotToTimezone(slot, entry.date, AppState.localTimezone, targetTz);
        const tzShort = getTimezoneAbbreviation(targetTz, entry.date);
        return `${converted} ${tzShort}`;
      });
      return conversions.join(' / ');
    });

    outputLines.push(`${entry.dateLabel}: ${slotStrings.join(', ')}`);
  }

  AppState.generatedOutput = outputLines.join('\n');
  Elements.outputPreview.textContent = AppState.generatedOutput;
  showOutput();
  showButtonFeedback('generate-feedback');
}

/**
 * Convert slot to timezone
 */
function convertSlotToTimezone(slot, date, sourceTimezone, targetTimezone) {
  const convertedStart = TimezoneManager.convertTime(
    date,
    slot.start.hour24,
    slot.start.minute,
    sourceTimezone,
    targetTimezone
  );

  const startStr = formatTime24to12(convertedStart.hour24, convertedStart.minute);

  // Handle single hour slots (no end time)
  if (slot.singleHour || !slot.end) {
    return startStr;
  }

  const convertedEnd = TimezoneManager.convertTime(
    date,
    slot.end.hour24,
    slot.end.minute,
    sourceTimezone,
    targetTimezone
  );

  const endStr = formatTime24to12(convertedEnd.hour24, convertedEnd.minute);

  return `${startStr} - ${endStr}`;
}

/**
 * Format 24h to 12h
 */
function formatTime24to12(hour24, minute) {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;

  if (minute === 0) {
    return `${hour} ${period}`;
  }
  return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Copy schedule
 */
async function copySchedule() {
  if (!AppState.generatedOutput) return;

  try {
    await navigator.clipboard.writeText(AppState.generatedOutput);
    showButtonFeedback('copy-feedback');
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = AppState.generatedOutput;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showButtonFeedback('copy-feedback');
  }
}

/**
 * Show button feedback overlay
 */
function showButtonFeedback(feedbackId) {
  const feedback = document.getElementById(feedbackId);
  if (feedback) {
    feedback.classList.add('show');
    setTimeout(() => {
      feedback.classList.remove('show');
    }, 1500);
  }
}

/**
 * Show output section
 */
function showOutput() {
  Elements.outputSection.classList.remove('hidden');
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  Elements.statusMessage.textContent = message;
  Elements.statusMessage.className = `status-toast ${type}`;
  Elements.statusMessage.classList.remove('hidden');

  setTimeout(() => {
    Elements.statusMessage.classList.add('hidden');
  }, 3000);
}

/**
 * Clear all entries (called after popup confirmation)
 */
function clearAllEntries() {
  const hasEntries = Object.keys(AppState.savedInputsByDate).length > 0 ||
    Array.from(Elements.dateRows.querySelectorAll('.time-input')).some(i => i.value.trim());

  if (!hasEntries) {
    showStatus('No entries to clear', 'info');
    return;
  }

  // Clear all entries
  AppState.savedInputsByDate = {};
  saveData();

  // Clear current inputs and their inline errors
  Elements.dateRows.querySelectorAll('.time-input').forEach((input, index) => {
    input.value = '';
    input.classList.remove('has-error', 'has-warning');
    clearInlineError(index);
  });

  // Hide output and validation
  Elements.outputSection.classList.add('hidden');
  Elements.validationMessages.classList.add('hidden');

  updateGenerateButtonState();
  showStatus('All entries cleared', 'success');
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
