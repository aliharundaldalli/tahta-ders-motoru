$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
Set-Location -LiteralPath $projectRoot
try {
    Invoke-RestMethod 'http://127.0.0.1:8770/api/animation/status' -TimeoutSec 2 | Out-Null
    Write-Host 'Stüdyo zaten çalışıyor: http://localhost:8770/studio/'
    exit 0
} catch {}
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules'))) {
    & npm install --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Node bağımlılıkları kurulamadı' }
}
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'math_cache.js'))) {
    & node tools/build_math.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Formül önbelleği oluşturulamadı' }
}
& python -X utf8 -c 'import numpy, faster_whisper, pypdf, docx, sympy'
if ($LASTEXITCODE -ne 0) { throw 'Önce python -m pip install numpy faster-whisper pypdf python-docx sympy komutunu çalıştır' }
$pythonPath = (Get-Command python).Source
$launcherPath = Join-Path $projectRoot 'tools/studio_windows.py'
$serverProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-X', 'utf8', ('"' + $launcherPath + '"')) -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'studio-server.log') -RedirectStandardError (Join-Path $projectRoot 'studio-server-error.log') -PassThru
$readyDeadline = (Get-Date).AddSeconds(25)
$studioReady = $false
while ((Get-Date) -lt $readyDeadline) {
    try {
        Invoke-RestMethod 'http://127.0.0.1:8770/api/animation/status' -TimeoutSec 2 | Out-Null
        $studioReady = $true
        break
    } catch { Start-Sleep -Milliseconds 250 }
}
if (-not $studioReady) { throw 'Sunucu hazır olmadı; studio-server-error.log dosyasını kontrol et.' }
Write-Host "Sunucu başlatıldı (PID $($serverProcess.Id)): http://localhost:8770/studio/"
