/**
 * Dofus Bot Module
 * Handles bot logic, screenshot capture, and state management
 */

import screenshot from 'screenshot-desktop'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import * as nativeInput from './nativeInput.js'

// Bot states
const BotState = {
  OUT_OF_COMBAT: 'out_of_combat',
  SEARCHING_COMBAT: 'searching_combat',
  COMBAT_PLACEMENT: 'combat_placement',
  COMBAT_PLAYER_TURN: 'combat_player_turn',
  COMBAT_WAITING: 'combat_waiting'
}

class DofusBot {
  constructor() {
    this.state = BotState.OUT_OF_COMBAT
    this.screenshots = [] // Keep last 5 screenshots
    this.maxScreenshots = 5
    this.isRunning = false
    this.screenshotDir = join(process.cwd(), 'dofus_screenshots')
    this.logCallback = null

    // Configurable detection parameters
    this.pixelmatchThreshold = 0.1 // Sensitivity for pixel comparison (0-1)
    this.diffGridSize = 50 // Grid size for region detection (pixels)
    this.diffThreshold = 100 // Minimum different pixels to consider a region

    // Create screenshot directory if it doesn't exist
    if (!existsSync(this.screenshotDir)) {
      mkdirSync(this.screenshotDir, { recursive: true })
    }

    this.log('Dofus Bot initialized')
  }

  /**
   * Set callback for logging
   */
  setLogCallback(callback) {
    this.logCallback = callback
  }

  /**
   * Log a message to console and through callback
   * @param {string} message - The log message
   * @param {string} level - Log level (info, warn, error)
   * @param {object} metadata - Optional metadata (images, analysis results, etc.)
   */
  log(message, level = 'info', metadata = null) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    console.log(logMessage)

    if (this.logCallback) {
      const logData = { timestamp, level, message }
      if (metadata) {
        logData.metadata = metadata
      }
      this.logCallback(logData)
    }
  }

  /**
   * Log with screenshot image
   */
  logWithScreenshot(message, filepath, level = 'info', additionalData = {}) {
    const metadata = {
      type: 'screenshot',
      filepath,
      filename: filepath.split('/').pop(),
      ...additionalData
    }
    this.log(message, level, metadata)
  }

  /**
   * Log analysis results with images
   */
  logAnalysis(
    message,
    screenshot1Path,
    screenshot2Path,
    diffPath,
    analysisResults,
    level = 'info'
  ) {
    const metadata = {
      type: 'analysis',
      screenshot1: screenshot1Path,
      screenshot2: screenshot2Path,
      diffImage: diffPath,
      results: analysisResults
    }
    this.log(message, level, metadata)
  }

  /**
   * Start the bot
   */
  async start() {
    if (this.isRunning) {
      this.log('Bot is already running', 'warn')
      return
    }

    this.isRunning = true
    this.state = BotState.OUT_OF_COMBAT
    this.log('🚀 Bot started - État initial: hors de combat')

    // Start the main loop
    this.mainLoop()
  }

  /**
   * Stop the bot
   */
  stop() {
    this.isRunning = false
    this.log('⏹️ Bot stopped')
  }

  /**
   * Main bot loop
   */
  async mainLoop() {
    while (this.isRunning) {
      try {
        switch (this.state) {
          case BotState.OUT_OF_COMBAT:
            await this.handleOutOfCombat()
            break
          case BotState.SEARCHING_COMBAT:
            await this.handleSearchingCombat()
            break
          case BotState.COMBAT_PLACEMENT:
            await this.handleCombatPlacement()
            break
          case BotState.COMBAT_PLAYER_TURN:
            await this.handleCombatPlayerTurn()
            break
          case BotState.COMBAT_WAITING:
            await this.handleCombatWaiting()
            break
        }

        // Small delay to prevent CPU overuse
        await this.sleep(100)
      } catch (error) {
        this.log(`Error in main loop: ${error.message}`, 'error')
        console.error(error)
      }
    }
  }

  /**
   * Handle out of combat state
   */
  async handleOutOfCombat() {
    this.log('État: Hors de combat - Passage en recherche de combat')
    this.changeState(BotState.SEARCHING_COMBAT)
  }

  /**
   * Handle searching for combat
   */
  async handleSearchingCombat() {
    this.log('État: Recherche de combat - Début de la phase de combat')

    try {
      // Take first screenshot
      this.log('📸 Capture du premier screenshot...')
      const screenshot1 = await this.takeScreenshot()

      // Simulate pressing 'z' key
      this.log('⌨️ Appui sur la touche Z...')
      try {
        if (nativeInput.isWindows()) {
          await nativeInput.keyDown('z')
          this.log('✅ Touche Z enfoncée')
        } else {
          this.log('⚠️ Simulation clavier non disponible (Windows uniquement)', 'warn')
        }
      } catch (error) {
        this.log(`❌ Erreur simulation clavier: ${error.message}`, 'error')
      }

      // Wait a bit
      await this.sleep(500)

      // Take second screenshot with Z pressed
      this.log('📸 Capture du deuxième screenshot (avec Z enfoncé)...')
      const screenshot2 = await this.takeScreenshot()

      // Release Z key
      try {
        if (nativeInput.isWindows()) {
          await nativeInput.keyUp('z')
          this.log('✅ Touche Z relâchée')
        }
      } catch (error) {
        this.log(`❌ Erreur libération touche: ${error.message}`, 'error')
      }

      // Calculate difference
      this.log('🔍 Calcul des différences entre les screenshots...')
      const differences = await this.findDifferences(screenshot1, screenshot2)

      if (differences.length > 0) {
        this.log(`✅ ${differences.length} zones de différence détectées`)

        // Click on differences
        for (let i = 0; i < differences.length; i++) {
          const diff = differences[i]
          this.log(`🖱️ Clic sur la zone ${i + 1} à (${diff.x}, ${diff.y})`)
          try {
            if (nativeInput.isWindows()) {
              await nativeInput.click(diff.x, diff.y, 'left')
              this.log(`✅ Clic effectué à (${diff.x}, ${diff.y})`)
            } else {
              this.log('⚠️ Simulation souris non disponible (Windows uniquement)', 'warn')
            }
          } catch (error) {
            this.log(`❌ Erreur simulation souris: ${error.message}`, 'error')
          }
          await this.sleep(200)
        }

        this.log('⚔️ Entré en combat!')
        this.changeState(BotState.COMBAT_PLACEMENT)
      } else {
        this.log('⚠️ Aucune différence détectée, nouvelle tentative...')
        await this.sleep(1000)
      }
    } catch (error) {
      this.log(`❌ Erreur lors de la recherche de combat: ${error.message}`, 'error')
      await this.sleep(2000)
    }
  }

  /**
   * Handle combat placement state
   */
  async handleCombatPlacement() {
    this.log('État: Placement de début de combat')
    // For now, just transition to waiting
    await this.sleep(2000)
    this.changeState(BotState.COMBAT_WAITING)
  }

  /**
   * Handle combat player turn
   */
  async handleCombatPlayerTurn() {
    this.log('État: En combat - Tour du joueur')
    // Placeholder for combat actions
    await this.sleep(2000)
    this.changeState(BotState.COMBAT_WAITING)
  }

  /**
   * Handle combat waiting state
   */
  async handleCombatWaiting() {
    this.log('État: En combat - Attente de début du tour')
    // Placeholder for waiting logic
    await this.sleep(2000)
    // For demo, go back to searching
    this.changeState(BotState.SEARCHING_COMBAT)
  }

  /**
   * Change bot state
   */
  changeState(newState) {
    const oldState = this.state
    this.state = newState
    this.log(`🔄 Changement d'état: ${oldState} → ${newState}`)
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot() {
    const timestamp = Date.now()
    const filename = `screenshot_${timestamp}.png`
    const filepath = join(this.screenshotDir, filename)

    // Capture screenshot
    const imgBuffer = await screenshot()

    // Save to file
    writeFileSync(filepath, imgBuffer)

    // Add to screenshots array
    this.screenshots.push({
      filename,
      filepath,
      timestamp,
      buffer: imgBuffer
    })

    // Manage screenshot history (keep only last 5)
    this.manageScreenshotHistory()

    // Log with screenshot preview
    this.logWithScreenshot(`📸 Screenshot capturé`, filepath, 'info', {
      timestamp,
      size: imgBuffer.length
    })

    return { filepath, buffer: imgBuffer, timestamp, filename }
  }

  /**
   * Manage screenshot history - keep only last 5
   */
  manageScreenshotHistory() {
    while (this.screenshots.length > this.maxScreenshots) {
      const oldScreenshot = this.screenshots.shift()

      // Delete old file
      if (existsSync(oldScreenshot.filepath)) {
        try {
          unlinkSync(oldScreenshot.filepath)
          this.log(`🗑️ Screenshot supprimé: ${oldScreenshot.filename}`)
        } catch (error) {
          this.log(
            `Erreur lors de la suppression de ${oldScreenshot.filename}: ${error.message}`,
            'error'
          )
        }
      }
    }
  }

  /**
   * Find differences between two screenshots
   */
  async findDifferences(screenshot1, screenshot2) {
    try {
      // Parse PNG images
      const img1 = PNG.sync.read(screenshot1.buffer)
      const img2 = PNG.sync.read(screenshot2.buffer)

      const { width, height } = img1
      const diff = new PNG({ width, height })

      // Calculate pixel differences
      const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
        threshold: this.pixelmatchThreshold
      })

      // Save diff image for debugging
      const diffFilename = `diff_${Date.now()}.png`
      const diffPath = join(this.screenshotDir, diffFilename)
      writeFileSync(diffPath, PNG.sync.write(diff))

      // Find regions of differences
      const differences = this.findDifferenceRegions(diff.data, width, height)

      // Log analysis results with images
      const analysisResults = {
        numDiffPixels,
        totalPixels: width * height,
        percentDiff: ((numDiffPixels / (width * height)) * 100).toFixed(2),
        regionsFound: differences.length,
        regions: differences.map((d) => ({ x: d.x, y: d.y, diffPixels: d.diffPixels }))
      }

      this.logAnalysis(
        `🔍 Analyse terminée: ${differences.length} région(s) détectée(s)`,
        screenshot1.filepath,
        screenshot2.filepath,
        diffPath,
        analysisResults,
        'info'
      )

      return differences
    } catch (error) {
      this.log(`Erreur lors du calcul des différences: ${error.message}`, 'error')
      return []
    }
  }

  /**
   * Find regions where differences are concentrated
   */
  findDifferenceRegions(diffData, width, height) {
    const regions = []

    for (let y = 0; y < height; y += this.diffGridSize) {
      for (let x = 0; x < width; x += this.diffGridSize) {
        let diffCount = 0

        // Count different pixels in this region
        for (let dy = 0; dy < this.diffGridSize && y + dy < height; dy++) {
          for (let dx = 0; dx < this.diffGridSize && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4
            // If pixel is marked as different (red channel > 0)
            if (diffData[idx] > 0) {
              diffCount++
            }
          }
        }

        if (diffCount > this.diffThreshold) {
          regions.push({
            x: x + this.diffGridSize / 2,
            y: y + this.diffGridSize / 2,
            diffPixels: diffCount
          })
        }
      }
    }

    return regions
  }

  /**
   * Get current state
   */
  getState() {
    return {
      state: this.state,
      isRunning: this.isRunning,
      screenshotCount: this.screenshots.length
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stop()
    this.log('🧹 Nettoyage des ressources')
  }
}

export { DofusBot, BotState }
