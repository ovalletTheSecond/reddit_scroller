import { useState, useEffect } from 'react'

const DofusBot = () => {
  const [botState, setBotState] = useState({
    state: 'not_initialized',
    isRunning: false,
    screenshotCount: 0
  })
  const [logs, setLogs] = useState([])
  const [maxLogs] = useState(100) // Keep last 100 logs

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
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  ...styles.logEntry,
                  backgroundColor: getLogColor(log.level)
                }}
              >
                <span style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span style={styles.logLevel}>[{log.level.toUpperCase()}]</span>
                <span style={styles.logMessage}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Basé sur reddit_scroller - Overlay Windows pour Dofus
        </p>
      </div>
    </div>
  )
}

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
