# Avails Version History

## v2.0.0 (January 2026) - Current

Complete rewrite with side panel interface and enhanced timezone support.

### New Features
- **Side Panel Interface**: Opens as a Chrome side panel instead of popup
- **600+ Timezones**: Full IANA timezone database with smart search
- **Favorite Timezones**: Save and quickly access frequently used timezones
- **Smart Defaults**: US-based users automatically get other US timezones as favorites
- **Per-Date Storage**: Saves availability entries for each specific date
- **Business Day Presets**: "Rest of Week" and "Next 7 Business Days" options
- **Improved Time Parsing**: Better support for shorthand formats like "10a-2p"
- **DST Awareness**: Automatic Daylight Saving Time handling

### Architecture Changes
- Modular JavaScript architecture with separate utility modules
- Service worker background script for side panel management
- Component-based UI (calendar, timezone picker, favorites manager)
- Uses browser's native `Intl` API for timezone operations

### Technical Details
- Manifest Version 3
- Permissions: `storage`, `sidePanel`
- Requires Chrome 114+ (Side Panel API)
- No external dependencies

---

## v1.0.0 (October 2025)

Original popup-based implementation.

### Features
- Quick presets: Next 5 Days, Next 10 Days, Custom
- Multi-timezone display: PST, EST, GMT
- Smart time parsing with flexible formats
- Auto-save functionality
- One-click copy to clipboard
- Compact 320px popup design

### Technical Details
- Manifest Version 3
- Permissions: `storage`, `clipboardWrite`
- Vanilla JavaScript (no frameworks)

### Files
- `popup.html`, `popup.css`, `popup.js`
- `time-parser.js`, `timezone-data.js`
- Icon files (16px, 48px, 128px)

> **Note**: v1.0.0 is available on the [v1 branch](https://github.com/aarongrobin/avails/tree/v1)

---

*Last updated: January 2026*
