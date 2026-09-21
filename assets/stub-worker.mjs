#!/usr/bin/env node
/* stub-worker.mjs — stands in for `claude -p` during --selftest.
   Reads the composed prompt out of argv, decides what to do from a
   keyword in the director's note, and speaks the same stream-json the
   real CLI does. Costs nothing, exercises everything. */
import fs from 'node:fs';
import path from 'node:path';

const prompt = process.argv[process.argv.indexOf('-p') + 1] ?? '';
const [data, art, turnFile] = (process.env.PLAN_ALLOW_FILES ?? '').split(path.delimiter);
const emit = o => process.stdout.write(JSON.stringify(o) + '\n');
const tool = (name, file) => emit({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input: { file_path: file } }] } });

tool('Read', data);

if (prompt.includes('SELFTEST-BREAK')) {
  tool('Edit', art);
  fs.writeFileSync(art, fs.readFileSync(art, 'utf8').replace('</svg>', '<g>'));
  fs.writeFileSync(turnFile, JSON.stringify({ summary: 'Redrew the frame.', changes: [{ scene: 'cold-open', field: 'art', note: 'redrew' }] }));
} else if (prompt.includes('SELFTEST-STRAY')) {
  const html = path.join(path.dirname(data), 'plan.html');
  fs.writeFileSync(html, fs.readFileSync(html, 'utf8') + '\n<!-- reached outside -->\n');
  fs.writeFileSync(turnFile, JSON.stringify({ summary: 'Restyled the page.', changes: [] }));
} else {
  tool('Edit', data);
  fs.writeFileSync(data, fs.readFileSync(data, 'utf8').replace("title: 'Working Title'", "title: 'SELFTEST APPLIED'"));
  fs.writeFileSync(turnFile, JSON.stringify({
    summary: 'Retitled the film.',
    changes: [{ scene: 'cold-open', field: 'title', note: 'Working Title → SELFTEST APPLIED' }],
  }));
}
emit({ type: 'result', subtype: 'success', is_error: false });
