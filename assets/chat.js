/* ───────────────────────────────────────────────────────────────────
   chat.js — the plan chat rail.

   Contract with the host page:
     · window.renderPlan()               rebuilds the page from window.PLAN
                                         and window.PLAN_ART. Optional; without
                                         it the page reloads instead.
     · [data-scene-id="<id>"]            on each scene element, so a change can
                                         be marked where it happened.

   Served from /__plan/chat.js by plan.server.mjs. Opened as a file://, the
   page never loads this — it degrades to a one-line note instead.
   ─────────────────────────────────────────────────────────────────── */
(() => {
  const API = '/__plan';
  const $ = (tag, attrs = {}, kids = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
    for (const kid of [].concat(kids)) el.append(kid);
    return el;
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── shell ───────────────────────────────────────────────────── */
  const root = $('div', { id: 'pc', 'data-open': '0', 'data-busy': '0', 'data-unread': '0' });
  root.innerHTML = `
    <button id="pc-tab" title="Talk to the plan"><span class="dot"></span>Plan chat</button>
    <div id="pc-panel">
      <div id="pc-head">
        <h2>Plan chat</h2>
        <span class="sub" id="pc-mode">connecting</span>
        <button id="pc-close" title="Collapse" aria-label="Collapse">&times;</button>
      </div>
      <div id="pc-tabs" role="tablist">
        <button role="tab" data-view="log" aria-selected="true">Conversation</button>
        <button role="tab" data-view="changes" aria-selected="false">Changes</button>
      </div>
      <div id="pc-body" data-view="log">
        <div id="pc-log"></div>
        <div id="pc-changes"></div>
      </div>
      <form id="pc-form">
        <div id="pc-working"><span class="pc-spin"></span><span class="what">thinking</span></div>
        <textarea id="pc-input" rows="2" placeholder="Tighten scene 4. Lose the second bray."></textarea>
        <div id="pc-foot">
          <span id="pc-hint">&#9166; to send &middot; &#8679;&#9166; newline</span>
          <button id="pc-send" type="submit">Send</button>
        </div>
      </form>
    </div>`;
  const pill = $('div', { id: 'pc-pill', 'data-show': '0' });
  pill.innerHTML = '<span class="pc-spin"></span><span class="what"></span>';
  document.body.append(root, pill);

  const el = id => document.getElementById(id);
  const log = el('pc-log'), changesPane = el('pc-changes'), input = el('pc-input');
  const workingWhat = document.querySelector('#pc-working .what');
  const pillWhat = pill.querySelector('.what');

  /* ── open / close ────────────────────────────────────────────── */
  const narrow = () => matchMedia('(max-width: 720px)').matches;
  const setOpen = on => {
    root.dataset.open = on ? '1' : '0';
    // Push the page over rather than covering it. On a narrow screen the rail
    // is a full-width sheet, so there is nothing to push.
    document.documentElement.style.setProperty('--pc-shift',
      on && !narrow() ? getComputedStyle(root).getPropertyValue('--pc-w').trim() || '0px' : '0px');
    if (on) { root.dataset.unread = '0'; input.focus(); }
    try { localStorage.setItem('pc-open', on ? '1' : '0'); } catch {}
  };
  addEventListener('resize', () => setOpen(root.dataset.open === '1'));
  el('pc-tab').onclick = () => setOpen(root.dataset.open === '0');
  el('pc-close').onclick = () => setOpen(false);
  for (const b of document.querySelectorAll('#pc-tabs button')) {
    b.onclick = () => {
      for (const o of document.querySelectorAll('#pc-tabs button')) o.setAttribute('aria-selected', String(o === b));
      el('pc-body').dataset.view = b.dataset.view;
    };
  }

  /* ── tab-title badge ─────────────────────────────────────────── */
  const trueTitle = document.title;
  const badge = on => { document.title = on ? `● ${trueTitle}` : trueTitle; };
  addEventListener('focus', () => badge(false));

  /* ── transcript ──────────────────────────────────────────────── */
  function renderEntry(e) {
    if (e.role === 'user') {
      log.append($('div', { class: 'pc-msg user', html: `<div class="who">You</div><div class="bubble">${esc(e.message)}</div>` }));
      return;
    }
    const kind = e.ok === false ? 'err' : 'plan';
    const list = (e.changes ?? []).length
      ? `<ul class="pc-changes-list">${e.changes.map(c =>
          `<li><b>${esc(c.scene || 'plan')}</b>${esc(c.note || c.field || '')}</li>`).join('')}</ul>`
      : '';
    const detail = e.detail ? `<div class="detail">${esc(e.detail)}</div>` : '';
    const warn = (e.warnings ?? []).length ? `<div class="detail">${esc(e.warnings.join('; '))}</div>` : '';
    log.append($('div', { class: `pc-msg ${kind}`, html:
      `<div class="who">${e.ok === false ? 'Not applied' : 'Plan'}</div><div class="bubble">${esc(e.summary)}${list}${detail}${warn}</div>` }));
  }
  const toBottom = () => { el('pc-body').scrollTop = el('pc-body').scrollHeight; };

  function renderChangelog(entries) {
    changesPane.replaceChildren();
    if (!entries.length) {
      changesPane.append($('p', { class: 'pc-empty', text: 'Nothing has changed through the chat yet.' }));
      return;
    }
    for (const e of [...entries].reverse()) {
      const when = new Date(e.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const row = $('div', { class: 'pc-entry', html:
        `<div class="when">${esc(when)}${e.sha ? ' &middot; ' + esc(e.sha.slice(0, 7)) : ''}</div>
         <div class="sum">${esc(e.summary)}</div>` });
      const undo = $('button', { type: 'button', text: 'Undo this' });
      undo.onclick = async () => {
        undo.disabled = true; undo.textContent = 'Undoing…';
        const r = await fetch(`${API}/revert`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ turnId: e.turnId }),
        }).then(r => r.json()).catch(() => ({ ok: false, reason: 'the bridge is not answering' }));
        if (!r.ok) { undo.disabled = false; undo.textContent = 'Undo this'; say({ ok: false, summary: r.reason }); }
      };
      row.append(undo);
      changesPane.append(row);
    }
  }
  const say = e => { renderEntry({ role: 'assistant', at: new Date().toISOString(), ...e }); toBottom(); };

  /* ── hot reload of the plan itself ───────────────────────────── */
  function reloadPlan(changedIds = []) {
    if (typeof window.renderPlan !== 'function') { location.reload(); return; }
    const stamp = Date.now();
    const load = src => new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = `${src}?v=${stamp}`; s.onload = res; s.onerror = rej;
      document.head.append(s);
    });
    Promise.all([load('plan.data.js'), load('plan.art.js')])
      .then(() => {
        window.renderPlan();
        for (const id of changedIds.filter(Boolean)) {
          const node = document.querySelector(`[data-scene-id="${CSS.escape(id)}"]`);
          if (!node) continue;
          node.setAttribute('data-pc-changed', '');
          setTimeout(() => node.removeAttribute('data-pc-changed'), 12000);
        }
        const first = changedIds.filter(Boolean)[0];
        if (first) document.querySelector(`[data-scene-id="${CSS.escape(first)}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(() => location.reload());
  }

  /* ── notifications ───────────────────────────────────────────── */
  const notify = (title, body) => {
    if (document.hasFocus()) return;
    try {
      if (window.Notification?.permission === 'granted') new Notification(title, { body, tag: 'plan-chat' });
    } catch {}
  };

  /* ── status ──────────────────────────────────────────────────── */
  function setBusy(on, note) {
    root.dataset.busy = on ? '1' : '0';
    if (note) { workingWhat.textContent = note; pillWhat.textContent = note; }
    pill.dataset.show = on ? '1' : '0';
    pill.dataset.kind = 'working';
    el('pc-send').disabled = on;
  }
  function settle(kind, note) {
    root.dataset.busy = '0';
    el('pc-send').disabled = false;
    pill.dataset.kind = kind; pill.dataset.show = '1'; pillWhat.textContent = note;
    clearTimeout(settle.t);
    settle.t = setTimeout(() => { pill.dataset.show = '0'; }, 9000);
  }
  pill.onclick = () => setOpen(true);

  /* ── wire ────────────────────────────────────────────────────── */
  fetch(`${API}/state`).then(r => r.json()).then(s => {
    for (const e of s.history) renderEntry(e);
    renderChangelog(s.changelog);
    el('pc-mode').textContent = s.git ? 'commits on' : 'no git';
    if (s.busy) setBusy(true, 'working');
    toBottom();
    try { if (localStorage.getItem('pc-open') === '1') setOpen(true); } catch {}
  }).catch(() => { el('pc-mode').textContent = 'offline'; });

  const es = new EventSource(`${API}/events`);
  es.addEventListener('queued', ev => { renderEntry({ role: 'user', ...JSON.parse(ev.data) }); setBusy(true, 'queued'); toBottom(); });
  es.addEventListener('working', ev => setBusy(true, JSON.parse(ev.data).note));
  es.addEventListener('activity', ev => setBusy(true, JSON.parse(ev.data).note));
  es.addEventListener('done', ev => {
    const e = JSON.parse(ev.data);
    renderEntry(e); toBottom();
    settle('done', e.summary);
    if (root.dataset.open === '0') root.dataset.unread = '1';
    badge(true); notify('Plan updated', e.summary);
    fetch(`${API}/state`).then(r => r.json()).then(s => renderChangelog(s.changelog)).catch(() => {});
    if (e.changed) reloadPlan((e.changes ?? []).map(c => c.scene));
  });
  es.addEventListener('failed', ev => {
    const e = JSON.parse(ev.data);
    renderEntry(e); toBottom();
    settle('failed', e.summary);
    if (root.dataset.open === '0') root.dataset.unread = '1';
    badge(true); notify('Plan unchanged', e.summary);
  });
  es.addEventListener('reverted', () => {
    fetch(`${API}/state`).then(r => r.json()).then(s => renderChangelog(s.changelog)).catch(() => {});
    reloadPlan();
  });
  es.onerror = () => { el('pc-mode').textContent = 'reconnecting'; };

  /* ── send ────────────────────────────────────────────────────── */
  async function send() {
    const message = input.value.trim();
    if (!message || el('pc-send').disabled) return;
    input.value = '';
    try { if (window.Notification?.permission === 'default') Notification.requestPermission(); } catch {}
    setBusy(true, 'queued');
    const r = await fetch(`${API}/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
    }).catch(() => null);
    if (!r?.ok) { setBusy(false); say({ ok: false, summary: 'The bridge is not answering. Is plan.server.mjs still running?' }); }
  }
  el('pc-form').onsubmit = e => { e.preventDefault(); send(); };
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 190) + 'px'; });
})();
