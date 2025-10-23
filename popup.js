// Main popup functionality
class AvailabilityManager {
  constructor() {
    this.timezoneManager = new TimezoneManager();
    this.timeParser = new TimeParser();
    this.currentPreset = 'next-5';
    this.selectedDates = [];
    this.targetTimezones = [];
    this.dateLines = new Map();
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadSavedData();
    this.initializeTimezones();
    this.generateDateLines();
    
    // Initialize button state
    this.elements.generateBtn.disabled = true;
  }

  initializeElements() {
    this.elements = {
      presetBtns: document.querySelectorAll('.preset-btn'),
      customDates: document.getElementById('custom-dates'),
      startDate: document.getElementById('start-date'),
      endDate: document.getElementById('end-date'),
      myTimezone: document.getElementById('my-timezone'),
      tzButtons: document.getElementById('tz-buttons'),
      dateLines: document.getElementById('date-lines'),
      generateBtn: document.getElementById('generate-btn'),
      copyBtn: document.getElementById('copy-btn'),
      output: document.getElementById('output'),
      warnings: document.getElementById('warnings'),
      scheduleText: document.getElementById('schedule-text'),
      toast: document.getElementById('toast')
    };
  }

  setupEventListeners() {
    // Preset buttons
    this.elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectPreset(e.target.dataset.preset);
      });
    });

    // Custom date inputs
    this.elements.startDate.addEventListener('change', () => this.updateCustomDates());
    this.elements.endDate.addEventListener('change', () => this.updateCustomDates());

    // My timezone dropdown
    this.elements.myTimezone.addEventListener('change', () => this.refreshTimezoneButtons());

    // Generate and copy buttons
    this.elements.generateBtn.addEventListener('click', () => this.generateSchedule());
    this.elements.copyBtn.addEventListener('click', () => this.copySchedule());

    // Set minimum date to today for date pickers (allow today to be selected)
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
                       String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(today.getDate()).padStart(2, '0');
    
    // Set min to today to allow today selection
    this.elements.startDate.min = todayString;
    this.elements.endDate.min = todayString;
    
    // Leave date inputs blank by default
    this.elements.startDate.value = '';
    this.elements.endDate.value = '';
  }

  selectPreset(preset) {
    this.currentPreset = preset;
    
    // Update button states
    this.elements.presetBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === preset);
    });

    // Show/hide custom dates
    this.elements.customDates.classList.toggle('hidden', preset !== 'custom');

    // Generate dates based on preset
    this.generateDateLines();
  }

  generateDateLines() {
    // Save current entries before switching
    this.saveCurrentEntries();
    
    // Get new dates for the selected preset
    this.selectedDates = this.getDatesForPreset();
    
    // Render the new date lines
    this.renderDateLines();
  }

  getDatesForPreset() {
    const today = new Date();
    const dates = [];

    switch (this.currentPreset) {
      case 'next-5':
        // Next 5 days (including today)
        for (let i = 0; i < 5; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date);
        }
        break;

      case 'next-10':
        // Next 10 days (including today)
        for (let i = 0; i < 10; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date);
        }
        break;

      case 'custom':
        const startDate = this.elements.startDate.value;
        const endDate = this.elements.endDate.value;
        if (startDate && endDate) {
          // Parse dates in local timezone to avoid UTC conversion issues
          const startParts = startDate.split('-');
          const endParts = endDate.split('-');
          
          const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
          const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
          const current = new Date(start);
          
          while (current <= end && dates.length < 30) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }
        }
        break;
    }

    return dates;
  }

  renderDateLines() {
    this.elements.dateLines.innerHTML = '';
    // Don't clear existing entries - keep them for persistence

    // Add help text above the first date line
    if (this.selectedDates.length > 0) {
      const helpText = document.createElement('div');
      helpText.className = 'input-help-inline';
      helpText.innerHTML = '<small>Enter times like: 10-11 AM, 2-3 PM, noon-1, 11 AM - 12 PM</small>';
      this.elements.dateLines.appendChild(helpText);
    }

    this.selectedDates.forEach(date => {
      const dateKey = this.formatDateKey(date);
      const dateLine = this.createDateLine(date);
      this.elements.dateLines.appendChild(dateLine);
      // Only initialize if the key doesn't exist
      if (!this.dateLines.has(dateKey)) {
        this.dateLines.set(dateKey, '');
      }
    });
    
    // Update button state after rendering
    this.updateGenerateButtonState();
  }

  createDateLine(date) {
    const div = document.createElement('div');
    div.className = 'date-line';
    
    const dateStr = this.formatDateLong(date);
    const dateKey = this.formatDateKey(date);
    const savedValue = this.restoreEntriesForDate(dateKey);
    
    div.innerHTML = `
      <div class="date-label">${dateStr}:</div>
      <input 
        type="text"
        class="time-input" 
        data-date="${dateKey}"
        value="${savedValue}"
      />
    `;

    // Add input event listener
    const input = div.querySelector('.time-input');
    input.addEventListener('input', (e) => {
      this.updateDateLine(dateKey, e.target.value);
    });

    return div;
  }

  updateDateLine(dateKey, value) {
    this.dateLines.set(dateKey, value);
    this.updateGenerateButtonState();
  }

  saveCurrentEntries() {
    // Save all current input values to a persistent store
    const inputs = this.elements.dateLines.querySelectorAll('.time-input');
    inputs.forEach(input => {
      const dateKey = input.dataset.date;
      if (dateKey && input.value.trim()) {
        this.dateLines.set(dateKey, input.value.trim());
      }
    });
  }

  updateGenerateButtonState() {
    // Check if any time inputs have values
    const hasAnyTimes = Array.from(this.dateLines.values()).some(value => value.trim() !== '');
    this.elements.generateBtn.disabled = !hasAnyTimes;
  }

  restoreEntriesForDate(dateKey) {
    // Restore saved entry for a specific date
    return this.dateLines.get(dateKey) || '';
  }

  updateCustomDates() {
    if (this.currentPreset === 'custom') {
      this.generateDateLines();
    }
  }

  initializeTimezones() {
    // Populate my timezone dropdown
    const localTz = this.timezoneManager.getLocalTimezone();
    this.populateMyTimezoneSelect();
    
    // Set default to local timezone
    this.elements.myTimezone.value = localTz;
    
    // Create continental US timezone toggle buttons
    this.createTimezoneButtons();
  }

  populateMyTimezoneSelect() {
    const continentalTz = this.timezoneManager.getContinentalUSTimezones();
    
    continentalTz.forEach(tz => {
      const option = document.createElement('option');
      option.value = tz.id;
      option.textContent = this.timezoneManager.getTimezoneDisplayNameWithDST(tz.id);
      this.elements.myTimezone.appendChild(option);
    });
  }

  createTimezoneButtons() {
    const continentalTz = this.timezoneManager.getContinentalUSTimezones();
    const myTz = this.elements.myTimezone.value;
    
    continentalTz.forEach(tz => {
      // Skip the selected "my timezone"
      if (tz.id === myTz) return;
      
      const button = document.createElement('button');
      button.className = 'tz-btn';
      button.textContent = this.timezoneManager.getTimezoneDisplayNameWithDST(tz.id);
      button.dataset.timezone = tz.id;
      button.dataset.short = tz.short;
      
      button.addEventListener('click', () => {
        button.classList.toggle('active');
        this.updateSelectedTimezones();
      });
      
      this.elements.tzButtons.appendChild(button);
    });
  }

  updateSelectedTimezones() {
    this.targetTimezones = Array.from(this.elements.tzButtons.querySelectorAll('.tz-btn.active'))
      .map(btn => ({
        id: btn.dataset.timezone,
        short: btn.dataset.short
      }));
  }

  refreshTimezoneButtons() {
    // Clear existing buttons
    this.elements.tzButtons.innerHTML = '';
    
    // Recreate buttons with new selection
    this.createTimezoneButtons();
  }


  generateSchedule() {
    const myTz = this.elements.myTimezone.value;
    this.updateSelectedTimezones();

    let schedule = '';
    const warnings = [];
    
    this.selectedDates.forEach(date => {
      const dateKey = this.formatDateKey(date);
      const timeInput = this.dateLines.get(dateKey) || '';
      
      if (timeInput.trim()) {
        const dateStr = this.formatDateLong(date);
        const parsed = this.timeParser.parseTimeInput(timeInput, dateStr);
        if (parsed.isValid) {
          // Collect all time blocks for this date
          const dateTimeBlocks = [];
          
          parsed.blocks.forEach(block => {
            // Check for warnings
            this.checkForWarnings(date, block, myTz, warnings);
            
            // Add target timezone conversions with proper ordering
            if (this.targetTimezones.length > 0) {
              // Create array of all timezones (local + targets) with their times
              const allTimezones = [];
              
              // Add local timezone
              allTimezones.push({
                id: myTz,
                short: this.timezoneManager.getTimezoneDisplayName(myTz),
                startTime: this.timeParser.formatTime(block.start),
                endTime: block.end ? this.timeParser.formatTime(block.end) : null,
                isLocal: true
              });
              
              // Add target timezones
              this.targetTimezones.forEach(tz => {
                const convertedStart = this.timezoneManager.convertTime(
                  this.timeParser.formatTime(block.start), 
                  myTz, 
                  tz.id
                );
                const convertedEnd = block.end ? this.timezoneManager.convertTime(
                  this.timeParser.formatTime(block.end), 
                  myTz, 
                  tz.id
                ) : null;
                
                allTimezones.push({
                  id: tz.id,
                  short: tz.short,
                  startTime: convertedStart,
                  endTime: convertedEnd,
                  isLocal: false
                });
              });
              
              // Sort by start time (earliest first)
              allTimezones.sort((a, b) => {
                // Parse the formatted time strings to get minutes since midnight
                const timeA = this.parseTimeForSorting(a.startTime);
                const timeB = this.parseTimeForSorting(b.startTime);
                return timeA - timeB;
              });
              
              // Format the sorted times
              const sortedTimes = allTimezones.map(tz => {
                if (tz.endTime) {
                  return `${tz.startTime} - ${tz.endTime} ${tz.short}`;
                } else {
                  return `${tz.startTime} ${tz.short}`;
                }
              });
              
              dateTimeBlocks.push(sortedTimes.join(' / '));
            } else {
              // No target timezones, just use the block display
              dateTimeBlocks.push(block.display);
            }
          });
          
          // Add this date's time blocks to the schedule
          if (dateTimeBlocks.length > 0) {
            schedule += `${dateStr}: ${dateTimeBlocks.join(', ')}\n`;
          }
        } else {
          // Add error message for unparseable input
          warnings.push({
            type: 'parse-error',
            message: parsed.error
          });
        }
      }
    });

    // Display warnings
    this.displayWarnings(warnings);
    
    this.elements.scheduleText.textContent = schedule.trim();
    this.elements.output.classList.remove('hidden');
    this.elements.copyBtn.disabled = false;
  }

  async copySchedule() {
    const text = this.elements.scheduleText.textContent;
    
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied!');
    } catch (error) {
      console.error('Failed to copy:', error);
      this.showToast('Copy failed');
    }
  }

  showToast(message) {
    this.elements.toast.textContent = message;
    this.elements.toast.classList.add('show');
    
    setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, 2000);
  }

  formatDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  formatDateLong(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  parseTimeForSorting(timeString) {
    // Convert time string to minutes since midnight for sorting
    // Handle both "10 AM" and "10:30 AM" formats
    const match = timeString.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]) || 0;
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours * 60 + minutes;
    }
    return 0;
  }

  loadSavedData() {
    // Load saved data from chrome.storage if needed
    // This would be implemented for persistence
  }

  saveData() {
    // Save data to chrome.storage if needed
    // This would be implemented for persistence
  }

  checkForWarnings(date, block, myTz, warnings) {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Check for past times on today
    if (isToday) {
      const currentTime = new Date();
      const blockStartTime = new Date(today);
      blockStartTime.setHours(block.start.hours, block.start.minutes, 0, 0);
      
      if (blockStartTime < currentTime) {
        const currentTimeStr = currentTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        warnings.push({
          type: 'past-time',
          message: `Schedule for today includes times in the past (current time: ${currentTimeStr})`
        });
      }
    }
    
    // Check for working hours (9 AM - 5 PM local)
    const workingHoursStart = 9; // 9 AM
    const workingHoursEnd = 17; // 5 PM
    
    if (block.start.hours < workingHoursStart || (block.end && block.end.hours > workingHoursEnd)) {
      const dateStr = this.formatDateLong(date);
      const tzName = this.timezoneManager.getTimezoneDisplayNameWithDST(myTz);
      
      warnings.push({
        type: 'working-hours',
        message: `Avails on ${dateStr} are outside of local working hours (9 AM - 5 PM local) for ${tzName}`
      });
    }
  }

  displayWarnings(warnings) {
    this.elements.warnings.innerHTML = '';
    
    if (warnings.length === 0) {
      return;
    }
    
    // Remove duplicates
    const uniqueWarnings = warnings.filter((warning, index, self) => 
      index === self.findIndex(w => w.message === warning.message)
    );
    
    uniqueWarnings.forEach(warning => {
      const warningDiv = document.createElement('div');
      if (warning.type === 'parse-error') {
        warningDiv.className = 'warning error';
      } else {
        warningDiv.className = 'warning';
      }
      warningDiv.textContent = warning.message;
      this.elements.warnings.appendChild(warningDiv);
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AvailabilityManager();
});
