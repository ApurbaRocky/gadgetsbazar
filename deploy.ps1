<#
====================================================================
  RockTech — Deploy Script (PowerShell 5.1+)
--------------------------------------------------------------------
  Packages the static storefront, runs sanity checks, copies it to a
  release folder and optionally serves it locally or creates a ZIP.

  Usage:
    .\deploy.ps1                              # build to .\deploy
    .\deploy.ps1 -Serve                       # build + run local server (http://localhost:8080)
    .\deploy.ps1 -Serve -Open                 # ... and open the browser
    .\deploy.ps1 -Zip                         # also create deploy.zip
    .\deploy.ps1 -DeployPath "C:\www\rocktech" # custom output folder
    .\deploy.ps1 -Port 3000 -Serve
====================================================================
#>
[CmdletBinding()]
param(
  [string]$SourcePath = '',
  [string]$DeployPath = '',
  [int]$Port = 8080,
  [switch]$Serve,
  [switch]$Open,
  [switch]$Zip,
  [switch]$SkipChecks,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$SourcePath = if ($PSBoundParameters.ContainsKey('SourcePath')) { $SourcePath } else { $ScriptDir }
$DeployPath = if ($PSBoundParameters.ContainsKey('DeployPath')) { $DeployPath } else { Join-Path $ScriptDir 'deploy' }

function Write-Step($msg) {
  if (-not $Quiet) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
}
function Write-Ok($msg) {
  if (-not $Quiet) { Write-Host "    $msg" -ForegroundColor Green }
}
function Write-Warn($msg) {
  if (-not $Quiet) { Write-Host "    ! $msg" -ForegroundColor Yellow }
}

# ---------------------------------------------------------------
# 1. Validate source
# ---------------------------------------------------------------
$required = @('index.html', 'css\styles.css', 'js\data.js', 'js\state.js', 'js\ui.js', 'js\app.js', 'js\checkout.js', 'js\admin.js', 'assets\img')
$missing = @()
foreach ($rel in $required) {
  if (-not (Test-Path (Join-Path $SourcePath $rel))) { $missing += $rel }
}
if ($missing.Count -gt 0) {
  Write-Error "Missing required files/folders:`n  $($missing -join "`n  ")"
  exit 1
}
$imgCount = @(Get-ChildItem (Join-Path $SourcePath 'assets\img') -Filter '*.jpg' -ErrorAction SilentlyContinue).Count
Write-Step "Source validated ($imgCount product images found)"

# ---------------------------------------------------------------
# 2. Optional sanity checks (JS syntax via node if available)
# ---------------------------------------------------------------
if (-not $SkipChecks) {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    Write-Step "Checking JavaScript syntax (node)"
    $bad = $false
    foreach ($js in Get-ChildItem (Join-Path $SourcePath 'js') -Filter '*.js') {
      & node --check $js.FullName 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Write-Warn "Syntax error in $($js.Name)"
        & node --check $js.FullName
        $bad = $true
      }
    }
    if ($bad) { Write-Error 'Aborting deploy: JS syntax errors found (use -SkipChecks to force).'; exit 1 }
    Write-Ok 'All JS files parse cleanly'
  } else {
    Write-Warn 'node not found - skipping JS syntax check (install Node.js or use -SkipChecks)'
  }
}

# ---------------------------------------------------------------
# 3. Copy to deploy folder
# ---------------------------------------------------------------
Write-Step "Building release -> $DeployPath"
if (Test-Path $DeployPath) { Remove-Item $DeployPath -Recurse -Force }
New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null

Copy-Item (Join-Path $SourcePath 'index.html') $DeployPath
Copy-Item (Join-Path $SourcePath 'css') (Join-Path $DeployPath 'css') -Recurse
Copy-Item (Join-Path $SourcePath 'js') (Join-Path $DeployPath 'js') -Recurse
Copy-Item (Join-Path $SourcePath 'assets') (Join-Path $DeployPath 'assets') -Recurse
Copy-Item (Join-Path $SourcePath 'CONTEXT.md') (Join-Path $DeployPath 'CONTEXT.md') -ErrorAction SilentlyContinue

$bytes = (Get-ChildItem $DeployPath -Recurse -File | Measure-Object Length -Sum).Sum
Write-Ok "Deployed $([Math]::Round($bytes / 1KB, 1)) KB to $DeployPath"

# ---------------------------------------------------------------
# 4. Optional ZIP
# ---------------------------------------------------------------
if ($Zip) {
  $zipPath = Join-Path $PSScriptRoot 'rocktech-release.zip'
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory($DeployPath, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
  Write-Ok "Created $zipPath"
}

# ---------------------------------------------------------------
# 5. Optional local server (function defined below, invoked here
#    after definitions - see bottom of script)
# ---------------------------------------------------------------

Write-Host "`nDone. Open $DeployPath\index.html in a browser." -ForegroundColor Green

# ---------------------------------------------------------------
# Self-contained static file server (no python required).
# Blocks until Ctrl+C; press Ctrl+C to stop.
# ---------------------------------------------------------------
function Start-LocalServer {
  param([string]$Root, [int]$Port)

  $mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.png'  = 'image/png'
    '.svg'  = 'image/svg+xml'
    '.gif'  = 'image/gif'
    '.ico'  = 'image/x-icon'
    '.webp' = 'image/webp'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.md'   = 'text/plain; charset=utf-8'
    '.txt'  = 'text/plain; charset=utf-8'
  }

  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("http://localhost:$Port/")
  try { $listener.Start() }
  catch {
    Write-Host "  Port $Port is already in use - try -Port <number>" -ForegroundColor Yellow
    exit 1
  }
  Write-Host "  Serving $Root at http://localhost:$Port/#/" -ForegroundColor Green
  Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray

  while ($listener.IsListening) {
    $ctx = $null
    try {
      $ctx = $listener.GetContext()
      $req = $ctx.Request
      $res = $ctx.Response
      $raw = [uri]::UnescapeDataString($req.Url.AbsolutePath)
      if ($raw -eq '/' -or $raw -eq '') { $raw = '/index.html' }
      $full = Join-Path $Root ($raw.TrimStart('/'))
      if (Test-Path -LiteralPath $full -PathType Leaf) {
        $ext = [IO.Path]::GetExtension($full).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $data = [IO.File]::ReadAllBytes($full)
        $res.ContentLength64 = $data.Length
        $res.OutputStream.Write($data, 0, $data.Length)
      } else {
        $res.StatusCode = 404
        $msg = [Text.Encoding]::UTF8.GetBytes('404 - not found')
        $res.ContentLength64 = $msg.Length
        $res.OutputStream.Write($msg, 0, $msg.Length)
      }
    } catch {
      if ($listener.IsListening) { break }
    } finally {
      if ($ctx) { try { $ctx.Response.Close() } catch { } }
    }
  }
}

# Invoke server mode (after function definitions)
if ($Serve) {
  Write-Step "Starting local server on port $Port"
  if ($Open) { Start-Process "http://localhost:$Port/#/" }
  Start-LocalServer -Root $DeployPath -Port $Port
}
