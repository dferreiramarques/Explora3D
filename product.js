// Keep existing editor bookmarks and classroom invitations working.
(() => {
  const hash = location.hash.slice(1);
  if (['home', 'area', 'volume', 'revolve', 'voxel'].includes(hash) || new URLSearchParams(location.search).has('code')) {
    const destination = new URL('app/', location.href);
    destination.search = location.search;
    destination.hash = hash || 'volume';
    location.replace(destination.href);
  }
})();
