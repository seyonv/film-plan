# The page contract

Three files. The split is not tidiness — it is what lets the chat worker change
the plan without being able to break the page.

| File | Holds | Who edits it |
|---|---|---|
| `plan.data.js` | `window.PLAN` — words and numbers | you, and the chat worker |
| `plan.art.js` | `window.PLAN_ART` — the drawn frames | you, and the chat worker |
| `plan.html` | tokens, CSS, renderer | **you only**; the worker is refused |

## `window.PLAN`

```js
window.PLAN = {
  meta:  { title, eyebrow, deck, duration, facts:[{text, hot?}] },
  acts:  [{ after, name, time, note }],
  scenes:[{ id, n, t, dur, title, plate, status, artCap, what, beats, narr, why, silent? }],
  plates:{ <key>: { label } },
};
```

**meta** — `deck` is the one paragraph that says what the film is; write it
last, when you know. `facts` are the hard constraints (runtime, format, frame
rate); `hot: true` marks the one or two that actually constrain the work.
`duration` must equal the last scene's out-point.

**acts** — `after` is how many scenes precede the band, so `after: 0` sits
above scene 1 and `after: 2` sits between scenes 2 and 3.

**scenes** — the spine of the page.

| Field | Means |
|---|---|
| `id` | unique, kebab-case, stable. Keys into `PLAN_ART`, and the chat uses it to mark what changed. **Do not renumber ids when scenes move.** |
| `n` | display number. This one does renumber. |
| `t` | `'12.0 – 16.5'`, in seconds, en dash. Scenes run back to back. |
| `dur` | `'4.5 s'`, human-facing, must agree with `t`. |
| `plate` | which visual register — a key of `plates`. Drives the badge and the scrubber colour. |
| `status` | `['new'\|'keep'\|'redo', 'free text']`. The honest build state. |
| `artCap` | one line under the frame, for whoever draws it for real. |
| `what` | what the audience sees, present tense, concrete nouns. HTML allowed. |
| `beats` | `[['12.4', 'what happens']]` — the moments, on the frame they land. |
| `narr` | `[['12.6', 'the line as spoken']]`. Empty plus `silent: true` means the picture carries it. |
| `why` | why the scene survives the cut. HTML allowed. The plan's conscience. |

## `window.PLAN_ART`

A map from scene `id` to a function returning an SVG string, drawn on the real
film frame. See `art-direction.md`.

## What the gate enforces

Every turn is checked before it lands. A failure rolls the whole turn back.

- both files parse as JavaScript, and load without throwing
- `PLAN.scenes` is a non-empty array; `PLAN_ART` is an object
- every scene has `id`, `n`, `title`, `t`, and ids are unique
- every `t` parses, ends after it starts, and starts no earlier than the
  previous scene ends
- every scene id resolves to a function in `PLAN_ART` that returns a string
  containing a balanced `<svg>`
- nothing outside the two files moved in the working tree

A mismatch between `meta.duration` and the last out-point is reported as a
warning, not a failure — mid-restructure it is usually true and temporary.

## The two rules `plan.html` must keep

Restyle everything else freely. These two are what the chat rail binds to:

1. **`window.renderPlan()`** rebuilds the page from `window.PLAN` and
   `window.PLAN_ART`, and is safe to call again at any time. The rail calls it
   after every accepted edit so the page updates without a reload and without
   losing your scroll position. Without it the rail falls back to reloading.
2. **`data-scene-id="<id>"`** on each scene element, so a change can be marked
   where it happened.

Keep the eight tokens on `:root` — `--paper --card --sunk --ink --ink-2
--ink-3 --rule --accent` — and the rail dresses itself to match. Optionally
`--pc-serif`, `--pc-sans`, `--pc-mono` to hand it your type.

## The anatomy of the page

Top to bottom, and it is worth keeping the order:

1. **Sticky ribbon** with the **scrubber strip** — one cell per scene, width
   proportional to duration, coloured by register. The film's rhythm as a
   picture, and the fastest way to see that act III is bloated.
2. **Masthead** — eyebrow, title, deck, hard facts.
3. **Act bands** — the spine, stated between scenes.
4. **Scene cards** — drawn frame on the left, and on the right: what the
   audience sees, the narration against its timecode, the beats on the grid,
   and why it earns its place.
5. **The narration script**, derived from the scenes, never written twice.
6. **A status table** — every scene and its honest build state.

Everything after the scene cards is derived from the same data. Nothing in this
page should ever be written in two places.
