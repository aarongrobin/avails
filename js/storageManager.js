/**
 * Avails - Storage Manager Module
 * Handles Chrome storage operations for favorites and preferences
 */

const StorageManager = {
  // Default preferences
  DEFAULT_PREFERENCES: {
    autoDetectSource: true,
    manualSourceTimezone: null,
    use24HourFormat: false,
    maxQuickFavorites: 3
  },

  // Default favorites (common US timezones)
  DEFAULT_FAVORITES: [
    { id: 'America/New_York', label: 'Eastern', usageCount: 0 },
    { id: 'America/Chicago', label: 'Central', usageCount: 0 },
    { id: 'America/Los_Angeles', label: 'Pacific', usageCount: 0 }
  ],

  /**
   * Get favorite timezones
   * @returns {Promise<Array>} Array of favorite timezone objects
   */
  async getFavorites() {
    try {
      const result = await chrome.storage.sync.get('favoriteTimezones');
      return result.favoriteTimezones || [...this.DEFAULT_FAVORITES];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [...this.DEFAULT_FAVORITES];
    }
  },

  /**
   * Save favorites to storage
   * @param {Array} favorites - Array of favorite timezone objects
   * @returns {Promise<void>}
   */
  async saveFavorites(favorites) {
    try {
      await chrome.storage.sync.set({ favoriteTimezones: favorites });
    } catch (error) {
      console.error('Error saving favorites:', error);
      throw error;
    }
  },

  /**
   * Add or update a favorite timezone
   * @param {string} timezoneId - IANA timezone identifier
   * @param {string} [label] - Custom label (optional)
   * @returns {Promise<Array>} Updated favorites array
   */
  async addFavorite(timezoneId, label = null) {
    const favorites = await this.getFavorites();
    const existing = favorites.find(f => f.id === timezoneId);

    if (existing) {
      // Increment usage count
      existing.usageCount = (existing.usageCount || 0) + 1;
      if (label) {
        existing.label = label;
      }
    } else {
      // Add new favorite
      const displayLabel = label || this.generateLabel(timezoneId);
      favorites.push({
        id: timezoneId,
        label: displayLabel,
        usageCount: 1,
        addedAt: Date.now()
      });
    }

    // Sort by usage count (most used first)
    favorites.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

    // Limit to 10 favorites
    const trimmed = favorites.slice(0, 10);

    await this.saveFavorites(trimmed);
    return trimmed;
  },

  /**
   * Remove a favorite timezone
   * @param {string} timezoneId - IANA timezone identifier
   * @returns {Promise<Array>} Updated favorites array
   */
  async removeFavorite(timezoneId) {
    const favorites = await this.getFavorites();
    const filtered = favorites.filter(f => f.id !== timezoneId);
    await this.saveFavorites(filtered);
    return filtered;
  },

  /**
   * Check if a timezone is a favorite
   * @param {string} timezoneId - IANA timezone identifier
   * @returns {Promise<boolean>}
   */
  async isFavorite(timezoneId) {
    const favorites = await this.getFavorites();
    return favorites.some(f => f.id === timezoneId);
  },

  /**
   * Toggle favorite status
   * @param {string} timezoneId - IANA timezone identifier
   * @returns {Promise<{isFavorite: boolean, favorites: Array}>}
   */
  async toggleFavorite(timezoneId) {
    const isFav = await this.isFavorite(timezoneId);
    let favorites;

    if (isFav) {
      favorites = await this.removeFavorite(timezoneId);
    } else {
      favorites = await this.addFavorite(timezoneId);
    }

    return { isFavorite: !isFav, favorites };
  },

  /**
   * Track usage of a timezone (increment count)
   * @param {string} timezoneId - IANA timezone identifier
   * @returns {Promise<void>}
   */
  async trackUsage(timezoneId) {
    const favorites = await this.getFavorites();
    const favorite = favorites.find(f => f.id === timezoneId);

    if (favorite) {
      favorite.usageCount = (favorite.usageCount || 0) + 1;
      favorites.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      await this.saveFavorites(favorites);
    }
  },

  /**
   * Get user preferences
   * @returns {Promise<Object>} Preferences object
   */
  async getPreferences() {
    try {
      const result = await chrome.storage.sync.get('preferences');
      return { ...this.DEFAULT_PREFERENCES, ...result.preferences };
    } catch (error) {
      console.error('Error getting preferences:', error);
      return { ...this.DEFAULT_PREFERENCES };
    }
  },

  /**
   * Update user preferences
   * @param {Object} updates - Partial preferences to update
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreferences(updates) {
    try {
      const current = await this.getPreferences();
      const merged = { ...current, ...updates };
      await chrome.storage.sync.set({ preferences: merged });
      return merged;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  /**
   * Get top N favorites for quick selection
   * @param {number} [count=3] - Number of favorites to return
   * @returns {Promise<Array>} Top favorites
   */
  async getTopFavorites(count = 3) {
    const favorites = await this.getFavorites();
    return favorites.slice(0, count);
  },

  /**
   * Generate a label for a timezone
   * @param {string} timezoneId - IANA timezone identifier
   * @returns {string} Generated label
   */
  generateLabel(timezoneId) {
    // Special handling for US timezones
    const usLabels = {
      'America/New_York': 'Eastern',
      'America/Chicago': 'Central',
      'America/Denver': 'Mountain',
      'America/Los_Angeles': 'Pacific',
      'America/Phoenix': 'Arizona',
      'America/Anchorage': 'Alaska',
      'Pacific/Honolulu': 'Hawaii'
    };

    if (usLabels[timezoneId]) {
      return usLabels[timezoneId];
    }

    // For other timezones, use city name
    const cityName = timezoneId.split('/').pop().replace(/_/g, ' ');
    return cityName;
  },

  /**
   * Clear all stored data (reset to defaults)
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  /**
   * Get storage usage info
   * @returns {Promise<{bytesUsed: number, quota: number}>}
   */
  async getStorageInfo() {
    try {
      const bytesUsed = await chrome.storage.sync.getBytesInUse(null);
      return {
        bytesUsed,
        quota: chrome.storage.sync.QUOTA_BYTES
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { bytesUsed: 0, quota: 102400 };
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
