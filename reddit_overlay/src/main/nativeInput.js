/**
 * Native Input Module for Windows
 * Uses C++ native addon with direct Windows API calls
 */

let nativeAddon = null

// Try to load the native addon
try {
  nativeAddon = require('../../build/Release/windows_input.node')
} catch (err) {
  console.warn('Native Windows input addon not available:', err.message)
  console.warn('Run "npm run rebuild" to compile the native addon')
}

/**
 * Check if running on Windows
 */
export function isWindows() {
  if (nativeAddon && nativeAddon.isWindows) {
    return nativeAddon.isWindows()
  }
  return process.platform === 'win32'
}

/**
 * Virtual Key Codes for Windows
 */
const VK_CODES = {
  // Letters
  a: 0x41,
  b: 0x42,
  c: 0x43,
  d: 0x44,
  e: 0x45,
  f: 0x46,
  g: 0x47,
  h: 0x48,
  i: 0x49,
  j: 0x4a,
  k: 0x4b,
  l: 0x4c,
  m: 0x4d,
  n: 0x4e,
  o: 0x4f,
  p: 0x50,
  q: 0x51,
  r: 0x52,
  s: 0x53,
  t: 0x54,
  u: 0x55,
  v: 0x56,
  w: 0x57,
  x: 0x58,
  y: 0x59,
  z: 0x5a,
  // Numbers
  0: 0x30,
  1: 0x31,
  2: 0x32,
  3: 0x33,
  4: 0x34,
  5: 0x35,
  6: 0x36,
  7: 0x37,
  8: 0x38,
  9: 0x39,
  // Special keys
  enter: 0x0d,
  escape: 0x1b,
  space: 0x20,
  tab: 0x09,
  shift: 0x10,
  control: 0x11,
  ctrl: 0x11,
  alt: 0x12,
  backspace: 0x08,
  delete: 0x2e,
  // Arrow keys
  left: 0x25,
  up: 0x26,
  right: 0x27,
  down: 0x28,
  // Function keys
  f1: 0x70,
  f2: 0x71,
  f3: 0x72,
  f4: 0x73,
  f5: 0x74,
  f6: 0x75,
  f7: 0x76,
  f8: 0x77,
  f9: 0x78,
  f10: 0x79,
  f11: 0x7a,
  f12: 0x7b
}

/**
 * Get virtual key code from key name
 */
function getVKCode(key) {
  const code = VK_CODES[key.toLowerCase()]
  if (code === undefined) {
    throw new Error(`Unknown key: ${key}`)
  }
  return code
}

/**
 * Press a key (down and up)
 * @param {string} key - Key name (e.g., 'z', 'enter', 'f1')
 */
export async function pressKey(key) {
  if (!nativeAddon) {
    throw new Error('Native addon not loaded. Run "npm run rebuild"')
  }
  if (!isWindows()) {
    throw new Error('Only supported on Windows')
  }

  const vk = getVKCode(key)
  return nativeAddon.pressKey(vk)
}

/**
 * Hold a key down
 * @param {string} key - Key name
 */
export async function keyDown(key) {
  if (!nativeAddon) {
    throw new Error('Native addon not loaded. Run "npm run rebuild"')
  }
  if (!isWindows()) {
    throw new Error('Only supported on Windows')
  }

  const vk = getVKCode(key)
  return nativeAddon.keyDown(vk)
}

/**
 * Release a key
 * @param {string} key - Key name
 */
export async function keyUp(key) {
  if (!nativeAddon) {
    throw new Error('Native addon not loaded. Run "npm run rebuild"')
  }
  if (!isWindows()) {
    throw new Error('Only supported on Windows')
  }

  const vk = getVKCode(key)
  return nativeAddon.keyUp(vk)
}

/**
 * Move mouse cursor to coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
export async function moveMouse(x, y) {
  if (!nativeAddon) {
    throw new Error('Native addon not loaded. Run "npm run rebuild"')
  }
  if (!isWindows()) {
    throw new Error('Only supported on Windows')
  }

  return nativeAddon.moveMouse(Math.round(x), Math.round(y))
}

/**
 * Click mouse at current or specified position
 * @param {number} x - Optional X coordinate
 * @param {number} y - Optional Y coordinate
 * @param {string} button - Mouse button ('left', 'right', 'middle')
 */
export async function click(x = null, y = null, button = 'left') {
  if (!nativeAddon) {
    throw new Error('Native addon not loaded. Run "npm run rebuild"')
  }
  if (!isWindows()) {
    throw new Error('Only supported on Windows')
  }

  const buttonCode = { left: 0, right: 1, middle: 2 }[button] || 0

  if (x !== null && y !== null) {
    return nativeAddon.click(Math.round(x), Math.round(y), buttonCode)
  } else {
    return nativeAddon.click(undefined, undefined, buttonCode)
  }
}
