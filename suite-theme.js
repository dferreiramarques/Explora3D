/* Shared daisyUI theme, applied before paint in the shell and every editor. */
(() => {
  'use strict';
  const key = 'explora3d-theme';
  const valid = value => value === 'dracula' || value === 'cmyk';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem(key); } catch (_) { /* Private browsing. */ }
  let explicit = valid(saved);
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const dark = theme === 'dracula';
      button.textContent = dark ? '☀ Claro' : '☾ Escuro';
      button.setAttribute('aria-label', dark ? 'Ativar modo claro (CMYK)' : 'Ativar modo escuro (Dracula)');
      button.setAttribute('aria-pressed', String(dark));
    });
  }
  apply(explicit ? saved : media.matches ? 'dracula' : 'cmyk');
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    explicit = valid(event.newValue);
    apply(explicit ? event.newValue : media.matches ? 'dracula' : 'cmyk');
  });
  media.addEventListener('change', () => {
    if (!explicit) apply(media.matches ? 'dracula' : 'cmyk');
  });
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === window.parent &&
        event.data?.type === 'explora:theme' && valid(event.data.theme)) apply(event.data.theme);
  });
  document.addEventListener('DOMContentLoaded', () => {
    // The shell owns the switch when this editor is embedded.
    if (window.parent !== window) return;
    const host = document.querySelector('.suite-header, .ux-projectbar');
    if (!host) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-ghost suite-theme-toggle';
    button.dataset.themeToggle = '';
    button.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'dracula' ? 'cmyk' : 'dracula';
      explicit = true;
      try { localStorage.setItem(key, theme); } catch (_) { /* Still switch this session. */ }
      apply(theme);
      document.querySelectorAll('iframe').forEach(frame => {
        frame.contentWindow?.postMessage({ type: 'explora:theme', theme }, location.origin);
      });
    });
    host.appendChild(button);
    apply(document.documentElement.dataset.theme);
  });
})();
