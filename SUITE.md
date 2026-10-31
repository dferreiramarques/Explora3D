# Explora3D — estrutura da suite

A entrada `index.html` apresenta Area, Volume, Revolve e Voxel, nesta ordem.
Todos os editores são agora ficheiros deste repositório, em `apps/`.
`suite.config.js` é a única tabela de endereços. O tema `suite-ui.css` é partilhado
diretamente, sem cópias nos editores nem sincronização com repositórios vizinhos.

## Navegação e trabalho em curso

Os endereços `#home`, `#area`, `#volume`, `#revolve` e `#voxel` suportam voltar/avançar.
Cada editor é carregado na primeira visita e mantém-se montado com as mesmas dimensões
ao alternar ou voltar ao início. O projeto, histórico e sessão de sala mantêm-se
na sessão aberta. Isto não equivale a gravação permanente: Guardar continua necessário
para recuperar trabalho depois de fechar ou recarregar.

O link antigo `volume.html?code=...` redireciona para a suite, que passa o código ao
editor `apps/volume/`. O link `?code=...` na entrada da suite também continua válido.

## Desenvolvimento e distribuição

`npm run dev` serve apenas este checkout em `http://127.0.0.1:8767/`.
`npm test` verifica rotas, retenção dos editores, materiais, assets e compatibilidade.
`npm run build` gera `dist/`, sem copiar servidores, segredos ou pastas vizinhas.
Publicar apenas `dist/`. A API de sala de aula mantém-se separada em `server/`.

O build transporta os recursos estáticos e os materiais importados de `apps/`.
A revisão de UX/UI e a sala de aula comum continuam fases independentes desta migração.

As três novas secções já têm o menu e os fluxos partilhados de sala de aula;
[CLASSROOM.md](CLASSROOM.md) descreve a API atualizada, a migração e os testes.

## Oficina criativa

O início usa ilustrações vetoriais locais em `assets/`, com uma cor por técnica,
mantendo o fundo escuro e o laranja da marca. Os editores partilham alvos maiores,
rótulos e controlos de vista através do tema e de `editor-runtime.js`.
O runtime recebe apenas mensagens de visibilidade do pai na mesma origem: as
secções inativas deixam de renderizar, mas mantêm o estado. A renderização volta
ao regressar. O Revolve agrupa atualizações do arrasto por frame, preservando
a última posição; não há alteração aos formatos de projeto ou de exportação.
