# Generate Kate Admin release keystore (Windows).
# Run from repo root: .\scripts\generate-android-keystore.ps1
#
# Output: kate-admin-release.jks in repo root (gitignored - do not commit).

$ErrorActionPreference = 'Stop'

$keytoolCandidates = @(
  "$env:ProgramFiles\Android\Android Studio\jbr\bin\keytool.exe",
  "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr\bin\keytool.exe"
)

$keytool = $keytoolCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $keytool) {
  Write-Error "keytool not found. Install Android Studio: https://developer.android.com/studio"
}

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$keystore = Join-Path $root 'kate-admin-release.jks'
$alias = 'kate-admin'

if (Test-Path $keystore) {
  Write-Host "Keystore already exists: $keystore" -ForegroundColor Yellow
  $overwrite = Read-Host 'Overwrite? Type y to replace'
  if ($overwrite -ne 'y' -and $overwrite -ne 'Y') { exit 0 }
}

Write-Host ''
Write-Host 'Kate Admin release keystore' -ForegroundColor Cyan
Write-Host "  File:  $keystore"
Write-Host "  Alias: $alias"
Write-Host ''
Write-Host 'Pick a strong password and SAVE IT. You need the same keystore for every future APK update.'
Write-Host ''

$storePassPlain = Read-Host 'Keystore password'
if ([string]::IsNullOrWhiteSpace($storePassPlain)) {
  Write-Error 'Keystore password cannot be empty.'
}

$keyPassPlain = Read-Host 'Key password (leave blank to match keystore password)'
if ([string]::IsNullOrWhiteSpace($keyPassPlain)) {
  $keyPassPlain = $storePassPlain
}

$dname = Read-Host 'Organization name (default: Kate Shop)'
if ([string]::IsNullOrWhiteSpace($dname)) {
  $dname = 'Kate Shop'
}

$dnameArg = "CN=Kate Admin, OU=Mobile, O=$dname, C=UG"

Write-Host ''
Write-Host 'Creating keystore...'

& $keytool -genkeypair -v `
  -keystore $keystore `
  -alias $alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass $storePassPlain `
  -keypass $keyPassPlain `
  -dname $dnameArg

if ($LASTEXITCODE -ne 0) {
  Write-Error "keytool failed with exit code $LASTEXITCODE"
}

if (-not (Test-Path $keystore)) {
  Write-Error "Keystore file was not created: $keystore"
}

Write-Host ''
Write-Host 'Keystore created.' -ForegroundColor Green
Write-Host ''
Write-Host 'Add these GitHub production secrets:'
Write-Host '  ANDROID_KEYSTORE_BASE64    = paste from clipboard below'
Write-Host '  ANDROID_KEYSTORE_PASSWORD  = your keystore password'
Write-Host "  ANDROID_KEY_ALIAS          = $alias"
Write-Host '  ANDROID_KEY_PASSWORD       = only if different from store password'
Write-Host ''

$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($keystore))
Set-Clipboard -Value $base64
Write-Host "Base64 copied to clipboard ($($base64.Length) chars)." -ForegroundColor Green
Write-Host 'Paste into GitHub -> Environments -> production -> ANDROID_KEYSTORE_BASE64'
Write-Host ''
Write-Host "Back up this file somewhere safe: $keystore"
