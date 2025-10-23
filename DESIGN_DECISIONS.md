# Design Decisions & Architecture

## Project Overview
Built a Chrome Extension (MV3) for manually composing availability with timezone support, following the PRD requirements for a popup-only interface.

## Key Design Decisions

### 1. Architecture Choice: Vanilla JavaScript
**Decision**: Used vanilla JavaScript instead of frameworks like React or Vue
**Reasoning**: 
- Minimal bundle size requirement (<200KB)
- Simple popup interface doesn't need complex state management
- Faster loading and execution
- No build process required
- Easier to maintain and debug

### 2. Time Parsing Strategy
**Decision**: Custom natural language parser instead of external libraries
**Reasoning**:
- No external dependencies to keep bundle small
- Full control over supported formats
- Can easily extend with new patterns
- Handles common formats: "10-11 AM", "2-3 PM", "noon-1", "10:30-11:30"

### 3. Timezone Handling
**Decision**: Built-in JavaScript Intl API instead of moment.js or date-fns
**Reasoning**:
- Native browser support, no external dependencies
- Automatic DST handling
- Smaller bundle size
- Sufficient for the use case

### 4. UI/UX Design
**Decision**: Clean, minimal interface with modern styling
**Reasoning**:
- Popup space is limited (400px width)
- Focus on functionality over decoration
- Clear visual hierarchy
- Accessible color contrast
- Responsive design for different screen sizes

### 5. Data Storage
**Decision**: Chrome storage API for future persistence
**Reasoning**:
- Minimal permissions required
- Built-in Chrome API
- Can store user preferences and recent timezones
- Currently implemented but not actively used (v1 focus)

### 6. Error Handling
**Decision**: Graceful degradation with user feedback
**Reasoning**:
- Toast notifications for copy success/failure
- Clear error messages for invalid time inputs
- Fallback to original text if timezone conversion fails
- Console logging for debugging

## Technical Implementation

### File Structure
```
popup.html          # Main interface
popup.css           # Styling (5.8KB)
popup.js            # Core functionality (11.8KB)
timezone-data.js    # Timezone utilities (5.4KB)
time-parser.js      # Time parsing logic (5.3KB)
manifest.json       # Extension configuration
```

### Bundle Size Analysis
- Total: ~30KB (well under 200KB target)
- Largest file: popup.js (11.8KB)
- No external dependencies
- Optimized for minimal footprint

### Key Features Implemented

1. **Date Selection**
   - This Week: Shows current week starting from Sunday
   - Next 7 Days: Shows next 7 days from today
   - Custom: User-defined date range (max 30 days)

2. **Time Input Parsing**
   - Supports multiple formats: "10-11 AM", "2-3 PM", "noon-1"
   - Comma-separated multiple blocks per date
   - Intelligent AM/PM detection
   - Range validation

3. **Timezone Support**
   - Auto-detects local timezone
   - Up to 2 target timezones
   - Popular timezones appear first
   - Proper DST handling via Intl API

4. **Schedule Generation**
   - Clean, readable format
   - Local timezone first, then target timezones
   - Proper time conversion
   - One-click copy functionality

### Performance Optimizations

1. **Lazy Loading**: Timezone data only loaded when needed
2. **Event Delegation**: Efficient event handling
3. **Minimal DOM Manipulation**: Direct updates to avoid reflows
4. **Efficient Parsing**: Regex-based time parsing with early returns

### Security Considerations

1. **Minimal Permissions**: Only `storage` and `clipboardWrite`
2. **No External Requests**: Fully offline after installation
3. **Input Sanitization**: Time input validation and sanitization
4. **No Personal Data**: No access to calendars or personal information

## Future Enhancements (v1.1+)

1. **Persistence**: Save user preferences and recent timezones
2. **Quick Actions**: One-click buttons for common timezones
3. **Compact View**: Dense layout option
4. **Analytics**: Anonymous usage tracking (no PII)
5. **Keyboard Shortcuts**: Quick access via hotkeys

## Testing Strategy

1. **Manual Testing**: test.html page for component verification
2. **Browser Testing**: Chrome extension environment
3. **Edge Cases**: Invalid time inputs, timezone edge cases
4. **Performance**: Bundle size monitoring

## Lessons Learned

1. **Chrome Extension MV3**: Simpler than expected, good documentation
2. **Time Parsing**: Natural language parsing is complex but manageable
3. **Timezone Handling**: Intl API is powerful but has some limitations
4. **Bundle Size**: Vanilla JS can be very efficient for simple use cases
5. **User Experience**: Popup constraints require careful UI design

## Conclusion

The extension successfully meets all PRD requirements:
- ✅ MV3 popup-only architecture
- ✅ Natural time input parsing
- ✅ Timezone support with DST
- ✅ One-click copy functionality
- ✅ <200KB bundle size
- ✅ Offline functionality
- ✅ Clean, modern UI

The implementation prioritizes simplicity, performance, and user experience while maintaining a small footprint and avoiding external dependencies.
