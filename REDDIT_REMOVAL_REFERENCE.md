# Reddit Scroller - Removed Code Reference

## Overview

This document lists all the Reddit functionality that was removed from this branch on 2026-02-03. This code could be moved to a separate repository if desired.

## Files Removed

### Application Code (3 large React components)
1. **`src/renderer/src/App.jsx`** (58 KB)
   - Main Reddit scroller application
   - Reddit RSS feed viewer
   - Post navigation and display
   - WebView integration for Reddit pages
   - Comment fetching and display

2. **`src/renderer/src/App_working.jsx`**
   - Working backup of the Reddit app

3. **`src/renderer/src/App_broken.jsx`**
   - Another version of the Reddit app

### Data Files
4. **`HOW TO USE.txt`** - Instructions for Reddit overlay
5. **`last_rss_data.txt`** - Cached Reddit RSS data
6. **`last_reddit_view.txt`** - Cached Reddit page content
7. **`last_main_content.txt`** - Cached main content
8. **`last_comment_fetch.txt`** - Cached comment data

## Code Removed from Existing Files

### `src/main/index.js`
Removed the following functions and handlers:

```javascript
// RSS fetching function
async function fetchRss(subredditOrUrl) { ... }

// Reddit page content fetching
async function fetchRedditPageContent(url) { ... }

// IPC Handlers
ipcMain.handle('fetch-rss', ...)
ipcMain.handle('fetch-reddit-content', ...)
ipcMain.handle('save-debug-file', ...)
ipcMain.handle('load-debug-file', ...)

// Startup RSS fetch
setTimeout(() => {
  fetchRss('javascript')...
}, 2000)
```

Also removed imports:
- `writeFileSync, readFileSync, existsSync` from 'fs'
- `const fetch = require('node-fetch')`

### `src/preload/index.js`
Removed from API exports:

```javascript
fetchRss: (subreddit) => ipcRenderer.invoke('fetch-rss', subreddit),
fetchRedditContent: (url) => ipcRenderer.invoke('fetch-reddit-content', url),
saveDebugFile: (filename, content) => ipcRenderer.invoke('save-debug-file', filename, content),
loadDebugFile: (filename) => ipcRenderer.invoke('load-debug-file', filename)
```

## Dependencies Removed

### From `package.json`:
- `"fast-xml-parser": "^5.3.3"` - Used for parsing Reddit RSS XML
- `"node-fetch": "^2.7.0"` - Used for HTTP requests to Reddit

## Features That Were Removed

1. **Reddit RSS Feed Reader**
   - Fetch and parse RSS feeds from subreddits
   - Custom URL support for RSS feeds
   - RSS data caching

2. **Reddit Post Viewer**
   - Navigate through Reddit posts
   - Display post titles, content, and metadata
   - Embedded WebView for viewing full Reddit pages

3. **Reddit Comment Fetching**
   - Fetch and display Reddit comments
   - Comment thread navigation

4. **Debug File System**
   - Save Reddit content to local files
   - Load cached Reddit data
   - Debug file management

## How to Recreate Reddit Scroller in a New Repo

If you want to move the Reddit functionality to a separate repository:

1. **Create a new Electron + React project**
   ```bash
   npm create @quick-start/electron reddit-scroller
   ```

2. **Install the removed dependencies**
   ```bash
   npm install node-fetch@2.7.0 fast-xml-parser@5.3.3
   ```

3. **Restore the removed files**
   - Copy `App.jsx`, `App_working.jsx`, `App_broken.jsx` to new repo
   - Restore the removed code in `main/index.js` and `preload/index.js`

4. **Update `main.jsx`** to import `App.jsx` instead of `AppDofus.jsx`:
   ```javascript
   import App from './App'
   // instead of
   import AppDofus from './AppDofus'
   ```

5. **Update window title** in `main/index.js`:
   ```javascript
   title: 'Reddit Scroller'
   ```

## Alternative: Retrieve from Git History

Since this code was committed to git before removal, you can retrieve it using:

```bash
# See what was removed
git show HEAD:reddit_overlay/src/renderer/src/App.jsx > App.jsx

# Or checkout the previous commit
git checkout HEAD~1 -- reddit_overlay/src/renderer/src/App.jsx
```

## Summary

The Reddit functionality was cleanly separated from the Dofus bot overlay. All Reddit-related code has been removed, leaving only the Dofus bot implementation. The removed code was:
- ~60 KB of React components
- 2 main processing functions
- 4 IPC handlers
- 5 data cache files
- 2 npm dependencies

The repository is now focused solely on the Dofus bot overlay application.
