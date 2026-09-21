/* ───────────────────────────────────────────────────────────────────
   plan.art.js — the storyboard frames, drawn in code.

   Every frame is an SVG string on the real film frame (here 1080×1920,
   so the compositions in the plan are the compositions you shoot). The
   value of drawing them procedurally is that a helper like `figure()`
   is the same figure in every scene — the plan stays consistent for
   free, and a re-time is an edit to one number.

   Structure, always:
     1. palette        a handful of named colours, and no others
     2. helpers        the drawing vocabulary of THIS film
     3. PLAN_ART       scene id -> () => svg string

   The chat worker may edit this file. Rule 4 of its brief is that it
   composes from the helpers rather than inventing new idioms, which is
   what keeps a chat-edited storyboard from drifting into mush.
   ─────────────────────────────────────────────────────────────────── */

/* ── 1. palette ─────────────────────────────────────────────────── */
const W = 1080, H = 1920;
const PAPER = '#F0E6CF', DARK = '#0B1230';
const INK = '#2A1C13', LINE = '#C9A86A', ACCENT = '#FF3D98';

/* ── 2. helpers ─────────────────────────────────────────────────── */

/** The frame itself. Everything returns through here. */
const frame = (inner, bg = PAPER) =>
  `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="storyboard frame">
     <rect width="${W}" height="${H}" fill="${bg}"/>${inner}</svg>`;

/** Safe-area guides — where a caption can sit without a phone UI eating it. */
const safe = () =>
  `<rect x="60" y="240" width="${W - 120}" height="${H - 480}" fill="none"
         stroke="rgba(42,28,19,.14)" stroke-width="3" stroke-dasharray="14 12"/>`;

/** A figure at (x, y) with a given height. One function, every scene. */
const figure = (x, y, h = 560, fill = 'none') => {
  const u = h / 8;
  return `<g stroke="${INK}" stroke-width="${Math.max(4, u * .16)}" fill="${fill}"
             stroke-linecap="round" stroke-linejoin="round">
    <circle cx="${x}" cy="${y - u * 7}" r="${u}"/>
    <path d="M${x} ${y - u * 6} L${x} ${y - u * 2.6}"/>
    <path d="M${x - u * 1.5} ${y - u * 5} L${x} ${y - u * 4.4} L${x + u * 1.5} ${y - u * 5}"/>
    <path d="M${x} ${y - u * 2.6} L${x - u * 1.1} ${y} M${x} ${y - u * 2.6} L${x + u * 1.1} ${y}"/>
  </g>`;
};

/** The caption plate along the bottom — the film's lower third. */
const caption = (text, y = H - 280) =>
  `<g><rect x="60" y="${y}" width="${W - 120}" height="150" fill="${INK}" opacity=".86"/>
     <text x="${W / 2}" y="${y + 96}" text-anchor="middle" fill="${PAPER}"
           font-family="monospace" font-size="62" letter-spacing="2">${text}</text></g>`;

/** A measured call-out: the diagram register's one gesture. */
const measure = (x1, y1, x2, y2, label) =>
  `<g stroke="${LINE}" stroke-width="5" fill="none">
     <path d="M${x1} ${y1} L${x2} ${y2}"/>
     <circle cx="${x1}" cy="${y1}" r="11" fill="${LINE}"/>
     <circle cx="${x2}" cy="${y2}" r="11" fill="${LINE}"/>
   </g>
   <text x="${(x1 + x2) / 2 + 26}" y="${(y1 + y2) / 2}" fill="${LINE}"
         font-family="monospace" font-size="46">${label}</text>`;

/** Horizon / ground plane. */
const ground = (y, fill = 'rgba(42,28,19,.10)') =>
  `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${fill}"/>`;

/* ── 3. the frames ──────────────────────────────────────────────── */
/* One entry per scene id in window.PLAN.scenes. The gate fails the turn
   if a scene has no drawing, so adding a scene means drawing it. */
window.PLAN_ART = {

  'cold-open': () => frame(`
    ${ground(1320)}
    ${safe()}
    ${figure(540, 1320, 620)}
    ${caption('the cold open')}
  `),

  'the-claim': () => frame(`
    ${figure(400, 1240, 560)}
    ${measure(400, 620, 400, 1240, 'h')}
    ${measure(400, 1240, 820, 1240, 'w')}
    <circle cx="400" cy="620" r="18" fill="${ACCENT}"/>
    ${caption('the claim')}
  `, DARK),

  'the-turn': () => frame(`
    ${ground(1180)}
    ${safe()}
    ${figure(330, 1180, 520)}
    ${figure(760, 1180, 520)}
    ${caption('the turn')}
  `),
};
