@echo off
REM Compile script for Windows (using MinGW/GCC or MSVC)
REM Run this from the native directory

echo ============================================================
echo   Windows Input Test - Compilation Script
echo ============================================================
echo.

REM Check if GCC is available (MinGW)
where gcc >nul 2>&1
if %errorlevel% == 0 (
    echo Using GCC (MinGW) compiler...
    echo.
    gcc test_windows_input.c -o test_windows_input.exe -luser32
    if %errorlevel% == 0 (
        echo.
        echo ✓ Compilation successful!
        echo   Output: test_windows_input.exe
        echo.
        echo Run with: test_windows_input.exe
        goto :end
    ) else (
        echo.
        echo ✗ Compilation failed!
        goto :error
    )
)

REM Check if CL is available (Visual Studio)
where cl >nul 2>&1
if %errorlevel% == 0 (
    echo Using Microsoft Visual C++ compiler...
    echo.
    cl test_windows_input.c user32.lib
    if %errorlevel% == 0 (
        echo.
        echo ✓ Compilation successful!
        echo   Output: test_windows_input.exe
        echo.
        echo Run with: test_windows_input.exe
        goto :end
    ) else (
        echo.
        echo ✗ Compilation failed!
        goto :error
    )
)

REM No compiler found
echo ✗ No C compiler found!
echo.
echo Please install one of:
echo   1. MinGW (GCC for Windows)
echo      Download: https://www.mingw-w64.org/
echo   2. Visual Studio Build Tools
echo      Download: https://visualstudio.microsoft.com/downloads/
echo.
goto :error

:error
echo.
echo ============================================================
pause
exit /b 1

:end
echo ============================================================
echo.
pause
