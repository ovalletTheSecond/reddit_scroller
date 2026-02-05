/**
 * Native Input Module for Windows
 * Uses Windows PowerShell and user32.dll via child_process
 * This avoids native module compilation issues
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Check if running on Windows
 */
export function isWindows() {
  return process.platform === 'win32'
}

/**
 * Press a key using Windows SendKeys via PowerShell
 * @param {string} key - The key to press (e.g., 'z', 'a', 'Enter')
 */
export async function pressKey(key) {
  if (!isWindows()) {
    throw new Error('Key simulation only supported on Windows')
  }

  // PowerShell script to send keys
  const script = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      using System.Windows.Forms;
      public class KeySender {
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
        
        public const int KEYEVENTF_KEYDOWN = 0x0000;
        public const int KEYEVENTF_KEYUP = 0x0002;
        
        public static void SendKey(byte vk) {
          keybd_event(vk, 0, KEYEVENTF_KEYDOWN, UIntPtr.Zero);
          System.Threading.Thread.Sleep(50);
          keybd_event(vk, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }
      }
"@
    [KeySender]::SendKey(${getVirtualKeyCode(key)})
  `

  try {
    await execAsync(`powershell -Command "${script.replace(/\n/g, ' ')}"`)
    return true
  } catch (error) {
    throw new Error(`Failed to press key '${key}': ${error.message}`)
  }
}

/**
 * Hold a key down using Windows API via PowerShell
 * @param {string} key - The key to hold
 */
export async function keyDown(key) {
  if (!isWindows()) {
    throw new Error('Key simulation only supported on Windows')
  }

  const script = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class KeySender {
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
        
        public const int KEYEVENTF_KEYDOWN = 0x0000;
        
        public static void KeyDown(byte vk) {
          keybd_event(vk, 0, KEYEVENTF_KEYDOWN, UIntPtr.Zero);
        }
      }
"@
    [KeySender]::KeyDown(${getVirtualKeyCode(key)})
  `

  try {
    await execAsync(`powershell -Command "${script.replace(/\n/g, ' ')}"`)
    return true
  } catch (error) {
    throw new Error(`Failed to hold key '${key}': ${error.message}`)
  }
}

/**
 * Release a held key using Windows API via PowerShell
 * @param {string} key - The key to release
 */
export async function keyUp(key) {
  if (!isWindows()) {
    throw new Error('Key simulation only supported on Windows')
  }

  const script = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class KeySender {
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
        
        public const int KEYEVENTF_KEYUP = 0x0002;
        
        public static void KeyUp(byte vk) {
          keybd_event(vk, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }
      }
"@
    [KeySender]::KeyUp(${getVirtualKeyCode(key)})
  `

  try {
    await execAsync(`powershell -Command "${script.replace(/\n/g, ' ')}"`)
    return true
  } catch (error) {
    throw new Error(`Failed to release key '${key}': ${error.message}`)
  }
}

/**
 * Move mouse cursor to coordinates using Windows API via PowerShell
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
export async function moveMouse(x, y) {
  if (!isWindows()) {
    throw new Error('Mouse simulation only supported on Windows')
  }

  const script = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class MouseMover {
        [DllImport("user32.dll")]
        public static extern bool SetCursorPos(int x, int y);
        
        public static void Move(int x, int y) {
          SetCursorPos(x, y);
        }
      }
"@
    [MouseMover]::Move(${Math.round(x)}, ${Math.round(y)})
  `

  try {
    await execAsync(`powershell -Command "${script.replace(/\n/g, ' ')}"`)
    return true
  } catch (error) {
    throw new Error(`Failed to move mouse to (${x}, ${y}): ${error.message}`)
  }
}

/**
 * Click mouse at current position or specified coordinates
 * @param {number} x - Optional X coordinate
 * @param {number} y - Optional Y coordinate
 * @param {string} button - Mouse button ('left', 'right', 'middle')
 */
export async function click(x = null, y = null, button = 'left') {
  if (!isWindows()) {
    throw new Error('Mouse simulation only supported on Windows')
  }

  // Move to position if coordinates provided
  if (x !== null && y !== null) {
    await moveMouse(x, y)
    // Small delay after moving
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  const buttonFlags = {
    left: { down: '0x0002', up: '0x0004' },
    right: { down: '0x0008', up: '0x0010' },
    middle: { down: '0x0020', up: '0x0040' }
  }

  const flags = buttonFlags[button] || buttonFlags.left

  const script = `
    Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class MouseClicker {
        [DllImport("user32.dll")]
        public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
        
        public static void Click(uint downFlag, uint upFlag) {
          mouse_event(downFlag, 0, 0, 0, UIntPtr.Zero);
          System.Threading.Thread.Sleep(50);
          mouse_event(upFlag, 0, 0, 0, UIntPtr.Zero);
        }
      }
"@
    [MouseClicker]::Click(${flags.down}, ${flags.up})
  `

  try {
    await execAsync(`powershell -Command "${script.replace(/\n/g, ' ')}"`)
    return true
  } catch (error) {
    throw new Error(`Failed to click mouse: ${error.message}`)
  }
}

/**
 * Get Virtual Key Code for common keys
 * @param {string} key - Key name
 * @returns {number} Virtual key code
 */
function getVirtualKeyCode(key) {
  const vkCodes = {
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

  const code = vkCodes[key.toLowerCase()]
  if (!code) {
    throw new Error(`Unknown key: ${key}`)
  }
  return code
}
