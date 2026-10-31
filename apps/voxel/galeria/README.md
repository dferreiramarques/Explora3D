# 🎞️ Pixel3D — Galeria

Galeria de GIFs exportados pelo Pixel3D. **100% estática** — sem servidor, sem
Railway/Render. Corre diretamente no GitHub Pages, tal como o resto do site.

---

## 🚀 Como funciona

A galeria lê a lista de GIFs a partir de `galeria/gifs/manifest.json`. Esse
ficheiro é gerado automaticamente por uma GitHub Action
(`.github/workflows/gallery-manifest.yml`) sempre que um `.gif` é adicionado,
removido ou alterado em `galeria/gifs/` na branch `main`:

1. Fazes push de um `.gif` novo para `galeria/gifs/`
2. A Action corre `node galeria/generate-manifest.js` e faz commit do
   `manifest.json` atualizado
3. O GitHub Pages redeploy automaticamente e a galeria mostra o novo GIF —
   sem qualquer intervenção manual

---

## ➕ Adicionar um GIF

**Via GitHub (mais simples):**
Abre a pasta `galeria/gifs` no GitHub → **Add file → Upload files** → arrasta
o `.gif` → **Commit changes** na `main`. Aguarda ~1 min.

**Via git local:**

```bash
cp ~/Desktop/meu_modelo.gif galeria/gifs/
git add galeria/gifs/meu_modelo.gif
git commit -m "Adiciona GIF à galeria"
git push
```

Para apagar um GIF, remove o ficheiro de `galeria/gifs/` (localmente ou pelo
GitHub) e faz commit/push — a Action atualiza o manifest automaticamente.

---

## 💻 Testar localmente

Não há servidor a correr — basta servir a pasta como ficheiros estáticos, por
exemplo:

```bash
npx http-server galeria -p 8080
# → http://localhost:8080
```

Ou simplesmente abrir `galeria/index.html` no browser (alguns browsers
bloqueiam `fetch` em `file://`; se isso acontecer, usa o `http-server`).

Se quiseres regenerar o manifest manualmente (sem esperar pela Action):

```bash
node galeria/generate-manifest.js
```

---

## 📁 Estrutura

```
pixel3d/
├── .github/workflows/
│   └── gallery-manifest.yml   ← gera o manifest automaticamente
├── galeria/
│   ├── index.html              ← Interface da galeria (estática)
│   ├── generate-manifest.js    ← Script que gera gifs/manifest.json
│   └── gifs/
│       ├── manifest.json       ← Gerado automaticamente, não editar à mão
│       └── *.gif
```
