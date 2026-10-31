const APPS = ['area', 'volume', 'revolve', 'voxel'];
const validApp = app => APPS.includes(app);
const finite = n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 10000;
function validProject(app, project) {
  if (!project || project.app !== app || project.version !== 1 || !project.data) return false;
  if (Buffer.byteLength(JSON.stringify(project)) > 6 * 1024 * 1024) return false;
  const d = project.data;
  if (app === 'voxel') return Array.isArray(d.blocos) && d.blocos.length <= 4096 && d.blocos.every(b =>
    b && ['x', 'y', 'z'].every(k => Number.isInteger(b[k]) && b[k] >= 0 && b[k] < 16) && Number.isInteger(b.c) && b.c >= 0 && b.c < 16);
  if (app === 'revolve') return Array.isArray(d.pontos) && d.pontos.length >= 3 && d.pontos.length <= 128 &&
    d.pontos.every(p => p && finite(p.x) && p.x >= 0 && finite(p.y)) &&
    Number.isInteger(d.segmentos) && d.segmentos >= 8 && d.segmentos <= 64 &&
    (!d.fractal || (Number.isInteger(d.fractal.repeticoes) && d.fractal.repeticoes >= 0 && d.fractal.repeticoes <= 5 && finite(d.fractal.raio) && finite(d.fractal.escala)));
  if (app === 'area') return typeof d.canvas === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(d.canvas) &&
    d.settings && [400, 600, 800, 1024].includes(d.settings.resolution) &&
    (!d.svg || (typeof d.svg.source === 'string' && d.svg.source.length <= 1024 * 1024 && d.svg.placement &&
      ['scale', 'offXPct', 'offYPct'].every(k => finite(d.svg.placement[k]))));
  return false;
}
module.exports = { validApp, validProject };
