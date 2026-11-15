(() => {
  'use strict';
  const app = document.body.dataset.suiteApp;
  const names = { area: 'Area', volume: 'Volume', revolve: 'Revolve', voxel: 'Voxel' };
  const adapter = window.ExploraProject;
  const key = 'explora_workspace_' + app + '_v1';
  const bar = document.createElement('header'); bar.id = 'explora-projectbar'; bar.className = 'ux-projectbar';
  bar.innerHTML = `<span class="ux-app-name">${names[app]}</span><input class="ux-project-name" aria-label="Nome do projeto" maxlength="100" value="O meu projeto"><button type="button" data-action="new">Novo</button><button type="button" data-action="open">Abrir</button><button type="button" data-action="save">Guardar</button><button type="button" data-action="undo" title="Desfazer (Ctrl+Z)">↶ Desfazer</button><button type="button" data-action="redo" title="Refazer (Ctrl+Shift+Z)">↷ Refazer</button><button type="button" data-action="output" class="ux-output">${app === 'voxel' ? 'Criar animação' : 'Preparar impressão'}</button><button type="button" data-action="help">Ajuda</button><button type="button" class="ux-panels-toggle" aria-expanded="true">Painel</button><span class="ux-project-status" role="status" aria-live="polite"></span>`;
  const name = bar.querySelector('input');
  const stateLabel = bar.querySelector('.ux-project-status');
  let statusMessage = stateLabel, statusTimeout;
  const floatingStatus = app === 'area' || app === 'volume';
  if (floatingStatus) {
    // Keep feedback outside the toolbar so it never changes the editor height.
    stateLabel.className = 'ux-toast ux-project-notification';
    stateLabel.hidden = true;
    statusMessage = document.createElement('span');
    const dismiss = document.createElement('button');
    dismiss.type = 'button'; dismiss.textContent = '×';
    dismiss.setAttribute('aria-label', 'Fechar notificação');
    dismiss.onclick = () => { clearTimeout(statusTimeout); stateLabel.hidden = true; };
    stateLabel.append(statusMessage, dismiss);
    document.body.appendChild(stateLabel);
  }
  const button = action => bar.querySelector('[data-action="' + action + '"]');
  const legacy = document.querySelector(app === 'area' ? 'body > header' : app === 'volume' ? '#hdr' : app === 'revolve' ? '#titlebar' : '#brand');
  if (app === 'voxel') document.body.prepend(bar); else legacy.before(bar);
  legacy.classList.add('ux-legacy-header');
  const scope = () => window.ExploraClassroom?.scope() || 'free';
  let history, restoring = false, gesture = false, timer, ready = false, storageBlocked = false;
  let lastScope = 'free', lastWritten = '';
  let resolveReady;
  const readyPromise = new Promise(resolve => { resolveReady = resolve; });
  const setStatus = (text, duration = 0) => {
    statusMessage.textContent = text;
    if (!floatingStatus) return;
    clearTimeout(statusTimeout);
    stateLabel.hidden = !text;
    if (text && duration) statusTimeout = setTimeout(() => { stateLabel.hidden = true; }, duration);
  };
  const raw = () => JSON.stringify({ name: name.value.trim() || 'O meu projeto', data: adapter.capture() });
  function controls() { button('undo').disabled = !history?.canUndo || restoring; button('redo').disabled = !history?.canRedo || restoring; }
  function persist() {
    if (!ready || scope() !== 'free' || restoring || storageBlocked) return;
    if (history.current === lastWritten) return;
    const payload = JSON.stringify({ version: 1, app, ...JSON.parse(history.current), ts: Date.now() });
    if (window.ExploraProjectStore.write(localStorage, key, payload)) {
      lastWritten = history.current; setStatus('✓ Guardado neste dispositivo', 4000);
    } else setStatus('Não foi possível guardar neste dispositivo. Usa Guardar para descarregar um ficheiro.');
  }
  function checkpoint() {
    if (!ready || restoring || gesture) return;
    try {
      const current = raw(), currentScope = scope();
      if (currentScope !== lastScope) { history.reset(current); lastScope = currentScope; controls(); return; }
      if (history.push(current)) {
        controls();
        if (currentScope === 'free') { setStatus('A guardar neste dispositivo…'); clearTimeout(timer); timer = setTimeout(persist, 300); }
      }
    } catch (error) { setStatus('Alterações por guardar: ' + error.message); }
  }
  async function restore(value) {
    const snapshot = JSON.parse(value);
    restoring = true; controls();
    try { await adapter.restore(snapshot.data); name.value = snapshot.name || 'O meu projeto'; }
    finally { restoring = false; controls(); }
  }
  async function travel(direction) {
    if (restoring || !history) return;
    checkpoint();
    if (direction < 0 ? !history.canUndo : !history.canRedo) return;
    const oldIndex = history.index;
    try { await restore(direction < 0 ? history.undo() : history.redo()); controls(); persist(); }
    catch (error) { history.index = oldIndex; controls(); setStatus(error.message); }
  }
  async function change(action) {
    if (!ready || restoring) return;
    checkpoint();
    const before = history.current;
    try { await action(); checkpoint(); persist(); }
    catch (error) { try { await restore(before); } catch { /* Keep the last recoverable snapshot. */ } setStatus(error.message); }
  }
  function boundary() {
    if (!ready) return;
    clearTimeout(timer); history.reset(raw()); lastScope = scope(); controls();
    if (lastScope === 'free') { lastWritten = ''; persist(); }
  }
  function download(data) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url;
    link.download = (name.value.trim().replace(/[^a-z0-9_-]+/gi, '_') || names[app]) + (app === 'area' ? '.stampforge' : '.json');
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const file = document.createElement('input'); file.type = 'file'; file.accept = '.json,.stampforge,application/json'; file.hidden = true; bar.appendChild(file);
  file.onchange = () => change(async () => {
    const selected = file.files[0]; if (!selected) return;
    try {
      let data = JSON.parse(await selected.text());
      if (data.app && data.data) { if (data.app !== app) throw new Error('Este projeto pertence à secção ' + data.app + '.'); data = data.data; }
      await adapter.restore(data); name.value = data.name || data.nome || selected.name.replace(/\.[^.]+$/, '');
    } finally { file.value = ''; }
  });
  button('new').onclick = () => change(async () => {
    let data;
    if (app === 'area') {
      data = adapter.capture(); const blank = document.createElement('canvas'); blank.width = blank.height = data.settings.resolution;
      const ctx = blank.getContext('2d'); ctx.fillStyle = '#f5f5f0'; ctx.fillRect(0, 0, blank.width, blank.height);
      data.canvas = blank.toDataURL('image/png'); data.svg = null; data.name = 'O meu desenho';
    } else if (app === 'volume') data = { version: 1, nextId: 1, shapes: [] };
    else if (app === 'voxel') data = { versao: '2.5', nome: 'Voxel', blocos: [] };
    else data = { nome: 'O meu perfil', pontos: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: .6, y: 2 }], segmentos: 20, cor: '#f5a623', fractal: { repeticoes: 0, raio: 2.5, escala: .5 } };
    await adapter.restore(data); name.value = 'O meu projeto';
  });
  button('open').onclick = () => file.click();
  button('save').onclick = () => {
    try { checkpoint(); const data = adapter.capture(); data[app === 'revolve' || app === 'voxel' ? 'nome' : 'name'] = name.value; download(data); setStatus('Ficheiro descarregado · podes voltar a abri-lo em Abrir', 6000); }
    catch (error) { setStatus(error.message); }
  };
  button('undo').onclick = () => travel(-1); button('redo').onclick = () => travel(1);
  const dialog = document.createElement('dialog'); dialog.className = 'ec-dialog'; dialog.setAttribute('aria-label', 'Ajuda e exportação'); document.body.appendChild(dialog);
  function showDialog(title, description, actions) {
    const invoker = document.activeElement;
    dialog.replaceChildren(); const heading = document.createElement('h2'); heading.textContent = title;
    const text = document.createElement('p'); text.className = 'ec-muted'; text.textContent = description;
    const list = document.createElement('div'); list.className = 'ec-actions';
    for (const [label, action] of actions) {
      const b = document.createElement('button'); b.textContent = label; b.type = 'button';
      b.onclick = async () => { try { await action(); } catch (error) { text.textContent = error.message; } }; list.appendChild(b);
    }
    const close = document.createElement('button'); close.textContent = 'Voltar ao projeto'; close.onclick = () => dialog.close();
    dialog.append(heading, text, list, close); dialog.onclose = () => invoker?.focus(); dialog.showModal();
  }
  button('output').onclick = async () => {
    if (app !== 'voxel') {
      try {
        if (app === 'volume') downloadSTL();
        else if (app === 'area') await exportSTL();
        else await exportarSTL();
      } catch (error) { setStatus('Não foi possível descarregar o STL: ' + error.message); }
      return;
    }
    const actions = [
      ['Descarregar GIF animado', () => { dialog.close(); return exportarGIF(); }],
      ['Guardar imagem PNG', () => { dialog.close(); exportarPNG(); }],
      ['Criar ficha PDF', () => { dialog.close(); exportarFicha(); }],
      ['Descarregar camadas TXT', () => { dialog.close(); exportarTXT(); }]
    ];
    showDialog('Apresentar a tua criação', 'O GIF mostra o modelo a rodar. Guarda também o projeto para poderes continuar a editá-lo.', actions);
  };
  button('help').onclick = () => window.ExploraHelp.open(app, names[app]);
  bar.querySelector('.ux-panels-toggle').onclick = event => {
    const hidden = document.body.classList.toggle('ux-panel-hidden'); event.currentTarget.setAttribute('aria-expanded', String(!hidden)); window.dispatchEvent(new Event('resize'));
  };
  // Centralise actions while keeping their legacy DOM nodes for editor internals.
  document.querySelectorAll('button[onclick]').forEach(b => {
    const action = b.getAttribute('onclick');
    if (/saveJSON|load-input|saveProject\(|loadProject\(|guardarModelo\(|abrirModelo\(|exportarFicheiro\(|importarFicheiro\(|exportSTL\(|exportarSTL\(|exportarPNG\(|exportarGIF\(|exportarFicha\(|exportarTXT\(|exportarA4\(|limparCena\(|limparTudo\(/.test(action)) b.classList.add('ux-legacy-action');
  });
  document.querySelectorAll('#btn-undo,#btn-redo').forEach(b => b.classList.add('ux-legacy-action'));
  if (app === 'area') {
    const wrap = document.getElementById('canvasWrap'); const rail = document.createElement('aside'); rail.className = 'ux-tools-panel'; rail.setAttribute('aria-label', 'Ferramentas de desenho'); wrap.before(rail); rail.appendChild(document.getElementById('toolPalette'));
    const settings = document.querySelector('.hdr-right'); const section = document.createElement('section'); section.className = 'panel-section';
    const title = document.createElement('h3'); title.className = 'section-title'; title.textContent = 'Cor e traço'; section.append(title, settings); document.querySelector('.panel').prepend(section);
    window.undoAction = () => travel(-1); window.redoAction = () => travel(1);
  } else if (app === 'volume') {
    window.undo = () => travel(-1); window.redo = () => travel(1);
    const panel = document.getElementById('rsb'); const group = document.createElement('details'); group.className = 'ux-panel-section';
    const title = document.createElement('summary'); title.className = 'ux-panel-title'; title.textContent = 'Conquistas'; group.appendChild(title);
    [...panel.childNodes].forEach(node => group.appendChild(node)); panel.appendChild(group);
    const intro = document.createElement('section'); intro.className = 'ux-panel-section';
    const h = document.createElement('h3'); h.className = 'ux-panel-title'; h.textContent = 'Dar volume';
    const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'Escolhe uma forma, desenha e usa a paleta em baixo para definir a espessura. Abre a vista 3D para observar o resultado.';
    intro.append(h, p); panel.prepend(intro);
    p.textContent = 'Desenha uma forma à esquerda. Escolhe a cor e a espessura aqui, e abre Ver em 3D para observar o resultado.';
    const coloursSection = document.createElement('section'); coloursSection.className = 'ux-panel-section';
    const colourTitle = document.createElement('h3'); colourTitle.className = 'ux-panel-title'; colourTitle.textContent = 'Cor e espessura';
    const colours = document.createElement('div'); colours.id = 'ux-volume-colours';
    [...document.querySelectorAll('#bot .col-wrap')].forEach(node => colours.appendChild(node));
    const tools = document.getElementById('bot');
    tools.classList.add('explora-view-controls', 'ux-shape-controls');
    tools.setAttribute('role', 'toolbar');
    tools.setAttribute('aria-label', 'Manipular formas');
    tools.querySelectorAll('.tool-btn').forEach(tool => {
      tool.type = 'button';
      tool.setAttribute('aria-label', tool.title);
    });
    document.getElementById('stage').appendChild(tools);
    const thickness = document.createElement('button'); thickness.type = 'button'; thickness.className = 'ux-panel-button'; thickness.textContent = 'Ajustar espessura';
    thickness.onclick = () => { const swatch = colours.querySelector('.col-wrap.active'); if (swatch && activeColor !== '#000000') openExtrudePop(activeColor, swatch); };
    coloursSection.append(colourTitle, colours, thickness); intro.after(coloursSection);
    const decorate = () => colours.querySelectorAll('.col-wrap').forEach(swatch => {
      if (swatch.tagName !== 'BUTTON') { swatch.tabIndex = 0; swatch.setAttribute('role', 'button'); }
      swatch.setAttribute('aria-label', swatch.title);
    });
    new MutationObserver(decorate).observe(colours, { childList: true }); decorate();
    colours.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key) && event.target.matches('.col-wrap')) { event.preventDefault(); event.target.click(); } });
  } else if (app === 'voxel') {
    document.querySelectorAll('#sidebar > div').forEach(section => section.classList.add('ux-panel-section'));
    const links = document.querySelector('.brand-links'); if (links) document.getElementById('sidebar').appendChild(links);
  }
  // Same card and accordion pattern across all property panels.
  document.querySelectorAll('.field').forEach(field => {
    const label = field.querySelector('label'), input = field.querySelector('input,select');
    if (label && input?.id) label.htmlFor = input.id;
  });
  function collapse(section, text) {
    if (!section || section.tagName === 'DETAILS') return;
    const details = document.createElement('details'); details.className = section.className;
    const summary = document.createElement('summary'); summary.className = 'section-title'; summary.textContent = text;
    section.before(details); details.appendChild(summary);
    [...section.children].forEach(child => { if (!child.matches('.section-label,.section-title')) details.appendChild(child); }); section.remove();
  }
  if (app === 'area') {
    const advanced = document.getElementById('layerH')?.closest('.panel-section');
    const basic = document.createElement('section'); basic.className = 'panel-section';
    const heading = document.createElement('h3'); heading.className = 'section-title'; heading.textContent = 'Relevo e base'; basic.appendChild(heading); advanced.before(basic);
    for (const id of ['baseThick', 'designLayers', 'mirrorX', 'includeBase']) basic.appendChild(document.getElementById(id).closest('.field'));
    const resolution = document.getElementById('canvasRes').closest('.field'); advanced.appendChild(resolution);
    collapse(advanced, 'Mais opções · relevo');
    const labels = document.querySelectorAll('.hdr-right label'); if (labels[0]) labels[0].htmlFor = 'colorPick'; if (labels[1]) labels[1].htmlFor = 'brushSize';
  }
  if (app === 'revolve') {
    const row = document.createElement('div'); row.className = 'ux-point-coordinates';
    row.innerHTML = '<label for="ux-point-radius">Raio<input id="ux-point-radius" type="number" min="0" step="0.05"></label><label for="ux-point-height">Altura<input id="ux-point-height" type="number" step="0.05"></label>';
    document.getElementById('profile-selection').after(row);
    const [radius, height] = row.querySelectorAll('input');
    row.addEventListener('change', () => {
      if (!radius.value || !height.value || !Number.isFinite(+radius.value) || !Number.isFinite(+height.value)) return;
      atualizarPontoPerfil(perfilSelecionado, +radius.value, +height.value); checkpoint();
    });
    window.ExploraProfilePoint = p => { radius.value = p.x; height.value = p.y; };
    const about = [...document.querySelectorAll('.section')].find(section => section.textContent.includes('RENDERER')); collapse(about, 'Sobre esta ferramenta');
    const install = document.getElementById('pwa-install-btn')?.closest('.section'); collapse(install, 'Instalar aplicação');
  }
  if (app === 'voxel') {
    const camera = [...document.querySelectorAll('#sidebar > div')].find(section => section.querySelector('[onclick="centrarPivot()"]')); collapse(camera, 'Mais opções · animação');
  }
  for (const b of document.querySelectorAll('button[onclick="resetarCamera()"]')) b.classList.add('ux-legacy-action');
  document.querySelectorAll('.section,#sidebar > .ux-panel-section').forEach(section => {
    if (section.tagName !== 'DETAILS' && section.querySelector('.section-title,.section-label') && !section.querySelector('input,textarea,select,svg,canvas,p,#palette,.info-box,.stats,button:not(.ux-legacy-action),a')) section.classList.add('ux-legacy-action');
  });
  for (const b of document.querySelectorAll('#toolPalette button[onclick="undoAction()"],#toolPalette button[onclick="redoAction()"],#toolPalette button[onclick="clearCanvas()"],#bot button[title="Limpar tudo (apagar todas as formas)"]')) b.classList.add('ux-legacy-action');
  for (const method of app === 'voxel' ? ['carregarTemplate'] : app === 'revolve' ? ['carregarExemplo'] : []) {
    const original = window[method];
    window[method] = (...args) => ready ? change(() => original(...args)) : original(...args);
  }
  // Native keyboard shortcuts and tool buttons use the same full-project history.
  document.addEventListener('keydown', event => {
    if (event.target.matches('input,textarea,select') || event.target.isContentEditable || event.target.closest('dialog')) return;
    if ((event.ctrlKey || event.metaKey) && ['z','y'].includes(event.key.toLowerCase())) {
      event.preventDefault(); event.stopImmediatePropagation(); travel(event.key.toLowerCase() === 'y' || event.shiftKey ? 1 : -1);
    }
  }, true);
  document.addEventListener('pointerdown', () => { checkpoint(); gesture = true; }, true);
  const endGesture = () => { gesture = false; setTimeout(checkpoint, 0); };
  document.addEventListener('pointerup', endGesture, true); document.addEventListener('pointercancel', endGesture, true);
  window.addEventListener('blur', endGesture);
  for (const event of ['click', 'change', 'keyup']) document.addEventListener(event, () => setTimeout(checkpoint, 0));
  document.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(checkpoint, 350); });
  window.addEventListener('explora:project-boundary', boundary);
  window.addEventListener('pagehide', () => { gesture = false; checkpoint(); persist(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { gesture = false; checkpoint(); persist(); } });
  new ResizeObserver(() => { document.documentElement.style.setProperty('--ux-bar-height', bar.getBoundingClientRect().height + 'px'); window.dispatchEvent(new Event('resize')); }).observe(bar);
  window.ExploraWorkspace = { ready: readyPromise, checkpoint, flush: () => { gesture = false; checkpoint(); persist(); }, status: setStatus, scope, change, boundary, undo: () => travel(-1), redo: () => travel(1) };
  window.addEventListener('load', async () => {
    try {
      let saved = localStorage.getItem(key);
      if (!saved && app === 'volume') {
        const legacy = JSON.parse(localStorage.getItem('monco3d_autosave_v1') || 'null');
        if (legacy?.shapes) saved = JSON.stringify({ version: 1, app, name: 'Projeto recuperado', data: legacy });
      }
      if (saved) {
        try { const parsed = JSON.parse(saved); if (parsed.version !== 1 || parsed.app !== app || !parsed.data) throw new Error('Formato inválido'); await restore(JSON.stringify({ name: parsed.name, data: parsed.data })); setStatus('✓ Projeto recuperado neste dispositivo', 5000); }
        catch { storageBlocked = !window.ExploraProjectStore.write(localStorage, key + '_recovery', saved); setStatus('O rascunho anterior não pôde ser aberto. Foi preservado para recuperação.'); }
      }
    } catch { setStatus('Armazenamento local indisponível. Usa Guardar para descarregar um ficheiro.'); }
    history = new window.ExploraProjectStore.History(raw()); ready = true; lastScope = scope(); controls();
    if (!stateLabel.textContent) setStatus('✓ Pronto para criar · recuperação automática neste dispositivo');
    resolveReady();
    setInterval(() => { if (window.exploraFrameActive !== false && !document.hidden) checkpoint(); }, 750);
  });
})();
