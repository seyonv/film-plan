#!/usr/bin/env node
/**
 * plan.server.mjs — the chat bridge for a film plan page.
 *
 * Serves a three-file plan (plan.html / plan.data.js / plan.art.js), accepts
 * chat messages from the page, hands each one to a headless Claude Code worker
 * that may edit ONLY the data and art files, validates the result, commits it,
 * and streams the whole thing back to the page over SSE.
 *
 * Zero dependencies. Node >= 20.
 *
 *   node plan.server.mjs --dir docs [--port 4173] [--no-open]
 *   node plan.server.mjs --selftest        # offline, stub worker, no tokens
 *   node plan.server.mjs --selftest=live   # one real `claude -p` turn
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = 'plan.data.js';
const ART_FILE = 'plan.art.js';
const HTML_FILE = 'plan.html';

/* ── args ─────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find(a => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  return argv.includes(`--${name}`) ? true : fallback;
};

// realpath throughout: on macOS /var is a symlink to /private/var, and git
// reports the resolved form while path.resolve does not. Comparing the two
// unresolved makes every plan file look like a stray.
const real = p => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
const PLAN_DIR = real(String(flag('dir', process.cwd())));
const NO_OPEN = !!flag('no-open');
const SELFTEST = flag('selftest');

/* ── paths and state ──────────────────────────────────────────────── */
const P = {
  html: path.join(PLAN_DIR, HTML_FILE),
  data: path.join(PLAN_DIR, DATA_FILE),
  art: path.join(PLAN_DIR, ART_FILE),
  state: path.join(PLAN_DIR, '.plan-chat'),
};
P.history = path.join(P.state, 'history.jsonl');
P.changelog = path.join(P.state, 'changelog.jsonl');
P.session = path.join(P.state, 'session-id');
P.turns = path.join(P.state, 'turns');
P.snaps = path.join(P.state, 'snapshots');

const EDITABLE = [P.data, P.art];

function ensureState() {
  fs.mkdirSync(P.turns, { recursive: true });
  fs.mkdirSync(P.snaps, { recursive: true });
  const ignore = path.join(P.state, '.gitignore');
  // The transcript and changelog are worth committing — they are usually the
  // best record of why the plan is the way it is. The rest is machine-local.
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, 'snapshots/\nturns/\nsession-id\n');
}

const readJsonl = f => !fs.existsSync(f) ? []
  : fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const appendJsonl = (f, obj) => fs.appendFileSync(f, JSON.stringify(obj) + '\n');

/* ── git ──────────────────────────────────────────────────────────── */
const gitAt = (dir, ...args) => {
  const r = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  // `raw` is untrimmed on purpose: porcelain's status field is two columns
  // wide and its first column is a space for an unstaged change, so trimming
  // stdout silently shifts every path along by one character.
  return { ok: r.status === 0, raw: r.stdout || '', out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
};
const REPO_ROOT = (() => {
  const r = gitAt(PLAN_DIR, 'rev-parse', '--show-toplevel');
  return r.ok ? real(r.out) : null;
})();
// All git runs from the repo root so that pathspecs can be absolute and
// unambiguous no matter how deep the plan lives.
const git = (...args) => gitAt(REPO_ROOT ?? PLAN_DIR, ...args);
const IS_REPO = () => REPO_ROOT !== null;

/* ── working tree ─────────────────────────────────────────────────── */
// Returns [{ code, file }] with `file` absolute. Porcelain paths are
// repo-root-relative and may be quoted when they contain odd characters.
function statusEntries() {
  if (!IS_REPO()) return [];
  // -z gives NUL-separated records and never quotes or escapes a path, which
  // keeps spaces, quotes and non-ASCII filenames honest. A rename or copy
  // record is followed by a second record holding the old path.
  const records = git('status', '--porcelain', '-z').raw.split('\0').filter(Boolean);
  const out = [];
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const code = rec.slice(0, 2);
    const rel = rec.slice(3);
    if (/^[RC]/.test(code)) i++;                       // skip the paired old path
    if (rel) out.push({ code, file: real(path.resolve(REPO_ROOT, rel)) });
  }
  return out;
}

/* ── SSE ──────────────────────────────────────────────────────────── */
const clients = new Set();
function broadcast(event, data) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) { try { res.write(frame); } catch {} }
}

/* ── validation gate ──────────────────────────────────────────────── */
const VOID_TAGS = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
  'polygon', 'use', 'stop', 'image', 'br', 'hr', 'img', 'input', 'meta', 'link']);

function svgBalanced(svg) {
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(svg))) {
    const [, closing, tag, , selfClose] = m;
    if (selfClose || VOID_TAGS.has(tag)) continue;
    if (closing) {
      if (stack.pop() !== tag) return `unbalanced tag </${tag}>`;
    } else stack.push(tag);
  }
  return stack.length ? `unclosed tag <${stack[stack.length - 1]}>` : null;
}

function parseTimecode(t) {
  const m = String(t ?? '').match(/(-?\d+(?:\.\d+)?)\s*[–—-]\s*(-?\d+(?:\.\d+)?)/);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
}

function validate() {
  const errors = [];
  for (const f of EDITABLE) {
    if (!fs.existsSync(f)) return { ok: false, errors: [`${path.basename(f)} is missing`] };
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) errors.push(`${path.basename(f)} is not valid JavaScript: ${(r.stderr || '').split('\n')[0]}`);
  }
  if (errors.length) return { ok: false, errors };

  const sandbox = { window: {}, console: { log() {}, warn() {}, error() {} } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  try {
    vm.runInContext(fs.readFileSync(P.data, 'utf8'), sandbox, { timeout: 5000, filename: DATA_FILE });
    vm.runInContext(fs.readFileSync(P.art, 'utf8'), sandbox, { timeout: 5000, filename: ART_FILE });
  } catch (e) {
    return { ok: false, errors: [`the plan files threw while loading: ${e.message}`] };
  }

  const PLAN = sandbox.window.PLAN;
  const ART = sandbox.window.PLAN_ART;
  if (!PLAN || !Array.isArray(PLAN.scenes) || !PLAN.scenes.length)
    return { ok: false, errors: ['window.PLAN.scenes is missing or empty'] };
  if (!ART || typeof ART !== 'object')
    return { ok: false, errors: ['window.PLAN_ART is missing'] };

  let prevEnd = null;
  const seen = new Set();
  PLAN.scenes.forEach((s, i) => {
    const where = `scene ${s?.n ?? i + 1}`;
    for (const key of ['id', 'n', 'title', 't']) {
      if (s?.[key] === undefined || s[key] === '') errors.push(`${where} is missing "${key}"`);
    }
    if (s?.id) {
      if (seen.has(s.id)) errors.push(`duplicate scene id "${s.id}"`);
      seen.add(s.id);
    }
    const tc = parseTimecode(s?.t);
    if (!tc) errors.push(`${where} has an unreadable timecode "${s?.t}"`);
    else {
      const [a, b] = tc;
      if (b <= a) errors.push(`${where} ends (${b}) before it starts (${a})`);
      if (prevEnd !== null && a < prevEnd - 0.001)
        errors.push(`${where} starts at ${a} but the previous scene runs to ${prevEnd}`);
      prevEnd = b;
    }
    const draw = ART?.[s?.id];
    if (typeof draw !== 'function') { errors.push(`${where} ("${s?.id}") has no drawing in PLAN_ART`); return; }
    let svg;
    try { svg = draw(); } catch (e) { errors.push(`${where} art threw: ${e.message}`); return; }
    if (typeof svg !== 'string' || !svg.includes('<svg')) { errors.push(`${where} art did not return an <svg> string`); return; }
    const bad = svgBalanced(svg);
    if (bad) errors.push(`${where} art is malformed: ${bad}`);
  });

  const warnings = [];
  if (PLAN.meta?.duration && prevEnd !== null) {
    const declared = parseFloat(PLAN.meta.duration);
    if (Number.isFinite(declared) && Math.abs(declared - prevEnd) > 0.05)
      warnings.push(`scenes run to ${prevEnd}s but meta.duration says ${declared}s`);
  }
  return { ok: !errors.length, errors, warnings };
}

/* ── snapshots (revert fallback when there is no git) ─────────────── */
function snapshot(turnId) {
  const dir = path.join(P.snaps, turnId);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of EDITABLE) if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dir, path.basename(f)));
}
function restoreSnapshot(turnId) {
  const dir = path.join(P.snaps, turnId);
  if (!fs.existsSync(dir)) return false;
  for (const f of EDITABLE) {
    const snap = path.join(dir, path.basename(f));
    if (fs.existsSync(snap)) fs.copyFileSync(snap, f);
  }
  return true;
}

/* ── the worker ───────────────────────────────────────────────────── */
function workerSessionId() {
  if (fs.existsSync(P.session)) return { id: fs.readFileSync(P.session, 'utf8').trim(), fresh: false };
  const id = randomUUID();
  fs.writeFileSync(P.session, id);
  return { id, fresh: true };
}

function guardSettings() {
  return JSON.stringify({
    hooks: {
      PreToolUse: [{
        matcher: 'Edit|Write|MultiEdit|NotebookEdit',
        hooks: [{ type: 'command', command: `${process.execPath} ${path.join(HERE, 'guard.mjs')}` }],
      }],
    },
  });
}

function composePrompt(turn) {
  const tmpl = fs.readFileSync(path.join(HERE, 'worker-prompt.md'), 'utf8');
  return tmpl
    .replaceAll('{{PLAN_DIR}}', PLAN_DIR)
    .replaceAll('{{DATA_FILE}}', P.data)
    .replaceAll('{{ART_FILE}}', P.art)
    .replaceAll('{{TURN_FILE}}', path.join(P.turns, `${turn.id}.json`))
    .replaceAll('{{MESSAGE}}', turn.message);
}

const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

/** Every path this event shows the worker writing to. */
function writeTargets(evt) {
  const out = [];
  try {
    if (evt.type !== 'assistant') return out;
    for (const block of evt.message?.content ?? []) {
      if (block.type !== 'tool_use' || !WRITE_TOOLS.has(block.name)) continue;
      const f = block.input?.file_path ?? block.input?.notebook_path ?? block.input?.path;
      if (f) out.push(real(path.isAbsolute(f) ? f : path.resolve(REPO_ROOT ?? PLAN_DIR, f)));
    }
  } catch {}
  return out;
}

function describeActivity(evt) {
  try {
    if (evt.type === 'assistant') {
      for (const block of evt.message?.content ?? []) {
        if (block.type === 'tool_use') {
          const f = block.input?.file_path || block.input?.pattern || block.input?.path;
          return f ? `${block.name.toLowerCase()} ${path.basename(String(f))}` : block.name.toLowerCase();
        }
        if (block.type === 'text' && block.text?.trim()) return block.text.trim().split('\n')[0].slice(0, 90);
      }
    }
  } catch {}
  return null;
}

function runWorker(turn) {
  return new Promise(resolve => {
    const { id: sid, fresh } = workerSessionId();
    const prompt = composePrompt(turn);
    const args = [
      '-p', prompt,
      '--restricted',
      '--allowedTools', 'Read,Edit,Write,Grep,Glob',
      '--permission-mode', 'acceptEdits',
      '--output-format', 'stream-json', '--verbose',
      '--settings', guardSettings(),
      '--add-dir', PLAN_DIR,
      fresh ? '--session-id' : '--resume', sid,
    ];
    const bin = process.env.PLAN_WORKER_CMD || 'claude';
    const child = spawn(bin, args, {
      cwd: REPO_ROOT ?? PLAN_DIR,
      env: {
        ...process.env,
        // The worker may write the two plan files and its own turn report. Nothing else.
        PLAN_ALLOW_FILES: [...EDITABLE, path.join(P.turns, `${turn.id}.json`)].join(path.delimiter),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let buf = '', stderr = '';
    const touched = new Set();
    child.stdout.on('data', chunk => {
      buf += chunk;
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        let evt; try { evt = JSON.parse(line); } catch { continue; }
        for (const f of writeTargets(evt)) touched.add(f);
        const note = describeActivity(evt);
        if (note) broadcast('activity', { turnId: turn.id, note });
      }
    });
    child.stderr.on('data', d => { stderr += d; });
    child.on('error', e => resolve({ ok: false, touched, stderr: `could not start the worker (${bin}): ${e.message}` }));
    child.on('close', code => resolve({ ok: code === 0, code, touched, stderr: stderr.trim(), sessionId: sid }));
  });
}

/* ── turn pipeline ────────────────────────────────────────────────── */
const queue = [];
let busy = false;

function enqueue(message) {
  const turn = { id: `t${Date.now().toString(36)}`, message, at: new Date().toISOString() };
  appendJsonl(P.history, { role: 'user', ...turn });
  queue.push(turn);
  broadcast('queued', turn);
  pump();
  return turn;
}

async function pump() {
  if (busy || !queue.length) return;
  busy = true;
  const turn = queue.shift();
  try { await runTurn(turn); }
  catch (e) { fail(turn, `the bridge itself fell over: ${e.message}`); }
  busy = false;
  if (queue.length) pump();
}

function fail(turn, reason, detail) {
  const entry = { role: 'assistant', turnId: turn.id, at: new Date().toISOString(), ok: false, summary: reason, detail: detail ?? null };
  appendJsonl(P.history, entry);
  broadcast('failed', entry);
}

async function runTurn(turn) {
  broadcast('working', { turnId: turn.id, note: 'thinking' });
  snapshot(turn.id);

  const run = await runWorker(turn);
  if (!run.ok) {
    restoreSnapshot(turn.id);
    return fail(turn, 'The worker could not finish that one.', run.stderr || `exit code ${run.code}`);
  }

  broadcast('working', { turnId: turn.id, note: 'checking the plan still holds' });

  // Backstop. The guard hook should already have refused these, but the hook is
  // configuration and configuration drifts. Attribution comes from the worker's
  // own tool stream rather than from a working-tree diff: someone editing this
  // repo in another window while a turn runs must not poison the turn.
  const strays = [...run.touched].filter(f =>
    !EDITABLE.includes(f) && !f.startsWith(P.state + path.sep));
  if (strays.length) {
    if (IS_REPO()) {
      const byPath = new Map(statusEntries().map(e => [e.file, e.code]));
      for (const f of strays) {
        if (byPath.get(f) === '??') { try { fs.rmSync(f, { recursive: true, force: true }); } catch {} }
        else if (byPath.has(f)) git('checkout', '--', f);
      }
    }
    restoreSnapshot(turn.id);
    return fail(turn, 'That edit reached outside the plan data and art, so I put everything back.',
      strays.map(f => path.relative(REPO_ROOT ?? PLAN_DIR, f)).join(', '));
  }

  const check = validate();
  if (!check.ok) {
    restoreSnapshot(turn.id);
    return fail(turn, 'That change broke the plan, so I reverted it.', check.errors.join('; '));
  }

  const turnFile = path.join(P.turns, `${turn.id}.json`);
  let report = { summary: 'Updated the plan.', changes: [] };
  if (fs.existsSync(turnFile)) {
    try { report = { ...report, ...JSON.parse(fs.readFileSync(turnFile, 'utf8')) }; } catch {}
  }

  const dirty = EDITABLE.some(f => !fs.existsSync(path.join(P.snaps, turn.id, path.basename(f)))
    || fs.readFileSync(f, 'utf8') !== fs.readFileSync(path.join(P.snaps, turn.id, path.basename(f)), 'utf8'));

  let sha = null;
  if (dirty && IS_REPO()) {
    broadcast('working', { turnId: turn.id, note: 'committing' });
    const msg = `plan: ${subject(report.summary)}\n\nPlan-Turn: ${turn.id}`;
    const c = git('commit', '-m', msg, '--', P.data, P.art);
    if (c.ok) sha = git('rev-parse', 'HEAD').out;
    else broadcast('activity', { turnId: turn.id, note: `edit kept, but the commit failed: ${(c.err || '').split('\n')[0]}` });
  }

  const entry = {
    role: 'assistant', turnId: turn.id, at: new Date().toISOString(), ok: true,
    summary: report.summary, changes: report.changes ?? [],
    warnings: check.warnings ?? [], sha, changed: dirty,
  };
  appendJsonl(P.history, entry);
  if (dirty) appendJsonl(P.changelog, entry);
  broadcast('done', entry);
}

/** A commit subject: one line, <= 68 chars, never cut mid-word. */
function subject(summary) {
  const line = String(summary).split('\n')[0].trim();
  if (line.length <= 68) return line;
  const cut = line.slice(0, 68);
  const space = cut.lastIndexOf(' ');
  return (space > 40 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, '') + '\u2026';
}

function revertTurn(turnId) {
  const entry = readJsonl(P.changelog).find(e => e.turnId === turnId);
  if (!entry) return { ok: false, reason: 'I have no record of that turn.' };

  if (entry.sha && IS_REPO()) {
    const r = git('revert', '--no-edit', entry.sha);
    if (!r.ok) {
      git('revert', '--abort');
      return { ok: false, reason: 'Later edits overlap that one, so it will not lift out cleanly. Ask in the chat to change it back instead.' };
    }
  } else if (!restoreSnapshot(turnId)) {
    return { ok: false, reason: 'That turn has no snapshot left to restore.' };
  }

  const check = validate();
  if (!check.ok) return { ok: false, reason: `undoing that left the plan invalid: ${check.errors.join('; ')}` };
  appendJsonl(P.history, { role: 'assistant', turnId: `${turnId}-revert`, at: new Date().toISOString(), ok: true, summary: `Undid: ${entry.summary}`, changes: [], reverted: turnId });
  broadcast('reverted', { turnId });
  return { ok: true };
}

/* ── http ─────────────────────────────────────────────────────────── */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };

const sendJson = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
};

function serveFile(res, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

function readBody(req) {
  return new Promise(resolve => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname === '/__plan/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write(': open\n\n');
    clients.add(res);
    const beat = setInterval(() => { try { res.write(': beat\n\n'); } catch {} }, 20000);
    req.on('close', () => { clearInterval(beat); clients.delete(res); });
    return;
  }

  if (pathname === '/__plan/state') {
    return sendJson(res, 200, {
      history: readJsonl(P.history), changelog: readJsonl(P.changelog),
      busy: busy || queue.length > 0, git: IS_REPO(),
    });
  }

  if (pathname === '/__plan/chat' && req.method === 'POST') {
    const { message } = await readBody(req);
    if (!message || !String(message).trim()) return sendJson(res, 400, { error: 'empty message' });
    return sendJson(res, 200, enqueue(String(message).trim()));
  }

  if (pathname === '/__plan/revert' && req.method === 'POST') {
    const { turnId } = await readBody(req);
    const r = revertTurn(turnId);
    return sendJson(res, r.ok ? 200 : 409, r);
  }

  if (pathname.startsWith('/__plan/')) {
    const name = path.basename(pathname);
    if (!['chat.js', 'chat.css'].includes(name)) { res.writeHead(404); return res.end('not found'); }
    return serveFile(res, path.join(HERE, name));
  }

  const rel = pathname === '/' ? HTML_FILE : decodeURIComponent(pathname).replace(/^\/+/, '');
  const file = path.resolve(PLAN_DIR, rel);
  if (!file.startsWith(PLAN_DIR + path.sep) && file !== PLAN_DIR) { res.writeHead(403); return res.end('forbidden'); }
  serveFile(res, file);
});

/* ── boot ─────────────────────────────────────────────────────────── */
function listen(port) {
  return new Promise((resolve, reject) => {
    server.once('error', e => e.code === 'EADDRINUSE' ? resolve(listen(port + 1)) : reject(e));
    server.listen(port, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function main() {
  if (!fs.existsSync(P.html)) {
    console.error(`No ${HTML_FILE} in ${PLAN_DIR}. Point --dir at the folder holding the plan.`);
    process.exit(1);
  }
  ensureState();
  const check = validate();
  if (!check.ok) console.error(`! the plan does not currently validate:\n  - ${check.errors.join('\n  - ')}`);
  const port = await listen(parseInt(flag('port', '4173'), 10));
  const at = `http://localhost:${port}/`;
  console.log(`  plan   ${PLAN_DIR}`);
  console.log(`  open   ${at}`);
  console.log(`  chat   ${process.env.PLAN_WORKER_CMD || 'claude'} · ${IS_REPO() ? 'commits on' : 'no git, snapshots only'}`);
  if (!NO_OPEN && os.platform() === 'darwin') spawnSync('open', [at]);
}

if (SELFTEST) {
  const { selftest } = await import(path.join(HERE, 'selftest.mjs'));
  await selftest({ live: SELFTEST === 'live', serverPath: path.join(HERE, 'plan.server.mjs') });
} else {
  main();
}
