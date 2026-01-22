/**
 * Avails - Calendar Picker Component
 * Minimal calendar for date selection
 */

class CalendarPicker {
  constructor(container, options = {}) {
    this.container = container;
    this.selectedDate = options.initialDate || null;
    this.currentMonth = new Date();
    this.onSelect = options.onSelect || (() => {});
    this.minDate = options.minDate || new Date();

    // Set minDate to start of day
    this.minDate.setHours(0, 0, 0, 0);

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="calendar-picker">
        <div class="calendar-header">
          <button type="button" class="cal-nav cal-prev" aria-label="Previous month">&lt;</button>
          <span class="cal-month-year"></span>
          <button type="button" class="cal-nav cal-next" aria-label="Next month">&gt;</button>
        </div>
        <div class="calendar-weekdays">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>
        <div class="calendar-days"></div>
      </div>
    `;

    this.monthYearEl = this.container.querySelector('.cal-month-year');
    this.daysEl = this.container.querySelector('.calendar-days');
    this.prevBtn = this.container.querySelector('.cal-prev');
    this.nextBtn = this.container.querySelector('.cal-next');

    this.attachEvents();
    this.renderMonth();
  }

  attachEvents() {
    this.prevBtn.addEventListener('click', () => this.navigateMonth(-1));
    this.nextBtn.addEventListener('click', () => this.navigateMonth(1));

    this.daysEl.addEventListener('click', (e) => {
      const dayEl = e.target.closest('.calendar-day');
      if (dayEl && !dayEl.classList.contains('disabled') && !dayEl.classList.contains('empty')) {
        const day = parseInt(dayEl.dataset.day, 10);
        this.selectDate(day);
      }
    });
  }

  navigateMonth(direction) {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
    this.renderMonth();
  }

  renderMonth() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Update header
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.monthYearEl.textContent = `${monthNames[month]} ${year}`;

    // Check if we can go back
    const firstOfMonth = new Date(year, month, 1);
    const minMonth = new Date(this.minDate.getFullYear(), this.minDate.getMonth(), 1);
    this.prevBtn.disabled = firstOfMonth <= minMonth;

    // Generate days
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';

    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      html += '<button type="button" class="calendar-day empty" disabled></button>';
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      const classes = ['calendar-day'];

      // Check if this is today
      if (date.getTime() === today.getTime()) {
        classes.push('today');
      }

      // Check if this is selected
      if (this.selectedDate &&
          date.getFullYear() === this.selectedDate.getFullYear() &&
          date.getMonth() === this.selectedDate.getMonth() &&
          date.getDate() === this.selectedDate.getDate()) {
        classes.push('selected');
      }

      // Check if this is before minDate
      if (date < this.minDate) {
        classes.push('disabled');
      }

      html += `<button type="button" class="${classes.join(' ')}" data-day="${day}">${day}</button>`;
    }

    this.daysEl.innerHTML = html;
  }

  selectDate(day) {
    this.selectedDate = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth(),
      day
    );

    this.renderMonth();
    this.onSelect(this.selectedDate);
  }

  getSelectedDate() {
    return this.selectedDate;
  }

  setSelectedDate(date) {
    this.selectedDate = date;
    if (date) {
      this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    this.renderMonth();
  }

  setMinDate(date) {
    this.minDate = new Date(date);
    this.minDate.setHours(0, 0, 0, 0);
    this.renderMonth();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalendarPicker;
}
