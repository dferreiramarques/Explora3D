// Development uses sibling repositories. build-suite.ps1 creates a self-contained
// distribution with this same file pointing at the bundled editors.
window.SUITE_APPS = {
  area: { name: 'Area', url: '../stampforge/' },
  volume: { name: 'Volume', url: './volume.html' },
  revolve: { name: 'Revolve', url: '../revolve/public/' },
  voxel: { name: 'Voxel', url: '../pixel3d/' }
};
