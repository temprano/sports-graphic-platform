@echo off
REM Diagnostic script for Node.js, npm, and vitest environment
REM Run this in Windows Command Prompt (cmd.exe)

echo.
echo ========================================
echo SPORTS GRAPHICS PLATFORM - ENV DIAGNOSIS
echo ========================================
echo.

REM Phase 1: Check Node.js and npm
echo [Phase 1] Checking Node.js and npm...
echo.

node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js NOT found. Install from https://nodejs.org
    exit /b 1
) else (
    echo ✅ Node.js is installed:
    node --version
)

echo.

npm --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm NOT found. Should be bundled with Node.js
    exit /b 1
) else (
    echo ✅ npm is installed:
    npm --version
)

echo.

REM Phase 2: Check node_modules
echo [Phase 2] Checking node_modules...
echo.

if exist node_modules (
    echo ✅ node_modules/ directory exists
    echo.
    echo Checking vitest specifically...
    if exist node_modules\vitest (
        echo ✅ vitest is installed
    ) else (
        echo ⚠️  vitest NOT in node_modules - running npm install...
        call npm install
    )
) else (
    echo ⚠️  node_modules/ does not exist
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install failed
        exit /b 1
    )
)

echo.

REM Phase 3: Check configuration files
echo [Phase 3] Checking configuration files...
echo.

if exist vitest.config.js (
    echo ✅ vitest.config.js exists
) else (
    echo ❌ vitest.config.js missing!
    exit /b 1
)

if exist package.json (
    echo ✅ package.json exists
) else (
    echo ❌ package.json missing!
    exit /b 1
)

echo.

REM Phase 4: Try running tests
echo [Phase 4] Running payment flows tests...
echo.

npm test src/orders/payment-flows.test.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Tests failed. Check output above for details.
    exit /b 1
) else (
    echo.
    echo ✅ Tests passed!
    exit /b 0
)
