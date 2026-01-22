/**
 * Avails - Time Parser Module
 * Smart time parsing with business hours inference
 */

const TimeParser = {
  // Timezone abbreviation to IANA mapping
  TIMEZONE_MAP: {
    // Central Time
    'CT': 'America/Chicago',
    'CST': 'America/Chicago',
    'CDT': 'America/Chicago',
    // Eastern Time
    'ET': 'America/New_York',
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    // Pacific Time
    'PT': 'America/Los_Angeles',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
    // Mountain Time
    'MT': 'America/Denver',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    // Atlantic Time
    'AT': 'America/Halifax',
    'AST': 'America/Halifax',
    'ADT': 'America/Halifax',
    // UTC/GMT
    'UTC': 'UTC',
    'GMT': 'Europe/London',
    // UK
    'BST': 'Europe/London',
    // Central European
    'CET': 'Europe/Paris',
    'CEST': 'Europe/Paris'
  },

  // Regex patterns for time parsing
  PATTERNS: {
    // "10-11 AM" or "10 - 11 AM" - single period applies to both
    RANGE_SINGLE_PERIOD: /^(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i,

    // "10 AM - 11 AM" or "10 AM - 2 PM" - explicit periods
    RANGE_DUAL_PERIOD: /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i,

    // "11 - 2" or "10-11" - no period, need to infer
    RANGE_NO_PERIOD: /^(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?$/,

    // "1PM" or "1 PM" or "10:30 AM" - single hour with period
    SINGLE_HOUR_WITH_PERIOD: /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i,

    // "1" or "10" or "10:30" - single hour without period
    SINGLE_HOUR_NO_PERIOD: /^(\d{1,2})(?::(\d{2}))?$/,

    // Timezone suffix pattern
    TIMEZONE_SUFFIX: /\s+(CT|CST|CDT|EST|EDT|ET|PST|PDT|PT|MST|MDT|MT|AST|ADT|AT|UTC|GMT|BST|CET|CEST)$/i
  },

  /**
   * Infer AM/PM for a single hour based on business hours
   * Returns null if ambiguous (like 7)
   * @param {number} hour - Hour (1-12)
   * @returns {string|null} 'AM', 'PM', or null if ambiguous
   */
  inferSingleHourPeriod(hour) {
    // 12 is always noon (PM)
    if (hour === 12) return 'PM';

    // Morning hours 8-11 are clearly AM in business context
    if (hour >= 8 && hour <= 11) return 'AM';

    // Afternoon hours 1-6 are clearly PM in business context
    if (hour >= 1 && hour <= 6) return 'PM';

    // Hour 7 is ambiguous - could be 7 AM or 7 PM
    // Return null to indicate we need AM/PM specified
    return null;
  },

  /**
   * Infer AM/PM periods for ambiguous time ranges based on business hours
   * @param {number} startHour - Start hour (1-12)
   * @param {number} endHour - End hour (1-12)
   * @returns {{startPeriod: string, endPeriod: string}}
   */
  inferPeriods(startHour, endHour) {
    // Handle 12 specially - 12 is always PM (noon)
    if (startHour === 12 && endHour !== 12) {
      // "12-1", "12-2", etc. means noon to afternoon
      return { startPeriod: 'PM', endPeriod: 'PM' };
    }

    if (endHour === 12 && startHour !== 12) {
      // "11-12", "10-12" means morning to noon
      return { startPeriod: 'AM', endPeriod: 'PM' };
    }

    if (startHour === 12 && endHour === 12) {
      // Edge case: "12-12" - treat as noon to noon (unlikely but handle)
      return { startPeriod: 'PM', endPeriod: 'PM' };
    }

    // If start > end numerically, assume AM to PM crossing
    // e.g., "11-2" means 11 AM - 2 PM
    if (startHour > endHour) {
      return { startPeriod: 'AM', endPeriod: 'PM' };
    }

    // Morning hours (7-11): Default to AM
    if (startHour >= 7 && startHour <= 11) {
      // Check if we stay in morning or cross to noon
      if (endHour >= 7 && endHour <= 11) {
        return { startPeriod: 'AM', endPeriod: 'AM' };
      }
      // End hour is 1-6, meaning we crossed noon
      return { startPeriod: 'AM', endPeriod: 'PM' };
    }

    // Afternoon hours (1-6): Default to PM
    if (startHour >= 1 && startHour <= 6) {
      return { startPeriod: 'PM', endPeriod: 'PM' };
    }

    // Default fallback for any edge cases
    return { startPeriod: 'AM', endPeriod: 'AM' };
  },

  /**
   * Convert 12-hour format to 24-hour format
   * @param {number} hour - Hour (1-12)
   * @param {string} period - AM or PM
   * @returns {number} Hour in 24-hour format (0-23)
   */
  to24Hour(hour, period) {
    const upperPeriod = period.toUpperCase();

    if (upperPeriod === 'AM') {
      return hour === 12 ? 0 : hour;
    } else {
      return hour === 12 ? 12 : hour + 12;
    }
  },

  /**
   * Convert 24-hour format to 12-hour format
   * @param {number} hour24 - Hour (0-23)
   * @returns {{hour: number, period: string}}
   */
  to12Hour(hour24) {
    if (hour24 === 0) {
      return { hour: 12, period: 'AM' };
    } else if (hour24 < 12) {
      return { hour: hour24, period: 'AM' };
    } else if (hour24 === 12) {
      return { hour: 12, period: 'PM' };
    } else {
      return { hour: hour24 - 12, period: 'PM' };
    }
  },

  /**
   * Parse a single time slot string
   * @param {string} input - Time slot string (e.g., "10-11 AM", "11 - 2", "2:30-3:30 PM CT")
   * @returns {{start: {hour: number, minute: number, hour24: number}, end: {hour: number, minute: number, hour24: number}, timezone: string|null}|null}
   */
  parseTimeSlot(input) {
    let cleanInput = input.trim();
    let timezone = null;

    // Extract timezone suffix if present
    const tzMatch = cleanInput.match(this.PATTERNS.TIMEZONE_SUFFIX);
    if (tzMatch) {
      const tzAbbrev = tzMatch[1].toUpperCase();
      timezone = this.TIMEZONE_MAP[tzAbbrev] || null;
      cleanInput = cleanInput.replace(this.PATTERNS.TIMEZONE_SUFFIX, '').trim();
    }

    let startHour, startMin, endHour, endMin, startPeriod, endPeriod;

    // Try dual period pattern first (most explicit): "10 AM - 2 PM"
    let match = cleanInput.match(this.PATTERNS.RANGE_DUAL_PERIOD);
    if (match) {
      startHour = parseInt(match[1], 10);
      startMin = match[2] ? parseInt(match[2], 10) : 0;
      startPeriod = match[3].toUpperCase();
      endHour = parseInt(match[4], 10);
      endMin = match[5] ? parseInt(match[5], 10) : 0;
      endPeriod = match[6].toUpperCase();
    } else {
      // Try single period pattern: "10-11 AM"
      match = cleanInput.match(this.PATTERNS.RANGE_SINGLE_PERIOD);
      if (match) {
        startHour = parseInt(match[1], 10);
        startMin = match[2] ? parseInt(match[2], 10) : 0;
        endHour = parseInt(match[3], 10);
        endMin = match[4] ? parseInt(match[4], 10) : 0;
        const period = match[5].toUpperCase();
        startPeriod = period;
        endPeriod = period;
      } else {
        // Try no period pattern: "11 - 2"
        match = cleanInput.match(this.PATTERNS.RANGE_NO_PERIOD);
        if (match) {
          startHour = parseInt(match[1], 10);
          startMin = match[2] ? parseInt(match[2], 10) : 0;
          endHour = parseInt(match[3], 10);
          endMin = match[4] ? parseInt(match[4], 10) : 0;

          // Infer AM/PM based on business hours
          const inferred = this.inferPeriods(startHour, endHour);
          startPeriod = inferred.startPeriod;
          endPeriod = inferred.endPeriod;
        } else {
          // Try single hour with period: "1PM", "1 PM", "10:30 AM"
          match = cleanInput.match(this.PATTERNS.SINGLE_HOUR_WITH_PERIOD);
          if (match) {
            startHour = parseInt(match[1], 10);
            startMin = match[2] ? parseInt(match[2], 10) : 0;
            startPeriod = match[3].toUpperCase();

            // Single hour - no end time needed
            // Validate hour
            if (startHour < 1 || startHour > 12) {
              return null;
            }
            if (startMin < 0 || startMin > 59) {
              return null;
            }

            const start24 = this.to24Hour(startHour, startPeriod);

            return {
              start: {
                hour: startHour,
                minute: startMin,
                period: startPeriod,
                hour24: start24
              },
              end: null,
              singleHour: true,
              timezone: timezone
            };
          } else {
            // Try single hour without period: "1", "10"
            match = cleanInput.match(this.PATTERNS.SINGLE_HOUR_NO_PERIOD);
            if (match) {
              startHour = parseInt(match[1], 10);
              startMin = match[2] ? parseInt(match[2], 10) : 0;

              // Validate hour is in valid range
              if (startHour < 1 || startHour > 12) {
                return null;
              }

              // Infer AM/PM based on business hours
              const inferredPeriod = this.inferSingleHourPeriod(startHour);
              if (inferredPeriod === null) {
                // Ambiguous hour (like 7) - return special error marker
                return { error: 'ambiguous_hour', hour: startHour };
              }

              startPeriod = inferredPeriod;

              if (startMin < 0 || startMin > 59) {
                return null;
              }

              const start24 = this.to24Hour(startHour, startPeriod);

              return {
                start: {
                  hour: startHour,
                  minute: startMin,
                  period: startPeriod,
                  hour24: start24
                },
                end: null,
                singleHour: true,
                timezone: timezone
              };
            } else {
              // No pattern matched
              return null;
            }
          }
        }
      }
    }

    // Validate hours
    if (startHour < 1 || startHour > 12 || endHour < 1 || endHour > 12) {
      return null;
    }

    // Validate minutes
    if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
      return null;
    }

    // Convert to 24-hour format for easier comparison/conversion
    const start24 = this.to24Hour(startHour, startPeriod);
    const end24 = this.to24Hour(endHour, endPeriod);

    return {
      start: {
        hour: startHour,
        minute: startMin,
        period: startPeriod,
        hour24: start24
      },
      end: {
        hour: endHour,
        minute: endMin,
        period: endPeriod,
        hour24: end24
      },
      singleHour: false,
      timezone: timezone
    };
  },

  /**
   * Parse a full line of availability
   * @param {string} line - Full line (e.g., "Monday, October 20, 2025: 10-11 AM, 2-3 PM CT")
   * @returns {{dateStr: string, date: Date|null, slots: Array, lineTimezone: string|null}}
   */
  parseLine(line) {
    // Split on first colon to separate date from times
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      return { dateStr: line.trim(), date: null, slots: [], lineTimezone: null };
    }

    const datePart = line.substring(0, colonIndex).trim();
    const timesPart = line.substring(colonIndex + 1).trim();

    // Parse the date
    const date = DateGenerator.parseDateLine(datePart);

    if (!timesPart) {
      return { dateStr: datePart, date: date, slots: [], lineTimezone: null };
    }

    // Check for line-level timezone at the end
    let lineTimezone = null;
    let cleanTimesPart = timesPart;

    // Look for timezone at the very end of the line
    const lastTzMatch = timesPart.match(/\s+(CT|CST|CDT|EST|EDT|ET|PST|PDT|PT|MST|MDT|MT|AST|ADT|AT|UTC|GMT|BST|CET|CEST)$/i);
    if (lastTzMatch) {
      // Check if this timezone applies to the whole line (not just the last slot)
      // If there's only one slot or it appears after all time ranges, it's a line-level timezone
      const beforeTz = timesPart.substring(0, timesPart.length - lastTzMatch[0].length).trim();
      const slots = beforeTz.split(',').map(s => s.trim()).filter(s => s.length > 0);

      // Check if the last slot already has a timezone
      const lastSlotHasTz = slots.length > 0 && this.PATTERNS.TIMEZONE_SUFFIX.test(slots[slots.length - 1]);

      if (!lastSlotHasTz) {
        lineTimezone = this.TIMEZONE_MAP[lastTzMatch[1].toUpperCase()] || null;
        cleanTimesPart = beforeTz;
      }
    }

    // Split by comma and parse each slot
    const slotStrings = cleanTimesPart.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const slots = [];

    for (const slotStr of slotStrings) {
      const parsed = this.parseTimeSlot(slotStr);
      if (parsed) {
        // If slot has no timezone but line has one, apply line timezone
        if (!parsed.timezone && lineTimezone) {
          parsed.timezone = lineTimezone;
        }
        slots.push(parsed);
      }
    }

    return {
      dateStr: datePart,
      date: date,
      slots: slots,
      lineTimezone: lineTimezone
    };
  },

  /**
   * Parse the entire textarea content
   * @param {string} content - Full textarea content
   * @returns {Array} Array of parsed lines
   */
  parseContent(content) {
    const lines = content.split('\n');
    const parsed = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        parsed.push(this.parseLine(trimmed));
      }
    }

    return parsed;
  },

  /**
   * Format a time for display
   * @param {number} hour - Hour (1-12)
   * @param {number} minute - Minute (0-59)
   * @param {string} period - AM or PM
   * @returns {string} Formatted time string
   */
  formatTime(hour, minute, period) {
    if (minute === 0) {
      return `${hour} ${period}`;
    }
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  },

  /**
   * Format a time slot for display
   * @param {Object} slot - Parsed slot object
   * @returns {string} Formatted time range
   */
  formatSlot(slot) {
    const startStr = this.formatTime(slot.start.hour, slot.start.minute, slot.start.period);
    const endStr = this.formatTime(slot.end.hour, slot.end.minute, slot.end.period);
    return `${startStr} - ${endStr}`;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimeParser;
}
