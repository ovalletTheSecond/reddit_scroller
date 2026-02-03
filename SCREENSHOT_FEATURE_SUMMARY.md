# Screenshot Viewing Feature - Implementation Summary

## Overview

Added comprehensive screenshot viewing and analysis capabilities to the Dofus bot logs. Users can now see captured images and detailed analysis results directly in the log timeline.

## Features Implemented

### 1. Screenshot Logs 📸

When the bot captures a screenshot, it now appears in the logs with:
- **Thumbnail preview** - Clickable image (max 200x150px)
- **File information** - Filename and file size in KB
- **Timestamp** - When the screenshot was taken
- **Click to expand** - View full-size image in modal

Example log entry:
```
[16:30:45] [INFO] 📸 Screenshot capturé
  📁 screenshot_1738604445123.png
  📊 Size: 245.67 KB
  [Thumbnail Image]
```

### 2. Analysis Logs 🔍

When the bot analyzes images for differences, it displays:

**Three Images Side-by-Side:**
- Screenshot 1 (before)
- Screenshot 2 (after pressing 'Z')
- Diff Image (highlighted differences)

**Detailed Metrics:**
- Pixels différents: 45,234 / 2,073,600 (2.18%)
- Régions détectées: 3

**Region Details:**
- Région 1: Position (450, 320) - 2,450 pixels
- Région 2: Position (780, 540) - 1,890 pixels
- Région 3: Position (210, 680) - 1,234 pixels

### 3. Image Modal 🖼️

Click any thumbnail to view full-size:
- Dark overlay (90% opacity)
- Image title header
- Close button (X)
- Click outside to dismiss
- Responsive sizing (max 90% viewport)

## Technical Implementation

### Backend Changes (dofusBot.js)

```javascript
// New logging methods
log(message, level = 'info', metadata = null)
logWithScreenshot(message, filepath, level = 'info', additionalData = {})
logAnalysis(message, screenshot1Path, screenshot2Path, diffPath, analysisResults, level = 'info')

// Enhanced screenshot capture
async takeScreenshot() {
  // ... capture logic ...
  this.logWithScreenshot(`📸 Screenshot capturé`, filepath, 'info', {
    timestamp,
    size: imgBuffer.length
  })
}

// Enhanced analysis
async findDifferences(screenshot1, screenshot2) {
  // ... diff logic ...
  const analysisResults = {
    numDiffPixels,
    totalPixels,
    percentDiff,
    regionsFound,
    regions: [...]
  }
  this.logAnalysis('🔍 Analyse terminée...', path1, path2, diffPath, analysisResults)
}
```

### IPC Layer (main/index.js)

```javascript
// New handler to retrieve images
ipcMain.handle('dofus-bot-get-image', async (event, filepath) => {
  const buffer = readFileSync(filepath)
  const base64 = buffer.toString('base64')
  return { success: true, data: base64 }
})
```

### Frontend (DofusBot.jsx)

```javascript
// New LogEntry component
const LogEntry = ({ log, index }) => {
  const [images, setImages] = useState({})
  const [expandedImage, setExpandedImage] = useState(null)

  useEffect(() => {
    // Load images asynchronously
    if (log.metadata?.type === 'screenshot') {
      // Load single screenshot
    } else if (log.metadata?.type === 'analysis') {
      // Load three images
    }
  }, [log])

  return (
    <div>
      {/* Log header */}
      {/* Screenshot display */}
      {/* Analysis display with 3 images */}
      {/* Image modal */}
    </div>
  )
}
```

## Log Structure

### Screenshot Log
```javascript
{
  timestamp: "2026-02-03T16:30:45.123Z",
  level: "info",
  message: "📸 Screenshot capturé",
  metadata: {
    type: "screenshot",
    filepath: "/path/to/screenshot_123.png",
    filename: "screenshot_123.png",
    timestamp: 1738604445123,
    size: 251580
  }
}
```

### Analysis Log
```javascript
{
  timestamp: "2026-02-03T16:30:47.456Z",
  level: "info",
  message: "🔍 Analyse terminée: 3 région(s) détectée(s)",
  metadata: {
    type: "analysis",
    screenshot1: "/path/to/screenshot_123.png",
    screenshot2: "/path/to/screenshot_124.png",
    diffImage: "/path/to/diff_125.png",
    results: {
      numDiffPixels: 45234,
      totalPixels: 2073600,
      percentDiff: "2.18",
      regionsFound: 3,
      regions: [
        { x: 450, y: 320, diffPixels: 2450 },
        { x: 780, y: 540, diffPixels: 1890 },
        { x: 210, y: 680, diffPixels: 1234 }
      ]
    }
  }
}
```

## Styling

### Colors & Theme
- Background: Dark theme (#1a1a2e)
- Image containers: rgba(0, 0, 0, 0.2-0.3)
- Borders: #0f3460
- Accent: #00d4ff
- Analysis results: rgba(0, 212, 255, 0.1)

### Layout
- Thumbnails: max 200x150px
- Modal images: max 90% viewport
- Flex layout for analysis images
- Responsive wrapping

### Interactions
- Hover effects on thumbnails
- Cursor pointer on clickable images
- Smooth transitions
- Modal overlay with click-outside dismiss

## Benefits

1. **Visual Debugging** - See exactly what the bot is analyzing
2. **Transparency** - Understand bot decisions through image diffs
3. **Real-time Feedback** - Watch screenshots appear as they're captured
4. **Detailed Metrics** - Precise analysis data for tuning parameters
5. **Historical View** - Review past captures in log timeline

## Future Enhancements

Potential improvements:
- [ ] Image comparison slider (before/after)
- [ ] Region highlighting overlays
- [ ] Export analysis reports
- [ ] Screenshot annotations
- [ ] Zoom/pan controls in modal
- [ ] Keyboard shortcuts (ESC to close modal)

## Usage

Simply start the bot and watch the logs:

1. Bot captures screenshot → Thumbnail appears in logs
2. Bot analyzes differences → 3 images + metrics appear
3. Click any image → View full-size in modal
4. Review regions detected in analysis results

No additional configuration needed - feature works automatically!
