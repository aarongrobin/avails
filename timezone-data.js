// Timezone data and utilities
class TimezoneManager {
  constructor() {
    this.continentalUSTimezones = [
      { id: 'America/Los_Angeles', name: 'Pacific', short: 'PT' },
      { id: 'America/Denver', name: 'Mountain', short: 'MT' },
      { id: 'America/Chicago', name: 'Central', short: 'CT' },
      { id: 'America/New_York', name: 'Eastern', short: 'ET' }
    ];

    this.favoriteTimezones = [
      'America/New_York',      // ET
      'America/Chicago',       // CT
      'America/Denver',        // MT
      'America/Los_Angeles',   // PT
      'Europe/London',         // GMT/BST
      'Europe/Paris',          // CET/CEST
      'Asia/Tokyo',            // JST
      'Asia/Shanghai',         // CST
      'Australia/Sydney',      // AEST/AEDT
      'Pacific/Auckland'       // NZST/NZDT
    ];

    this.allTimezones = [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Anchorage', 'America/Phoenix', 'America/Toronto', 'America/Vancouver',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
      'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Moscow', 'Asia/Tokyo',
      'Asia/Shanghai', 'Asia/Seoul', 'Asia/Singapore', 'Asia/Dubai', 'Asia/Kolkata',
      'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland',
      'Pacific/Honolulu', 'Atlantic/Azores', 'Africa/Cairo', 'Africa/Johannesburg'
    ];
  }

  getLocalTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  getTimezoneDisplayName(timezone) {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(now);
      const tzName = parts.find(part => part.type === 'timeZoneName')?.value || '';
      
      return tzName || timezone;
    } catch (error) {
      return timezone;
    }
  }

  getTimezoneDisplayNameWithDST(timezone) {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(now);
      const tzName = parts.find(part => part.type === 'timeZoneName')?.value || '';
      
      // Find the base name from our continental US list
      const baseTz = this.continentalUSTimezones.find(tz => tz.id === timezone);
      if (baseTz) {
        return `${baseTz.name} (${tzName})`;
      }
      
      return tzName || timezone;
    } catch (error) {
      return timezone;
    }
  }

  getTimezoneOffset(timezone) {
    try {
      // Use a simpler approach: create a date and see the difference
      const now = new Date();
      
      // Create a date in the target timezone
      const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const localDate = new Date(now.toLocaleString('en-US'));
      
      // Calculate the difference in minutes
      return (targetDate.getTime() - localDate.getTime()) / (1000 * 60);
    } catch (error) {
      console.error('Error getting timezone offset:', error);
      return 0;
    }
  }

  formatOffset(offsetMinutes) {
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getContinentalUSTimezones() {
    return this.continentalUSTimezones;
  }

  getFavorites() {
    return this.favoriteTimezones;
  }

  getAllTimezones() {
    return this.allTimezones;
  }

  convertTime(timeString, fromTz, toTz) {
    try {
      // Parse the time string to get hours and minutes
      const time = this.parseFormattedTime(timeString);
      if (!time) {
        return timeString;
      }

      // Get UTC offsets for both timezones
      const fromOffset = this.getTimezoneOffsetUTC(fromTz);
      const toOffset = this.getTimezoneOffsetUTC(toTz);
      
      // Calculate the difference
      const offsetDiff = toOffset - fromOffset;
      
      // Apply the offset difference
      const convertedMinutes = (time.hours * 60 + time.minutes) + offsetDiff;
      
      // Handle day rollover
      let finalMinutes = convertedMinutes;
      if (finalMinutes < 0) {
        finalMinutes += 24 * 60; // Add a day
      } else if (finalMinutes >= 24 * 60) {
        finalMinutes -= 24 * 60; // Subtract a day
      }
      
      // Convert back to hours and minutes
      const hours = Math.floor(finalMinutes / 60);
      const minutes = finalMinutes % 60;
      
      // Create the converted date
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();
      const convertedDate = new Date(year, month, day, hours, minutes);
      
      return this.formatTime(convertedDate);
    } catch (error) {
      console.error('Error converting time:', error);
      return timeString;
    }
  }

  getTimezoneOffsetUTC(timezone) {
    // Get the UTC offset in minutes for a timezone
    const now = new Date();
    
    // Create a date in the target timezone
    const utcTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    
    // Use Intl.DateTimeFormat to get the timezone offset
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    const parts = formatter.formatToParts(utcTime);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    if (offsetPart && offsetPart.value) {
      // Parse offset like "+05:00" or "-08:00"
      const match = offsetPart.value.match(/([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2]);
        const minutes = parseInt(match[3]);
        return sign * (hours * 60 + minutes);
      }
    }
    
    return 0;
  }

  parseFormattedTime(timeStr) {
    if (!timeStr) return null;
    
    // Handle formatted time strings like "10 AM", "2:30 PM", etc.
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
    
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const period = match[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return { hours, minutes };
    }
    
    return null;
  }

  parseTimeString(timeStr) {
    if (!timeStr) return null;
    
    // Remove extra whitespace and normalize
    const clean = timeStr.trim().toLowerCase();
    
    // Handle various formats
    const patterns = [
      /^(\d{1,2}):(\d{2})\s*(am|pm)?$/,
      /^(\d{1,2})\s*(am|pm)$/,
      /^(\d{1,2})-(\d{1,2})\s*(am|pm)?$/,
      /^(\d{1,2})\s*to\s*(\d{1,2})\s*(am|pm)?$/,
      /^(\d{1,2})\s*-\s*(\d{1,2})\s*(am|pm)?$/
    ];
    
    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const period = match[3] || match[4] || '';
        
        // Handle AM/PM
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        return { hours, minutes };
      }
    }
    
    return null;
  }

  convertToUTC(date, timezone) {
    // Create a date in the source timezone
    const sourceDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return utcDate;
  }

  convertFromUTC(utcDate, timezone) {
    // Convert UTC to target timezone
    const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    return targetDate;
  }

  formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
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

  formatTimeRange(startTime, endTime, timezone) {
    const start = this.convertTime(startTime, this.getLocalTimezone(), timezone);
    const end = this.convertTime(endTime, this.getLocalTimezone(), timezone);
    return `${start} - ${end}`;
  }
}

// Export for use in other scripts
window.TimezoneManager = TimezoneManager;
