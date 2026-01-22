/**
 * Avails - Date Generator Module
 * Utilities for generating date lines for availability scheduling
 */

const DateGenerator = {
  /**
   * Get remaining business days this week (starting from tomorrow)
   * @returns {Date[]} Array of business days remaining this week
   */
  getRemainingWeekDays() {
    const dates = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Calculate days until end of week (Saturday)
    // If today is Saturday (6), return empty array
    // If today is Friday (5), return empty array (no business days left)
    if (currentDay >= 5) {
      return dates;
    }

    // Start from tomorrow until Friday
    for (let i = 1; i <= 5 - currentDay; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay();
      // Only include weekdays (Monday-Friday: 1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        dates.push(date);
      }
    }

    return dates;
  },

  /**
   * Get the next N business days (Monday-Friday)
   * @param {number} count - Number of business days to return
   * @param {Date} [startDate] - Optional start date (defaults to tomorrow)
   * @returns {Date[]} Array of business days
   */
  getNextBusinessDays(count = 7, startDate = null) {
    const dates = [];
    const start = startDate ? new Date(startDate) : new Date();

    // If no startDate provided, start from tomorrow
    if (!startDate) {
      start.setDate(start.getDate() + 1);
    }

    const current = new Date(start);

    while (dates.length < count) {
      const dayOfWeek = current.getDay();

      // Include only weekdays (Monday-Friday: 1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        dates.push(new Date(current));
      }

      current.setDate(current.getDate() + 1);
    }

    return dates;
  },

  /**
   * Get N calendar days from a start date (includes all days, weekends too)
   * @param {Date} startDate - Start date
   * @param {number} count - Number of days
   * @returns {Date[]} Array of dates
   */
  getCustomDays(startDate, count) {
    const dates = [];
    const current = new Date(startDate);

    for (let i = 0; i < count; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  },

  /**
   * Format a date for display in the textarea
   * Format: "Monday, October 20, 2025: "
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string with trailing colon and space
   */
  formatDateLine(date) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const formatted = date.toLocaleDateString('en-US', options);
    return `${formatted}: `;
  },

  /**
   * Generate the full textarea content with date lines
   * @param {Date[]} dates - Array of dates
   * @returns {string} Multi-line string with formatted dates
   */
  generateDateLines(dates) {
    return dates.map(d => this.formatDateLine(d)).join('\n');
  },

  /**
   * Parse a date string back to a Date object
   * Expects format like "Monday, October 20, 2025"
   * @param {string} dateStr - Date string to parse
   * @returns {Date|null} Parsed date or null if invalid
   */
  parseDateLine(dateStr) {
    // Remove the colon and any trailing text
    const cleanStr = dateStr.split(':')[0].trim();

    // Try to parse the date
    const parsed = new Date(cleanStr);

    if (isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  },

  /**
   * Check if a date is a business day (Monday-Friday)
   * @param {Date} date - Date to check
   * @returns {boolean} True if business day
   */
  isBusinessDay(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  },

  /**
   * Check if a date is today
   * @param {Date} date - Date to check
   * @returns {boolean} True if today
   */
  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  /**
   * Check if a date is in the past
   * @param {Date} date - Date to check
   * @returns {boolean} True if in the past (before today)
   */
  isPast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  },

  /**
   * Get the start of the week (Sunday) for a given date
   * @param {Date} date - Reference date
   * @returns {Date} Start of the week
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  },

  /**
   * Get the end of the week (Saturday) for a given date
   * @param {Date} date - Reference date
   * @returns {Date} End of the week
   */
  getWeekEnd(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day));
    return d;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DateGenerator;
}
