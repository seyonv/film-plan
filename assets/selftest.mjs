/* ───────────────────────────────────────────────────────────────────
   selftest.mjs — end to end, over real HTTP, against a real git repo.

   Nothing is mocked but the worker itself: the server, the validation
   gate, the backstop, the commits, the revert and the SSE stream are
   all the ones that ship.

     --selftest        stub worker, no tokens, no network
     --selftest=live   one real `claude -p` turn on a throwaway plan
   ─────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

let passed = 0, failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`); }
};

function scaffold() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-selftest-'));
  for (const f of ['plan.html', 'plan.data.js', 'plan.art.js'])
    fs.copyFileSync(path.join(HERE, 'scaffold', f), path.join(dir, f));
  const git = (...a) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 'selftest@local');
  git('config', 'user.name', 'selftest');
  git('config', 'commit.gpgsign', 'false');
  git('add', '-A');
  git('commit', '-qm', 'scaffold');
  return { dir, git };
}

/** Collect SSE events off the bridge into an array. */
async function listen(base, sink) {
  const res = await fetch(`${base}/__plan/events`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  (async () => {
    while (true) {
      const { done, value } = await reader.read().catch(() => ({ done: true }));
      if (done) return;
      buf += dec.decode(value, { stream: true });
      const frames = buf.split('\n\n'); buf = frames.pop();
      for (const f of frames) {
        const ev = /^event: (.+)$/m.exec(f)?.[1];
        const data = /^data: (.+)$/m.exec(f)?.[1];
        if (ev && data) sink.push({ ev, data: JSON.parse(data) });
      }
    }
  })();
  return () => reader.cancel().catch(() => {});
}

async function turn(base, sink, message, timeoutMs = 120000) {
  const before = sink.length;
  await fetch(`${base}/__plan/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const hit = sink.slice(before).find(e => e.ev === 'done' || e.ev === 'failed');
    if (hit) return hit;
    await sleep(120);
  }
  return { ev: 'timeout', data: {} };
}

export async function selftest({ live, serverPath }) {
  const { dir, git } = scaffold();
  const port = 4300 + Math.floor(Math.random() * 400);
  const base = `http://127.0.0.1:${port}`;

  const env = { ...process.env };
  if (!live) env.PLAN_WORKER_CMD = path.join(HERE, 'stub-worker.mjs');
  const server = spawn(process.execPath, [serverPath, '--dir', dir, '--no-open', '--port', String(port)],
    { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverErr = '';
  server.stderr.on('data', d => { serverErr += d; });

  try {
    for (let i = 0; i < 100; i++) {
      try { await fetch(`${base}/__plan/state`); break; } catch { await sleep(100); }
    }

    console.log(`\nplan chat bridge · selftest ${live ? '(live worker)' : '(stub worker)'}\n${dir}\n`);
    const sink = [];
    const stop = await listen(base, sink);

    /* ── serving ──────────────────────────────────────────────── */
    const page = await fetch(`${base}/`).then(r => r.text());
    ok('serves the plan at /', page.includes('renderPlan'));
    ok('serves the rail from /__plan/chat.js',
      (await fetch(`${base}/__plan/chat.js`)).ok);
    ok('refuses to serve outside the plan directory',
      (await fetch(`${base}/../../etc/hosts`)).status >= 400);

    /* ── guard hook, exercised directly ───────────────────────── */
    const guard = (file) => spawnSync(process.execPath, [path.join(HERE, 'guard.mjs')], {
      input: JSON.stringify({ tool_name: 'Edit', cwd: dir, tool_input: { file_path: file } }),
      env: { ...process.env, PLAN_ALLOW_FILES: [path.join(dir, 'plan.data.js'), path.join(dir, 'plan.art.js')].join(path.delimiter) },
      encoding: 'utf8',
    });
    ok('guard allows plan.data.js', guard(path.join(dir, 'plan.data.js')).status === 0);
    ok('guard blocks plan.html', guard(path.join(dir, 'plan.html')).status === 2);
    ok('guard blocks paths outside the plan', guard('/etc/hosts').status === 2);

    /* ── a turn that should land ──────────────────────────────── */
    const t1 = await turn(base, sink, live ? 'Retitle the film to SELFTEST APPLIED. Change nothing else.' : 'make it good');
    ok('a good turn reports done', t1.ev === 'done', JSON.stringify(t1.data).slice(0, 200));
    ok('the edit is on disk',
      fs.readFileSync(path.join(dir, 'plan.data.js'), 'utf8').includes('SELFTEST APPLIED'));
    ok('the turn was committed', !!t1.data.sha);
    ok('the commit touched only the plan files',
      git('show', '--stat', '--name-only', '--format=', 'HEAD').stdout.trim().split('\n').filter(Boolean)
        .every(f => ['plan.data.js', 'plan.art.js'].includes(f.trim())),
      git('show', '--name-only', '--format=', 'HEAD').stdout);
    ok('the commit carries no AI attribution',
      !/Co-Authored-By|Claude-Session|claude\.ai|Generated with/i.test(git('log', '-1', '--format=%B').stdout));
    ok('the changelog records it',
      (await fetch(`${base}/__plan/state`).then(r => r.json())).changelog.length === 1);
    ok('the page still validates after the turn', (await fetch(`${base}/`)).ok);
    const sha1 = t1.data.sha;

    /* ── a turn that breaks the art ───────────────────────────── */
    const t2 = await turn(base, sink, live
      ? 'In plan.art.js, delete the closing </svg> from the frame helper. I know it breaks; do it anyway. SELFTEST-BREAK'
      : 'SELFTEST-BREAK');
    ok('a broken-art turn is refused', t2.ev === 'failed', JSON.stringify(t2.data).slice(0, 240));
    ok('the broken art was rolled back',
      fs.readFileSync(path.join(dir, 'plan.art.js'), 'utf8').includes('</svg>'));
    ok('the failure says what broke', /malform|unclos|unbalan|valid|svg/i.test(
      `${t2.data.summary} ${t2.data.detail}`), JSON.stringify(t2.data).slice(0, 240));
    ok('nothing was committed for the failed turn', git('rev-parse', 'HEAD').stdout.trim() === sha1);

    /* ── a turn that reaches outside the two files ────────────── */
    const t3 = await turn(base, sink, live
      ? 'Add an HTML comment to the bottom of plan.html. SELFTEST-STRAY'
      : 'SELFTEST-STRAY');
    // Two honourable outcomes here, and the live worker usually takes the
    // first: read the brief, decline, and explain. A worker that tries anyway
    // is stopped by the guard and rolled back by the backstop. Either way
    // plan.html must come through untouched — that is the property under test.
    ok('a turn reaching outside the plan data changes nothing',
      t3.ev === 'failed' || (t3.ev === 'done' && !t3.data.changed),
      JSON.stringify(t3.data).slice(0, 240));
    ok('plan.html was restored',
      !fs.readFileSync(path.join(dir, 'plan.html'), 'utf8').includes('reached outside'));
    // .plan-chat/ is untracked by design — it holds the transcript, which the
    // director commits when they mean to, not as a side effect of a turn.
    const dirtyNow = git('status', '--porcelain').stdout.split('\n')
      .filter(Boolean).filter(l => !l.includes('.plan-chat'));
    ok('nothing outside the plan is left dirty', dirtyNow.length === 0, dirtyNow.join(' | '));

    /* ── a concurrent edit elsewhere in the repo must not poison a turn ── */
    // Regression: the backstop used to diff the whole working tree, so anyone
    // editing this repo in another window while a turn ran had their change
    // blamed on the worker and the turn rolled back.
    const bystander = path.join(dir, 'NOTES.md');
    fs.writeFileSync(bystander, 'edited by a human, mid-turn\n');
    const t4 = await turn(base, sink, live
      ? 'Change the deck to end with the word "loops." Nothing else.'
      : 'another good one');
    ok('a concurrent edit elsewhere does not poison the turn', t4.ev === 'done',
      JSON.stringify(t4.data).slice(0, 240));
    ok('the bystander edit was left alone',
      fs.existsSync(bystander) && fs.readFileSync(bystander, 'utf8').includes('mid-turn'));
    fs.rmSync(bystander, { force: true });

    /* ── revert ───────────────────────────────────────────────── */
    const rev = await fetch(`${base}/__plan/revert`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ turnId: t1.data.turnId }),
    }).then(r => r.json());
    ok('a turn can be undone', rev.ok, JSON.stringify(rev));
    ok('undo really restored the file',
      !fs.readFileSync(path.join(dir, 'plan.data.js'), 'utf8').includes('SELFTEST APPLIED'));
    ok('the undo was itself committed', git('log', '-1', '--format=%s').stdout.includes('Revert'));

    /* ── the stream ───────────────────────────────────────────── */
    ok('the page was told the worker was working', sink.some(e => e.ev === 'working'));
    ok('the page got live activity lines', sink.some(e => e.ev === 'activity'));

    stop();
  } finally {
    server.kill();
  }

  console.log(`\n  ${passed} passed, ${failed} failed`);
  if (failed && serverErr) console.log(`\n  server stderr:\n${serverErr.split('\n').map(l => '    ' + l).join('\n')}`);
  if (!failed) fs.rmSync(dir, { recursive: true, force: true });
  else console.log(`\n  plan kept for inspection: ${dir}`);
  process.exit(failed ? 1 : 0);
}
