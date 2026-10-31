$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'suite-ui.css'))) { throw 'Shared theme missing' }
Write-Output 'All four editors use the root suite-ui.css directly. No copies to synchronize.'
