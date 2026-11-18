# Explora3D

Suite de aprendizagem de conceitos 3D do 1.º ao 3.º ciclo. Um único repositório reúne
quatro formas de explorar, criar e apresentar resultados digitais ou materiais.

| Ordem | Secção | Editor | Resultado |
|---|---|---|---|
| 1 | Area | `apps/area/` | Desenho e relevo → impressão 3D |
| 2 | Volume | `apps/volume/` | Formas e extrusão → impressão 3D |
| 3 | Revolve | `apps/revolve/public/` | Perfil e rotação → impressão 3D |
| 4 | Voxel | `apps/voxel/` | Construção por blocos → GIF animado |

## Abrir localmente

Requer Node.js 18 ou superior. A suite não precisa de instalar dependências:

```sh
npm run dev
```

Abrir `http://127.0.0.1:8767/`. Em alternativa, servir esta pasta com qualquer servidor
estático. O menu inicial, as tabs e o botão de início preservam os editores durante
a sessão aberta; usar Guardar para continuar depois de fechar/recarregar.

## Construir e verificar

```sh
npm test
npm run build
```

Publicar o conteúdo de `dist/`. Desenvolvimento e distribuição usam os mesmos caminhos;
nenhum passo depende das pastas antigas pixel3d, revolve ou stampforge. `build-suite.ps1`
continua disponível como atalho para o mesmo build. O tema partilhado é `suite-ui.css`.

## Sala de aula

O serviço existente encontra-se em `server/` (Node/Express e PostgreSQL). Mantém o seu
processo de instalação e configuração próprios. As quatro secções têm entrada de
sala de aula e usam a mesma conta de professor. Area, Revolve e Voxel têm o menu
partilhado de aluno/professor, gravação de rascunhos e entrega de uma versão para
avaliação. O Volume mantém o fluxo existente. Turmas permanentes com várias
atividades continuam uma fase posterior: nesta versão, cada código identifica
uma atividade. Ver [CLASSROOM.md](CLASSROOM.md) para instalação e publicação.

Para executar os testes completos, instalar primeiro as dependências da API com
`npm --prefix server ci`. O editor e o build estático continuam sem dependências.

## Materiais e migração

Os guias, exemplos e materiais pedagógicos acompanham cada editor em `apps/`.
As licenças originais foram preservadas. [MIGRATION.md](MIGRATION.md) documenta o mapeamento
dos repositórios anteriores e [IMPORTS.json](IMPORTS.json) identifica os commits importados.
O histórico Git dos três projetos anteriores faz parte do histórico deste repositório.
Os respetivos diretórios mantêm também alterações locais anteriores à importação.

O endereço antigo `volume.html?code=...` continua a encaminhar para a atividade no Volume.
As ligações `index.html?code=...` abrem a mesma secção diretamente.

MIT. Ver [LICENSE](LICENSE) e as licenças de cada aplicação.
