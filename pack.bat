@echo off
setlocal enabledelayedexpansion

REM =====================================================
REM pack.bat - Build all H5 games, copy to Flutter assets
REM
REM Usage:
REM   pack.bat          Build all games
REM   pack.bat mbti     Build only the mbti game
REM =====================================================

set "SCRIPT_DIR=%~dp0"
set "H5_ROOT=%SCRIPT_DIR%"
set "FLUTTER_ASSETS=%SCRIPT_DIR%..\voice_client\assets\h5_games"

set "TARGET=%~1"

echo.
echo =====================================================
echo  H5 Games Packer
echo  Output: %FLUTTER_ASSETS%
echo =====================================================
echo.

if not exist "%FLUTTER_ASSETS%" mkdir "%FLUTTER_ASSETS%"

set GAME_COUNT=0
set FAIL_COUNT=0

for /d %%G in ("%H5_ROOT%*") do (
    set "GAME_NAME=%%~nxG"
    if exist "%%G\package.json" (
        if "%TARGET%"=="" (
            call :build_game "%%G" "!GAME_NAME!"
        ) else if /i "!GAME_NAME!"=="%TARGET%" (
            call :build_game "%%G" "!GAME_NAME!"
        )
    )
)

echo.
echo =====================================================
if %FAIL_COUNT% gtr 0 (
    echo  Done: %GAME_COUNT% games processed, %FAIL_COUNT% FAILED
    exit /b 1
) else (
    echo  Done: %GAME_COUNT% games packed successfully
    exit /b 0
)

:build_game
set /a GAME_COUNT+=1
set "GAME_DIR=%~1"
set "GAME_NAME=%~2"

echo [%GAME_NAME%] Building...

pushd "%GAME_DIR%"

if not exist "node_modules" (
    echo [%GAME_NAME%] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [%GAME_NAME%] ERROR: npm install failed
        set /a FAIL_COUNT+=1
        popd
        goto :eof
    )
)

call npm run build
if errorlevel 1 (
    echo [%GAME_NAME%] ERROR: build failed
    set /a FAIL_COUNT+=1
    popd
    goto :eof
)

popd

if not exist "%GAME_DIR%\dist\index.html" (
    echo [%GAME_NAME%] ERROR: dist/index.html not found after build
    set /a FAIL_COUNT+=1
    goto :eof
)

set "DEST=%FLUTTER_ASSETS%\%GAME_NAME%"
if exist "%DEST%" rmdir /s /q "%DEST%"

echo [%GAME_NAME%] Copying to %DEST%
xcopy /e /i /q /y "%GAME_DIR%\dist" "%DEST%" >nul

echo [%GAME_NAME%] OK
goto :eof
