/* ───────────────────────────────────────────────────────────────────
   plan.data.js — the words and the numbers. See
   ~/.claude/skills/film-plan/references/anatomy.md
   ─────────────────────────────────────────────────────────────────── */
window.PLAN = {
  meta: {
    title: 'The Life of a Donkey',
    eyebrow: 'Storyboard \u00b7 v5 \u00b7 narrated cut',
    deck: 'A natural-history film about the worst player at your table, narrated throughout in the '
        + 'unhurried, sympathetic register of a British wildlife documentary. Sixteen scenes, four acts, '
        + 'forty-eight seconds, and it loops.',
    duration: 48.0,
    facts: [
      { text: '48.0 s', hot: true },
      { text: 'narrated throughout', hot: true },
      { text: '1080 \u00d7 1920 \u00b7 24 fps' },
      { text: 'four acts \u00b7 sixteen scenes' },
      { text: 'loops' },
    ],
  },

  acts: [
   {after:0, name:'Act I — The specimen', time:'0.0 – 6.0 s', note:'Sets the format, the subject, and the narrator’s voice. He opens on the line that names the species and never breaks register again.'},
   {after:2, name:'Act II — The early instars', time:'6.0 – 18.0 s', note:'Two stages, dramatised. The table frame is established in scene 3 and does not move again for the rest of the film.'},
   {after:6, name:'Act III — The donk, and the hand', time:'18.0 – 32.5 s', note:'Stage three expands into the hand the film is named for, ending on the suckout — the only place the narrator falls silent.'},
   {after:11, name:'Act IV — The late instars and the reframe', time:'32.5 – 48.0 s', note:'The blueprints stop after the tilt plate. The film quits dissecting him and just looks at him.'}
  ],

  plates: { p: { label: 'Paper plate' }, b: { label: 'Blueprint' } },

  scenes: [
{n:1,id:'hero-donk',t:'0.0 – 3.0',dur:'3.0 s',plate:'p',status:['keep','built · retime + captions'],
 title:'Cold open on the specimen',
 artCap:'He fills the safe width · cuffs and forearms at the rail · no face but his',
 what:'A donkey in mirrored aviators behind green felt. Dun coat, dorsal stripe, shoulder cross, headphones askew, <b>7♦ 2♣</b> in his hooves — seven-deuce offsuit, the worst hand in hold’em, a badly-stacked tower with two toppled, a drink with a straw. Human hands rest at the rail — forearms and cuffs only, never faces. He brays; his ears swivel; he pushes a stack and it topples.',
 beats:[['0.5','He brays — the first of only three in the film'],['1.2','The ears swivel: one forward, one gently back'],['2.2','He pushes a stack forward and it topples']],
 narr:[['0.6','The classic Texas donkey.'],['1.7','He arrives shortly after four, as he always does.']],
 why:'<strong>The hook.</strong> The whole film has to survive its first second on a phone, and a beautifully-drawn donkey in aviators does that work before the narrator has said anything.'},

{n:2,id:'taxonomy-plate',t:'3.0 – 6.0',dur:'3.0 s',plate:'b',status:['redo','built · add five-stage ring + captions'],
 title:'The taxonomy plate',
 artCap:'Three bands · the five-stage ring previewed along the bottom',
 what:'The animal in left profile reduced to amber line on navy. Shoulder cross bracketed and measured at the withers, ear angle ticked, proportions called against a shared scale. In the bottom third, <b>five stage roundels light left to right</b> — the shape of the film, laid out before it runs.',
 beats:[['3.6','Ear-angle arcs sweep on'],['4.2','The shoulder cross measured — magenta flash at the intersection'],['5.0','Five roundels light in sequence on 16ths']],
 narr:[['3.4','Asinus pokerensis.'],['5.5','Five stages. He will pass through every one.']],
 why:'The caption does what two seconds of silent roundels could not: it tells the audience the film <strong>has a structure</strong> and that they should be counting.'},

{n:3,id:'stage-fish',t:'6.0 – 10.0',dur:'4.0 s',plate:'p',status:['redo','re-choreograph from the-limp · folds, not limps'],
 title:'I. Fish',
 artCap:'Three hands fold away from the pot · his chip goes in alone',
 what:'<b>The table frame, established.</b> Three human hands fold in turn — cards flicked away, decisive, on consecutive beats. He hesitates: ears swivel, he lifts his cards and checks them a second time. Then his hoof pushes chips forward, <b>alone</b>. Stack 22, drink full, coat clean.',
 beats:[['6.5','Hand A folds — cards flicked away'],['7.0','Hand B folds'],['7.5','Hand C folds'],['8.2','He hesitates — ears swivel, he checks his cards again'],['9.0','His chip goes in. Alone.']],
 narr:[['6.4','His first night.'],['7.6','He does not yet know which hands to fold.'],['8.9','Observe. The others withdraw. He does not.']],
 why:'<strong>Changed from the approved plan.</strong> Reusing the limp shot said “everyone played a hand, including him” — the opposite of not understanding. Three decisive folds against one hesitant call is what makes a fish a fish.'},

{n:4,id:'plate-i-ii',t:'10.0 – 11.5',dur:'1.5 s',plate:'b',status:['new','new'],
 title:'Stage marker I → II',
 artCap:'Stage I filled · stage II lighting · the stack axis begins to fall',
 what:'The same five-stage ring. Stage I fills; stage II lights on the beat. A stack-height axis beneath shows his chips beginning to fall.',
 beats:[['10.2','Stage I fills solid'],['10.75','Stage II lights — one magenta tick'],['11.1','The stack axis draws its first falling segment']],
 narr:[],
 why:'No narration — the ring is doing the talking and it only has a second and a half. <strong>Upgraded from “weak”</strong>: the taxonomy caption has already told the audience there are five stages, so the ring refers back instead of arriving cold.'},

{n:5,id:'stage-calling-station',t:'11.5 – 15.5',dur:'4.0 s',plate:'p',status:['new','new'],
 title:'II. Calling station',
 artCap:'Bet → call, four times · the stack visibly shorter each pass',
 what:'Same frame. <b>Bet, call. Four times</b>: a human hand pushes chips out, his hoof matches it. Every time. Stack visibly shorter at each repetition — 14 down to 9. Settled, head level, ears gently back. Drink half gone.',
 beats:[['12.0','Bet · call — stack 14'],['12.9','Bet · call — stack 13'],['13.8','Bet · call — stack 11'],['14.7','Bet · call — stack 9. He has folded nothing.']],
 narr:[['11.9','Within a month, the second instar. The calling station.'],['13.6','He has learned to call.'],['14.6','He has not learned to fold.']],
 why:'<strong>The best joke construction in the script</strong> — a setup and a punchline in the flattest possible voice, while the stack quietly shrinks underneath. Repetition plus a shrinking stack needs no poker knowledge at all.'},

{n:6,id:'range-lattice',t:'15.5 – 18.0',dur:'2.5 s',plate:'b',status:['keep','built · retime + captions'],
 title:'His range',
 artCap:'169 cells · 163 filled · six survivors left dark',
 what:'The 13 × 13 hand-range grid, 169 cells. It fills — 163 of them — with six scattered survivors left dark. A bracket spans the filled region.',
 beats:[['15.8','Cells ignite in an anti-diagonal sweep'],['16.8','The grid is full; the bracket snaps with a magenta flash']],
 narr:[['16.0','Of the one hundred and sixty-nine hands available to him, he plays one hundred and sixty-three.'],['17.2','The remaining six, he folds by accident.']],
 why:'<strong>The scene that proved the whole argument.</strong> Silent, this was a mint grid filling in — meaningless to anyone who has not seen a range chart. One line of narration makes it one of the funniest beats in the film; the second lands the joke that even the exceptions are not deliberate.'},

{n:7,id:'stage-donk',t:'18.0 – 22.0',dur:'4.0 s',plate:'p',status:['new','new'],
 title:'III. Donk',
 artCap:'Flop down · his chips go in FIRST · the other hands freeze',
 what:'Same frame. Three flop cards snap down — <b>K♠ 9♥ 5♦</b>. It misses him completely. Then he pushes chips forward <b>first</b>, out of position, before anyone else has acted, into the player who raised. <b>The other hands go still.</b> Headphones slipping.',
 beats:[['18.5','Flop card 1 snaps'],['19.0','Flop card 2'],['19.5','Flop card 3'],['20.5','He pushes first — bray 2'],['21.0','The other three hands stop dead']],
 narr:[['18.4','By spring, the third instar. And the act for which the species is named.'],['20.2','He is out of position. He bets first, into the player who raised him.']],
 why:'“Donk” is the most technical idea in the film and was unreadable silently. The freeze sells it visually; the caption explains it; and the line <strong>quietly explains the title</strong>, which nothing in the old cut ever did.'},

{n:8,id:'donk-bet-anatomy',t:'22.0 – 24.5',dur:'2.5 s',plate:'b',status:['keep','built · retime + captions'],
 title:'Anatomy of the donk bet',
 artCap:'Seat ring · the OOP lead in magenta · the raiser’s unfired reply dotted',
 what:'The pot as a measured ellipse with hex-lattice volume. The nine-seat ring above with position arrows. The out-of-position lead drawn as a heavy vector against the preflop raiser\'s dotted, unfired counter-vector. Sizing bracketed as a fraction of pot. Magenta marks the donk.',
 beats:[['22.3','Position arrows sweep the ring'],['23.0','The pot is measured — bracket snaps'],['23.8','The lead fires in magenta']],
 narr:[['22.5','No creature at this table does this.'],['23.6','He believes he is ahead.']],
 why:'<strong>His interiority, reported clinically.</strong> No bubble, no wink — the naturalist simply states what the specimen believes, and it is funnier for the flatness.'},

{n:9,id:'the-hero-call',t:'24.5 – 26.5',dur:'2.0 s',plate:'p',status:['keep','built · retime + caption'],
 title:'The hero call',
 artCap:'His toppled tower left · four flush columns right · one neat hand',
 what:'A human hand — pressed cuff, a watch with lugs and crown, knuckles and tendons — sets down four chip columns of equal height, edges flush. At the frame edge, his leaning tower with two toppled chips. One neat, one not.',
 beats:[['24.5','Match cut on the pot geometry from the plate before'],['25.6','The stack is set down. Not one chip topples.']],
 narr:[['25.2','The call is correct.'],['26.0','It will not matter.']],
 why:'Six words establish the victim as <strong>competent</strong>, which is what makes the next ninety frames cruel rather than merely lucky. <em class="t">It will not matter</em> is the narrator telling you the ending early — and it still hurts.'},

{n:10,id:'outs-and-equity',t:'26.5 – 29.0',dur:'2.5 s',plate:'b',status:['keep','built · retime + captions'],
 title:'Outs and equity',
 artCap:'Six outs on a 47-card ring · a 5° wedge · almost invisible',
 what:'Six outs light one at a time around a ring divided into the 47 unseen cards — three sevens and three deuces, the only cards in the deck that can help him. Inside, an equity dial sweeps a wedge of <b>5.0°</b> against a full circle and stops dead. It is so thin it is almost not there. Below, the curve plots flat against a ghost curve of what a real draw would look like.',
 beats:[['27.0','Six outs light in sequence — three sevens, three deuces'],['28.0','The dial sweeps to 5.0° and stops — one magenta tick'],['28.3','Held motionless to the cut']],
 narr:[['27.0','He needs both remaining cards to pair him.'],['28.1','One point four percent.']],
 why:'Every figure is derived, not typed: <em class="t">15 of 1081 two-card runouts = 1.39%</em> — three ways to trip sevens, three to trip deuces, nine to make two pair — and the arc is that probability × 360° = 5.0°. <strong>A 5° wedge reads as a joke at a glance in a way 15° never did.</strong> The first line explains the draw; the bare number lands alone on its own beat.'},

{n:11,id:'turn-and-river',t:'29.0 – 32.5',dur:'3.5 s',plate:'p',status:['keep','built · unchanged · only its start moves'],
 title:'Turn and river',
 artCap:'K♠ 9♥ 5♦ 7♥ 2♠ · the last two cards are his own · NO caption',
 what:'The turn snaps down — <b>7♥</b>. It pairs him, and his ears stay neutral: he does not know that it matters. Then <b>nothing happens for a second and a quarter</b>. One beat of near-silence, the score dropping 26 dB. The river lands — <b>2♠</b> — on a single white frame. Two pair, sevens and deuces. His ears snap straight up, rings burst, he brays.',
 beats:[['29.5','Turn 7♥ snaps — it pairs him; ears stay neutral'],['29.5–31.0','Nothing. The hold. 0.23 px of drift in 1.25 s'],['31.0','One beat of near-silence — 26 dB below the river'],['31.5','RIVER 2♠ · one white frame · two pair · ears straight up · bray 3'],['31.5–32.5','A full second of aftermath. He does not celebrate.']],
 narr:[['—','Silence. Deliberately. After twenty-nine seconds of talking, the narrator stops dead.']],
 silent:true,
 why:'<strong>The board ends K♠ 9♥ 5♦ 7♥ 2♠ — the last two cards are a seven and a deuce, exactly the two cards in his hooves.</strong> Anyone can see that match without knowing a thing about poker, which is a far easier read than counting diamonds for a flush.<br><br> Verified: exactly one white frame; 0.23 px of drift across the hold; the silent beat measured 26.4 dB below the river.'},

{n:12,id:'tilt-response',t:'32.5 – 34.0',dur:'1.5 s',plate:'b',status:['keep','built · retime + caption'],
 title:'Tilt response',
 artCap:'Real PQRST morphology accelerating · the stack falls off a cliff',
 what:'The opponent as a clinical plate. A real ECG trace — gaussian P, piecewise QRS, rounded T — accelerating as the interval shortens 40%, measured against itself by two brackets. A chip-stack step plot falling off a cliff, with one magenta spike.',
 beats:[['33.0','The heart rate begins climbing'],['33.5','The stack graph collapses — magenta spike']],
 narr:[['33.0','The correct play, punished.']],
 why:'Played completely straight, which is what makes it funny. An accelerating heartbeat and a collapsing graph need no explanation in any language.'},

{n:13,id:'stage-maniac',t:'34.0 – 37.5',dur:'3.5 s',plate:'p',status:['new','new'],
 title:'IV. Maniac',
 artCap:'The won pot still arriving · the tower goes in · chips scatter',
 what:'Same frame. <b>The won pot is still sliding toward him as the scene opens</b>, and his first shove comes out of that same arriving pile. He pushes the whole tower in, and again, chips scattering. Reared, ears flat back. Headphones gone, coat rough. By the last frame the stack is empty.',
 beats:[['34.0','The won pot is still sliding toward him'],['34.9','First shove — out of the arriving pile'],['36.1','Second shove — chips scatter across the felt'],['37.2','The stack is empty']],
 narr:[['34.4','One win. It is sufficient.'],['35.6','The fourth instar. The maniac.'],['36.6','He believes, now, that he is due.']],
 why:'<strong>The only stage the hand causes.</strong> Fish, calling station and donk arrive with the calendar — first night, a month, spring; the maniac is made by the suckout. Cut it and the whole of Act III is an anecdote with no consequence. It is also the loudest frame in the film, and the hardest cut in the film needs something this loud to cut away from.'},

{n:14,id:'stage-nit',t:'37.5 – 41.5',dur:'4.0 s',plate:'p',status:['new','new'],
 title:'V. Nit',
 artCap:'Four chips · cards slid away · the aviators are OFF',
 what:'The same frame, and <b>the hardest cut in the film lands on it</b>: identical composition, everything changed. Four chips. He slides his cards away and folds, then does not move while every other hand plays around him. Hunched, drawn back, ears neutral. Drink empty. <b>The aviators are off — his eyes, for the first and only time.</b>',
 beats:[['37.5','CUT — identical frame, 31 chips → 4, chaos → stillness'],['39.5','He slides his cards away. Folds.'],['39.5–41.5','Nothing. He does not move.']],
 narr:[['37.9','A year later. The adult form.'],['39.2','The nit. He folds everything.'],['40.3','He has learned, at last, what it costs to be wrong.']],
 why:'<strong>Scene 3, inverted, in the same frame.</strong> The fish was the one hand that would not withdraw; the nit is the one hand that will not play. That rhyme is what closes five stages into a life. And it buys <em class="t">And yet.</em> — the film has to stop laughing at him for four seconds, and see his eyes, before the reframe can turn tender.'},

{n:15,id:'the-ecosystem',t:'41.5 – 46.0',dur:'4.5 s',plate:'p',status:['keep','built · retime 3.0 → 4.5 s · captions'],
 title:'Primary producer',
 artCap:'The only pull-back · chips flow him → pot → eight hands',
 what:'The camera pulls back from the table frame for the only time in the film. He sits at the far rail; eight human hands ring the near arc, each different, each beside a neat stack. Chips flow outward along curving arrows — from him, to the pot, to every one of them. The warmest light in the film. No magenta anywhere.',
 beats:[['41.5','Pull-back begins — 1.50 → 1.18, the slowest move in the film'],['42.5','Eight arrows radiate; chips begin travelling'],['44.0','The bracket draws across the web'],['45.0','Held. Chips still flowing.']],
 narr:[['42.0','And yet.'],['42.9','Every player at this table eats because he sits down.'],['44.4','He is the primary producer. The pond needs him.']],
 why:'The old cut gave two words 0.5 s. At 4.5 s the reframe gets three lines and room to breathe. <em class="t">And yet.</em> is the hinge — two words that turn thirty-eight seconds of mockery into something close to tenderness.'},

{n:16,id:'cycle-loop',t:'46.0 – 48.0',dur:'2.0 s',plate:'b',status:['keep','built · retime + caption'],
 title:'The cycle closes',
 artCap:'deposit → stack → move up → bust · the last arrow closes on the beat',
 what:'Four roundels on a ring — deposit, stack, move up, bust. The fourth arrow closes the last quadrant on the beat with a single magenta tick. The wordmark types on. The plate settles to the chip and the head geometry so the last frame hands straight into the first.',
 beats:[['46.2','Roundels light on 8ths'],['46.9','The arrow closes the cycle — one magenta tick'],['47.4','The wordmark types on'],['47.9','Settles to G1 + G4 for the loop seam']],
 narr:[['46.4','He will be back on Tuesday.']],
 why:'<em class="t">He will be back on Tuesday.</em> does what the ring alone could not: it makes the loop <strong>a fact about him</strong> rather than a graphic device, and it is the last laugh before the wordmark.'}
],
};
