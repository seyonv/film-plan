# Drawing the storyboard

The frames are drawn in code, as SVG strings on the real film frame. A
1080×1920 film gets `viewBox="0 0 1080 1920"`, so a composition that reads in
the plan is a composition you can actually shoot.

Drawing them procedurally is not a clever trick, it buys three things:

- **Consistency for free.** One `figure()` helper used in nine scenes makes
  nine frames that look like one film. Nine hand-drawn frames do not.
- **Re-timing is an edit to a number**, not a redraw.
- **The chat can change them.** A worker composing from named helpers produces
  something coherent. A worker writing raw SVG produces mush.

## Structure, always

```js
/* 1. palette — a handful of named colours, and no others */
const W = 1080, H = 1920;
const PAPER = '#F0E6CF', DARK = '#0B1230', INK = '#2A1C13', ACCENT = '#FF3D98';

/* 2. helpers — the drawing vocabulary of THIS film */
const frame = (inner, bg = PAPER) => `<svg viewBox="0 0 ${W} ${H}">…</svg>`;
const figure = (x, y, h) => `…`;

/* 3. the frames */
window.PLAN_ART = {
  'cold-open': () => frame(`${ground(1320)}${figure(540, 1320, 620)}`),
};
```

The palette is a closed set. If a frame needs a colour that is not in it,
either the palette is wrong or the frame is.

## Choosing a motif

The motif is the visual idiom the frames are drawn in. It should rhyme with the
film without pretending to be the film — a storyboard frame that tries to look
like a finished shot is a lie about how finished you are.

Some that carry a whole plan:

- **Field-guide plate** — line on warm paper, specimens labelled, a caption
  strip. Good for anything taxonomic, natural-historical, or wry.
- **Blueprint** — pale line on deep navy, measured, annotated, clinical. Good
  for a diagram register, and it cuts beautifully against a warm plate.
- **Silhouette and ground** — flat shapes, one accent. Good when the film is
  about movement and staging rather than detail.
- **Contact sheet** — frames as sprocketed strips. Good for a film that is
  really about editing.

Pick **two or three registers**, not one. A film that cuts between a world and
a diagram of that world is legible in a way a single register never is, and the
scrubber strip turns that cutting into a visible rhythm before anyone reads a
word. Give each register a `plate` key, a colour, and a badge.

## Helpers worth having

Most films want some version of:

- `frame(inner, bg)` — the frame itself. Everything returns through it.
- `safe()` — the safe area. On vertical video, where a caption can sit without
  a phone's UI eating it.
- one **subject** helper, parameterised by position, size and state — the
  figure, the animal, the product, the typeface.
- `caption(text)` — the film's lower third, drawn the way it will be.
- a **register-specific gesture** — `measure()` for a blueprint, `stripes()`
  for a paper plate. One gesture per register is usually enough.

Parameterise state rather than duplicating: `figure(x, y, h, 'running')` beats
`runningFigure()`, because state is how a frame shows a beat.

## Rules

1. **Compose from helpers.** New idioms only when the film genuinely changes.
2. **Balanced tags.** The gate checks; an unclosed `<g>` fails the turn.
3. **Every scene id has a drawing.** Add a scene, draw it.
4. **No external images.** Self-contained, or the plan stops working the day
   someone opens it on a plane.
5. **Draw the beat, not the scene.** Pick the one frame that shows why the
   scene exists — usually the moment of change, not the establishing shot.

## How much detail

Enough to argue about staging, not enough to argue about style. If you are
choosing a shade of grey you have gone too far; if you cannot tell where the
subject is in the frame, not far enough.
