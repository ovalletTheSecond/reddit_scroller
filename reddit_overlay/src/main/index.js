import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const fetch = require('node-fetch')

async function fetchRss(subreddit) {
  try {
    console.log(`Fetching RSS for subreddit: ${subreddit}`)
    const url = `https://www.reddit.com/r/${subreddit}/.rss`
    const res = await fetch(url, { 
      headers: { "User-Agent": "reddit-overlay-app/1.0" } 
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const xml = await res.text()
    console.log(`Successfully fetched RSS data for r/${subreddit}`)
    console.log('First 400 characters:')
    console.log(xml.slice(0, 400))
    console.log('--- End of preview ---')
    
    return xml
  } catch (error) {
    console.error(`Error fetching RSS for r/${subreddit}:`, error)
    throw error
  }
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setAlwaysOnTop(true, 'screen');

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  
  // Handle RSS fetch requests
  ipcMain.handle('fetch-rss', async (event, subreddit) => {
    try {
      const rssData = await fetchRss(subreddit)
      return { success: true, data: rssData }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  createWindow()
  
  // Fetch RSS data on startup for demonstration
  setTimeout(() => {
    console.log('\n=== Testing RSS fetch on startup ===')
    fetchRss('javascript')
      .then(() => console.log('=== RSS fetch test completed ===\n'))
      .catch(err => console.error('=== RSS fetch test failed ===', err, '\n'))
  }, 2000) // Wait 2 seconds after startup

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
