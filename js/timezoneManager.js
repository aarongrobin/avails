/**
 * Avails - Timezone Manager Module
 * Handles timezone conversions using the Intl API
 */

const TimezoneManager = {
  // Cache for timezone data
  _cache: {
    allTimezones: null,
    displayNames: new Map()
  },

  // Timezone ordering for US timezones (east to west for display)
  US_TIMEZONE_ORDER: {
    'America/New_York': 1,
    'America/Chicago': 2,
    'America/Denver': 3,
    'America/Los_Angeles': 4,
    'America/Anchorage': 5,
    'Pacific/Honolulu': 6
  },

  /**
   * Get all supported IANA timezones
   * @returns {string[]} Array of timezone identifiers
   */
  getAllTimezones() {
    if (!this._cache.allTimezones) {
      this._cache.allTimezones = Intl.supportedValuesOf('timeZone');
    }
    return this._cache.allTimezones;
  },

  /**
   * Get the user's local timezone
   * @returns {string} IANA timezone identifier
   */
  getLocalTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  /**
   * Get short timezone name (e.g., "CT", "ET")
   * @param {string} timezone - IANA timezone identifier
   * @param {Date} [date] - Date for DST context (defaults to now)
   * @returns {string} Short timezone name
   */
  getShortName(timezone, date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });

    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : timezone;
  },

  /**
   * Get UTC offset for a timezone
   * @param {string} timezone - IANA timezone identifier
   * @param {Date} [date] - Date for DST context (defaults to now)
   * @returns {string} Offset string (e.g., "UTC-6", "UTC+5:30")
   */
  getOffset(timezone, date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });

    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');

    if (tzPart) {
      // Convert "GMT-06:00" to "UTC-6"
      const offset = tzPart.value;
      return offset.replace('GMT', 'UTC').replace(':00', '').replace(/([+-])0/, '$1');
    }

    return 'UTC';
  },

  /**
   * Format timezone for display
   * @param {string} timezone - IANA timezone identifier
   * @param {Date} [date] - Date for DST context
   * @returns {string} Formatted display string (e.g., "New York (ET, UTC-5)")
   */
  formatDisplay(timezone, date = new Date()) {
    const cacheKey = `${timezone}-${date.toDateString()}`;
    if (this._cache.displayNames.has(cacheKey)) {
      return this._cache.displayNames.get(cacheKey);
    }

    // Extract city name from timezone (e.g., "America/New_York" -> "New York")
    const cityName = timezone.split('/').pop().replace(/_/g, ' ');

    const shortName = this.getShortName(timezone, date);
    const offset = this.getOffset(timezone, date);

    const display = `${cityName} (${shortName}, ${offset})`;
    this._cache.displayNames.set(cacheKey, display);

    return display;
  },

  /**
   * Search timezones by query
   * @param {string} query - Search query
   * @param {string[]} [favorites] - Array of favorite timezone IDs to prioritize
   * @returns {string[]} Matching timezone identifiers
   */
  searchTimezones(query, favorites = []) {
    const allTimezones = this.getAllTimezones();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      // Return popular timezones when no query
      return this.getPopularTimezones();
    }

    const matches = allTimezones.filter(tz => {
      // Match against identifier
      if (tz.toLowerCase().includes(lowerQuery)) return true;

      // Match against city name
      const cityName = tz.split('/').pop().replace(/_/g, ' ').toLowerCase();
      if (cityName.includes(lowerQuery)) return true;

      // Match against short name
      const shortName = this.getShortName(tz).toLowerCase();
      if (shortName.includes(lowerQuery)) return true;

      return false;
    });

    // Sort: favorites first, then by relevance
    return matches.sort((a, b) => {
      const aIsFav = favorites.includes(a);
      const bIsFav = favorites.includes(b);

      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;

      // Then sort by US timezone order if applicable
      const aOrder = this.US_TIMEZONE_ORDER[a] || 999;
      const bOrder = this.US_TIMEZONE_ORDER[b] || 999;

      return aOrder - bOrder;
    });
  },

  /**
   * Get popular/common timezones
   * @returns {string[]} Array of popular timezone identifiers
   */
  getPopularTimezones() {
    return [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Dubai',
      'Asia/Singapore',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];
  },

  /**
   * Convert a time from one timezone to another
   * @param {Date} date - The reference date
   * @param {number} hour24 - Hour in 24-hour format (0-23)
   * @param {number} minute - Minute (0-59)
   * @param {string} sourceTimezone - Source IANA timezone
   * @param {string} targetTimezone - Target IANA timezone
   * @returns {{hour24: number, minute: number, dateOffset: number}} Converted time
   */
  convertTime(date, hour24, minute, sourceTimezone, targetTimezone) {
    // Create a date object representing the time in the source timezone
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Create formatters for source and target timezones
    const sourceFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: sourceTimezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });

    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });

    // We need to find the UTC time that corresponds to the given local time in sourceTimezone
    // Start with an estimate
    let testDate = new Date(year, month, day, hour24, minute);

    // Adjust to get the correct time in source timezone
    // This is a bit tricky - we need to iterate to find the right UTC time
    for (let i = 0; i < 24; i++) {
      const sourceFormatted = sourceFormatter.format(testDate);
      const sourceParts = this.parseFormattedDateTime(sourceFormatted);

      if (sourceParts.hour === hour24 && sourceParts.minute === minute &&
          sourceParts.day === day && sourceParts.month === month + 1) {
        // Found the right UTC time
        break;
      }

      // Adjust by the difference
      const hourDiff = hour24 - sourceParts.hour;
      const dayDiff = day - sourceParts.day;

      testDate = new Date(testDate.getTime() + (hourDiff * 60 + dayDiff * 24 * 60) * 60 * 1000);
    }

    // Now format in the target timezone
    const targetFormatted = targetFormatter.format(testDate);
    const targetParts = this.parseFormattedDateTime(targetFormatted);

    // Calculate date offset (did the date change?)
    let dateOffset = 0;
    if (targetParts.day > day || (targetParts.month > month + 1)) {
      dateOffset = 1;  // Next day
    } else if (targetParts.day < day || (targetParts.month < month + 1)) {
      dateOffset = -1; // Previous day
    }

    return {
      hour24: targetParts.hour === 24 ? 0 : targetParts.hour,
      minute: targetParts.minute,
      dateOffset: dateOffset
    };
  },

  /**
   * Parse formatted date/time string
   * @param {string} formatted - Formatted string from DateTimeFormat
   * @returns {{year: number, month: number, day: number, hour: number, minute: number}}
   */
  parseFormattedDateTime(formatted) {
    // Format is like "1/20/2025, 14:30" or "1/20/2025, 24:00"
    const [datePart, timePart] = formatted.split(', ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    return { year, month, day, hour, minute };
  },

  /**
   * Sort timezones by their UTC offset (east to west)
   * @param {string[]} timezones - Array of timezone identifiers
   * @param {Date} [date] - Date for DST context
   * @returns {string[]} Sorted array
   */
  sortByOffset(timezones, date = new Date()) {
    return [...timezones].sort((a, b) => {
      // Get offsets
      const offsetA = this.getOffsetMinutes(a, date);
      const offsetB = this.getOffsetMinutes(b, date);

      // Sort from most positive (east) to most negative (west)
      return offsetB - offsetA;
    });
  },

  /**
   * Get timezone offset in minutes
   * @param {string} timezone - IANA timezone identifier
   * @param {Date} [date] - Date for context
   * @returns {number} Offset in minutes from UTC
   */
  getOffsetMinutes(timezone, date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });

    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');

    if (!tzPart) return 0;

    // Parse "GMT+05:30" or "GMT-06:00"
    const match = tzPart.value.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);

    return sign * (hours * 60 + minutes);
  },

  /**
   * Check if two timezones are the same (accounting for aliases)
   * @param {string} tz1 - First timezone
   * @param {string} tz2 - Second timezone
   * @returns {boolean} True if same timezone
   */
  isSameTimezone(tz1, tz2) {
    if (tz1 === tz2) return true;

    // Check if they have the same offset at the current time
    const now = new Date();
    return this.getOffsetMinutes(tz1, now) === this.getOffsetMinutes(tz2, now) &&
           this.getShortName(tz1, now) === this.getShortName(tz2, now);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimezoneManager;
}
