[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

Set-Location $PSScriptRoot

$nodeExe = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue)

if (-not $nodeExe) {
    $dirs = @(
        "$env:LOCALAPPDATA\OpenAI\Codex\runtimes\cua_node",
        "C:\Program Files\nodejs",
        "$env:LOCALAPPDATA\Programs\nodejs"
    )
    foreach ($d in $dirs) {
        if (Test-Path $d) {
            $n = Get-ChildItem -Path $d -Filter "node.exe" -Recurse -Depth 2 -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($n) {
                $nodeExe = $n.FullName
                break
            }
        }
    }
}

if (-not $nodeExe) {
    Write-Error "Node.js executable could not be found. Please install Node.js."
    exit 1
}

$firstArg = if ($Args.Count -gt 0) { $Args[0] } else { "" }
if ($firstArg -eq "run" -and $Args.Count -gt 1) {
    $firstArg = $Args[1]
}

if ($firstArg -eq "test") {
    $vitestJs = Join-Path $PSScriptRoot "node_modules\vitest\vitest.mjs"
    & $nodeExe $vitestJs run
} elseif ($firstArg -eq "build") {
    $tscJs = Join-Path $PSScriptRoot "node_modules\typescript\bin\tsc"
    $viteJs = Join-Path $PSScriptRoot "node_modules\vite\bin\vite.js"
    & $nodeExe $tscJs -b
    if ($LASTEXITCODE -eq 0) {
        & $nodeExe $viteJs build
    }
} else {
    $viteJs = Join-Path $PSScriptRoot "node_modules\vite\bin\vite.js"
    if (Test-Path $viteJs) {
        & $nodeExe $viteJs @Args
    } else {
        Write-Error "frontend/node_modules/vite not found."
        exit 1
    }
}
