$ErrorActionPreference = 'Stop'

$exePath = Join-Path $PSScriptRoot 'rpa_demo.exe'
if (-not (Test-Path -LiteralPath $exePath)) {
  throw "RPA executable not found: $exePath"
}

$schemePath = 'HKCU:\Software\Classes\robotica-rpa'
$commandPath = Join-Path $schemePath 'shell\open\command'

New-Item -Path $schemePath -Force | Out-Null
Set-Item -Path $schemePath -Value 'URL:Robotica RPA Protocol' -Force
New-ItemProperty -Path $schemePath -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
New-Item -Path $commandPath -Force | Out-Null
Set-Item -Path $commandPath -Value ('"{0}" "%1"' -f $exePath) -Force

Write-Host 'Registered robotica-rpa:// for the current Windows user.'
