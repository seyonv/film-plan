---
name: film-plan
description: Build an interactive plan page for a film or video — a scene-by-scene storyboard with drawn frames, narration, beats and timing, rendered as a single browsable HTML page with a chat rail that edits the plan by talking to it. Use when planning, storyboarding, pitching or revising a film, short, ad, explainer, music video or title sequence; when someone asks for a shot list, storyboard, treatment, beat sheet or animatic plan; or when an existing plan page needs its chat bridge wired up.
---

# Film plan

A film plan is worth building as a page, not a document, because a film is a
thing that happens over time and a document cannot show you that. The page
gives you the whole runtime at a glance, every frame drawn, every line of
narration against the second it lands — and a chat rail that changes it while
you read.

## The method

Five moves. Do not skip to move four; the page is only as good as the thinking
under it, and a beautiful page wrapped around a vague film is worse than no
page, because it hides the vagueness.

### 1. Interview

Ask, one at a time, and stop when you can answer these yourself:

- What is the film **about**, in one sentence that contains a claim?
- **How long**, what **aspect ratio**, what **frame rate**? Where is it watched —
  a phone held vertically, a laptop, a projector, a feed with the sound off?
- Who is the **audience**, and what do they know already?
- What is the **register**? Name two or three real films or films-in-a-genre.
  "Attenborough narrating a poker table" is a brief. "Fun and engaging" is not.
- Does it **loop**? Films that loop have to end where they began, which is a
  structural constraint, not a flourish.
- What already **exists** — footage, a script, a previous cut?

### 2. Find the spine

Before a single scene, find the shape: the five stages, the three acts, the
argument in four moves. The spine is what makes a plan reviewable — with one,
someone can tell you scene 9 is in the wrong act; without one, all they can say
is that they like it or they don't.

Write the acts first. Then hang scenes off them. If a scene does not belong to
an act, either the act list is wrong or the scene is decoration.

### 3. Choose the aesthetic

**Design it for this film. Never reuse the last one.** The page should look
like it belongs to the thing it plans — a nature documentary and a fashion
title sequence should not produce the same page. Decide, and write it down:

- **The palette** — the eight tokens in `references/anatomy.md`, and one accent
  that means "pay attention here".
- **The type pairing** — usually a serif with a voice for headings and
  narration, a plain sans for the body, a mono for anything numeric. Timecodes
  are numbers and must be tabular.
- **The drawing motif** — the visual idiom the storyboard frames are drawn in,
  and the two or three *registers* the film cuts between (world vs. diagram,
  daylight vs. night, footage vs. title card). Registers get their own colour
  and their own badge, so the scrubber strip shows the film's rhythm as a
  pattern of light and dark before you read a word.

`references/art-direction.md` covers choosing a motif and drawing frames.

### 4. Build

Copy the scaffold and fill it in:

```bash
cp ~/.claude/skills/film-plan/assets/scaffold/{plan.html,plan.data.js,plan.art.js,plan.sh} docs/
```

- `plan.data.js` — the words and numbers. **Write this first**, whole, before
  drawing anything. If the plan is not right in the data it will not be right
  on the page.
- `plan.art.js` — the storyboard frames. Build the film's drawing vocabulary as
  helpers, then compose each frame from them. A shared `figure()` used in nine
  scenes is what makes nine frames look like one film.
- `plan.html` — restyle the eight tokens, the type, and the scene card to suit
  the aesthetic. The renderer rarely needs touching; the CSS always does.

`references/anatomy.md` is the contract: what every field means, what the
validation gate enforces, and the two rules `plan.html` must keep.

### 5. Serve it

```bash
docs/plan.sh
```

Opens the plan in the browser with the chat rail attached. Opened straight off
disk it still reads perfectly, just read-only.

## The chat rail

The director reads the plan and types into the rail: *"scene 4 is a beat too
long, take it out of the middle not the end."* A headless Claude Code worker
picks it up, edits `plan.data.js` and `plan.art.js` — those two files and
nothing else — and the page updates itself in place, marks what changed, and
says what it did. Every accepted turn is its own git commit with a one-click
undo. A turn that would break the plan is caught and rolled back before the
director ever sees it.

Run it, don't explain it. `references/chat-bridge.md` has the internals, the
failure modes, and how to debug a turn that went wrong.

## Verifying

Never hand over a plan page you have not opened.

```bash
node ~/.claude/skills/film-plan/assets/plan.server.mjs --selftest   # bridge, no tokens
node ~/.claude/skills/film-plan/tools/inline.mjs --dir docs         # one shareable file
```

The bridge validates the plan on boot and prints what is wrong. Beyond that,
look at the page: every frame drawn, the scrubber reading as a rhythm, the
timecodes adding up, and the narration sounding like one person wrote it.

## The failure to avoid

The most common bad outcome is a page that is gorgeous and says nothing —
sixteen scene cards whose "why it earns its place" all say some version of *"this
builds tension"*. That field is the plan's conscience. If you cannot finish the
sentence for a scene, the honest move is to say so in the field and let the
director cut it, not to write something that sounds like a reason.
