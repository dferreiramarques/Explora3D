(() => {
  'use strict';
  const app = document.body.dataset.suiteApp;
  if (!['area', 'volume', 'revolve', 'voxel'].includes(app)) return;
  const names = { area: 'Area', volume: 'Volume', revolve: 'Revolve', voxel: 'Voxel' };
  const adapter = window.ExploraProject;
  const API = window.EXPLORA_CLASSROOM_API;
  const tokenKey = 'monco3d_teacher_token_v1';
  const sessionKey = 'explora_classroom_' + app;
  const draftKey = sessionKey + '_pending';
  let session = null, personal = null, preview = null, delivered = false;
  let lastSaved = '', queue = Promise.resolve(), supported = false, tab = 'student', activity = null;
  let returnFocus;
  const get = id => document.getElementById('ec-' + id);
  const read = key => { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } };
  const write = (key, value) => { try { value == null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Server acknowledgement is still required. */ } };
  const token = () => { try { return localStorage.getItem(tokenKey); } catch { return null; } };
  const setToken = value => { if (value) localStorage.setItem(tokenKey, value); else localStorage.removeItem(tokenKey); };
  const toolbar = document.createElement('div');
  toolbar.className = 'ec-toolbar';
  toolbar.innerHTML = '<button class="ec-entry" type="button">🏫 Sala de aula</button><button class="ec-deliver" type="button" hidden>Entregar ao professor</button><button class="ec-entry" type="button" hidden>Voltar ao meu trabalho</button><span class="ec-status" role="status" aria-live="polite"></span>';
  const [entry, deliver, back] = toolbar.querySelectorAll('button');
  const status = toolbar.querySelector('.ec-status');
  const header = document.getElementById('explora-projectbar') || document.querySelector(app === 'area' ? 'body > header' : app === 'volume' ? '#hdr' : app === 'revolve' ? '#titlebar' : '#brand');
  header.appendChild(toolbar);
  new MutationObserver(() => { if (status.textContent) window.ExploraWorkspace?.status(status.textContent); }).observe(status, { childList: true, characterData: true, subtree: true });
  const boundary = () => window.dispatchEvent(new Event('explora:project-boundary'));
  const dialog = document.createElement('dialog');
  dialog.className = 'ec-dialog'; dialog.setAttribute('aria-labelledby', 'ec-title');
  dialog.innerHTML = `
    <div class="ec-heading"><h2 id="ec-title">Sala de aula · ${names[app]}</h2><button id="ec-close" type="button" aria-label="Fechar sala de aula">✕</button></div>
    <div class="ec-tabs"><button id="ec-student-tab" type="button" aria-pressed="true">Sou aluno</button><button id="ec-teacher-tab" type="button" aria-pressed="false">Sou professor</button></div>
    <p id="ec-notice" class="ec-notice" role="status" aria-live="polite"></p>
    <section id="ec-student">
      <form id="ec-join"><p class="ec-muted">Usa o código da atividade e o teu código pessoal para continuar o trabalho.</p>
        <label>Código da sala<input id="ec-code" required maxlength="12" autocomplete="off"></label>
        <label>O teu nome<input id="ec-name" required maxlength="80" autocomplete="off"></label>
        <label>Código pessoal de 4 números<input id="ec-pin" required inputmode="numeric" type="password" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off"></label>
        <button class="ec-primary" type="submit">Entrar na sala</button></form>
      <div id="ec-session" hidden><h3 id="ec-activity-title"></h3><p id="ec-identity" class="ec-muted"></p><div id="ec-brief" class="ec-brief"></div>
        <p class="ec-muted">O rascunho é guardado enquanto trabalhas. Entregar envia uma versão para o professor; as alterações seguintes ficam no teu rascunho.</p>
        <div class="ec-actions"><button id="ec-submit" class="ec-primary" type="button">Entregar ao professor</button><button id="ec-save" type="button">Guardar agora</button><button id="ec-leave" type="button">Sair da sala</button></div>
      </div>
    </section>
    <section id="ec-teacher" hidden>
      <form id="ec-auth"><p class="ec-muted">A tua conta de professor é a mesma nas quatro secções.</p>
        <label>Email<input id="ec-email" type="email" required autocomplete="username"></label>
        <label>Palavra-passe<input id="ec-password" type="password" required minlength="6" autocomplete="current-password"></label>
        <div class="ec-actions"><button class="ec-primary" type="submit">Entrar</button><button id="ec-register" type="button">Criar conta</button></div></form>
      <div id="ec-dashboard" hidden>
        <div class="ec-actions"><button id="ec-refresh" type="button">Atualizar</button><button id="ec-logout" type="button">Terminar sessão</button></div>
        <div id="ec-activities"><h3>Atividades de ${names[app]}</h3><div id="ec-list" class="ec-list"></div>
          <form id="ec-create"><h3>Nova atividade</h3><label>Título<input id="ec-new-title" required maxlength="160"></label><label>O desafio<textarea id="ec-new-brief" maxlength="10000" placeholder="O que vamos criar? Escreve os passos do desafio."></textarea></label><button class="ec-primary" type="submit">Criar atividade</button></form></div>
        <div id="ec-detail" hidden><button id="ec-back" type="button">← Atividades</button><h3 id="ec-detail-title"></h3><strong id="ec-detail-code" class="ec-code"></strong><button id="ec-copy" type="button">Copiar link para os alunos</button><div id="ec-results" class="ec-list"></div></div>
      </div>
    </section>`;
  document.body.appendChild(dialog);
  if (window.EXPLORA_CLASSROOM_DEMO) {
    const label = document.createElement('p'); label.className = 'ec-muted';
    label.textContent = 'Demonstração local: as contas e os trabalhos existem apenas enquanto o servidor de teste estiver ligado.';
    dialog.querySelector('.ec-heading').after(label);
  }

  function notice(message = '') { get('notice').textContent = message; }
  function render() {
    get('student').hidden = tab !== 'student'; get('teacher').hidden = tab !== 'teacher';
    get('student-tab').setAttribute('aria-pressed', String(tab === 'student'));
    get('teacher-tab').setAttribute('aria-pressed', String(tab === 'teacher'));
    get('join').hidden = !!session; get('session').hidden = !session;
    get('auth').hidden = !!token(); get('dashboard').hidden = !token();
    deliver.hidden = !session || !!preview; back.hidden = !preview;
    get('submit').disabled = !!preview; get('save').disabled = !!preview;
    get('leave').disabled = !!preview;
    entry.textContent = session ? '🏫 ' + session.code : '🏫 Sala de aula';
    if (session) {
      get('activity-title').textContent = session.title;
      get('identity').textContent = session.name + ' · ' + session.code;
      get('brief').textContent = session.brief || 'O professor ainda não escreveu o desafio.';
    }
  }
  function open(nextTab) {
    if (nextTab === 'teacher' || nextTab === 'student') tab = nextTab;
    returnFocus = document.activeElement; notice(); render(); dialog.showModal();
    if (tab === 'teacher' && token()) run(activities);
  }
  entry.addEventListener('click', open);
  get('close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => returnFocus?.focus());
  get('student-tab').onclick = () => { tab = 'student'; notice(); render(); };
  get('teacher-tab').onclick = () => { tab = 'teacher'; notice(); render(); if (token()) run(activities); };
  async function run(action) {
    notice();
    const buttons = [...dialog.querySelectorAll('button')].filter(button => button.id !== 'ec-close' && !button.disabled);
    buttons.forEach(button => button.disabled = true);
    try { await action(); } catch (error) { notice(error.message); }
    finally { buttons.forEach(button => button.disabled = false); render(); }
  }
  async function request(path, options = {}, check = true) {
    if (check && !supported) {
      let capability;
      try { capability = await request('/api/capabilities', {}, false); } catch {
        throw new Error('Esta secção precisa da versão atualizada do servidor de sala de aula. O trabalho no editor continua disponível.');
      }
      if (capability.classroom_version < 3 || !capability.apps?.includes(app)) throw new Error('Atualiza o servidor para usar a sala de aula nesta secção.');
      supported = true;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(API + path, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && options.headers?.Authorization) { setToken(null); render(); }
      if (!res.ok) throw new Error(data.error || `Não foi possível concluir o pedido (${res.status}).`);
      return data;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('Sem ligação ao servidor. O teu trabalho continua no editor; tenta guardar novamente.');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  const auth = () => ({ Authorization: 'Bearer ' + token() });
  const envelope = () => ({ version: 1, app, data: adapter.capture() });
  function save(submit = false) {
    if (!session || preview) return Promise.resolve();
    let project;
    try { project = envelope(); } catch (error) { status.textContent = 'Não foi possível guardar: ' + error.message; return Promise.reject(error); }
    const raw = JSON.stringify(project), target = session;
    if (!submit && raw === lastSaved) return queue;
    write(draftKey, { submissionId: target.id, project });
    queue = queue.catch(() => {}).then(async () => {
      if (session !== target || preview) return;
      status.textContent = submit ? 'A entregar…' : 'A guardar…';
      try {
        await request('/api/submissions/' + target.id, { method: 'PUT', body: JSON.stringify({ project_json: project, submit }) });
        lastSaved = raw;
        const pending = read(draftKey);
        if (JSON.stringify(pending?.project) === raw) write(draftKey, null);
        if (submit) delivered = true;
        status.textContent = submit ? '✓ Entregue ao professor' : delivered ? 'Rascunho guardado · entrega anterior mantida' : '✓ Rascunho guardado';
      } catch (error) { status.textContent = 'Não guardado no servidor · tenta novamente'; throw error; }
    });
    return queue;
  }
  get('join').onsubmit = event => {
    event.preventDefault(); run(async () => {
      const creds = { classroom_code: get('code').value.trim().toUpperCase(), student_name: get('name').value.trim(), student_pin: get('pin').value, app_id: app };
      await join(creds);
    });
  };
  async function join(creds) {
    if (preview) throw new Error('Volta ao teu trabalho antes de entrar numa sala.');
    window.ExploraWorkspace?.flush();
    const own = adapter.capture();
    const data = await request('/api/submissions/join', { method: 'POST', body: JSON.stringify(creds) });
    if (data.activity?.app_id !== app) throw new Error('Esta atividade pertence a outra secção.');
    let project = data.project_json || (app === 'volume' && data.shapes_json ? { app, version: 1, data: data.shapes_json } : null);
    const pending = read(draftKey);
    if (pending?.submissionId === data.submission_id && confirm('Há um rascunho neste navegador que ainda não foi confirmado pelo servidor. Queres recuperá-lo?')) project = pending.project;
    if (project) {
      if (project.app !== app || project.version !== 1) throw new Error('O trabalho guardado não pertence a este editor.');
      await adapter.restore(project.data);
    }
    personal = own;
    session = { id: data.submission_id, code: creds.classroom_code, name: creds.student_name, title: data.activity.title, brief: data.activity.brief };
    delivered = !!data.submitted_at; lastSaved = '';
    write(sessionKey, creds); render(); boundary(); notice('Entraste na sala. Podes continuar a criar.');
    await save();
  }
  async function submit() { await save(true); notice('Trabalho entregue. Podes continuar a editar e entregar outra versão quando quiseres.'); }
  deliver.onclick = () => { save(true).catch(error => { open(); notice(error.message); }); };
  get('submit').onclick = () => run(submit);
  get('save').onclick = () => run(() => save());
  get('leave').onclick = () => run(async () => {
    await save();
    if (personal) await adapter.restore(personal);
    session = null; personal = null; lastSaved = ''; delivered = false; write(sessionKey, null);
    get('pin').value = ''; get('name').value = '';
    const url = new URL(location.href); url.searchParams.delete('code'); history.replaceState(null, '', url);
    status.textContent = ''; render(); boundary(); notice('Saíste da sala. O trabalho está guardado no servidor.');
  });
  async function login(register = false) {
    if (!get('auth').reportValidity()) return;
    const data = await request('/api/auth/' + (register ? 'register' : 'login'), { method: 'POST', body: JSON.stringify({ email: get('email').value, password: get('password').value }) });
    setToken(data.token); get('password').value = ''; render(); await activities();
  }
  get('auth').onsubmit = event => { event.preventDefault(); run(() => login()); };
  get('register').onclick = () => run(() => login(true));
  get('logout').onclick = () => { setToken(null); activity = null; get('list').replaceChildren(); get('results').replaceChildren(); render(); };
  async function activities() {
    activity = null; get('detail').hidden = true; get('activities').hidden = false;
    const list = await request('/api/activities?app_id=' + app, { headers: auth() });
    get('list').replaceChildren();
    if (!list.length) get('list').textContent = 'Ainda não tens atividades nesta secção.';
    list.forEach(item => {
      if (item.app_id !== app) return;
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = `${item.title} · ${item.classroom_code} · ${item.submission_count} trabalhos`;
      button.onclick = () => run(() => detail(item)); get('list').appendChild(button);
    });
  }
  get('create').onsubmit = event => { event.preventDefault(); run(async () => {
    const item = await request('/api/activities', { method: 'POST', headers: auth(), body: JSON.stringify({ title: get('new-title').value, brief: get('new-brief').value, app_id: app }) });
    get('create').reset(); await detail(item);
  }); };
  async function detail(item) {
    activity = item; get('activities').hidden = true; get('detail').hidden = false;
    get('detail-title').textContent = item.title; get('detail-code').textContent = item.classroom_code;
    const list = await request('/api/activities/' + item.id + '/submissions', { headers: auth() });
    get('results').replaceChildren();
    if (!list.length) get('results').textContent = 'Ainda não há trabalhos nesta atividade.';
    list.forEach(result => {
      const row = document.createElement('div'); row.className = 'ec-row';
      const label = document.createElement('p'); label.textContent = result.student_name + ' · ' + (result.submitted_at ? 'Entregue em ' + new Date(result.submitted_at).toLocaleString('pt-PT') : 'Rascunho em curso');
      const actions = document.createElement('div'); actions.className = 'ec-actions';
      for (const [label, download] of [['Abrir cópia', false], ['Descarregar projeto', true]]) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
        button.onclick = () => run(async () => {
          const data = await request('/api/teacher/submissions/' + result.id, { headers: auth() });
          const project = data.submitted_project_json || data.project_json || (app === 'volume' && data.shapes_json ? { app, version: 1, data: data.shapes_json } : null);
          if (!project || project.app !== app) throw new Error('Este aluno ainda não guardou um projeto nesta atividade.');
          if (download) {
            const url = URL.createObjectURL(new Blob([JSON.stringify(project.data, null, 2)], { type: 'application/json' }));
            const link = document.createElement('a'); link.href = url; link.download = app + '-trabalho.' + (app === 'area' ? 'stampforge' : 'json'); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          } else {
            window.ExploraWorkspace?.flush();
            const own = preview || adapter.capture();
            await adapter.restore(project.data); preview = own; render(); boundary();
            status.textContent = 'Cópia do trabalho de ' + result.student_name + ' · original preservado'; dialog.close();
          }
        }); actions.appendChild(button);
      }
      row.append(label, actions); get('results').appendChild(row);
    });
  }
  back.onclick = async () => {
    try { await adapter.restore(preview); preview = null; status.textContent = session ? 'De volta ao teu trabalho' : ''; render(); boundary(); }
    catch (error) { open(); notice(error.message); }
  };
  get('refresh').onclick = () => run(() => activity ? detail(activity) : activities());
  get('back').onclick = () => run(activities);
  get('copy').onclick = () => run(async () => {
    const url = new URL(location.href); url.search = '?code=' + encodeURIComponent(activity.classroom_code);
    // Share the suite route when embedded; standalone editors also remain usable.
    let link = url.href;
    try { if (parent !== window && parent.location.origin === location.origin) {
      const suite = new URL(parent.location.href); suite.search = url.search; suite.hash = app; link = suite.href;
    } } catch { /* Standalone URL remains valid. */ }
    await navigator.clipboard.writeText(link); notice('Link copiado.');
  });
  window.addEventListener('storage', event => { if (event.key === tokenKey) { get('results').replaceChildren(); render(); } });
  setInterval(() => { if (session && !preview && window.exploraFrameActive !== false && !document.hidden) save().catch(() => {}); }, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save().catch(() => {}); });
  window.addEventListener('pagehide', () => {
    if (session && !preview) {
      try { write(draftKey, { submissionId: session.id, project: envelope() }); } catch { /* Existing pending draft remains recoverable. */ }
    }
  });
  window.addEventListener('message', event => {
    if (event.source === parent && event.origin === location.origin && event.data?.type === 'explora:visibility' && event.data.active === false) save().catch(() => {});
  });
  const code = new URLSearchParams(location.search).get('code');
  const saved = read(sessionKey);
  if (code) get('code').value = code;
  window.addEventListener('load', async () => {
    await window.ExploraWorkspace?.ready;
    if (saved && (!code || saved.classroom_code === code.toUpperCase())) {
      try { await join(saved); } catch (error) { status.textContent = 'Sessão não retomada · abre Sala de aula'; }
    }
    if (code && !session) open();
  });
  window.ExploraClassroom = { open, save, scope: () => preview ? 'copy' : session ? 'classroom' : 'free' };
  render();
})();
