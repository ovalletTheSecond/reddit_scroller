import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { writeFileSync, readFileSync, existsSync } from 'fs'
const fetch = require('node-fetch')

async function fetchRss(subredditOrUrl) {
  try {
    let url, logName
    
    // Check if it's a custom URL (starts with 'custom:')
    if (subredditOrUrl.startsWith('custom:')) {
      url = subredditOrUrl.replace('custom:', '')
      logName = url
      console.log(`Fetching RSS from custom URL: ${url}`)
    } else {
      // Standard subreddit RSS
      url = `https://www.reddit.com/r/${subredditOrUrl}/.rss`
      logName = `r/${subredditOrUrl}`
      console.log(`Fetching RSS for subreddit: ${subredditOrUrl}`)
    }
    
    const res = await fetch(url, { 
      headers: { "User-Agent": "reddit-overlay-app/1.0" } 
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const xml = await res.text()
    console.log(`Successfully fetched RSS data for ${logName}`)
    console.log('First 400 characters:')
    console.log(xml.slice(0, 400))
    console.log('--- End of preview ---')
    
    // Save RSS to file at project root
    try {
      const projectRoot = process.cwd()
      const filePath = join(projectRoot, 'last_rss_data.txt')
      const timestamp = new Date().toISOString()
      const fileContent = `=== RSS DATA FOR ${logName} ===\n` +
                         `Fetched at: ${timestamp}\n` +
                         `URL: ${url}\n` +
                         `Content length: ${xml.length} characters\n` +
                         `=== RAW RSS XML ===\n\n` +
                         xml
      
      writeFileSync(filePath, fileContent, 'utf8')
      console.log(`RSS data saved to: ${filePath}`)
    } catch (fileError) {
      console.error('Error saving RSS to file:', fileError)
    }
    
    return xml
  } catch (error) {
    console.error(`Error fetching RSS for ${logName || subredditOrUrl}:`, error)
    throw error
  }
}

async function fetchRedditPageContent(url) {
  try {
    console.log('url main found - url fetched - response : fetching...', url)
    const res = await fetch(url, { 
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0"
      },
      method: 'GET'
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`)
    }
    
    const html = await res.text()
    console.log('url main found - url fetched - response :', {
      url: url,
      status: res.status,
      statusText: res.statusText,
      responseLength: html.length,
      preview: html.slice(0, 200).replace(/\n/g, ' ') + '...'
    })
    
    return html
  } catch (error) {
    console.error('Error fetching Reddit page content:', error)
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
    title: 'Reddit Scroller',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
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
  
  // Handle Reddit page content fetch requests
  ipcMain.handle('fetch-reddit-content', async (event, url) => {
    try {
      const htmlContent = await fetchRedditPageContent(url)
      return { success: true, data: htmlContent }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // Handle debug file saving
  ipcMain.handle('save-debug-file', async (event, filename, content) => {
    try {
      const projectRoot = process.cwd()
      const filePath = join(projectRoot, filename)
      writeFileSync(filePath, content, 'utf8')
      console.log(`Debug file saved to: ${filePath}`)
      return { success: true, path: filePath }
    } catch (error) {
      console.error('Error saving debug file:', error)
      return { success: false, error: error.message }
    }
  })
  
  // Handle debug file load requests
  ipcMain.handle('load-debug-file', async (event, filename) => {
    try {
      const projectRoot = process.cwd()
      const filePath = join(projectRoot, filename)
      
      if (!existsSync(filePath)) {
        return { success: false, error: 'File not found' }
      }
      
      const content = readFileSync(filePath, 'utf8')
      console.log(`Debug file loaded: ${filePath} (${content.length} chars)`)
      return { success: true, data: content }
    } catch (error) {
      console.error('Error loading debug file:', error)
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
