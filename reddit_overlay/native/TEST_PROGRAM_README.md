# Windows Input Test Program

A standalone C program to test Windows API keyboard and mouse simulation.

## Overview

This is a **simple, standalone C program** that demonstrates direct Windows API calls for keyboard and mouse automation. You can compile and run it independently without Node.js.

## Features

✅ **Pure C** - No dependencies except Windows API
✅ **Interactive menu** - Choose which test to run
✅ **Safe testing** - Countdown before actions
✅ **Visual feedback** - Shows what's happening

## What It Does

The program demonstrates:

1. **Keyboard Simulation**
   - Press 'Z' key
   - Press 'Enter' key
   - Uses `keybd_event()` Windows API

2. **Mouse Movement**
   - Move cursor to screen center
   - Move to specific coordinates
   - Uses `SetCursorPos()` Windows API

3. **Mouse Clicking**
   - Click at current position
   - Click at specific coordinates
   - Uses `mouse_event()` Windows API

4. **Full Demo**
   - Press key + move cursor + click
   - Shows complete automation sequence

## Quick Start

### Option 1: Windows (Easiest)

**Using the batch file:**

```cmd
cd native
compile.bat
test_windows_input.exe
```

### Option 2: Manual Compilation

**With MinGW (GCC):**

```cmd
gcc test_windows_input.c -o test_windows_input.exe -luser32
```

**With Visual Studio (MSVC):**

```cmd
cl test_windows_input.c user32.lib
```

### Option 3: Cross-compile on Linux/Mac

```bash
cd native
chmod +x compile.sh
./compile.sh
# Transfer test_windows_input.exe to Windows
```

## Installation Requirements

You need a C compiler:

### MinGW (Recommended for most users)

1. Download from https://www.mingw-w64.org/
2. Install and add to PATH
3. Verify: `gcc --version`

### Visual Studio Build Tools

1. Download from https://visualstudio.microsoft.com/downloads/
2. Install "Desktop development with C++"
3. Use "Developer Command Prompt"

## Usage

1. **Compile the program** (see Quick Start)

2. **Run it:**

   ```cmd
   test_windows_input.exe
   ```

3. **Choose a test from the menu:**

   ```
   ═══════════════════════════════════════════════════════
   TEST MENU:
   ═══════════════════════════════════════════════════════
     1. Press 'Z' key
     2. Press 'Enter' key
     3. Move mouse to screen center
     4. Click at current mouse position
     5. Click at (100, 100)
     6. Full demo (press z + move + click)
     0. Exit
   ═══════════════════════════════════════════════════════
   ```

4. **Follow the countdown** - The program waits before performing actions

5. **Observe the result** - You'll see the keyboard/mouse action happen

## Example Output

```
╔══════════════════════════════════════════════════════╗
║   Windows Input Test Program - Pure C               ║
║   Direct Windows API Calls                          ║
╚══════════════════════════════════════════════════════╝

This program demonstrates keyboard and mouse simulation
using direct Windows API calls in pure C.

⚠️  WARNING: This will control your keyboard/mouse!
    Make sure you're ready before running tests.

═══════════════════════════════════════════════════════
TEST MENU:
═══════════════════════════════════════════════════════
Enter choice: 1

→ Testing keyboard: Press 'Z' key
  Get ready... (3 seconds)
  3...
  2...
  1...
  → Pressing virtual key 0x5A (Z)...
    - Key down sent
    - Key up sent
  ✓ Key press complete
  ✓ Done! You should have seen 'z' typed.
```

## How It Works

### Keyboard Simulation

```c
/* Press a key */
void test_press_key(BYTE vk, const char* key_name) {
    /* Key down */
    keybd_event(vk, 0, 0, 0);
    Sleep(50);

    /* Key up */
    keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
}

/* Example: Press 'Z' (VK code 0x5A) */
test_press_key(0x5A, "Z");
```

### Mouse Simulation

```c
/* Move cursor */
void test_move_mouse(int x, int y) {
    SetCursorPos(x, y);
}

/* Click mouse */
void test_click_mouse(int x, int y) {
    SetCursorPos(x, y);
    Sleep(50);

    /* Mouse down */
    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
    Sleep(50);

    /* Mouse up */
    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
}
```

## Virtual Key Codes

The program uses Windows Virtual-Key codes:

| Key    | VK Code | Hex  |
| ------ | ------- | ---- |
| Z      | 90      | 0x5A |
| Enter  | 13      | 0x0D |
| Space  | 32      | 0x20 |
| Escape | 27      | 0x1B |

Full list: https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes

## Testing Tips

1. **Open Notepad** - Good for testing keyboard input

   ```
   1. Open Notepad
   2. Click in the text area
   3. Run test #1 (Press 'Z')
   4. You should see 'z' appear in Notepad
   ```

2. **Test Mouse Movement** - Use empty desktop area

   ```
   1. Clear some desktop space
   2. Run test #3 (Move to center)
   3. Watch cursor move to screen center
   ```

3. **Test Clicking** - Use a button or icon
   ```
   1. Position a window or icon at (100, 100)
   2. Run test #5 (Click at 100, 100)
   3. The item should be clicked
   ```

## Troubleshooting

### Program doesn't compile

**Problem:** `gcc: command not found`
**Solution:** Install MinGW and add to PATH

**Problem:** `'windows.h' not found`
**Solution:** You're not on Windows or using wrong compiler

**Problem:** `undefined reference to 'SetCursorPos'`
**Solution:** Add `-luser32` flag to link user32.lib

### Program compiles but nothing happens

**Problem:** No visible effect when pressing keys
**Solution:**

- Click in a text editor first (like Notepad)
- Make sure the window has focus

**Problem:** Mouse doesn't move
**Solution:**

- Check if coordinates are within screen bounds
- Some security software may block mouse movement

### Permission Issues

**Problem:** "Access denied" or security warnings
**Solution:**

- Run as Administrator (right-click → Run as administrator)
- Check antivirus settings
- Some games may block simulated input

## Code Structure

```
test_windows_input.c
├── main()              - Menu loop
├── print_menu()        - Display options
├── test_press_key()    - Keyboard simulation
├── test_move_mouse()   - Cursor movement
├── test_click_mouse()  - Mouse clicking
└── wait_seconds()      - Countdown timer
```

## Safety Features

- ⏱️ **Countdown timers** - 2-3 seconds before actions
- 📝 **Clear messages** - Shows what will happen
- ⚠️ **Warnings** - Reminds you about keyboard/mouse control
- 🛑 **Manual control** - You choose when to run tests

## Comparison with Node.js Addon

| Feature      | Test Program | Node.js Addon        |
| ------------ | ------------ | -------------------- |
| Language     | Pure C       | Pure C + N-API       |
| Dependencies | None         | Node.js, node-gyp    |
| Compilation  | Simple       | Requires build tools |
| Use Case     | Testing      | Production bot       |
| Interactive  | Yes (menu)   | No (API calls)       |

## Next Steps

After testing this program:

1. ✅ Verify Windows API calls work on your system
2. ✅ Understand how keyboard/mouse simulation works
3. ✅ Build the Node.js addon with confidence
4. ✅ Integrate with the Dofus bot

## Files

- `test_windows_input.c` - Main test program (~250 lines)
- `compile.bat` - Windows compilation script
- `compile.sh` - Linux/Mac cross-compilation script
- `TEST_PROGRAM_README.md` - This file

## License

This test program uses Windows API functions which are part of the Windows SDK. The code is provided as-is for testing purposes.

## References

- [Windows API: keybd_event](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-keybd_event)
- [Windows API: mouse_event](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-mouse_event)
- [Windows API: SetCursorPos](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setcursorpos)
- [Virtual-Key Codes](https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes)
