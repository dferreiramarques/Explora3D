# Consolidação no monco3d / Explora3D

Este é o único repositório de desenvolvimento ativo da suite.

| Repositório anterior | Local atual |
|---|---|
| stampforge | `apps/area/` |
| monco3d (editor original) | `apps/volume/` |
| revolve (Code3D) | `apps/revolve/`, editor em `public/` |
| pixel3d | `apps/voxel/` |

Foram importados o histórico Git, os ficheiros versionados, as licenças e as alterações
locais dos editores existentes na data da migração. Os SHA de origem estão em
`IMPORTS.json`. Os ficheiros CNAME e workflows de publicação dos repositórios antigos
não foram ativados na suite; o domínio é definido pelo CNAME da raiz.

Os guiões, apresentações, exemplos, galeria, documentação e integrações antigas foram
preservados junto da aplicação. Os servidores individuais e as configurações antigas
que aí permanecem são referências históricas; a entrada oficial é a suite na raiz,
com desenvolvimento e build descritos no README principal.

Os repositórios antigos ficam descontinuados para novo desenvolvimento. As pastas e
históricos antigos não foram apagados. Os avisos de descontinuação preparados nessas
pastas só ficam públicos após commit/push nesses repositórios. Esta migração local
não arquiva repositórios no GitHub nem muda domínios ou publicações existentes.

## Publicação e endereços anteriores

Publicar `dist/` a partir do monco3d. Os domínios antigos podem continuar a servir
versões antigas até serem configurados para redirecionar para a secção correspondente
da suite. Não retirar esses endereços antes de verificar links de aulas existentes.

## Histórico e atualizações

O merge conserva os três históricos como pais do commit de consolidação. O caminho
dos ficheiros nos commits antigos continua a ser o original; a importação é a fronteira
entre esse histórico e os novos caminhos em `apps/`. Não há submódulos nem gitlinks.
