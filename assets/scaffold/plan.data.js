/* ───────────────────────────────────────────────────────────────────
   plan.data.js — the words and the numbers.

   Pure data. No functions, no DOM, no drawing. The chat worker edits
   this file and plan.art.js, and nothing else.

   Fields marked (required) are enforced by the bridge's validation gate.
   ─────────────────────────────────────────────────────────────────── */
window.PLAN = {
  meta: {
    title: 'Working Title',
    eyebrow: 'Storyboard · v1',
    deck: 'One paragraph that says what the film is, who it is for, and why it '
        + 'is worth ninety seconds of someone’s life. Write it last.',
    duration: 30.0,                       // seconds; must match the last scene's out-point
    facts: [                              // the hard constraints, stated once
      { text: '30.0 s', hot: true },
      { text: '1080 × 1920 · 24 fps' },
      { text: 'silent-first · captions carry it' },
    ],
  },

  /* Act bands break the scene list into movements. `after` is the number of
     scenes that precede the band, so `after: 0` sits above scene 1. */
  acts: [
    { after: 0, name: 'Act I — The premise', time: '0.0 – 10.0 s',
      note: 'What the opening has to establish before it earns the right to continue.' },
    { after: 2, name: 'Act II — The turn', time: '10.0 – 30.0 s',
      note: 'Where the film stops explaining and starts arguing.' },
  ],

  scenes: [
    {
      id: 'cold-open',                    // (required) unique; keys into PLAN_ART
      n: 1,                               // (required) display number
      t: '0.0 – 4.0',                // (required) in – out, seconds; scenes run back to back
      dur: '4.0 s',
      title: 'Cold open',                 // (required)
      plate: 'a',                         // visual register: keys into PLAN.plates
      status: ['new', 'not built'],       // ['new'|'keep'|'redo', free text]
      artCap: 'A one-line note on the composition, for whoever draws it.',
      what: 'What the audience actually sees, in the present tense, as prose. '
          + 'Concrete nouns. No adjectives you cannot draw.',
      beats: [
        ['0.5', 'A thing happens, on the frame it happens.'],
        ['2.2', 'The thing that changes because of it.'],
      ],
      narr: [
        ['0.6', 'The first line, written as it will be spoken.'],
      ],
      why: '<strong>Why this scene survives the cut.</strong> If you cannot '
         + 'finish this sentence, the scene is decoration.',
    },
    {
      id: 'the-claim', n: 2, t: '4.0 – 10.0', dur: '6.0 s',
      title: 'The claim',
      plate: 'b',
      status: ['new', 'not built'],
      artCap: 'The diagram register — line on dark, measured, clinical.',
      what: 'The film’s argument, stated as an image rather than a sentence.',
      beats: [['5.0', 'The diagram assembles'], ['8.4', 'The one number that matters lands']],
      narr: [['4.6', 'The line that names the subject.']],
      why: 'Tells the audience the film <strong>has a structure</strong>, and '
         + 'that they should be counting.',
    },
    {
      id: 'the-turn', n: 3, t: '10.0 – 30.0', dur: '20.0 s',
      title: 'The turn',
      plate: 'a',
      status: ['new', 'not built'],
      artCap: 'Back to the world. The diagrams stop.',
      what: 'The longest scene, and the one the film is actually about.',
      beats: [['12.0', 'Set up'], ['22.0', 'Pay off'], ['28.5', 'The loop point']],
      narr: [],                           // empty = the picture carries this one
      silent: true,
      why: 'The only place the narrator falls silent, which is why it lands.',
    },
  ],

  /* The two or three visual registers the film cuts between. Each key is a
     `plate` value above; `label` is what the badge says. */
  plates: {
    a: { label: 'World' },
    b: { label: 'Diagram' },
  },
};
