@echo off
setlocal

REM Check if node is in PATH
set "NODE_BIN="
where node >nul 2>nul
if %errorlevel%==0 (
    set "NODE_BIN=node"
) else (
    for /d %%D in ("%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\*") do (
        if exist "%%D\bin\node.exe" set "NODE_BIN=%%D\bin\node.exe"
    )
    if not defined NODE_BIN (
        if exist "C:\Program Files\nodejs\node.exe" set "NODE_BIN=C:\Program Files\nodejs\node.exe"
    )
)

if not defined NODE_BIN (
    echo Error: Node.js runtime not found. Please install Node.js. >&2
    exit /b 1
)

set "CMD_ARG=%~1"
if "%CMD_ARG%"=="run" (
    shift
    set "CMD_ARG=%~1"
)

if "%CMD_ARG%"=="test" (
    "%NODE_BIN%" "%~dp0node_modules\vitest\vitest.mjs" run
) else if "%CMD_ARG%"=="build" (
    "%NODE_BIN%" "%~dp0node_modules\typescript\bin\tsc" -b && "%NODE_BIN%" "%~dp0node_modules\vite\bin\vite.js" build
) else (
    "%NODE_BIN%" "%~dp0node_modules\vite\bin\vite.js" %*
)
