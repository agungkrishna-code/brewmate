<#
.SYNOPSIS
  Builds the Brewmate Android APK.

.DESCRIPTION
  Two Windows-specific problems are handled here:

  1. Non-ASCII project path. This repository lives in a folder containing an en
     dash. The Android NDK toolchain cannot read such paths, so the build is
     mirrored to %TEMP%\brewmate-native-build and the APK is copied back.

  2. Old ninja. The ninja bundled with the SDK's CMake 3.22.1 hard-fails on
     object paths longer than 260 characters (React Native codegen paths are
     ~320). When ninja is older than 1.11 the script prepares a private copy of
     CMake with a current ninja and points android/local.properties at it.

.PARAMETER Variant
  debug (development build, loads JS from Metro) or release (standalone APK with
  the JS bundle embedded, signed with the generated debug keystore).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/build-android.ps1
  powershell -ExecutionPolicy Bypass -File scripts/build-android.ps1 -Variant release
#>

param(
  [ValidateSet('debug', 'release')]
  [string]$Variant = 'debug'
)

$ErrorActionPreference = 'Stop'

$project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nonAscii = $project -match '[^\x00-\x7F]'

if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
if (-not $env:ANDROID_SDK_ROOT) {
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}

# ---------------------------------------------------------------- build root
$buildRoot = $project
if ($nonAscii) {
  $buildRoot = Join-Path $env:TEMP 'brewmate-native-build'
  Write-Host "Non-ASCII project path detected. Mirroring to $buildRoot" -ForegroundColor Yellow
  if (Test-Path $buildRoot) {
    Remove-Item $buildRoot -Recurse -Force
  }
  robocopy $project $buildRoot /E /XD node_modules android .expo .git /NFL /NDL /NJH /NJS | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

  Push-Location $buildRoot
  try {
    Write-Host 'Installing dependencies in the build mirror…'
    npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
      npm install --no-audit --no-fund
      if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
    }
  } finally {
    Pop-Location
  }
}

Write-Host "Project:     $project"
Write-Host "Build root:  $buildRoot"
Write-Host "Android SDK: $env:ANDROID_HOME"

# ------------------------------------------------------------ native project
if (-not (Test-Path (Join-Path $buildRoot 'android'))) {
  Write-Host 'Generating the native Android project…'
  Push-Location $buildRoot
  npx expo prebuild --platform android
  Pop-Location
}

# --------------------------------------------------------------------- ninja
$sdkCmake = Join-Path $env:ANDROID_HOME 'cmake\3.22.1'
$sdkNinja = Join-Path $sdkCmake 'bin\ninja.exe'
if (Test-Path $sdkNinja) {
  $versionText = (& $sdkNinja --version).Trim()
  $version = $null
  [void][System.Version]::TryParse($versionText, [ref]$version)
  if ($version -and $version -lt [version]'1.11') {
    Write-Host "Bundled ninja $versionText cannot handle long paths; preparing a newer one." -ForegroundColor Yellow
    $tools = Join-Path $env:TEMP 'brewmate-cmake'
    $ninjaExe = Join-Path $env:TEMP 'brewmate-cmake-ninja.exe'

    if (-not (Test-Path $ninjaExe)) {
      $zip = Join-Path $env:TEMP 'ninja-win.zip'
      Invoke-WebRequest -Uri 'https://github.com/ninja-build/ninja/releases/download/v1.12.1/ninja-win.zip' -OutFile $zip -UseBasicParsing
      Expand-Archive -Path $zip -DestinationPath (Join-Path $env:TEMP 'brewmate-ninja') -Force
      Copy-Item (Join-Path $env:TEMP 'brewmate-ninja\ninja.exe') $ninjaExe -Force
    }

    if (-not (Test-Path $tools)) {
      Copy-Item $sdkCmake $tools -Recurse
    }
    Copy-Item $ninjaExe (Join-Path $tools 'bin\ninja.exe') -Force

    $localProperties = Join-Path $buildRoot 'android\local.properties'
    $escaped = $tools.Replace('\', '\\')
    $lines = @()
    if (Test-Path $localProperties) {
      $lines = Get-Content $localProperties | Where-Object { $_ -notmatch '^cmake\.dir=' }
    }
    $lines += "cmake.dir=$($escaped.Substring(0,2))$($escaped.Substring(2))".Replace(':', '\:')
    Set-Content -Path $localProperties -Value $lines
  }
}

# -------------------------------------------------------------------- gradle
$task = if ($Variant -eq 'release') { 'assembleRelease' } else { 'assembleDebug' }
Push-Location (Join-Path $buildRoot 'android')
try {
  & .\gradlew.bat $task
  if ($LASTEXITCODE -ne 0) { throw "Gradle failed with exit code $LASTEXITCODE" }
} finally {
  Pop-Location
}

# --------------------------------------------------------------- collect APK
$sourceDir = Join-Path $buildRoot "android\app\build\outputs\apk\$Variant"
$sourceApk = Join-Path $sourceDir "app-$Variant.apk"
if (-not (Test-Path $sourceApk)) {
  $sourceApk = Get-ChildItem $sourceDir -Filter *.apk | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $sourceApk) { throw 'The build finished but no APK was found.' }

$targetDir = Join-Path $project "android\app\build\outputs\apk\$Variant"
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
$targetApk = Join-Path $targetDir (Split-Path $sourceApk -Leaf)
Copy-Item -Path $sourceApk -Destination $targetApk -Force

$sizeMb = [math]::Round((Get-Item $targetApk).Length / 1MB, 1)
Write-Host ''
Write-Host "APK ready: $targetApk ($sizeMb MB)" -ForegroundColor Green
