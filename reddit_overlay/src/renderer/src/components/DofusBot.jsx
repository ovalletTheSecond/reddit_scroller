import { useState, useEffect } from 'react'

// Component to render a single log entry
const LogEntry = ({ log, index }) => {
  const [images, setImages] = useState({})
  const [expandedImage, setExpandedImage] = useState(null)

  useEffect(() => {
    // Load images for this log entry if it has metadata
    const loadImages = async () => {
      if (!log.metadata) return

      const newImages = {}

      if (log.metadata.type === 'screenshot' && log.metadata.filepath) {
        const response = await window.api?.dofusBotGetImage(log.metadata.filepath)
        if (response?.success) {
          newImages.main = response.data
        }
      } else if (log.metadata.type === 'analysis') {
        // Load all three images for analysis
        if (log.metadata.screenshot1) {
          const resp = await window.api?.dofusBotGetImage(log.metadata.screenshot1)
          if (resp?.success) newImages.screenshot1 = resp.data
        }
        if (log.metadata.screenshot2) {
          const resp = await window.api?.dofusBotGetImage(log.metadata.screenshot2)
          if (resp?.success) newImages.screenshot2 = resp.data
        }
        if (log.metadata.diffImage) {
          const resp = await window.api?.dofusBotGetImage(log.metadata.diffImage)
          if (resp?.success) newImages.diff = resp.data
        }
      }

      setImages(newImages)
    }

    loadImages()
  }, [log])

  const getLogColor = (level) => {
    switch (level) {
      case 'error':
        return 'rgba(244, 67, 54, 0.1)'
      case 'warn':
        return 'rgba(255, 152, 0, 0.1)'
      case 'info':
        return 'rgba(33, 150, 243, 0.05)'
      default:
        return 'transparent'
    }
  }

  return (
    <div
      style={{
        ...styles.logEntry,
        backgroundColor: getLogColor(log.level)
      }}
    >
      <div style={styles.logHeader}>
        <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
        <span style={styles.logLevel}>[{log.level.toUpperCase()}]</span>
        <span style={styles.logMessage}>{log.message}</span>
      </div>

      {/* Render screenshot metadata */}
      {log.metadata?.type === 'screenshot' && images.main && (
        <div style={styles.imageContainer}>
          <img
            src={`data:image/png;base64,${images.main}`}
            alt="Screenshot"
            style={styles.thumbnailImage}
            onClick={() => setExpandedImage({ src: images.main, title: 'Screenshot' })}
          />
          <div style={styles.imageInfo}>
            <span>📁 {log.metadata.filename}</span>
            <span>📊 Size: {(log.metadata.size / 1024).toFixed(2)} KB</span>
          </div>
        </div>
      )}

      {/* Render analysis metadata */}
      {log.metadata?.type === 'analysis' && (
        <div style={styles.analysisContainer}>
          <div style={styles.analysisImages}>
            {images.screenshot1 && (
              <div style={styles.analysisImageWrapper}>
                <div style={styles.imageLabel}>Screenshot 1</div>
                <img
                  src={`data:image/png;base64,${images.screenshot1}`}
                  alt="Screenshot 1"
                  style={styles.thumbnailImage}
                  onClick={() =>
                    setExpandedImage({ src: images.screenshot1, title: 'Screenshot 1' })
                  }
                />
              </div>
            )}
            {images.screenshot2 && (
              <div style={styles.analysisImageWrapper}>
                <div style={styles.imageLabel}>Screenshot 2</div>
                <img
                  src={`data:image/png;base64,${images.screenshot2}`}
                  alt="Screenshot 2"
                  style={styles.thumbnailImage}
                  onClick={() =>
                    setExpandedImage({ src: images.screenshot2, title: 'Screenshot 2' })
                  }
                />
              </div>
            )}
            {images.diff && (
              <div style={styles.analysisImageWrapper}>
                <div style={styles.imageLabel}>Différences</div>
                <img
                  src={`data:image/png;base64,${images.diff}`}
                  alt="Diff"
                  style={styles.thumbnailImage}
                  onClick={() =>
                    setExpandedImage({ src: images.diff, title: 'Image de différence' })
                  }
                />
              </div>
            )}
          </div>
          {log.metadata.results && (
            <div style={styles.analysisResults}>
              <div style={styles.resultItem}>
                <strong>Pixels différents:</strong> {log.metadata.results.numDiffPixels} /{' '}
                {log.metadata.results.totalPixels} ({log.metadata.results.percentDiff}%)
              </div>
              <div style={styles.resultItem}>
                <strong>Régions détectées:</strong> {log.metadata.results.regionsFound}
              </div>
              {log.metadata.results.regions && log.metadata.results.regions.length > 0 && (
                <div style={styles.regionsList}>
                  <strong>Détails des régions:</strong>
                  {log.metadata.results.regions.map((region, idx) => (
                    <div key={idx} style={styles.regionItem}>
                      Région {idx + 1}: Position ({region.x}, {region.y}) - {region.diffPixels}{' '}
                      pixels
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image modal for expanded view */}
      {expandedImage && (
        <div style={styles.modalOverlay} onClick={() => setExpandedImage(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>{expandedImage.title}</h3>
              <button style={styles.closeButton} onClick={() => setExpandedImage(null)}>
                ✕
              </button>
            </div>
            <img
              src={`data:image/png;base64,${expandedImage.src}`}
              alt={expandedImage.title}
              style={styles.expandedImage}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const DofusBot = () => {
  const [botState, setBotState] = useState({
    state: 'not_initialized',
    isRunning: false,
    screenshotCount: 0
  })
  const [logs, setLogs] = useState([])
  const maxLogs = 100 // Keep last 100 logs

  // Initialize bot and set up log listener
  useEffect(() => {
    const initBot = async () => {
      if (window.api?.dofusBotInit) {
        await window.api.dofusBotInit()
        updateBotState()
      }
    }

    initBot()

    // Set up log listener
    if (window.api?.dofusBotOnLog) {
      window.api.dofusBotOnLog((log) => {
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, log]
          // Keep only last maxLogs entries
          if (newLogs.length > maxLogs) {
            return newLogs.slice(-maxLogs)
          }
          return newLogs
        })
      })
    }

    // Poll bot state every second
    const stateInterval = setInterval(updateBotState, 1000)

    return () => {
      clearInterval(stateInterval)
    }
  }, [maxLogs])

  const updateBotState = async () => {
    if (window.api?.dofusBotGetState) {
      const response = await window.api.dofusBotGetState()
      if (response.success) {
        setBotState(response.data)
      }
    }
  }

  const handleStart = async () => {
    if (window.api?.dofusBotStart) {
      const response = await window.api.dofusBotStart()
      if (response.success) {
        updateBotState()
      }
    }
  }

  const handleStop = async () => {
    if (window.api?.dofusBotStop) {
      const response = await window.api.dofusBotStop()
      if (response.success) {
        updateBotState()
      }
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'out_of_combat':
        return '#4CAF50'
      case 'searching_combat':
        return '#FF9800'
      case 'combat_placement':
        return '#2196F3'
      case 'combat_player_turn':
        return '#F44336'
      case 'combat_waiting':
        return '#9C27B0'
      default:
        return '#757575'
    }
  }

  const getStateLabel = (state) => {
    switch (state) {
      case 'out_of_combat':
        return 'Hors de combat'
      case 'searching_combat':
        return 'Recherche de combat'
      case 'combat_placement':
        return 'Placement de combat'
      case 'combat_player_turn':
        return 'Tour du joueur'
      case 'combat_waiting':
        return 'Attente de tour'
      case 'not_initialized':
        return 'Non initialisé'
      default:
        return state
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎮 Dofus Bot Overlay</h1>
        <div style={styles.statusBar}>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>État:</span>
            <span
              style={{
                ...styles.statusValue,
                color: getStateColor(botState.state)
              }}
            >
              {getStateLabel(botState.state)}
            </span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Screenshots:</span>
            <span style={styles.statusValue}>{botState.screenshotCount}/5</span>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <button
          onClick={handleStart}
          disabled={botState.isRunning}
          style={{
            ...styles.button,
            ...styles.startButton,
            ...(botState.isRunning ? styles.buttonDisabled : {})
          }}
        >
          ▶️ Démarrer le Bot
        </button>
        <button
          onClick={handleStop}
          disabled={!botState.isRunning}
          style={{
            ...styles.button,
            ...styles.stopButton,
            ...(!botState.isRunning ? styles.buttonDisabled : {})
          }}
        >
          ⏹️ Arrêter le Bot
        </button>
        <button onClick={clearLogs} style={{ ...styles.button, ...styles.clearButton }}>
          🗑️ Effacer les logs
        </button>
      </div>

      <div style={styles.logsContainer}>
        <div style={styles.logsHeader}>
          <h2 style={styles.logsTitle}>📜 Logs du Bot</h2>
          <span style={styles.logCount}>{logs.length} logs</span>
        </div>
        <div style={styles.logsContent}>
          {logs.length === 0 ? (
            <div style={styles.noLogs}>Aucun log pour le moment...</div>
          ) : (
            logs.map((log, index) => <LogEntry key={index} log={log} index={index} />)
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>Dofus Bot Overlay - Electron + React</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#eee',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    backgroundColor: '#16213e',
    borderBottom: '2px solid #0f3460'
  },
  title: {
    margin: '0 0 15px 0',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00d4ff'
  },
  statusBar: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap'
  },
  statusItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  statusLabel: {
    color: '#999',
    fontSize: '14px'
  },
  statusValue: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  controls: {
    padding: '20px',
    display: 'flex',
    gap: '15px',
    backgroundColor: '#16213e',
    borderBottom: '1px solid #0f3460',
    flexWrap: 'wrap'
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
  },
  startButton: {
    backgroundColor: '#4CAF50',
    color: 'white'
  },
  stopButton: {
    backgroundColor: '#f44336',
    color: 'white'
  },
  clearButton: {
    backgroundColor: '#757575',
    color: 'white'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  logsContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#1a1a2e'
  },
  logsHeader: {
    padding: '15px 20px',
    backgroundColor: '#16213e',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #0f3460'
  },
  logsTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#00d4ff'
  },
  logCount: {
    color: '#999',
    fontSize: '14px'
  },
  logsContent: {
    flex: 1,
    overflow: 'auto',
    padding: '10px'
  },
  noLogs: {
    textAlign: 'center',
    color: '#666',
    padding: '40px',
    fontSize: '16px'
  },
  logEntry: {
    padding: '8px 12px',
    marginBottom: '2px',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: "'Consolas', 'Monaco', monospace",
    display: 'flex',
    gap: '10px'
  },
  logTime: {
    color: '#888',
    minWidth: '80px'
  },
  logLevel: {
    minWidth: '60px',
    fontWeight: 'bold'
  },
  logMessage: {
    flex: 1,
    wordBreak: 'break-word'
  },
  logHeader: {
    display: 'flex',
    gap: '10px',
    marginBottom: '8px'
  },
  imageContainer: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px'
  },
  thumbnailImage: {
    maxWidth: '200px',
    maxHeight: '150px',
    cursor: 'pointer',
    border: '2px solid #0f3460',
    borderRadius: '4px',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'scale(1.05)'
    }
  },
  imageInfo: {
    marginTop: '8px',
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#999'
  },
  analysisContainer: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px'
  },
  analysisImages: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    flexWrap: 'wrap'
  },
  analysisImageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageLabel: {
    fontSize: '11px',
    color: '#00d4ff',
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  analysisResults: {
    padding: '10px',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: '4px',
    fontSize: '13px'
  },
  resultItem: {
    marginBottom: '5px',
    color: '#eee'
  },
  regionsList: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  regionItem: {
    marginLeft: '15px',
    marginTop: '3px',
    fontSize: '12px',
    color: '#ccc'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modalContent: {
    maxWidth: '90%',
    maxHeight: '90%',
    backgroundColor: '#16213e',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    color: '#00d4ff'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px 10px'
  },
  expandedImage: {
    maxWidth: '100%',
    maxHeight: 'calc(90vh - 100px)',
    objectFit: 'contain'
  },
  footer: {
    padding: '15px 20px',
    backgroundColor: '#16213e',
    borderTop: '1px solid #0f3460',
    textAlign: 'center'
  },
  footerText: {
    margin: 0,
    color: '#666',
    fontSize: '12px'
  }
}

export default DofusBot
