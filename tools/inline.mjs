#!/usr/bin/env node
/**
 * inline.mjs — fuse the three plan files into one self-contained HTML.
 *
 * The split exists so the chat worker can edit data and art without ever
 * touching layout. Nobody you send the plan to cares about that, so this
 * puts it back together into a single file that opens off a desktop with
 * no server, no network, and no chat rail.
 *
 *   node inline.mjs --dir docs [--out docs/plan.shared.html]
 */
import fs from 'node:fs';
import path from 'node:path';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const dir = path.resolve(arg('dir', process.cwd()));
const out = path.resolve(arg('out', path.join(dir, 'plan.shared.html')));
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');

let html = read('plan.html');
for (const f of ['plan.data.js', 'plan.art.js']) {
  const tag = new RegExp(`<script src="${f.replace(/\./g, '\\.')}"></script>`);
  if (!tag.test(html)) { console.error(`! ${f} is not linked from plan.html; nothing to inline`); process.exit(1); }
  html = html.replace(tag, `<script>\n${read(f)}\n</script>`);
}

// The rail only ever exists when the bridge serves the page. A shared copy is
// read-only by definition, so the loader comes out entirely.
html = html.replace(/if \(location\.protocol\.startsWith\('http'\)\) \{[\s\S]*?\n\}/,
  "document.body.insertAdjacentHTML('beforeend', '<div id=\"pc-offline\">read-only copy</div>');");

fs.writeFileSync(out, html);
console.log(`${path.relative(process.cwd(), out)}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, self-contained`);
