# Sala de aula — quatro secções

Area, Volume, Revolve e Voxel carregam `classroom.config.js`, `classroom-adapter.js`,
`classroom.js` e `classroom.css`. O botão Sala de aula abre um diálogo nativo com
os percursos de aluno e professor. Os projetos mantêm os seus formatos nativos:
imagem/configuração/SVG na Area, formas/paleta no Volume, perfil/configuração no Revolve e blocos no Voxel.

## Professor

A conta e o token são os mesmos do Volume. As atividades são filtradas pela secção.
O professor cria título/desafio, partilha um link, atualiza a lista de alunos e abre
uma cópia ou descarrega o projeto. A cópia permite explorar/exportar no editor;
nunca guarda por cima do trabalho do aluno. Voltar ao meu trabalho repõe a sessão
anterior. A lista identifica rascunhos e entregas.

## Aluno

Entra com código, nome e PIN de quatro números. O rascunho sincroniza a cada cinco
segundos e quando a secção fica em segundo plano. Só é apresentado como guardado
depois da confirmação do servidor. Em falha de rede, o editor continua utilizável
e tenta novamente; o estado pendente fica no armazenamento da sessão quando cabe.
Ao retomar uma sessão com um rascunho pendente, é oferecida a sua recuperação.
Guardar um ficheiro continua a ser uma alternativa independente.

Entregar ao professor grava uma versão separada do rascunho. Editar depois não muda
a entrega anterior. Entregar novamente substitui a versão entregue. Sair da sala
aguarda a gravação e repõe o projeto pessoal anterior à entrada. No Voxel, o modelo
editável é entregue; a criação de GIF mantém-se no editor, sem opção de impressão.

## API e migração

Instalar dependências em `server/` e configurar `DATABASE_URL`, `JWT_SECRET` e
`ALLOWED_ORIGIN` como antes. Publicar esta versão do servidor antes do frontend.
No arranque, `initSchema` acrescenta colunas com `ADD COLUMN IF NOT EXISTS`:

- `activities.app_id` (default `volume` para atividades antigas);
- `submissions.project_json` (rascunho das novas secções);
- `submissions.submitted_project_json` e `submitted_at` (versão entregue).

As tabelas e os trabalhos existentes não são eliminados. `shapes_json` e os
pedidos antigos sem `app_id` continuam a corresponder ao Volume. O cliente novo
verifica `/api/capabilities` antes de enviar dados e explica que é necessário
atualizar o servidor se a versão pública ainda não suporta estas secções.
Esta versão exige capabilities 3 para guardar também o Volume no formato comum,
mantendo `shapes_json` sincronizado para clientes antigos. Publicar primeiro a API.

`classroom.config.js` aponta por defeito para a API já usada pelo Volume; pode ser
alterado para staging ou alojamento próprio. A API aceita JSON até 8 MB e valida
o formato por secção (projeto até 6 MB). Bitmap/SVG continuam sujeitos a este limite.

## Testes locais, sem dados reais

```sh
npm --prefix server ci
npm test
node tests/support/classroom-memory.cjs
```

A última linha arranca apenas uma API de teste em memória na porta 3002. Não liga
a PostgreSQL nem é importada pelo servidor de produção. Contém uma conta fictícia
`professor@example.test` / `teste123`. Os dados desaparecem ao terminar esse processo.

Para testar o frontend contra essa API em PowerShell:

```powershell
$env:PORT='8768'
$env:EXPLORA_CLASSROOM_API='http://127.0.0.1:3002'
npm run dev
```

Abrir `http://127.0.0.1:8768/`. A configuração só vale para esse processo local.
Os testes exercitam rotas reais Express com uma base de dados em memória: separação
por secção, autorização do professor, recuperação e manutenção da entrega após
editar o rascunho. Isto não substitui a verificação da migração num PostgreSQL de
staging antes de publicar em produção.
