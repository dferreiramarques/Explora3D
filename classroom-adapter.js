// Native project formats stay intact. No conversion between the four techniques.
(() => {
  const app = document.body.dataset.suiteApp;
  const image = src => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Não foi possível abrir a imagem do projeto.')); img.src = src;
  });
  window.ExploraProject = {
    capture() {
      if (app === 'volume') return { version: 1, nextId, shapes: JSON.parse(JSON.stringify(shapes)), palette: JSON.parse(JSON.stringify(COLOR_DEFS)), activeColor };
      if (app === 'revolve') return construirJSONCompleto();
      if (app === 'voxel') return { versao: '2.5', nome: 'Voxel', blocos: Object.keys(voxelMeshes).map(key => {
        const [x, y, z] = key.split(',').map(Number); return { x, y, z, c: grid[x][y][z] };
      }) };
      if (app === 'area') return {
        version: 2, name: document.getElementById('projectTitle').textContent.trim(), settings: getSettings(), canvas: canvas.toDataURL('image/png'),
        svg: _svgActive && _svgSrc ? { source: _svgSrc, placement: { ..._svgPlacement } } : null
      };
      throw new Error('Editor não suportado.');
    },
    async restore(data) {
      if (app === 'volume') {
        if (!Array.isArray(data.shapes) || data.shapes.some(s => !s || !['x', 'y', 'w', 'h'].every(k => Number.isFinite(s[k])))) throw new Error('Formas inválidas.');
        if (data.palette) {
          if (!Array.isArray(data.palette) || data.palette.length === 0 || data.palette.length > 16 || data.palette.some(c => !c || !/^#[0-9a-f]{6}$/i.test(c.hex) || !Number.isFinite(c.z))) throw new Error('Paleta inválida.');
          COLOR_DEFS.splice(0, COLOR_DEFS.length, ...JSON.parse(JSON.stringify(data.palette)));
          activeColor = COLOR_DEFS.some(c => c.hex === data.activeColor) ? data.activeColor : COLOR_DEFS[0].hex;
          rebuildSwatches(); updateHoleBadge();
        }
        applyLoadedShapes(data); undoStack = []; redoStack = []; updateHistoryBtns();
        return;
      }
      if (app === 'revolve') {
        if (!Array.isArray(data.pontos) || data.pontos.length < 3) throw new Error('Perfil inválido.');
        document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
        carregarJSON(true); return;
      }
      if (app === 'voxel') {
        if (!Array.isArray(data.blocos) || data.blocos.some(b => !b || !['x', 'y', 'z'].every(k => Number.isInteger(b[k]) && b[k] >= 0 && b[k] < 16) || !Number.isInteger(b.c) || b.c < 0 || b.c > 15)) throw new Error('Modelo de blocos inválido.');
        Object.values(voxelMeshes).forEach(mesh => voxelGroup.remove(mesh));
        voxelMeshes = {}; resetGrid();
        data.blocos.forEach(b => adicionarVoxel(b.x, b.y, b.z, b.c)); atualizarEstatisticas(); return;
      }
      if (app === 'area') {
        if (!data.canvas?.startsWith('data:image/png;base64,')) throw new Error('Desenho inválido.');
        // Decode everything before replacing the current canvas.
        const bitmap = await image(data.canvas);
        let svgImage = null;
        if (data.svg) {
          const url = URL.createObjectURL(new Blob([data.svg.source], { type: 'image/svg+xml' }));
          try { svgImage = await image(url); } finally { URL.revokeObjectURL(url); }
        }
        const settings = data.settings || {};
        const fields = { physW: 'physW', physH: 'physH', layerH: 'layerH', baseThick: 'baseThick', designLayers: 'designLayers', simplifyEps: 'simplifyEps', chaikinPasses: 'chaikinPasses', resolution: 'canvasRes' };
        Object.entries(fields).forEach(([key, id]) => { if (settings[key] != null) document.getElementById(id).value = settings[key]; });
        for (const id of ['mirrorX', 'includeBase']) document.getElementById(id).checked = !!settings[id];
        initCanvas(settings.resolution || 600);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        document.getElementById('projectTitle').textContent = data.name || 'O meu desenho';
        _svgActive = !!data.svg; _svgSrc = data.svg?.source || null; _svgPlacement = data.svg?.placement || null; _svgImg = svgImage;
        document.getElementById('svgBadge').classList.toggle('active', _svgActive);
        document.getElementById('chaikinVal').textContent = (settings.chaikinPasses ?? 3) + ' passes';
        if (_svgActive) drawSvgOverlay();
        // Undo must never expose the previous student's project.
        undoStack = []; redoStack = []; updateInfo(); updateExportButtons();
      }
    }
  };
})();
