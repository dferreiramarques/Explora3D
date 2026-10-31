#!/usr/bin/env node
// ============================================================
// Pixel3D — Gerador do manifest da galeria
// ============================================================
// Lê os .gif em galeria/gifs/ e escreve galeria/gifs/manifest.json.
// Corre automaticamente via GitHub Actions a cada push que altere
// galeria/gifs/ (ver .github/workflows/gallery-manifest.yml).
//
// Também podes correr manualmente:
//   node galeria/generate-manifest.js
// ============================================================

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GIFS_DIR = path.join(__dirname, 'gifs');
const MANIFEST_PATH = path.join(GIFS_DIR, 'manifest.json');

function commitDate(absPath) {
    try {
        const out = execFileSync(
            'git',
            ['log', '-1', '--format=%cI', '--', absPath],
            { cwd: __dirname, encoding: 'utf8' }
        ).trim();
        if (out) return out;
    } catch {
        // sem git disponível ou ficheiro ainda não commitado — usa mtime
    }
    return null;
}

if (!fs.existsSync(GIFS_DIR)) fs.mkdirSync(GIFS_DIR, { recursive: true });

const gifs = fs.readdirSync(GIFS_DIR)
    .filter(f => f.toLowerCase().endsWith('.gif'))
    .map(f => {
        const abs = path.join(GIFS_DIR, f);
        const stat = fs.statSync(abs);
        return {
            name: f,
            url: `gifs/${encodeURIComponent(f)}`,
            size: stat.size,
            date: commitDate(abs) || stat.mtime.toISOString()
        };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

const manifest = {
    generated: new Date().toISOString(),
    count: gifs.length,
    gifs
};

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest gerado: ${gifs.length} GIF(s) -> ${path.relative(process.cwd(), MANIFEST_PATH)}`);
