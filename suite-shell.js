(() => {
  'use strict';
  const apps = window.SUITE_APPS;
  const frames = new Map();
  const home = document.getElementById('suite-home');
  const workspace = document.getElementById('suite-workspace');
  const host = document.getElementById('suite-frames');
  const status = document.getElementById('suite-load-status');
  const help = document.getElementById('suite-load-help');
  let current = 'home';
  let timeout;
  const initialApp = Object.hasOwn(apps, location.hash.slice(1)) ? location.hash.slice(1) : 'volume';

  function editorURL(id) {
    const url = new URL(apps[id].url, location.href);
    // Existing Volume classroom links remain valid at the suite entry point.
    if (id === initialApp) {
      const code = new URLSearchParams(location.search).get('code');
      if (code) url.searchParams.set('code', code);
    }
    return url.href;
  }

  function show() {
    clearTimeout(timeout);
    const requested = location.hash.slice(1);
    current = Object.hasOwn(apps, requested) ? requested : 'home';
    if (requested && requested !== current) history.replaceState(null, '', '#home');
    const atHome = current === 'home';
    home.hidden = !atHome;
    workspace.hidden = atHome;
    help.hidden = true;
    status.textContent = '';
    document.title = atHome ? 'Explora3D · Explorar, criar e materializar' : `${apps[current].name} · Explora3D`;
    document.querySelectorAll('.suite-nav a').forEach(link => {
      if (link.dataset.app === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const homeLink = document.querySelector('.suite-home');
    if (atHome) homeLink.setAttribute('aria-current', 'page');
    else homeLink.removeAttribute('aria-current');
    // Keep all editors mounted and sized: hidden frames retain their projects,
    // canvas dimensions, undo history and classroom session.
    frames.forEach((frame, id) => {
      const active = !atHome && id === current;
      frame.classList.toggle('is-active', active);
      frame.inert = !active;
      frame.setAttribute('aria-hidden', String(!active));
      frame.tabIndex = active ? 0 : -1;
      frame.contentWindow?.postMessage({ type: 'explora:visibility', active }, location.origin);
    });
    if (atHome) return;

    let frame = frames.get(current);
    if (!frame) {
      const id = current;
      frame = document.createElement('iframe');
      frame.title = `${apps[id].name} — editor 3D`;
      frame.src = editorURL(id);
      frame.className = 'suite-frame is-active';
      frame.setAttribute('aria-hidden', 'false');
      frame.addEventListener('load', () => {
        frame.dataset.loaded = 'true';
        frame.contentWindow?.postMessage({ type: 'explora:visibility', active: current === id }, location.origin);
        if (current === id) {
          clearTimeout(timeout);
          status.textContent = '';
          help.hidden = true;
        }
      });
      host.appendChild(frame);
      frames.set(id, frame);
      document.querySelector(`[data-card="${id}"] .suite-card-action`).firstChild.textContent = `Continuar ${apps[id].name} `;
    }
    if (!frame.dataset.loaded) {
      status.textContent = `A abrir ${apps[current].name}…`;
      timeout = setTimeout(() => {
        if (!frame.dataset.loaded) {
          help.hidden = false;
          document.getElementById('suite-direct').href = frame.src;
        }
      }, 15000);
    }
  }

  document.getElementById('suite-retry').addEventListener('click', () => {
    const frame = frames.get(current);
    // Retry is offered only before the editor has loaded; never discard work.
    if (frame && !frame.dataset.loaded) {
      frame.remove();
      frames.delete(current);
      show();
    }
  });
  window.addEventListener('hashchange', show);
  if (new URLSearchParams(location.search).has('code') && !Object.hasOwn(apps, location.hash.slice(1))) {
    history.replaceState(null, '', `${location.pathname}${location.search}#volume`);
  }
  show();
})();
