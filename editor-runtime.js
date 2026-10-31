/* Shared editor behaviour. It never reads, replaces or saves a project. */
(() => {
  'use strict';
  window.exploraFrameActive = !window.frameElement || window.frameElement.classList.contains('is-active');
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== location.origin ||
        event.data?.type !== 'explora:visibility' || typeof event.data.active !== 'boolean') return;
    window.exploraFrameActive = event.data.active;
  });
  const app = document.body.dataset.suiteApp;
  if (app === 'area') return;
  const mount = document.getElementById(app === 'revolve' ? 'viewport-wrap' : app === 'volume' ? 'stage' : 'viewport');
  if (!mount) return;
  const controls = document.createElement('nav');
  controls.className = 'explora-view-controls';
  controls.setAttribute('aria-label', 'Controlos da vista 3D');
  const actions = [
    ['◫ Frente', 'Ver o objeto de frente', () => {
      if (app === 'volume') { theta3 = 0; phi3 = Math.PI / 2; updateCam3(); }
      else { camera.position.set(cameraTarget.x, cameraTarget.y, cameraTarget.z + 12 * (app === 'voxel' ? 2 : 1)); camera.lookAt(cameraTarget); }
    }],
    ['+ Zoom', 'Aproximar o objeto', () => {
      if (app === 'volume') { radius3 = Math.max(60, radius3 * .85); updateCam3(); }
      else if (camera.position.distanceTo(cameraTarget) > 1) { camera.position.sub(cameraTarget).multiplyScalar(.85).add(cameraTarget); camera.lookAt(cameraTarget); }
    }],
    ['↺ Repor vista', 'Voltar à vista inicial', () => {
      if (app === 'volume') { theta3 = .4; phi3 = .75; radius3 = 400; updateCam3(); }
      else resetarCamera();
    }]
  ];
  for (const [label, title, action] of actions) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.title = title;
    button.setAttribute('aria-label', title);
    button.addEventListener('click', action);
    controls.appendChild(button);
  }
  mount.appendChild(controls);
})();
