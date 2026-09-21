#!/usr/bin/env node
/**
 * guard.mjs — PreToolUse hook for the plan chat worker.
 *
 * The worker is allowed to touch the plan's data file, its art file, and its
 * own turn report. Every other write is refused, with a reason the worker can
 * read and act on. Exit 2 is the "block and tell the model why" contract.
 *
 * The allowlist arrives as PLAN_ALLOW_FILES, path-delimiter separated.
 */
import fs from 'node:fs';
import path from 'node:path';

const real = p => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };

const allow = new Set((process.env.PLAN_ALLOW_FILES ?? '')
  .split(path.delimiter).filter(Boolean).map(real));

let raw = '';
process.stdin.on('data', c => { raw += c; });
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(raw || '{}'); } catch { process.exit(0); }

  const target = ev.tool_input?.file_path ?? ev.tool_input?.notebook_path ?? ev.tool_input?.path;
  if (!target) process.exit(0);

  const resolved = real(path.isAbsolute(target) ? target : path.join(ev.cwd ?? process.cwd(), target));
  if (allow.has(resolved)) process.exit(0);

  const names = [...allow].map(f => path.basename(f)).join(', ');
  process.stderr.write(
    `Refused: ${path.basename(resolved)} is not yours to edit. This turn may only write ${names}. ` +
    `If the change you want needs anything else, do not attempt it — explain in your turn report why it cannot be done from here.\n`
  );
  process.exit(2);
});
