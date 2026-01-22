/**
 * Avails - Timezone Picker Component
 * Searchable timezone dropdown with favorites support
 */

class TimezonePicker {
  constructor(options = {}) {
    this.searchInput = options.searchInput;
    this.dropdown = options.dropdown;
    this.favoritesListEl = options.favoritesList;
    this.allListEl = options.allList;
    this.selectedContainer = options.selectedContainer;

    this.maxSelections = options.maxSelections || 2;
    this.selectedTimezones = [];
    this.favorites = [];

    this.onSelect = options.onSelect || (() => {});
    this.onFavoriteToggle = options.onFavoriteToggle || (() => {});

    this.init();
  }

  async init() {
    this.favorites = await StorageManager.getFavorites();
    this.attachEvents();
    this.renderFavorites();
    this.renderPopularTimezones();
  }

  attachEvents() {
    // Search input events
    this.searchInput.addEventListener('focus', () => this.showDropdown());
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.hideDropdown();
      }
    });

    // Keyboard navigation
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Dropdown item clicks
    this.dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.tz-item');
      if (item) {
        const tzId = item.dataset.timezone;

        // Check if star was clicked
        if (e.target.closest('.favorite-star')) {
          this.toggleFavorite(tzId);
        } else {
          this.selectTimezone(tzId);
        }
      }
    });
  }

  showDropdown() {
    this.dropdown.classList.remove('hidden');
  }

  hideDropdown() {
    this.dropdown.classList.add('hidden');
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.renderFavorites();
      this.renderPopularTimezones();
      return;
    }

    const results = TimezoneManager.searchTimezones(query, this.favorites.map(f => f.id));

    // Hide favorites section when searching
    const favSection = this.dropdown.querySelector('#tz-favorites');
    favSection.style.display = 'none';

    // Show search results
    this.renderTimezoneList(results.slice(0, 15), this.allListEl);
  }

  renderFavorites() {
    const favSection = this.dropdown.querySelector('#tz-favorites');

    if (this.favorites.length === 0) {
      favSection.style.display = 'none';
      return;
    }

    favSection.style.display = 'block';
    this.renderTimezoneList(
      this.favorites.map(f => f.id),
      this.favoritesListEl,
      true
    );
  }

  renderPopularTimezones() {
    const popular = TimezoneManager.getPopularTimezones();
    this.renderTimezoneList(popular, this.allListEl);
  }

  renderTimezoneList(timezones, container, isFavoriteSection = false) {
    if (timezones.length === 0) {
      container.innerHTML = '<div class="tz-no-results">No timezones found</div>';
      return;
    }

    const html = timezones.map(tzId => {
      const isFavorite = this.favorites.some(f => f.id === tzId);
      const isSelected = this.selectedTimezones.includes(tzId);
      const display = TimezoneManager.formatDisplay(tzId);

      // Split display into name and offset parts
      const match = display.match(/^(.+)\s+\(([^)]+)\)$/);
      const name = match ? match[1] : display;
      const offset = match ? match[2] : '';

      return `
        <div class="tz-item ${isSelected ? 'selected' : ''}" data-timezone="${tzId}">
          <div class="tz-info">
            <span class="tz-name">${name}</span>
            <span class="tz-offset">${offset}</span>
          </div>
          <span class="favorite-star ${isFavorite ? 'active' : ''}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            ${isFavorite ? '★' : '☆'}
          </span>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  async toggleFavorite(tzId) {
    const result = await StorageManager.toggleFavorite(tzId);
    this.favorites = result.favorites;
    this.onFavoriteToggle(result.favorites);

    // Re-render
    this.renderFavorites();

    // Update the star in all lists
    const stars = this.dropdown.querySelectorAll(`[data-timezone="${tzId}"] .favorite-star`);
    stars.forEach(star => {
      star.classList.toggle('active', result.isFavorite);
      star.textContent = result.isFavorite ? '★' : '☆';
    });
  }

  selectTimezone(tzId) {
    // Check if already selected
    if (this.selectedTimezones.includes(tzId)) {
      return;
    }

    // Check max selections
    if (this.selectedTimezones.length >= this.maxSelections) {
      // Remove oldest selection
      this.selectedTimezones.shift();
    }

    this.selectedTimezones.push(tzId);

    // Track usage
    StorageManager.trackUsage(tzId);

    // Update UI
    this.renderSelectedTimezones();
    this.hideDropdown();
    this.searchInput.value = '';

    // Notify
    this.onSelect(this.selectedTimezones);
  }

  removeTimezone(tzId) {
    this.selectedTimezones = this.selectedTimezones.filter(tz => tz !== tzId);
    this.renderSelectedTimezones();
    this.onSelect(this.selectedTimezones);
  }

  renderSelectedTimezones() {
    if (this.selectedTimezones.length === 0) {
      this.selectedContainer.innerHTML = '';
      return;
    }

    const html = this.selectedTimezones.map(tzId => {
      const shortName = TimezoneManager.getShortName(tzId);
      const cityName = tzId.split('/').pop().replace(/_/g, ' ');

      return `
        <div class="selected-tz-chip" data-timezone="${tzId}">
          <span>${cityName} (${shortName})</span>
          <span class="remove-tz" title="Remove">&times;</span>
        </div>
      `;
    }).join('');

    this.selectedContainer.innerHTML = html;

    // Attach remove handlers
    this.selectedContainer.querySelectorAll('.remove-tz').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chip = e.target.closest('.selected-tz-chip');
        if (chip) {
          this.removeTimezone(chip.dataset.timezone);
        }
      });
    });
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.hideDropdown();
      this.searchInput.blur();
    }
  }

  getSelectedTimezones() {
    return [...this.selectedTimezones];
  }

  setSelectedTimezones(timezones) {
    this.selectedTimezones = timezones.slice(0, this.maxSelections);
    this.renderSelectedTimezones();
  }

  clearSelection() {
    this.selectedTimezones = [];
    this.renderSelectedTimezones();
    this.onSelect([]);
  }

  async refreshFavorites() {
    this.favorites = await StorageManager.getFavorites();
    this.renderFavorites();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimezonePicker;
}
