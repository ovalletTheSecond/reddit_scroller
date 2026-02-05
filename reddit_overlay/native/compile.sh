#!/bin/bash
# Compile script for cross-compilation or WSL

echo "============================================================"
echo "  Windows Input Test - Compilation Script (Cross-compile)"
echo "============================================================"
echo ""

# Check for MinGW cross-compiler
if command -v x86_64-w64-mingw32-gcc &> /dev/null; then
    echo "Using MinGW cross-compiler (x86_64-w64-mingw32-gcc)..."
    echo ""
    x86_64-w64-mingw32-gcc test_windows_input.c -o test_windows_input.exe -luser32
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Compilation successful!"
        echo "  Output: test_windows_input.exe"
        echo ""
        echo "Transfer this file to Windows and run it."
        exit 0
    else
        echo ""
        echo "✗ Compilation failed!"
        exit 1
    fi
fi

# Check for i686 MinGW
if command -v i686-w64-mingw32-gcc &> /dev/null; then
    echo "Using MinGW cross-compiler (i686-w64-mingw32-gcc)..."
    echo ""
    i686-w64-mingw32-gcc test_windows_input.c -o test_windows_input.exe -luser32
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Compilation successful!"
        echo "  Output: test_windows_input.exe"
        echo ""
        echo "Transfer this file to Windows and run it."
        exit 0
    else
        echo ""
        echo "✗ Compilation failed!"
        exit 1
    fi
fi

echo "✗ No MinGW cross-compiler found!"
echo ""
echo "This script is for cross-compilation on Linux/Mac."
echo "On Windows, use compile.bat instead."
echo ""
echo "To install MinGW cross-compiler:"
echo "  Ubuntu/Debian: sudo apt-get install mingw-w64"
echo "  Fedora:        sudo dnf install mingw64-gcc"
echo "  macOS:         brew install mingw-w64"
echo ""
exit 1
