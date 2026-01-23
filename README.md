# Avails - Manual Availability Chrome Extension

A lightweight Chrome extension (Manifest V3) for quickly composing and sharing your availability across multiple timezones.


## Screenshots

**Chrome Extension**
<br><img src="Avails%20Start.jpg" width="500"/>

**Schedule Entered and Formatted**
<br><img src="Avails%20Formatted%20Schedule.jpg" width="500"/>

**Schedule Entered and Formatted with Multiple Timezones**
<br><img src="Avails%20Formatted%20Schedule%20with%20Multiple%20Timezones.jpg" width="500"/>

**Custom Dates and Formatted with Multiple Timezones**
<br><img src="Avails%20Formatted%20Custom%20Dates%20Schedule%20with%20Multiple%20Timezones.jpg" width="500"/>


## Demo

https://www.loom.com/share/9d316064e98d4ec7916096d57414f8e8

## Features

- 🗓️ **Quick Presets**: Next 5 days, Next 10 days, or custom date ranges
- 🌍 **Multi-Timezone Support**: Display availability in PST, EST, and GMT
- ⚡ **Smart Time Parsing**: Flexible input formats (e.g., "10-11 AM", "2-3 PM", "noon-1")
- 💾 **Auto-Save**: Automatically saves your entries as you type
- 📋 **One-Click Copy**: Generate and copy formatted schedules to clipboard
- 🎨 **Clean UI**: Compact, modern design optimized for quick use

## Installation

### From Source

1. **Clone this repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/avails.git
   cd avails
   ```

2. **Load the extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing this extension

3. **Use the extension**:
   - Click the Avails icon in your Chrome toolbar
   - Enter your availability
   - Click "Generate Schedule" and "Copy Schedule"

## Usage

### Entering Times

Enter times in a flexible, natural format:
- `10-11 AM` or `10-11 am`
- `2-3 PM` or `2-3pm`
- `noon-1` or `12-1`
- `11 AM - 12 PM` (spaces are fine)
- Multiple slots: `10-11 AM, 2-3 PM, 5-6 PM`

### Presets

- **Next 5 Days**: Shows today + next 4 days (default)
- **Next 10 Days**: Shows today + next 9 days
- **Custom**: Select your own start and end dates

### Additional Timezones

Toggle PST, EST, or GMT to show your availability in those timezones alongside your local time.

## Example Output

```
Tue, Oct 22, 2024
10:00 AM - 11:00 AM PDT
11:00 AM PDT = 2:00 PM EDT / 6:00 PM GMT

Wed, Oct 23, 2024
2:00 PM - 3:00 PM PDT
2:00 PM PDT = 5:00 PM EDT / 9:00 PM GMT
```

## Technical Details

- **Manifest Version**: 3
- **Permissions**: `storage`, `clipboardWrite`
- **Storage**: Uses Chrome's `chrome.storage.local` API
- **Framework**: Vanilla JavaScript (no dependencies)
- **Browser Support**: Chrome, Edge, and other Chromium-based browsers

## Project Structure

```
avails/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI structure
├── popup.css             # Styling
├── popup.js              # Core functionality
├── time-parser.js        # Time parsing utilities
├── timezone-data.js      # Timezone definitions
├── icon16.png            # 16x16 icon
├── icon48.png            # 48x48 icon
├── icon128.png           # 128x128 icon
├── generate-icons.html   # Icon generator tool
├── DESIGN_DECISIONS.md   # Architecture notes
├── VERSION_NOTES.md      # Version history
└── README.md             # This file
```

## Development

### Making Changes

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Avails extension
4. Test your changes

### Design Philosophy

See [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) for detailed information about architecture and design choices.

## Version History

See [VERSION_NOTES.md](VERSION_NOTES.md) for version-specific notes and changelog.

## License

MIT License - Feel free to use and modify as needed.

## Contributing

This is a personal project, but suggestions and improvements are welcome! Feel free to open an issue or submit a pull request.

## Author

Created for quick availability scheduling across timezones.

---

**Note**: This extension stores data locally in your browser. Your availability data never leaves your machine.
