/* ───────────────────────────────────────────────────────────────────
   plan.art.js — the storyboard frames, drawn on the 1080×1920 film
   frame from the composition numbers in docs/TABLE-FRAME.md. See
   ~/.claude/skills/film-plan/references/art-direction.md
   ─────────────────────────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────────
   Scene data. Storyboard frames are drawn from the real
   composition numbers in docs/TABLE-FRAME.md (1080×1920).
   ──────────────────────────────────────────────────────────── */
const P='p', B='b';

/* --- tiny SVG helpers, all on the 1080×1920 film frame --- */
const F = (inner, bg) => `<svg viewBox="0 0 1080 1920" role="img">
  <rect width="1080" height="1920" fill="${bg}"/>${inner}</svg>`;

const PAPER='#F0E6CF', NAVY='#0B1230';
const INK='#2A1C13', FAINT='rgba(42,28,19,.32)';
const LAV='#C8C1EF', LAVF='rgba(200,193,239,.42)', MINT='#5FE0A8', MAG='#FF3D98';

/* diagonal stripe hint for paper plates */
const stripes = (c='rgba(201,168,106,.30)') => {
  let s='';
  for(let i=-1200;i<1400;i+=210) s+=`<line x1="${i}" y1="1920" x2="${i+900}" y2="0" stroke="${c}" stroke-width="86"/>`;
  return `<g>${s}</g>`;
};
/* the shared TABLE FRAME: felt, rails, betting line, pot, 3 hands */
const tableFrame = () => `
  ${stripes()}
  <rect x="0" y="560" width="1080" height="140" fill="#6B4A32"/>
  <rect x="0" y="700" width="1080" height="730" fill="#2F6B4F"/>
  <rect x="0" y="1430" width="1080" height="170" fill="#6B4A32"/>
  <rect x="0" y="1600" width="1080" height="320" fill="#E7DCC2"/>
  <ellipse cx="540" cy="1120" rx="300" ry="112" fill="none" stroke="rgba(234,181,48,.55)" stroke-width="5" stroke-dasharray="20 16"/>
  <g fill="#D9C6A8" stroke="${INK}" stroke-width="6">
    <rect x="-40" y="1140" width="150" height="86" rx="34"/>
    <rect x="250" y="620" width="120" height="150" rx="40"/>
    <rect x="970" y="1200" width="150" height="86" rx="34"/>
  </g>`;
/* his head at G4 (470,760) r150 + ears; earMode: fwd|back|up|flat|low */
const head = (earMode='fwd', opts={}) => {
  const ears = {
    fwd:  `<ellipse cx="392" cy="580" rx="46" ry="150" transform="rotate(-13 392 580)"/><ellipse cx="548" cy="576" rx="46" ry="150" transform="rotate(15 548 576)"/>`,
    back: `<ellipse cx="368" cy="616" rx="44" ry="140" transform="rotate(-38 368 616)"/><ellipse cx="572" cy="612" rx="44" ry="140" transform="rotate(40 572 612)"/>`,
    up:   `<ellipse cx="404" cy="556" rx="42" ry="162"/><ellipse cx="536" cy="552" rx="42" ry="162"/>`,
    flat: `<ellipse cx="330" cy="700" rx="42" ry="132" transform="rotate(-74 330 700)"/><ellipse cx="610" cy="696" rx="42" ry="132" transform="rotate(74 610 696)"/>`,
    low:  `<ellipse cx="376" cy="628" rx="46" ry="140" transform="rotate(-50 376 628)"/><ellipse cx="564" cy="624" rx="46" ry="140" transform="rotate(52 564 624)"/>`
  }[earMode];
  const y = opts.dy||0;
  const glasses = opts.noGlasses ? '' :
    `<ellipse cx="398" cy="790" rx="62" ry="44" fill="#3E5F7A"/><ellipse cx="542" cy="790" rx="62" ry="44" fill="#3E5F7A"/><line x1="460" y1="790" x2="480" y2="790" stroke="${INK}" stroke-width="7"/>`;
  const eyes = opts.noGlasses ?
    `<circle cx="398" cy="790" r="15" fill="${INK}"/><circle cx="542" cy="790" r="15" fill="${INK}"/>` : '';
  return `<g transform="translate(0 ${y})">
    <g fill="#9A8B78" stroke="${INK}" stroke-width="7">${ears}</g>
    <ellipse cx="470" cy="770" rx="152" ry="168" fill="#9A8B78" stroke="${INK}" stroke-width="8"/>
    <ellipse cx="470" cy="905" rx="76" ry="62" fill="#E4DAC6" stroke="${INK}" stroke-width="6"/>
    <line x1="470" y1="600" x2="470" y2="700" stroke="#4A3E30" stroke-width="16"/>
    ${glasses}${eyes}
  </g>`;
};
/* a chip stack: n chips at x,baseY */
const stack = (x,baseY,n,w=58,messy=0) => {
  let s='';
  for(let i=0;i<n;i++){
    const off = messy? ((i*37)%11)-5 : 0;
    s+=`<ellipse cx="${x+off}" cy="${baseY-i*24}" rx="${w}" ry="17" fill="${i%3===0?'#B8372C':i%3===1?'#2F5C9E':'#F0E7D4'}" stroke="${INK}" stroke-width="5"/>`;
  }
  return s;
};
const card = (x,y,w=110,h=154,rot=0,face='#F7F0DE') =>
  `<g transform="rotate(${rot} ${x+w/2} ${y+h/2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${face}" stroke="${INK}" stroke-width="6"/></g>`;
/* blueprint furniture */
const bpBase = () => {
  let g='';
  for(let x=0;x<=1080;x+=120) g+=`<line x1="${x}" y1="0" x2="${x}" y2="1920" stroke="rgba(58,74,134,.5)" stroke-width="2"/>`;
  for(let y=0;y<=1920;y+=120) g+=`<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="rgba(58,74,134,.5)" stroke-width="2"/>`;
  return g+`<circle cx="540" cy="900" r="430" fill="none" stroke="${LAVF}" stroke-width="3"/>`;
};
const band = (y,h=110) => `<rect x="40" y="${y}" width="1000" height="${h}" fill="none" stroke="${LAVF}" stroke-width="3"/>`;
const caption = (txt, y=1640) =>
  `<rect x="90" y="${y-46}" width="900" height="76" rx="6" fill="rgba(0,0,0,.30)"/>
   <text x="540" y="${y+4}" text-anchor="middle" font-family="monospace" font-size="46" fill="#FFF8EC" letter-spacing="4">${txt}</text>`;

/* ── the sixteen scenes ─────────────────────── */

window.PLAN_ART = {
  'hero-donk': () => F(`${stripes()}<rect x="0" y="1180" width="1080" height="300" fill="#2F6B4F"/><rect x="0" y="1480" width="1080" height="180" fill="#6B4A32"/>
  ${stack(860,1160,9,56,1)}${head('fwd')}${card(400,1180,120,168,-8)}${card(540,1180,120,168,7)}
  <rect x="150" y="1080" width="92" height="150" rx="14" fill="#EFD9A0" stroke="${INK}" stroke-width="6"/>
  <g fill="#D9C6A8" stroke="${INK}" stroke-width="6"><rect x="-30" y="1500" width="170" height="92" rx="36"/><rect x="940" y="1520" width="170" height="92" rx="36"/></g>
  ${caption('the classic texas donkey')}`,PAPER),
  'taxonomy-plate': () => F(`${bpBase()}${band(190)}
  <g fill="none" stroke="#C9A86A" stroke-width="9"><ellipse cx="540" cy="820" rx="290" ry="170"/><ellipse cx="300" cy="700" rx="92" ry="112"/><line x1="230" y1="600" x2="252" y2="470"/><line x1="330" y1="596" x2="352" y2="468"/><line x1="380" y1="960" x2="380" y2="1160"/><line x1="700" y1="960" x2="700" y2="1160"/></g>
  <g stroke="${LAV}" stroke-width="6" fill="none"><path d="M300 640 L300 900"/><path d="M250 700 L360 700"/><path d="M620 640 L900 640"/><path d="M620 620 L620 660"/><path d="M900 620 L900 660"/></g>
  <g fill="none" stroke="${LAV}" stroke-width="7">
   <circle cx="150" cy="1520" r="82"/><circle cx="345" cy="1520" r="82"/><circle cx="540" cy="1520" r="82"/><circle cx="735" cy="1520" r="82"/><circle cx="930" cy="1520" r="82"/></g>
  <circle cx="150" cy="1520" r="82" fill="rgba(201,168,106,.45)"/>
  ${caption('asinus pokerensis')}`,NAVY),
  'stage-fish': () => F(`${tableFrame()}${head('fwd')}${stack(830,1180,10,54,1)}
  <g stroke="${INK}" stroke-width="7" fill="none"><path d="M120 1050 L40 960"/><path d="M300 800 L250 720"/><path d="M960 1100 L1040 1010"/></g>
  <ellipse cx="540" cy="1120" rx="46" ry="16" fill="#F0E7D4" stroke="${INK}" stroke-width="5"/>
  ${caption('he does not yet know which')}`,PAPER),
  'plate-i-ii': () => F(`${bpBase()}
  <g fill="none" stroke="${LAV}" stroke-width="8"><circle cx="150" cy="820" r="92"/><circle cx="345" cy="820" r="92"/><circle cx="540" cy="820" r="92"/><circle cx="735" cy="820" r="92"/><circle cx="930" cy="820" r="92"/></g>
  <circle cx="150" cy="820" r="92" fill="rgba(201,168,106,.55)"/>
  <circle cx="345" cy="820" r="92" fill="none" stroke="${MAG}" stroke-width="12"/>
  <g stroke="${LAV}" stroke-width="6"><line x1="120" y1="1300" x2="960" y2="1300"/><path d="M150 1230 L345 1290 L540 1330 L735 1380 L930 1430" fill="none" stroke="${MINT}" stroke-width="9"/></g>`,NAVY),
  'stage-calling-station': () => F(`${tableFrame()}${head('back')}${stack(830,1180,7,54,1)}
  <g stroke="${INK}" stroke-width="7" fill="none"><path d="M180 1120 L420 1120"/><path d="M400 1100 L420 1120 L400 1140"/></g>
  ${stack(540,1150,4,50,0)}
  ${caption('he has not learned to fold')}`,PAPER),
  'range-lattice': () => F(`${bpBase()}${(()=>{let g='';for(let r=0;r<13;r++)for(let c=0;c<13;c++){const x=200+c*52,y=560+r*52;const dark=(r*13+c)%29===0;g+=`<rect x="${x}" y="${y}" width="46" height="46" fill="${dark?'none':'rgba(95,224,168,.45)'}" stroke="rgba(95,224,168,.75)" stroke-width="2"/>`}return g})()}
  <line x1="200" y1="560" x2="876" y2="1236" stroke="${LAV}" stroke-width="5"/>
  <g stroke="${MAG}" stroke-width="7" fill="none"><rect x="190" y="550" width="696" height="696"/></g>
  ${caption('163 of 169 hands')}`,NAVY),
  'stage-donk': () => F(`${tableFrame()}${head('fwd',{dy:26})}${stack(830,1180,5,54,1)}
  ${card(300,1060,100,140,-5)}${card(420,1060,100,140,3)}${card(540,1060,100,140,-2)}
  <g stroke="${MAG}" stroke-width="10" fill="none"><path d="M700 1240 L560 1160"/><path d="M590 1150 L560 1160 L572 1188"/></g>
  ${stack(700,1270,3,48,0)}
  ${caption('he bets into the raiser')}`,PAPER),
  'donk-bet-anatomy': () => F(`${bpBase()}
  <ellipse cx="540" cy="300" rx="380" ry="92" fill="none" stroke="${MINT}" stroke-width="6"/>
  ${(()=>{let g='';for(let i=0;i<9;i++){const a=(i*40-100)*Math.PI/180;g+=`<circle cx="${540+Math.cos(a)*380}" cy="${300+Math.sin(a)*92}" r="16" fill="${i===1?'#EEF0FF':'rgba(95,224,168,.7)'}"/>`}return g})()}
  <ellipse cx="540" cy="1180" rx="300" ry="112" fill="none" stroke="${MINT}" stroke-width="11"/>
  ${[400,490,580,670].map((x,i)=>`<g>${[5,8,6,9][i]&&Array.from({length:[5,8,6,9][i]}).map((_,k)=>`<ellipse cx="${x}" cy="${1230-k*26}" rx="40" ry="12" fill="none" stroke="rgba(95,224,168,.8)" stroke-width="3"/>`).join('')}</g>`).join('')}
  <path d="M200 400 Q 240 800 420 1090" fill="none" stroke="${MAG}" stroke-width="11"/>
  <path d="M880 400 Q 840 780 690 1070" fill="none" stroke="${LAVF}" stroke-width="7" stroke-dasharray="26 20"/>
  <g stroke="${LAV}" stroke-width="5"><line x1="150" y1="1560" x2="930" y2="1560"/><line x1="410" y1="1520" x2="410" y2="1600"/></g>`,NAVY),
  'the-hero-call': () => F(`${stripes('rgba(220,227,204,.5)')}
  <rect x="0" y="700" width="1080" height="730" fill="#2F6B4F"/><rect x="0" y="1430" width="1080" height="180" fill="#6B4A32"/>
  <ellipse cx="540" cy="1180" rx="300" ry="112" fill="#28624A" stroke="${INK}" stroke-width="7"/>
  ${[400,490,580,670].map((x,i)=>stack(x,1210,[5,8,6,9][i],36,0)).join('')}
  ${stack(140,1120,6,52,1)}
  ${[820,890,960].map(x=>stack(x,1030,5,30,0)).join('')}
  <g fill="#D9C6A8" stroke="${INK}" stroke-width="7"><rect x="800" y="720" width="190" height="230" rx="60"/></g>
  ${caption('the call is correct')}`,PAPER),
  'outs-and-equity': () => F(`${bpBase()}
  <circle cx="540" cy="820" r="320" fill="none" stroke="${LAVF}" stroke-width="4"/>
  ${(()=>{let g='';for(let i=0;i<6;i++){const a=(i*60-90)*Math.PI/180;g+=`<circle cx="${540+Math.cos(a)*320}" cy="${820+Math.sin(a)*320}" r="17" fill="#FFF3DC"/>`}return g})()}
  <path d="M540 820 L540 560 A260 260 0 0 1 563 561 Z" fill="rgba(95,224,168,.7)" stroke="${MINT}" stroke-width="6"/>
  <line x1="563" y1="561" x2="576" y2="533" stroke="${MAG}" stroke-width="10"/>
  <g stroke="${LAV}" stroke-width="4" fill="none"><path d="M180 1520 L930 1520"/><path d="M180 1500 Q 560 1420 930 1250" stroke-dasharray="22 18" stroke="${LAVF}"/><path d="M180 1512 L560 1508 L930 1496" stroke="${MINT}" stroke-width="8"/></g>
  ${caption('one point four percent')}`,NAVY),
  'turn-and-river': () => F(`${stripes('rgba(220,227,204,.5)')}
  <rect x="0" y="1080" width="1080" height="400" fill="#2F6B4F"/><rect x="0" y="1480" width="1080" height="180" fill="#6B4A32"/>
  ${head('up')}
  ${[150,330,510,690,870].map((x,i)=>card(x,1150,150,210,0,i===4?'#FFFFFF':'#F7F0DE')).join('')}
  <circle cx="470" cy="800" r="340" fill="none" stroke="${MAG}" stroke-width="9" opacity=".8"/>
  <circle cx="470" cy="800" r="430" fill="none" stroke="rgba(234,181,48,.75)" stroke-width="7"/>`,PAPER),
  'tilt-response': () => F(`${bpBase()}${band(230,120)}
  <path d="M60 820 L200 820 L215 760 L235 940 L255 820 L420 820 L432 770 L450 930 L468 820 L600 820 L610 760 L626 950 L642 820 L740 820 L748 750 L762 960 L776 820 L880 820" fill="none" stroke="${MINT}" stroke-width="8"/>
  <line x1="940" y1="640" x2="940" y2="1000" stroke="${MAG}" stroke-width="9"/>
  <path d="M120 1300 L360 1300 L360 1320 L600 1320 L600 1340 L760 1340 L760 1560 L960 1560" fill="none" stroke="${MINT}" stroke-width="8" opacity=".9"/>
  ${caption('the correct play, punished')}`,NAVY),
  'stage-maniac': () => F(`${tableFrame()}${head('flat',{dy:-18})}
  ${stack(830,1180,14,54,1)}
  <g stroke="${INK}" stroke-width="8" fill="none"><path d="M790 1120 L580 1080"/><path d="M612 1062 L580 1080 L596 1108"/></g>
  ${[430,500,620,690].map((x,i)=>`<ellipse cx="${x}" cy="${1040+((i*53)%60)}" rx="46" ry="15" fill="#B8372C" stroke="${INK}" stroke-width="5" transform="rotate(${(i*37)%40-20} ${x} ${1040+((i*53)%60)})"/>`).join('')}
  ${caption('one win. it is sufficient.')}`,PAPER),
  'stage-nit': () => F(`${tableFrame()}${head('low',{dy:54,noGlasses:true})}
  ${stack(830,1180,3,52,0)}
  ${card(300,1210,110,150,-14,'#E8DFCB')}
  <g stroke="${INK}" stroke-width="7" fill="none"><path d="M330 1180 L250 1130"/></g>
  ${caption('this is the adult form')}`,PAPER),
  'the-ecosystem': () => F(`${stripes('rgba(239,220,163,.6)')}
  <ellipse cx="540" cy="1010" rx="430" ry="330" fill="#2F6B4F" stroke="#6B4A32" stroke-width="46"/>
  ${head('fwd',{dy:-300})}
  <ellipse cx="540" cy="1010" rx="70" ry="26" fill="#F0E7D4" stroke="${INK}" stroke-width="6"/>
  ${(()=>{let g='';for(let i=0;i<8;i++){const a=(i*45+22.5)*Math.PI/180;const x=540+Math.cos(a)*380,y=1010+Math.sin(a)*290;
    g+=`<path d="M540 1010 Q ${540+Math.cos(a)*220} ${1010+Math.sin(a)*150} ${x} ${y}" fill="none" stroke="rgba(234,181,48,.95)" stroke-width="7"/>`;
    g+=`<rect x="${x-52}" y="${y-30}" width="104" height="60" rx="26" fill="#D9C6A8" stroke="${INK}" stroke-width="6"/>`;
    g+=`<circle cx="${540+Math.cos(a)*250}" cy="${1010+Math.sin(a)*180}" r="13" fill="#F0E7D4" stroke="${INK}" stroke-width="4"/>`}return g})()}
  ${caption('the pond needs him',1700)}`,PAPER),
  'cycle-loop': () => F(`${bpBase()}
  <circle cx="540" cy="880" r="300" fill="none" stroke="${MINT}" stroke-width="9"/>
  ${[[540,580],[840,880],[540,1180],[240,880]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="86" fill="${NAVY}" stroke="${LAV}" stroke-width="7"/>`).join('')}
  <path d="M240 880 A300 300 0 0 1 540 580" fill="none" stroke="${MAG}" stroke-width="12"/>
  <circle cx="540" cy="880" r="150" fill="none" stroke="${LAV}" stroke-width="7"/>
  <text x="540" y="1560" text-anchor="middle" font-family="monospace" font-size="50" fill="${LAV}" letter-spacing="7">the life of a donkey</text>`,NAVY),
};
