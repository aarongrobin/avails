# Avails v9

## Starting Point (Copied from v8)

### Current Features
- **Preset Options**: Next 5 Days (default), Next 10 Days, Custom
- **Custom Date Picker**: Allows selecting date ranges (today and future dates only)
- **Date Input Lines**: Clean, compact layout with date labels and time input boxes
- **Timezone Support**: Additional timezones section (PST, EST, GMT) centered without box
- **Help Text**: Inline help text above first input showing time format examples
- **Storage**: Persists entered times using chrome.storage
- **Generate & Copy**: Creates formatted schedule with copy-to-clipboard functionality

### UI Characteristics
- **Compact Design**: 320px width, minimal padding and spacing
- **Date Labels**: 90px wide, 11px font
- **Input Boxes**: Flexible width with 32px gap from date labels
- **Timezone Section**: Centered, no background box, stacked "ADDITIONAL TIMEZONES" label
- **Clean Spacing**: 6px bottom margin after date lines, balanced whitespace

### Technical Details
- Manifest Version 3
- Vanilla JavaScript (no frameworks)
- Chrome storage API for persistence
- Local timezone detection and parsing
- Custom time parser with flexible input formats
- Icon references added (need to generate icon files)

### Files Included
- `manifest.json` - Extension configuration
- `popup.html` - Main UI structure
- `popup.css` - Styling
- `popup.js` - Core functionality and UI logic
- `time-parser.js` - Time parsing utilities
- `timezone-data.js` - Timezone definitions and formatting
- `README.md` - General documentation
- `DESIGN_DECISIONS.md` - Architecture and design notes

### Ready for v9 Development
This folder contains a clean copy of the v8 extension, ready for further enhancements and modifications.

---
*Created: October 22, 2025*

