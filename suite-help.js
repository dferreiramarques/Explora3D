/* Read-only onboarding: opening help never changes the student's project. */
(() => {
  'use strict';
  const guides = {
    area: [
      ['✎', 'Começa por um desenho', 'Escolhe Lápis, Linha ou uma forma no menu à esquerda. Desenha na área central. Usa a Borracha para corrigir.'],
      ['◐', 'Explora o traço e o preenchimento', 'No painel Cor e traço, ajusta a cor e a espessura. Compara uma forma só com contorno com uma forma preenchida.'],
      ['↔', 'Define as dimensões', 'Ajusta as dimensões e o relevo no painel de propriedades. Pensa no tamanho que a tua peça deverá ter quando for impressa.'],
      ['↶', 'Experimenta sem receio', 'Desfazer e Refazer permitem comparar alterações. Guardar descarrega um projeto editável; Abrir permite retomá-lo mais tarde.'],
      ['↓', 'Descarrega a tua peça', 'Clica em Preparar impressão para descarregar diretamente o STL. Guarda também o projeto: o STL serve para preparar a impressão num programa como o Cura.']
    ],
    volume: [
      ['□', 'Escolhe uma forma', 'No menu à esquerda, escolhe uma forma ou Desenho livre. Clica e arrasta na área central para a desenhar.'],
      ['◐', 'Dá cor e altura', 'Escolhe uma cor no painel Cor e espessura. Usa Ajustar espessura para definir a altura associada à cor.'],
      ['↔', 'Combina e transforma', 'Usa os ícones da barra flutuante para selecionar ou mover formas, deslocar a vista e apagar. As pegas da seleção permitem ajustar o tamanho e rodar.'],
      ['◫', 'Descobre o resultado em 3D', 'Clica em Ver 3D. Roda a vista e observa a relação entre as formas desenhadas e os volumes. Usa Editar para voltar ao desenho.'],
      ['↓', 'Guarda e prepara a impressão', 'Guardar descarrega o projeto editável. Preparar impressão descarrega diretamente o STL, para abrir num programa de preparação de impressão.']
    ],
    revolve: [
      ['⌁', 'Desenha um perfil', 'Começa por um exemplo ou pelo perfil atual. A linha representa a silhueta que será rodada em torno do eixo.'],
      ['↔', 'Move os pontos', 'Arrasta um ponto do perfil e observa a mudança no sólido. Também podes ajustar o ponto selecionado com as setas do teclado.'],
      ['◫', 'Observa de vários ângulos', 'Roda o modelo e usa os controlos flutuantes Frente, Zoom e Repor vista para inspecionar a tua criação.'],
      ['↶', 'Compara alternativas', 'Experimenta proporções diferentes e usa Desfazer para comparar. Guardar descarrega o projeto para poderes continuar mais tarde.'],
      ['↓', 'Leva o sólido para a impressão', 'Clica em Preparar impressão para descarregar diretamente um STL. O ficheiro será preparado num programa de impressão com o apoio do professor.']
    ],
    voxel: [
      ['▦', 'Começa por blocos', 'Escolhe um template ou constrói o teu modelo. Um template substitui a construção atual; guarda primeiro o teu projeto se quiseres conservá-lo.'],
      ['◐', 'Escolhe a cor e a camada', 'Seleciona uma cor e a altura de construção no painel. Cada camada permite acrescentar blocos a uma altura diferente.'],
      ['+', 'Constrói e corrige', 'Clica para acrescentar blocos. Usa Apagar para os retirar e observa o modelo de outros ângulos para verificar a construção.'],
      ['◫', 'Encontra a melhor vista', 'Usa Frente, Zoom e Repor vista nos controlos flutuantes. Procura simetrias e verifica como as camadas se ligam.'],
      ['↗', 'Guarda e apresenta', 'Guardar descarrega o modelo editável. Em Criar animação, podes exportar um GIF com o modelo a rodar, uma imagem PNG ou uma ficha PDF.']
    ]
  };
  let dialog;
  function open(app, name) {
    if (!guides[app]) return;
    const invoker = document.activeElement;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'ec-dialog ux-help-wizard';
      dialog.setAttribute('aria-labelledby', 'ux-help-title');
      document.body.appendChild(dialog);
    }
    let index = 0;
    function render() {
      const [icon, title, description] = guides[app][index];
      dialog.innerHTML = '<div class="ux-help-top"><span class="ux-help-counter"></span><button type="button" data-help="close" aria-label="Fechar ajuda">×</button></div><progress aria-label="Progresso da ajuda"></progress><div class="ux-help-step" aria-live="polite" aria-atomic="true"><span class="ux-help-icon" aria-hidden="true"></span><h2 id="ux-help-title"></h2><p></p></div><div class="ux-help-actions"><button type="button" data-help="back">Anterior</button><button type="button" class="ec-primary" data-help="next"></button></div>';
      dialog.querySelector('.ux-help-counter').textContent = name + ' · Passo ' + (index + 1) + ' de ' + guides[app].length;
      const progress = dialog.querySelector('progress');
      progress.max = guides[app].length; progress.value = index + 1;
      dialog.querySelector('.ux-help-icon').textContent = icon;
      dialog.querySelector('h2').textContent = title;
      dialog.querySelector('.ux-help-step p').textContent = description;
      dialog.querySelector('[data-help="close"]').onclick = () => dialog.close();
      const back = dialog.querySelector('[data-help="back"]');
      back.disabled = index === 0;
      back.onclick = () => { index--; render(); dialog.querySelector('[data-help="back"]').disabled ? dialog.querySelector('[data-help="next"]').focus() : dialog.querySelector('[data-help="back"]').focus(); };
      const next = dialog.querySelector('[data-help="next"]');
      next.textContent = index === guides[app].length - 1 ? 'Começar a criar' : 'Seguinte →';
      next.onclick = () => {
        if (index === guides[app].length - 1) dialog.close();
        else { index++; render(); dialog.querySelector('[data-help="next"]').focus(); }
      };
    }
    render();
    dialog.onclose = () => invoker?.focus();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-help="next"]').focus();
  }
  window.ExploraHelp = { open };
})();
