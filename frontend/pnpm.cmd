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
    echo Error: Node.js runtime not found. Please install Node.js via winget install OpenJS.NodeJS.LTS >&2
    exit /b 1
)

if exist "%~dp0node_modules\vite\bin\vite.js" (
    "%NODE_BIN%" "%~dp0node_modules\vite\bin\vite.js" %*
) else (
    echo Error: frontend node_modules/vite not found. >&2
    exit /b 1
)

