# The chat bridge

The director reads the plan in a browser and types into a rail on the right.
A headless Claude Code worker makes the change. The page updates itself.

```
page ──POST /__plan/chat──▶ server ──claude -p──▶ worker
                              │                     │ edits plan.data.js
                              │                     │ edits plan.art.js
                              │                     │ writes turn report
                              │◀────────────────────┘
                              │ validate → commit → SSE
page ◀──────events───────────┘  re-render, mark what changed, notify
```

## Running it

```bash
docs/plan.sh                       # serve with the rail, open the browser
docs/plan.sh --port 4200 --no-open
node …/assets/plan.server.mjs --dir docs   # the same thing, longhand
```

Boot validates the plan and prints anything wrong. `file://` still reads the
page perfectly; the rail simply is not there.

## What a turn does

1. Snapshot both plan files.
2. Spawn the worker: `claude -p` with `--restricted` (no Bash, no shell),
   `--allowedTools Read,Edit,Write,Grep,Glob`, `--permission-mode acceptEdits`,
   and a `PreToolUse` hook (`guard.mjs`) that refuses any write outside the two
   plan files and the worker's own turn report.
3. Stream the worker's tool calls to the page as the live status line.
4. **Backstop** — if the worker's own tool stream shows it writing anywhere
   outside the two files, that write is undone and the turn fails. The hook is
   configuration and configuration drifts, so this is the second line.
   Attribution comes from the stream rather than from a working-tree diff, so
   editing the repo in another window while a turn runs does not poison it.
5. **Gate** — the checks in `anatomy.md`. Any failure restores the snapshot.
6. **Commit** — the server commits, not the worker, and only those two files,
   with a `Plan-Turn: <id>` trailer and no attribution lines.
7. Broadcast `done` with the worker's summary and its list of changes.

One turn at a time. Messages sent during a turn queue behind it.

**The worker is one continuing conversation**, not a series of one-shots: the
session id is kept in `.plan-chat/session-id` and resumed every turn, so *"now
do the same to scene 7"* works. Delete that file to start it fresh.

## Failure is a message, not a crash

A turn that breaks the plan never reaches the page. It is rolled back and comes
back as the assistant's own turn in the transcript — *"That change broke the
plan, so I reverted it: scene 4 art is malformed: unclosed tag `<g>`."*
The director sees a sentence, not a broken page.

## Undo

Each accepted turn has an **Undo this** in the Changes tab. With git, that is a
real `git revert` of that turn's commit. If later turns overlap it, the undo is
refused with a reason rather than fought — ask in the chat instead. Without
git, snapshots cover the most recent turn only.

## `.plan-chat/`

| | |
|---|---|
| `history.jsonl` | the transcript, both sides |
| `changelog.jsonl` | accepted turns, with their commit shas |
| `session-id` | the worker's continuing session |
| `turns/`, `snapshots/` | per-turn reports and rollback copies (gitignored) |

Commit `history.jsonl` and `changelog.jsonl` if you want the reasoning to
survive alongside the film. They are often the best record of why the plan is
the way it is.

## When something goes wrong

| Symptom | Cause |
|---|---|
| rail says `offline` | the server is not running, or you opened the file directly |
| rail says `reconnecting` | the server died; the page recovers on its own when it returns |
| every turn fails the gate | the plan was already invalid — run the server and read the boot output |
| worker will not start | `claude` is not on the server's `PATH` |
| turn does nothing, summary explains why | working as intended: the worker read its brief and declined |
| a turn was refused for touching a file you edited | you edited it *through the worker*; your own concurrent edits elsewhere are ignored |
| commit failed but the edit stuck | git refused — no identity, or a pre-commit hook. The rail says so |

Set `PLAN_WORKER_CMD` to point the bridge at something other than `claude` —
that is how `--selftest` runs the whole pipeline without spending a token.

## Tests

```bash
node …/assets/plan.server.mjs --selftest        # stub worker, free, ~3s
node …/assets/plan.server.mjs --selftest=live   # real worker, real tokens
```

Both build a throwaway plan in a real git repo and drive the real server over
real HTTP: serving, the guard, a good turn, a turn that breaks the art, a turn
that reaches outside its remit, commits, undo, and the event stream.
