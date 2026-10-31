$ErrorActionPreference = 'Stop'
$repositories = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $PSScriptRoot 'dist'
# Only copies explicitly selected static files. No servers, credentials or .git.
$null = New-Item -ItemType Directory -Path $outputPath -Force
foreach ($file in @('index.html', 'volume.html', 'suite-ui.css', 'suite-shell.css', 'suite-shell.js')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $outputPath
}
$bundles = @(
    @{ Name = 'area'; Root = 'stampforge'; Files = @('index.html', 'suite-ui.css') },
    @{ Name = 'voxel'; Root = 'pixel3d'; Files = @('index.html', 'app.js', 'suite-ui.css', 'visualizador_txt.html', 'galeria') },
    @{ Name = 'revolve'; Root = 'revolve/public'; Files = @('index.html', 'app.js', 'suite-ui.css', 'sw.js', 'manifest.json', 'icons', 'favicon.svg', 'favicon.ico', 'favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png') }
)
foreach ($bundle in $bundles) {
    $targetPath = Join-Path $outputPath "suite-apps/$($bundle.Name)"
    $null = New-Item -ItemType Directory -Path $targetPath -Force
    foreach ($file in $bundle.Files) {
        Copy-Item -LiteralPath (Join-Path (Join-Path $repositories $bundle.Root) $file) -Destination $targetPath -Recurse -Force
    }
}
@'
window.SUITE_APPS = {
  area: { name: 'Area', url: './suite-apps/area/' },
  volume: { name: 'Volume', url: './volume.html' },
  revolve: { name: 'Revolve', url: './suite-apps/revolve/' },
  voxel: { name: 'Voxel', url: './suite-apps/voxel/' }
};
'@ | Set-Content -LiteralPath (Join-Path $outputPath 'suite.config.js') -Encoding utf8
Write-Output "Suite assembled at $outputPath"
