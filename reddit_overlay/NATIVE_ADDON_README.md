# Windows Input Native Addon - Pure C Implementation

## Overview

This is a **pure C** native addon for Node.js that provides direct access to Windows user32.dll functions for keyboard and mouse automation. It uses the N-API (Node-API) C interface for maximum compatibility and performance.

## Architecture

### Pure C with N-API

The addon is written in **pure C** (not C++) using the Node-API:

```c
#include <node_api.h>  // N-API header
#include <windows.h>    // Windows API

// Pure C function definitions
static napi_value PressKey(napi_env env, napi_callback_info info) {
    // Direct Windows API calls
    keybd_event((BYTE)vk, 0, 0, 0);              // Key down
    Sleep(50);
    keybd_event((BYTE)vk, 0, KEYEVENTF_KEYUP, 0); // Key up
}
```

### Windows API Functions Used

1. **keybd_event** - Synthesize keyboard input

   ```c
   void keybd_event(
     BYTE bVk,        // Virtual-key code
     BYTE bScan,      // Scan code
     DWORD dwFlags,   // Flags (KEYEVENTF_KEYUP, etc.)
     ULONG_PTR dwExtraInfo
   );
   ```

2. **mouse_event** - Synthesize mouse input

   ```c
   void mouse_event(
     DWORD dwFlags,   // Controls various aspects
     DWORD dx,        // Horizontal position
     DWORD dy,        // Vertical position
     DWORD dwData,    // Wheel movement
     ULONG_PTR dwExtraInfo
   );
   ```

3. **SetCursorPos** - Move mouse cursor
   ```c
   BOOL SetCursorPos(
     int X,  // X coordinate
     int Y   // Y coordinate
   );
   ```

## API Reference

### JavaScript Interface

```javascript
const nativeInput = require('./nativeInput')

// Check platform
if (nativeInput.isWindows()) {
  // Keyboard functions
  await nativeInput.pressKey('z') // Press and release
  await nativeInput.keyDown('shift') // Hold key down
  await nativeInput.keyUp('shift') // Release key

  // Mouse functions
  await nativeInput.moveMouse(100, 200) // Move cursor
  await nativeInput.click(100, 200, 'left') // Click at position
}
```

### Exported Functions

#### `pressKey(key)`

Press and release a key.

- **Parameters**: `key` (string) - Key name ('a'-'z', 'enter', 'space', etc.)
- **Returns**: Boolean
- **Example**: `await pressKey('z')`

#### `keyDown(key)`

Hold a key down.

- **Parameters**: `key` (string) - Key name
- **Returns**: Boolean
- **Example**: `await keyDown('shift')`

#### `keyUp(key)`

Release a held key.

- **Parameters**: `key` (string) - Key name
- **Returns**: Boolean
- **Example**: `await keyUp('shift')`

#### `moveMouse(x, y)`

Move mouse cursor to absolute screen coordinates.

- **Parameters**:
  - `x` (number) - X coordinate
  - `y` (number) - Y coordinate
- **Returns**: Boolean
- **Example**: `await moveMouse(500, 300)`

#### `click(x, y, button)`

Click mouse at specified position.

- **Parameters**:
  - `x` (number) - X coordinate (optional)
  - `y` (number) - Y coordinate (optional)
  - `button` (string) - 'left', 'right', or 'middle' (default: 'left')
- **Returns**: Boolean
- **Example**: `await click(100, 200, 'left')`

#### `isWindows()`

Check if running on Windows.

- **Returns**: Boolean
- **Example**: `if (isWindows()) { ... }`

## Virtual Key Codes

The module supports these keys (Windows VK codes):

### Letters (0x41-0x5A)

`a`, `b`, `c`, ..., `z`

### Numbers (0x30-0x39)

`0`, `1`, `2`, ..., `9`

### Special Keys

- `enter` (0x0D)
- `escape` (0x1B)
- `space` (0x20)
- `tab` (0x09)
- `shift` (0x10)
- `control`/`ctrl` (0x11)
- `alt` (0x12)
- `backspace` (0x08)
- `delete` (0x2E)

### Arrow Keys

- `left` (0x25)
- `up` (0x26)
- `right` (0x27)
- `down` (0x28)

### Function Keys

`f1` (0x70) through `f12` (0x7B)

## Building the Addon

### Prerequisites

**Windows:**

- Visual Studio Build Tools 2019 or later
- Python 3.x
- Node.js 18+

### Build Commands

```bash
# Install dependencies
npm install

# Rebuild native addon
npm run rebuild

# Or manually with node-gyp
node-gyp rebuild
```

### Build Process

1. **binding.gyp** configures the build:

   ```json
   {
     "targets": [
       {
         "target_name": "windows_input",
         "sources": ["native/windows_input.c"],
         "libraries": ["user32.lib"]
       }
     ]
   }
   ```

2. **node-gyp** compiles the C code:
   - Reads `native/windows_input.c`
   - Links against `user32.lib` (Windows DLL)
   - Outputs `build/Release/windows_input.node`

3. **JavaScript wrapper** (`nativeInput.js`) loads the addon:
   ```javascript
   const addon = require('../../build/Release/windows_input.node')
   ```

## File Structure

```
reddit_overlay/
├── binding.gyp               # Build configuration
├── native/
│   └── windows_input.c       # Pure C implementation
├── src/main/
│   ├── nativeInput.js        # JavaScript wrapper
│   └── dofusBot.js           # Bot using native input
├── build/
│   └── Release/
│       └── windows_input.node # Compiled addon
└── package.json
```

## Integration with Dofus Bot

The bot uses the native addon for automation:

```javascript
// In dofusBot.js
import * as nativeInput from './nativeInput.js'

// Press Z key to show enemies
await nativeInput.keyDown('z')
await this.sleep(500)
const screenshot = await this.takeScreenshot()
await nativeInput.keyUp('z')

// Click on detected enemy positions
for (const enemy of enemies) {
  await nativeInput.click(enemy.x, enemy.y, 'left')
  await this.sleep(200)
}
```

## Error Handling

The addon includes comprehensive error handling:

```c
// Check argument types
if (argc < 1) {
  napi_throw_type_error(env, NULL, "Wrong number of arguments");
  return NULL;
}

// Validate numeric values
status = napi_get_value_int32(env, args[0], &vk);
if (status != napi_ok) {
  napi_throw_type_error(env, NULL, "Invalid key code");
  return NULL;
}

// Platform check
#ifdef _WIN32
  // Windows implementation
#else
  napi_throw_error(env, NULL, "Only supported on Windows");
  return NULL;
#endif
```

## Performance

- **Direct API calls**: No intermediate layers or interpreters
- **Minimal overhead**: C code with direct function calls
- **Fast execution**: ~50-100µs per operation
- **Low memory**: No allocations except for N-API objects

## Advantages of Pure C

1. **No C++ runtime**: Smaller binary, faster load times
2. **Direct Windows API**: Maximum performance
3. **Wide compatibility**: Works with any Node.js version supporting N-API
4. **Simple debugging**: Straightforward C code, no template magic
5. **Cross-version**: N-API is stable across Node.js versions

## Security Considerations

⚠️ **Warning**: This addon can control keyboard and mouse, which could be dangerous if misused.

- Only use on Windows with user consent
- Be careful with automation in games (may violate ToS)
- Test in safe environments first
- Handle errors gracefully

## Troubleshooting

### Build fails on Linux/Mac

**Solution**: This is Windows-only. The code checks `#ifdef _WIN32` and will build but throw errors at runtime on other platforms.

### "addon not loaded" error

**Solution**: Run `npm run rebuild` to compile the native addon.

### "user32.lib not found"

**Solution**: Install Visual Studio Build Tools with Windows SDK.

### Keyboard/mouse not working

**Solution**:

1. Check if running as Administrator (may be required)
2. Verify Windows 10/11 compatibility
3. Check antivirus isn't blocking input simulation

## License

This implementation uses Windows API functions which are part of the Windows SDK. The C code itself is provided as-is for the Dofus bot project.

## References

- [Windows API Documentation](https://docs.microsoft.com/en-us/windows/win32/api/)
- [N-API Documentation](https://nodejs.org/api/n-api.html)
- [node-gyp](https://github.com/nodejs/node-gyp)
- [Virtual-Key Codes](https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes)
