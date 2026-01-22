/**
 * Avails - Favorites Manager Component
 * Manages the favorite timezone chips display
 */

class FavoritesManager {
  constructor(options = {}) {
    this.container = options.container;
    this.onSelect = options.onSelect || (() => {});
    this.maxDisplay = options.maxDisplay || 5;

    this.favorites = [];
    this.init();
  }

  async init() {
    await this.refresh();
  }

  async refresh() {
    this.favorites = await StorageManager.getFavorites();
    this.render();
  }

  render() {
    if (this.favorites.length === 0) {
      this.container.innerHTML = '<span class="no-favorites">No favorites yet</span>';
      return;
    }

    const displayFavorites = this.favorites.slice(0, this.maxDisplay);

    const html = displayFavorites.map(fav => {
      const shortName = TimezoneManager.getShortName(fav.id);

      return `
        <button type="button" class="favorite-chip" data-timezone="${fav.id}" title="${fav.label}">
          <span class="star">★</span>
          <span class="label">${shortName}</span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = html;

    // Attach click handlers
    this.container.querySelectorAll('.favorite-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tzId = chip.dataset.timezone;
        this.onSelect(tzId);
      });
    });
  }

  getFavorites() {
    return [...this.favorites];
  }

  getTopFavorites(count = 3) {
    return this.favorites.slice(0, count);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FavoritesManager;
}
