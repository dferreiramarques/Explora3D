$ErrorActionPreference = 'Stop'
# The four repositories remain independently deployable: ship a local CSS copy.
$suiteRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $PSScriptRoot 'suite-ui.css'
$destinations = @('pixel3d/suite-ui.css', 'revolve/public/suite-ui.css', 'stampforge/suite-ui.css')
foreach ($destination in $destinations) {
    $targetPath = Join-Path $suiteRoot $destination
    if (-not (Test-Path -LiteralPath (Split-Path -Parent $targetPath))) {
        throw "Repository missing for $targetPath"
    }
    Copy-Item -LiteralPath $sourcePath -Destination $targetPath
}
Write-Output 'Suite UI synchronized to Area, Revolve and Voxel.'
