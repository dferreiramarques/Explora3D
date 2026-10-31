# Explora3D — levantamento de consistência UX/UI

Data: 31 de outubro de 2026. Base: código publicado em `a5ffb69`, comparado com as
observações de navegador realizadas nas validações da suite. Esta é uma revisão
heurística; não constitui teste com crianças nem certificação de acessibilidade.
Nenhuma alteração funcional ou visual foi feita neste levantamento.

## Diagnóstico

A navegação global, as cores por secção e o tema comum já dão unidade à suite.
O maior desvio está no comportamento: guardar, recuperar, desfazer, abrir exemplos
e consultar entregas ainda exigem aprender regras diferentes conforme o editor.
A prioridade deve ser tornar as mesmas ações previsíveis, antes da identidade das
ilustrações. As ferramentas específicas de cada técnica devem continuar distintas.

Prioridades: P1 = risco de perder trabalho ou de executar a ação errada;
P2 = dificuldade frequente de compreensão ou operação; P3 = acabamento e identidade.

## P1 — confiança e recuperação

### 01. Recuperação do trabalho livre desigual

Volume tem autosave local e recuperação. Area, Revolve e Voxel guardam ficheiros,
mas não têm recuperação local equivalente no modo livre. Manter um iframe aberto
preserva a sessão, mas não sobrevive necessariamente a fechar/recarregar o navegador.
A criança pode generalizar a proteção que encontrou no Volume às restantes secções.

Proposta: recuperação automática comum por projeto/secção, com estado persistente
«Guardado neste dispositivo». Distinguir explicitamente gravação local, gravação
na sala e versão entregue. Testar reabertura, falha de rede e armazenamento cheio.

### 02. Limpar, mudar de exemplo e desfazer seguem regras diferentes

No Revolve, `limparCena()` elimina a cena sem confirmação nem histórico de desfazer.
Voxel confirma Limpar tudo, mas carregar um template substitui os blocos sem histórico.
Revolve também substitui o projeto ao carregar exemplos. Area e Volume têm desfazer,
mas não existe uma regra comum de proteção para substituições do projeto completo.

Proposta: Desfazer/Refazer acessíveis nas quatro secções; exemplos abrem como novo
projeto ou preservam uma versão anterior recuperável. Novo projeto e Limpar devem
ser ações distintas. Se uma substituição não puder ser desfeita, oferecer guardar
antes. Não confirmar cada gesto normal de edição.

### 03. Entrega e edição pelo professor divergem no Volume

Area, Revolve e Voxel guardam uma versão entregue separada do rascunho e abrem uma
cópia para o professor. O Volume mantém o fluxo antigo: o professor pode editar e
guardar por cima do original, sem o mesmo mecanismo de entrega separada.

Proposta: um modelo comum de rascunho/entrega/cópia. Abrir cópia deve ser a opção
normal do professor; alterar o original, se necessário, tem de ser uma ação explícita.

### 04. Falhas de gravação do Volume não têm o mesmo tratamento

`syncClassroomAutosave()` ignora falhas da API. Além disso,
`saveTeacherEditAndReturn()` termina a sessão de edição mesmo depois de uma falha
no pedido de guardar. Isto pode impedir o professor de repetir a gravação da versão
que acabou de editar. As novas secções mostram erro e mantêm um rascunho pendente.

Proposta: não abandonar a edição após falhar; conservar alterações e permitir repetir.
Padronizar «A guardar», «Guardado», «Sem ligação» e «Entregue», acompanhados de texto
sobre onde está guardado o projeto. Nunca apresentar sucesso antes da confirmação.

## P2 — estrutura, compreensão e acessibilidade

| # | Inconsistência observada | Proposta |
|---|---|---|
| 05 | Guardar/Abrir na barra superior da Area e Volume; no painel lateral do Revolve e Voxel. | Uma barra de projeto comum, sempre no mesmo sítio. |
| 06 | Sala de aula na marca flutuante do Voxel, no cabeçalho da Area/Revolve; Volume mantém Aluno e Professor separados. | Um único acesso Sala de aula, com os mesmos percursos nas quatro secções. |
| 07 | Câmara tem controlos comuns, mas Repor vista reaparece em painéis; zoom não tem sempre os mesmos limites e falta uma ação clara de enquadrar o modelo. | Uma zona de vista comum com Frente, Cima, Enquadrar tudo e zoom +/−; detalhes específicos recolhidos. |
| 08 | STL, PNG, JSON, TXT e SVG aparecem como ações principais; Guardar/Carregar e Abrir/Exportar alternam. | Nomear pelo objetivo: Guardar projeto, Abrir projeto, Preparar impressão, Criar animação, Guardar imagem. Formato no passo seguinte. |
| 09 | Resolução, altura de camada e simplificação estão expostas logo na Area; o Revolve já recolhe código e repetições. | Básico primeiro, ajustes técnicos em Mais opções. Explicar o efeito de cada parâmetro. |
| 10 | Volume tem tutorial, conquistas e certificado; as outras secções não têm entrada guiada equivalente. | Ajuda comum e uma primeira tarefa curta em cada técnica. Definir separadamente se as conquistas são da suite ou só de atividades específicas. |
| 11 | Labels pequenos de 9–10 px em ferramentas; alguns controlos têm 40–42 px de altura; checkboxes da Area são 14 px e os labels não estão associados por for/id. | Usar 44×44 px como meta de interação, aumentar a área clicável dos labels e testar leitura em computadores de escola. Medir o alvo real, não só o desenho do ícone. |
| 12 | Revolve/Voxel usam eventos de rato para órbita/pan. Há controlos que dependem de arrasto ou botão direito. | Unificar interação de rato, trackpad, toque e caneta; oferecer alternativas por botões/campos. As setas do teclado do perfil são úteis, mas não substituem alternativas de toque. |
| 13 | A 1280 px ou menos, o Volume esconde vários nomes dos botões do cabeçalho e deixa ícones. | Preservar os rótulos das ações importantes; recolher ações secundárias antes de retirar os nomes. |
| 14 | Toasts, modais, confirmações nativas e popups de conquistas têm estilos e durações diferentes. | Um padrão de diálogos e feedback, com erros persistentes até serem resolvidos e notificações de sucesso discretas. |
| 15 | Criar conta e Entrar partilham o mesmo formulário; não há recuperação de palavra-passe no percurso atual. | Separar claramente os objetivos, indicar requisitos antes de submeter e desenhar a recuperação de acesso. |

Os critérios WCAG 2.2 distinguem o mínimo AA de 24×24 px (com exceções de espaçamento)
da meta AAA de 44×44 px. Para esta suite, proponho a segunda como padrão de produto.
Não foi medido o contraste da interface completa: textos secundários, estados
inativos, foco e mensagens precisam de medição, antes de afirmar conformidade.

A organização pedagógica também precisa de uma decisão explícita: hoje, o código
identifica uma atividade, embora a interface lhe chame sala. A hierarquia desejada
Turma → Atividade → Trabalhos exige também evolução do modelo de dados. Os textos
da interface devem refletir o comportamento disponível e evitar sugerir que a turma
permanente já existe.

## P3 — acabamento e identidade

16. Mistura de emojis, PrimeIcons, símbolos Unicode e SVG. Definir uma família de
ícones; manter texto para ações essenciais. A identidade das ilustrações pode ser
definida posteriormente sem atrasar esta consistência funcional.

17. Persistem nomes antigos em resultados: o PDF/TXT do Voxel usa Pixel3D, a folha
do Revolve usa Code3D e os ficheiros do Volume usam monco. Unificar rótulos visíveis
e nomes de ficheiro, preservando leitura dos formatos antigos e atribuições de autoria.

18. Há cabeçalho global e marcas locais com «3D»/«BETA», informação de renderer e
ligações institucionais em posições diferentes. Usar a marca global e a secção ativa;
reunir informações técnicas/créditos num acesso Sobre, mantendo a autoria disponível.

## Estrutura comum proposta

1. Navegação global: Início, Area, Volume, Revolve e Voxel.
2. Barra de projeto: nome editável, Novo, Abrir, Guardar, Desfazer/Refazer.
3. Ações de saída: Sala de aula/Entregar e Preparar impressão; no Voxel, Criar animação.
4. Espaço de criação: ferramentas e propriedades da técnica, com hierarquia e
   espaçamento comuns. O perfil do Revolve e as camadas do Voxel conservam os seus
   controlos próprios; não é necessário tornar os quatro editores idênticos.
5. Vista: controlos de câmara no mesmo sítio sempre que houver visualização 3D.
6. Estado do projeto: distinguir rascunho local, rascunho na sala e versão entregue.

Regras semânticas: o laranja destaca ações principais, sem tornar todos os botões
igualmente importantes; as cores das secções identificam técnicas; erro, sucesso e
aviso usam convenções comuns e texto, sem depender apenas da cor.

## Sequência de trabalho sugerida

**Primeira passagem:** recuperação local nas quatro secções, desfazer/refazer,
proteção ao substituir projetos e correção dos fluxos de gravação do Volume.

**Segunda passagem:** barra de projeto, acesso comum à sala, nomes das ações,
controlos de vista, organização Básico/Mais opções e padrões de mensagens.

**Terceira passagem:** sistema de ícones, identidade das ilustrações, documentos
exportados, tutoriais e decisão sobre gamificação.

Validar a segunda passagem com crianças dos 8–10 e 11–14 anos e professores. Observar
se conseguem iniciar, corrigir um erro, guardar/reabrir, alternar entre secções e
entregar sem ajuda. Testar portátil 1280×720, ecrã maior, tablet, teclado e zoom 200%.
Registar erros, pedidos de ajuda e perdas de contexto; não usar apenas preferências
estéticas como critério de sucesso.

## Referências de desenho

- Nielsen Norman Group: https://www.nngroup.com/articles/ten-usability-heuristics/
- W3C, tamanho mínimo: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- W3C, tamanho reforçado: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- W3C, alternativas ao arrasto: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html

As prioridades e soluções acima são recomendações para o Explora3D, não resultados
já obtidos em testes com utilizadores.
