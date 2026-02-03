import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DofusBot } from './dofusBot.js'

// Global bot instance
let dofusBot = null

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: 'Dofus Bot Overlay',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })

  mainWindow.setAlwaysOnTop(true, 'screen')

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

  // ==== Dofus Bot IPC Handlers ====

  // Initialize Dofus Bot
  ipcMain.handle('dofus-bot-init', async () => {
    try {
      if (!dofusBot) {
        dofusBot = new DofusBot()

        // Set up log callback to send logs to renderer
        dofusBot.setLogCallback((log) => {
          // Send log to all windows
          BrowserWindow.getAllWindows().forEach((window) => {
            window.webContents.send('dofus-bot-log', log)
          })
        })

        console.log('Dofus Bot initialized')
      }
      return { success: true }
    } catch (error) {
      console.error('Error initializing Dofus Bot:', error)
      return { success: false, error: error.message }
    }
  })

  // Start Dofus Bot
  ipcMain.handle('dofus-bot-start', async () => {
    try {
      if (!dofusBot) {
        dofusBot = new DofusBot()
        dofusBot.setLogCallback((log) => {
          BrowserWindow.getAllWindows().forEach((window) => {
            window.webContents.send('dofus-bot-log', log)
          })
        })
      }

      await dofusBot.start()
      return { success: true }
    } catch (error) {
      console.error('Error starting Dofus Bot:', error)
      return { success: false, error: error.message }
    }
  })

  // Stop Dofus Bot
  ipcMain.handle('dofus-bot-stop', async () => {
    try {
      if (dofusBot) {
        dofusBot.stop()
      }
      return { success: true }
    } catch (error) {
      console.error('Error stopping Dofus Bot:', error)
      return { success: false, error: error.message }
    }
  })

  // Get Dofus Bot state
  ipcMain.handle('dofus-bot-state', async () => {
    try {
      if (!dofusBot) {
        return { success: true, data: { state: 'not_initialized', isRunning: false } }
      }
      return { success: true, data: dofusBot.getState() }
    } catch (error) {
      console.error('Error getting Dofus Bot state:', error)
      return { success: false, error: error.message }
    }
  })

  // Get screenshot image as base64
  ipcMain.handle('dofus-bot-get-image', async (event, filepath) => {
    try {
      const { readFileSync, existsSync } = require('fs')
      if (!existsSync(filepath)) {
        return { success: false, error: 'File not found' }
      }
      const buffer = readFileSync(filepath)
      const base64 = buffer.toString('base64')
      return { success: true, data: base64 }
    } catch (error) {
      console.error('Error reading screenshot:', error)
      return { success: false, error: error.message }
    }
  })

  createWindow()

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
  // Cleanup Dofus Bot
  if (dofusBot) {
    dofusBot.cleanup()
    dofusBot = null
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup on quit
app.on('before-quit', () => {
  if (dofusBot) {
    dofusBot.cleanup()
    dofusBot = null
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
