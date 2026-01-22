/**
 * Avails - Output Formatter Module
 * Generates formatted output with timezone conversions
 */

const OutputFormatter = {
  /**
   * Format a time for display
   * @param {number} hour24 - Hour in 24-hour format (0-23)
   * @param {number} minute - Minute (0-59)
   * @returns {string} Formatted time string (e.g., "10 AM", "2:30 PM")
   */
  formatTime(hour24, minute) {
    const { hour, period } = TimeParser.to12Hour(hour24);

    if (minute === 0) {
      return `${hour} ${period}`;
    }
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  },

  /**
   * Format a time range
   * @param {number} startHour24 - Start hour (0-23)
   * @param {number} startMin - Start minute
   * @param {number} endHour24 - End hour (0-23)
   * @param {number} endMin - End minute
   * @returns {string} Formatted range (e.g., "10 AM - 2 PM")
   */
  formatTimeRange(startHour24, startMin, endHour24, endMin) {
    const startStr = this.formatTime(startHour24, startMin);
    const endStr = this.formatTime(endHour24, endMin);
    return `${startStr} - ${endStr}`;
  },

  /**
   * Convert a slot to a specific timezone and format it
   * @param {Object} slot - Parsed time slot
   * @param {Date} date - Reference date
   * @param {string} sourceTimezone - Source timezone
   * @param {string} targetTimezone - Target timezone
   * @returns {string} Formatted time range with timezone abbreviation
   */
  convertAndFormatSlot(slot, date, sourceTimezone, targetTimezone) {
    // Use slot's timezone if specified, otherwise use source
    const effectiveSource = slot.timezone || sourceTimezone;

    // Convert start time
    const convertedStart = TimezoneManager.convertTime(
      date,
      slot.start.hour24,
      slot.start.minute,
      effectiveSource,
      targetTimezone
    );

    const tzShort = TimezoneManager.getShortName(targetTimezone, date);

    // Handle single hour slots (no end time)
    if (slot.singleHour || !slot.end) {
      const timeStr = this.formatTime(convertedStart.hour24, convertedStart.minute);
      return `${timeStr} ${tzShort}`;
    }

    // Convert end time
    const convertedEnd = TimezoneManager.convertTime(
      date,
      slot.end.hour24,
      slot.end.minute,
      effectiveSource,
      targetTimezone
    );

    const timeRange = this.formatTimeRange(
      convertedStart.hour24,
      convertedStart.minute,
      convertedEnd.hour24,
      convertedEnd.minute
    );

    return `${timeRange} ${tzShort}`;
  },

  /**
   * Generate formatted output for parsed availability
   * @param {Array} parsedLines - Array of parsed lines from TimeParser
   * @param {string} sourceTimezone - Source/local timezone
   * @param {string[]} targetTimezones - Array of target timezones
   * @returns {string} Formatted output string
   */
  formatOutput(parsedLines, sourceTimezone, targetTimezones) {
    const outputLines = [];

    // Build the list of all timezones to display (source + targets)
    // Remove duplicates
    let allTimezones = [sourceTimezone, ...targetTimezones];
    allTimezones = [...new Set(allTimezones)];

    // Sort timezones east to west (most positive offset first)
    allTimezones = TimezoneManager.sortByOffset(allTimezones);

    for (const line of parsedLines) {
      if (line.slots.length === 0) {
        // No slots for this date, skip or include empty
        continue;
      }

      // Start with the date
      let outputLine = `${line.dateStr}:`;

      // Format each slot with all timezone conversions
      const slotStrings = line.slots.map(slot => {
        // Get the effective source timezone for this slot
        const effectiveSource = slot.timezone || sourceTimezone;

        // If only one timezone and it matches source, just show the time
        if (allTimezones.length === 1 && allTimezones[0] === effectiveSource) {
          const tzShort = TimezoneManager.getShortName(effectiveSource, line.date || new Date());

          // Handle single hour slots
          if (slot.singleHour || !slot.end) {
            const timeStr = this.formatTime(slot.start.hour24, slot.start.minute);
            return `${timeStr} ${tzShort}`;
          }

          const timeRange = this.formatTimeRange(
            slot.start.hour24,
            slot.start.minute,
            slot.end.hour24,
            slot.end.minute
          );
          return `${timeRange} ${tzShort}`;
        }

        // Convert to each timezone
        const conversions = allTimezones.map(targetTz => {
          return this.convertAndFormatSlot(slot, line.date || new Date(), effectiveSource, targetTz);
        });

        return conversions.join(' / ');
      });

      outputLine += ' ' + slotStrings.join(', ');
      outputLines.push(outputLine);
    }

    return outputLines.join('\n');
  },

  /**
   * Generate output with just the source timezone (no conversion)
   * @param {Array} parsedLines - Array of parsed lines
   * @param {string} sourceTimezone - Source timezone
   * @returns {string} Formatted output
   */
  formatSourceOnly(parsedLines, sourceTimezone) {
    return this.formatOutput(parsedLines, sourceTimezone, []);
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for environments where clipboard API is restricted
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch (fallbackErr) {
        console.error('Clipboard copy failed:', fallbackErr);
        return false;
      }
    }
  },

  /**
   * Generate and copy output to clipboard
   * @param {string} inputContent - Raw textarea content
   * @param {string} sourceTimezone - Source timezone
   * @param {string[]} targetTimezones - Target timezones
   * @returns {Promise<{success: boolean, output: string}>}
   */
  async generateAndCopy(inputContent, sourceTimezone, targetTimezones) {
    // Parse the input
    const parsedLines = TimeParser.parseContent(inputContent);

    // Check if there's any actual content
    const hasContent = parsedLines.some(line => line.slots.length > 0);
    if (!hasContent) {
      return {
        success: false,
        output: '',
        error: 'No availability times found. Please enter times after the dates.'
      };
    }

    // Generate formatted output
    const output = this.formatOutput(parsedLines, sourceTimezone, targetTimezones);

    // Copy to clipboard
    const copySuccess = await this.copyToClipboard(output);

    return {
      success: copySuccess,
      output: output,
      error: copySuccess ? null : 'Failed to copy to clipboard'
    };
  },

  /**
   * Preview the output without copying
   * @param {string} inputContent - Raw textarea content
   * @param {string} sourceTimezone - Source timezone
   * @param {string[]} targetTimezones - Target timezones
   * @returns {{output: string, parsedLines: Array}}
   */
  preview(inputContent, sourceTimezone, targetTimezones) {
    const parsedLines = TimeParser.parseContent(inputContent);
    const output = this.formatOutput(parsedLines, sourceTimezone, targetTimezones);

    return { output, parsedLines };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OutputFormatter;
}
