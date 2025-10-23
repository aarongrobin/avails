// Time parsing utilities for natural language time input
class TimeParser {
  constructor() {
    this.timePatterns = [
      // Range pattern: "10 - 2", "10 AM - 2 PM", "10:30 - 2", etc.
      /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i,
      
      // "to" format: "10 to 2", "10 AM to 2 PM"
      /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i,
      
      // Single times: "10 AM", "2 PM", "10:30 AM"
      /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i,
      
      // Special times: "noon", "midnight"
      /^(noon|midnight)$/i
    ];
  }

  parseTimeInput(input, dateContext = '') {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Invalid input' };
    }

    const cleanInput = input.trim();
    if (!cleanInput) {
      return { isValid: false, error: 'Empty input' };
    }

    // Handle multiple time blocks separated by commas
    const timeBlocks = cleanInput.split(',').map(block => block.trim());
    const parsedBlocks = [];

    for (const block of timeBlocks) {
      const result = this.parseSingleTimeBlock(block);
      if (!result.isValid) {
        const errorMessage = dateContext ? 
          `Cannot detect time on ${dateContext}. Please check formatting.` : 
          `Cannot parse time: "${block}". Please check formatting.`;
        return { isValid: false, error: errorMessage };
      }
      parsedBlocks.push(result);
    }

    return {
      isValid: true,
      blocks: parsedBlocks
    };
  }

  parseSingleTimeBlock(block) {
    // First try to fix common typos
    const correctedBlock = this.fixCommonTypos(block);
    
    // Try each pattern with the corrected block
    for (const pattern of this.timePatterns) {
      const match = correctedBlock.match(pattern);
      if (match) {
        return this.processMatch(match, correctedBlock);
      }
    }

    return { isValid: false, error: `Could not parse: "${block}"` };
  }

  fixCommonTypos(input) {
    let corrected = input.trim();
    
    // Fix space after colon: "10: 30" -> "10:30"
    corrected = corrected.replace(/:(\s+)(\d)/g, ':$2');
    
    // Fix missing space before AM/PM: "10AM" -> "10 AM"
    corrected = corrected.replace(/(\d)(AM|PM)/gi, '$1 $2');
    
    // Fix extra spaces around dash: "10 - 2" -> "10 - 2" (already correct)
    // Fix missing space around dash: "10-2" -> "10 - 2"
    corrected = corrected.replace(/(\d)\s*-\s*(\d)/g, '$1 - $2');
    
    // Fix missing space around "to": "10to2" -> "10 to 2"
    corrected = corrected.replace(/(\d)\s*to\s*(\d)/gi, '$1 to $2');
    
    // Fix multiple spaces: "10   AM" -> "10 AM"
    corrected = corrected.replace(/\s+/g, ' ');
    
    // Fix case for AM/PM: "am" -> "AM", "pm" -> "PM"
    corrected = corrected.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
    
    return corrected.trim();
  }

  processMatch(match, original) {
    const groups = match.slice(1);
    
    // Handle special cases
    if (groups[0].toLowerCase() === 'noon') {
      return {
        isValid: true,
        start: { hours: 12, minutes: 0 },
        end: null,
        display: '12 PM',
        isSingleTime: true
      };
    }
    
    if (groups[0].toLowerCase() === 'midnight') {
      return {
        isValid: true,
        start: { hours: 0, minutes: 0 },
        end: null,
        display: '12 AM',
        isSingleTime: true
      };
    }

    // Handle range patterns (groups.length >= 4)
    if (groups.length >= 4) {
      const startHours = parseInt(groups[0]);
      const startMinutes = parseInt(groups[1]) || 0;
      const endHours = parseInt(groups[3]);
      const endMinutes = parseInt(groups[4]) || 0;
      
      // Determine periods using your simple logic
      const startPeriod = this.determinePeriod(startHours, groups[2]);
      const endPeriod = this.determinePeriod(endHours, groups[5]);

      const start = this.normalizeTime(startHours, startMinutes, startPeriod);
      const end = this.normalizeTime(endHours, endMinutes, endPeriod);

      if (!start || !end) {
        return { isValid: false, error: `Invalid time range: "${original}"` };
      }

      return {
        isValid: true,
        start,
        end,
        display: this.formatTimeRange(start, end)
      };
    }

    // Handle single time patterns (groups.length >= 2)
    if (groups.length >= 2) {
      const hours = parseInt(groups[0]);
      const minutes = parseInt(groups[1]) || 0;
      const period = this.determinePeriod(hours, groups[2]);

      const time = this.normalizeTime(hours, minutes, period);
      if (!time) {
        return { isValid: false, error: `Invalid time: "${original}"` };
      }

      // For single times, return just the single time (no range)
      return {
        isValid: true,
        start: time,
        end: null,
        display: this.formatTime(time),
        isSingleTime: true
      };
    }

    return { isValid: false, error: `Could not process: "${original}"` };
  }

  determinePeriod(hours, explicitPeriod) {
    // If explicit period is provided, use it
    if (explicitPeriod) {
      return explicitPeriod.toLowerCase();
    }
    
    // Otherwise, use your business hours logic
    if (hours >= 7 && hours <= 11) {
      return 'am';
    } else if (hours === 12 || (hours >= 1 && hours <= 6)) {
      return 'pm';
    } else {
      return 'am'; // Default to AM for other cases
    }
  }

  normalizeTime(hours, minutes, period) {
    if (isNaN(hours) || isNaN(minutes)) {
      return null;
    }

    let normalizedHours = hours;
    const normalizedMinutes = Math.max(0, Math.min(59, minutes));

    // Handle AM/PM
    if (period.toLowerCase() === 'pm') {
      if (hours === 12) {
        normalizedHours = 12; // 12 PM stays 12
      } else {
        normalizedHours = hours + 12; // 1 PM = 13, 2 PM = 14, etc.
      }
    } else if (period.toLowerCase() === 'am') {
      if (hours === 12) {
        normalizedHours = 0; // 12 AM = midnight (0)
      } else {
        normalizedHours = hours; // 1 AM = 1, 2 AM = 2, etc.
      }
    } else {
      // No period specified - use your business hours logic
      // 7, 8, 9, 10, 11 are AM
      // 12, 1, 2, 3, 4, 5, 6 are PM
      if (hours >= 7 && hours <= 11) {
        normalizedHours = hours; // AM
      } else if (hours === 12 || (hours >= 1 && hours <= 6)) {
        if (hours === 12) {
          normalizedHours = 12; // 12 PM (noon)
        } else {
          normalizedHours = hours + 12; // 1-6 PM
        }
      } else {
        normalizedHours = hours; // Default to AM
      }
    }

    // Validate hours
    if (normalizedHours < 0 || normalizedHours > 23) {
      return null;
    }

    return {
      hours: normalizedHours,
      minutes: normalizedMinutes
    };
  }

  addHours(time, hours) {
    const totalMinutes = time.hours * 60 + time.minutes + (hours * 60);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    
    return {
      hours: newHours,
      minutes: newMinutes
    };
  }

  formatTimeRange(start, end) {
    const startStr = this.formatTime(start);
    const endStr = this.formatTime(end);
    return `${startStr} - ${endStr}`;
  }

  formatTime(time) {
    const hours = time.hours;
    const minutes = time.minutes;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    // Only show minutes if they're not :00
    if (minutes === 0) {
      return `${displayHours} ${period}`;
    } else {
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${period}`;
    }
  }

  // Validate that end time is after start time
  validateTimeRange(start, end) {
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    return endMinutes > startMinutes;
  }
}

// Export for use in other scripts
window.TimeParser = TimeParser;
