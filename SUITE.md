# Explora3D — integração local

A entrada `index.html` apresenta Area, Volume, Revolve e Voxel, nesta ordem.
O antigo editor Monco3D permanece em `volume.html`. Um link antigo com `?code=`
abre Volume automaticamente e transmite o código à sala de aula existente.

## Pré-visualização

Com os quatro repositórios lado a lado, abrir `/monco3d/` no servidor local.
`suite.config.js` define os endereços dos editores. O menu e as tabs usam hashes:
`#home`, `#area`, `#volume`, `#revolve` e `#voxel`. Voltar/avançar do browser funciona.

Cada editor é carregado apenas na primeira visita. Os iframes permanecem montados,
com as mesmas dimensões, ao trocar de secção ou voltar ao início. Isto preserva
o projeto, o histórico de edição e a sessão de sala de aula durante a sessão aberta.
Não equivale a gravação permanente. Recarregar/fechar a suite pode perder trabalho
que não tenha sido guardado pelo próprio editor. Os ficheiros Guardar/Carregar
continuam disponíveis em cada secção. Nenhuma conversão entre formatos é feita.

## Distribuição num só domínio

Executar `./sync-suite-ui.ps1` e `./build-suite.ps1` na pasta monco3d.
Publicar o conteúdo de `dist/` como raiz da suite. O bundle contém apenas ficheiros
estáticos selecionados dos quatro projetos, sem repositórios Git ou configuração
de servidor. Não publicar a raiz de desenvolvimento como distribuição autónoma:
a configuração de desenvolvimento aponta para pastas vizinhas.

Pré-visualização do bundle no servidor existente: `/monco3d/dist/`.
A API de sala de aula existente do Volume mantém a configuração atual.
Esta integração não acrescenta ainda turmas permanentes nem sala de aula às outras
três secções. Esse trabalho requer o modelo de dados comum discutido na conversa.

## Design

`suite-ui.css` é a origem do tema comum. `sync-suite-ui.ps1` distribui cópias locais
para manter os editores independentes. `suite-shell.css` define apenas os quadrantes
e a navegação, sem interferir no desenho ou nas cores dos modelos.

## Verificação

Executar `node --test tests/suite-shell.test.cjs`. Validar ainda no browser:
abrir cada secção, editar, voltar ao início, alternar e regressar; confirmar o projeto
e o histórico, os links de sala, as exportações e o comportamento em janela estreita.
