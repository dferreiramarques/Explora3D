$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot 'scripts/build-suite.cjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
