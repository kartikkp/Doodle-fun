export const LETTER_DATA={
  upper:[
    {ch:'A',word:'Apple',em:'🍎'},{ch:'B',word:'Ball',em:'🏀'},{ch:'C',word:'Cat',em:'🐱'},
    {ch:'D',word:'Dog',em:'🐶'},{ch:'E',word:'Egg',em:'🥚'},{ch:'F',word:'Fish',em:'🐟'},
    {ch:'G',word:'Grapes',em:'🍇'},{ch:'H',word:'Hat',em:'🎩'},{ch:'I',word:'Ice cream',em:'🍦'},
    {ch:'J',word:'Juice',em:'🧃'},{ch:'K',word:'Kite',em:'🪁'},{ch:'L',word:'Lion',em:'🦁'},
    {ch:'M',word:'Moon',em:'🌙'},{ch:'N',word:'Nest',em:'🪺'},{ch:'O',word:'Orange',em:'🍊'},
    {ch:'P',word:'Pizza',em:'🍕'},{ch:'Q',word:'Question',em:'❓'},{ch:'R',word:'Rainbow',em:'🌈'},
    {ch:'S',word:'Star',em:'⭐'},{ch:'T',word:'Train',em:'🚂'},{ch:'U',word:'Umbrella',em:'☂️'},
    {ch:'V',word:'Violin',em:'🎻'},{ch:'W',word:'Whale',em:'🐋'},{ch:'X',word:'X-ray',em:'🩻'},
    {ch:'Y',word:'Yarn',em:'🧶'},{ch:'Z',word:'Zebra',em:'🦓'},
  ],
  lower:[
    {ch:'a',word:'ant',em:'🐜'},{ch:'b',word:'bee',em:'🐝'},{ch:'c',word:'cow',em:'🐄'},
    {ch:'d',word:'duck',em:'🦆'},{ch:'e',word:'egg',em:'🥚'},{ch:'f',word:'frog',em:'🐸'},
    {ch:'g',word:'goat',em:'🐐'},{ch:'h',word:'hen',em:'🐔'},{ch:'i',word:'insect',em:'🐛'},
    {ch:'j',word:'jellyfish',em:'🪼'},{ch:'k',word:'koala',em:'🐨'},{ch:'l',word:'ladybug',em:'🐞'},
    {ch:'m',word:'mouse',em:'🐭'},{ch:'n',word:'nest',em:'🪺'},{ch:'o',word:'owl',em:'🦉'},
    {ch:'p',word:'penguin',em:'🐧'},{ch:'q',word:'question',em:'❓'},{ch:'r',word:'rabbit',em:'🐰'},
    {ch:'s',word:'snail',em:'🐌'},{ch:'t',word:'turtle',em:'🐢'},{ch:'u',word:'unicorn',em:'🦄'},
    {ch:'v',word:'violin',em:'🎻'},{ch:'w',word:'wolf',em:'🐺'},{ch:'x',word:'x-ray',em:'🩻'},
    {ch:'y',word:'yarn',em:'🧶'},{ch:'z',word:'zebra',em:'🦓'},
  ],
  nums: ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'].map((word, i) => ({ch: String(i), word, em: '●'})),
};

export const STROKES={
  'A':[[[.35,.85],[.5,.15],[.65,.85]],[[.28,.6],[.72,.6]]],
  'B':[[[.28,.15],[.28,.85]],[[.28,.15],[.58,.15],[.68,.22],[.68,.35],[.58,.48],[.28,.48]],[[.28,.48],[.58,.48],[.7,.58],[.7,.72],[.58,.85],[.28,.85]]],
  'C':[[[.7,.3],[.55,.15],[.38,.15],[.25,.3],[.25,.7],[.38,.85],[.55,.85],[.7,.7]]],
  'D':[[[.28,.15],[.28,.85]],[[.28,.15],[.52,.15],[.68,.28],[.68,.72],[.52,.85],[.28,.85]]],
  'E':[[[.65,.15],[.28,.15],[.28,.85],[.65,.85]],[[.28,.5],[.58,.5]]],
  'F':[[[.28,.15],[.28,.85]],[[.28,.15],[.65,.15]],[[.28,.5],[.58,.5]]],
  'G':[[[.7,.3],[.55,.15],[.38,.15],[.25,.3],[.25,.7],[.38,.85],[.55,.85],[.7,.72],[.7,.5],[.52,.5]]],
  'H':[[[.28,.15],[.28,.85]],[[.72,.15],[.72,.85]],[[.28,.5],[.72,.5]]],
  'I':[[[.36,.15],[.64,.15]],[[.5,.15],[.5,.85]],[[.36,.85],[.64,.85]]],
  'J':[[[.62,.15],[.62,.72],[.5,.85],[.36,.85],[.26,.72]]],
  'K':[[[.28,.15],[.28,.85]],[[.68,.15],[.28,.5],[.68,.85]]],
  'L':[[[.28,.15],[.28,.85],[.68,.85]]],
  'M':[[[.22,.85],[.22,.15],[.5,.52],[.78,.15],[.78,.85]]],
  'N':[[[.28,.85],[.28,.15],[.72,.85],[.72,.15]]],
  'O':[[[.5,.15],[.72,.28],[.72,.72],[.5,.85],[.28,.72],[.28,.28],[.5,.15]]],
  'P':[[[.28,.15],[.28,.85]],[[.28,.15],[.58,.15],[.68,.25],[.68,.4],[.58,.5],[.28,.5]]],
  'Q':[[[.5,.15],[.72,.28],[.72,.72],[.5,.85],[.28,.72],[.28,.28],[.5,.15]],[[.58,.72],[.74,.88]]],
  'R':[[[.28,.15],[.28,.85]],[[.28,.15],[.58,.15],[.68,.25],[.68,.4],[.58,.5],[.28,.5],[.68,.85]]],
  'S':[[[.68,.25],[.55,.15],[.38,.15],[.28,.28],[.38,.45],[.62,.55],[.72,.68],[.62,.85],[.42,.85],[.28,.75]]],
  'T':[[[.28,.15],[.72,.15]],[[.5,.15],[.5,.85]]],
  'U':[[[.28,.15],[.28,.72],[.38,.85],[.5,.88],[.62,.85],[.72,.72],[.72,.15]]],
  'V':[[[.25,.15],[.5,.85],[.75,.15]]],
  'W':[[[.18,.15],[.32,.85],[.5,.55],[.68,.85],[.82,.15]]],
  'X':[[[.28,.15],[.72,.85]],[[.72,.15],[.28,.85]]],
  'Y':[[[.28,.15],[.5,.52],[.72,.15]],[[.5,.52],[.5,.85]]],
  'Z':[[[.28,.15],[.72,.15],[.28,.85],[.72,.85]]],
  'a':[[[.65,.42],[.42,.35],[.28,.5],[.28,.7],[.42,.82],[.58,.78],[.65,.65],[.65,.42]],[[.65,.42],[.65,.82]]],
  'b':[[[.28,.15],[.28,.82]],[[.28,.52],[.42,.4],[.58,.42],[.65,.56],[.62,.7],[.5,.82],[.35,.82],[.28,.72]]],
  'c':[[[.65,.48],[.5,.38],[.35,.42],[.28,.56],[.3,.7],[.42,.8],[.58,.8],[.65,.7]]],
  'd':[[[.65,.15],[.65,.82]],[[.65,.52],[.5,.4],[.35,.42],[.28,.56],[.3,.7],[.42,.8],[.58,.8],[.65,.7]]],
  'e':[[[.28,.58],[.65,.58],[.65,.48],[.52,.38],[.36,.4],[.28,.54],[.28,.68],[.38,.8],[.55,.82],[.66,.74]]],
  'f':[[[.62,.2],[.52,.15],[.4,.22],[.38,.38],[.38,.82]],[[.28,.45],[.56,.45]]],
  'g':[[[.65,.42],[.42,.35],[.28,.5],[.28,.7],[.42,.82],[.58,.78],[.65,.65],[.65,.42]],[[.65,.42],[.65,.95],[.55,1.02],[.4,1.0],[.28,.93]]],
  'h':[[[.28,.15],[.28,.82]],[[.28,.56],[.42,.42],[.58,.4],[.65,.52],[.65,.82]]],
  'i':[[[.5,.38],[.5,.82]],[[.5,.22],[.5,.27]]],
  'j':[[[.58,.38],[.58,.92],[.48,.99],[.35,.96]],[[.58,.22],[.58,.27]]],
  'k':[[[.28,.15],[.28,.82]],[[.62,.38],[.28,.62],[.62,.82]]],
  'l':[[[.5,.15],[.5,.78],[.55,.82]]],
  'm':[[[.22,.38],[.22,.82]],[[.22,.52],[.35,.4],[.5,.42],[.55,.52],[.55,.82]],[[.55,.52],[.68,.4],[.78,.42],[.82,.52],[.82,.82]]],
  'n':[[[.28,.38],[.28,.82]],[[.28,.54],[.42,.4],[.58,.4],[.65,.54],[.65,.82]]],
  'o':[[[.5,.38],[.65,.5],[.65,.68],[.5,.8],[.35,.68],[.35,.5],[.5,.38]]],
  'p':[[[.28,.38],[.28,1.0]],[[.28,.52],[.42,.4],[.58,.42],[.65,.56],[.62,.7],[.5,.82],[.35,.82],[.28,.72]]],
  'q':[[[.65,.38],[.65,1.0]],[[.65,.52],[.5,.4],[.35,.42],[.28,.56],[.3,.7],[.42,.8],[.58,.8],[.65,.7]]],
  'r':[[[.28,.38],[.28,.82]],[[.28,.54],[.4,.42],[.52,.38],[.6,.4]]],
  's':[[[.63,.44],[.52,.38],[.38,.38],[.28,.48],[.38,.58],[.55,.62],[.65,.72],[.55,.82],[.38,.82],[.28,.74]]],
  't':[[[.5,.2],[.5,.75],[.56,.82]],[[.32,.45],[.62,.45]]],
  'u':[[[.28,.38],[.28,.68],[.38,.8],[.52,.8],[.65,.68],[.65,.38],[.65,.82]]],
  'v':[[[.28,.38],[.5,.82],[.72,.38]]],
  'w':[[[.22,.38],[.34,.82],[.5,.6],[.66,.82],[.78,.38]]],
  'x':[[[.28,.38],[.65,.82]],[[.65,.38],[.28,.82]]],
  'y':[[[.28,.38],[.5,.65],[.72,.38]],[[.5,.65],[.38,.9],[.28,.95]]],
  'z':[[[.28,.38],[.65,.38],[.28,.82],[.65,.82]]],
  '1':[[[.38,.25],[.5,.18],[.5,.82]],[[.32,.82],[.68,.82]]],
  '2':[[[.3,.3],[.38,.2],[.52,.18],[.65,.28],[.65,.42],[.28,.78],[.28,.82],[.72,.82]]],
  '3':[[[.3,.2],[.62,.2],[.5,.5],[.65,.62],[.62,.78],[.48,.85],[.32,.82]]],
  '4':[[[.58,.82],[.58,.18],[.22,.62],[.75,.62]]],
  '5':[[[.65,.18],[.28,.18],[.25,.48],[.4,.42],[.58,.45],[.68,.58],[.65,.75],[.5,.85],[.32,.82]]],
  '6':[[[.65,.22],[.48,.18],[.32,.32],[.25,.52],[.28,.7],[.42,.82],[.58,.82],[.7,.7],[.68,.54],[.52,.44],[.35,.5]]],
  '7':[[[.28,.2],[.72,.2],[.38,.82]]],
  '8':[[[.5,.18],[.65,.28],[.65,.42],[.5,.52],[.35,.42],[.35,.28],[.5,.18]],[[.5,.52],[.35,.62],[.35,.75],[.5,.85],[.65,.75],[.65,.62],[.5,.52]]],
  '9':[[[.5,.2],[.35,.22],[.28,.35],[.32,.5],[.46,.58],[.62,.56],[.7,.42],[.65,.28],[.5,.2]],[[.62,.56],[.58,.82],[.44,.9]]],
  '0':[[[.5,.18],[.68,.3],[.72,.5],[.68,.7],[.5,.85],[.32,.7],[.28,.5],[.32,.3],[.5,.18]]],
};

// Keep ascenders, x-height, baseline, and descenders inside the same square.
// The original g, j, p, and q extended beyond its drawing surface.
for (const ch of 'abcdefghijklmnopqrstuvwxyz') {
  STROKES[ch] = STROKES[ch].map(stroke => stroke.map(([x, y]) => [x,
    y <= .82 ? .18 + (y - .15) * (.58 / .67) : .76 + (y - .82) * .75,
  ]));
}
// A crossbar should meet both sides of A; 4 starts at its top.
STROKES.A = [[[.5,.18],[.28,.82]],[[.5,.18],[.72,.82]],[[.36,.59],[.64,.59]]];
STROKES['4'] = [[[.58,.18],[.25,.61],[.74,.61]],[[.58,.18],[.58,.82]]];
STROKES['3'] = [[[.3,.24],[.4,.18],[.56,.18],[.67,.27],[.65,.38],[.53,.48],[.43,.48]],[[.53,.48],[.67,.57],[.68,.71],[.57,.82],[.41,.84],[.3,.77]]];
STROKES['6'] = [[[.65,.22],[.48,.18],[.32,.32],[.25,.52],[.28,.7],[.42,.82],[.58,.82],[.7,.7],[.68,.54],[.52,.44],[.35,.5],[.25,.59]]];

const circle = Array.from({length: 49}, (_, i) => {
  const angle = -Math.PI / 2 - i / 48 * Math.PI * 2;
  return [.5 + Math.cos(angle) * .29, .5 + Math.sin(angle) * .29];
});
export const SHAPES = [
  {ch:'line',label:'Down',word:'A line from top to bottom',em:'↓',strokes:[[[.5,.2],[.5,.8]]]},
  {ch:'across',label:'Across',word:'A line from left to right',em:'→',strokes:[[[.2,.5],[.8,.5]]]},
  {ch:'circle',label:'Circle',word:'Go around and join the ends',em:'○',strokes:[circle]},
  {ch:'cross',label:'Cross',word:'One line down, one line across',em:'＋',strokes:[[[.5,.2],[.5,.8]],[[.2,.5],[.8,.5]]]},
  {ch:'square',label:'Square',word:'Four straight sides',em:'□',strokes:[[[.25,.25],[.25,.75],[.75,.75],[.75,.25],[.25,.25]]]},
  {ch:'triangle',label:'Triangle',word:'Three straight sides',em:'△',strokes:[[[.5,.2],[.2,.75],[.8,.75],[.5,.2]]]},
  {ch:'wave',label:'Waves',word:'Travel up and down',em:'∿',strokes:[Array.from({length: 61}, (_, i) => [.15+i/60*.7,.5-Math.sin(i/60*Math.PI*4)*.18])]},
  {ch:'zigzag',label:'Zigzag',word:'Make a mountain path',em:'⌁',strokes:[[[.18,.7],[.34,.3],[.5,.7],[.66,.3],[.82,.7]]]},
];
export const WORDS = [
  {ch:'cat',word:'cat',em:'🐱'}, {ch:'sun',word:'sun',em:'☀️'},
  {ch:'dog',word:'dog',em:'🐶'}, {ch:'map',word:'map',em:'🗺️'},
  {ch:'box',word:'box',em:'📦'}, {ch:'red',word:'red',em:'🔴'},
];
export function makeWordStrokes(word) {
  return [...word].flatMap((ch, i) => (STROKES[ch] || []).map(stroke =>
    stroke.map(([x,y]) => [x*.4 + i*.28 + .02, y*.4 + .29])));
}
export function getLearningItems(set) {
  if (set === 'shapes') return SHAPES;
  if (set === 'words') return WORDS.map(item => ({...item, strokes: makeWordStrokes(item.ch)}));
  return (LETTER_DATA[set] || LETTER_DATA.upper).map(item => ({...item, strokes:STROKES[item.ch]}));
}

export function pathLength(path) {
  return path.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0]-path[i][0],point[1]-path[i][1]), 0);
}
export function samplePath(path, spacing=.01) {
  if (!path.length) return [];
  const samples = [path[0]];
  // Sampling by distance prevents fast pointer events or long line segments
  // from skipping target coverage, and weights precision by ink length.
  for (let i=1;i<path.length;i++) {
    const a=path[i-1], b=path[i], steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/spacing));
    for (let n=1;n<=steps;n++) samples.push([a[0]+(b[0]-a[0])*n/steps,a[1]+(b[1]-a[1])*n/steps]);
  }
  return samples;
}
function distanceToPath(point, path) {
  let closest=Infinity;
  for (let i=0;i<path.length;i++) {
    const a=path[i], b=path[i+1] || a, dx=b[0]-a[0], dy=b[1]-a[1], length=dx*dx+dy*dy;
    const t=length ? Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/length)) : 0;
    closest=Math.min(closest,Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dy));
  }
  return closest;
}
function projectToPath(point, path) {
  let distance=Infinity,position=0,offset=0;
  for(let i=1;i<path.length;i++) {
    const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
    const t=length?Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(length*length))):0;
    const current=Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dy);
    if(current<distance){distance=current;position=offset+t*length;}
    offset+=length;
  }
  return {distance,position};
}
function traversalCoverage(target, sampledInk, tolerance) {
  const intervals=[];
  for(const path of sampledInk)for(let i=1;i<path.length;i++) {
    const a=projectToPath(path[i-1],target),b=projectToPath(path[i],target);
    const distance=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);
    // Credit the part of a guide actually travelled along. Tolerance makes
    // near-path writing friendly, but does not turn stationary dots into ink.
    // Reject projection jumps at crossings or a closed path's start/end.
    if(a.distance<=tolerance&&b.distance<=tolerance&&Math.abs(b.position-a.position)<=distance*1.6+.001)
      intervals.push([Math.min(a.position,b.position),Math.max(a.position,b.position)]);
  }
  intervals.sort((a,b)=>a[0]-b[0]);let total=0,end=0;
  for(const [start,finish]of intervals){total+=Math.max(0,finish-Math.max(start,end));end=Math.max(end,finish);}
  return total/Math.max(.0001,pathLength(target));
}
export function evaluateTrace(targets, ink, options={}) {
  const tolerance=options.tolerance ?? .045, requiredCoverage=options.coverage ?? .8, requiredPrecision=options.precision ?? .6;
  const valid=path => Array.isArray(path) && path.length>0 && path.every(p => Array.isArray(p) && p.length===2 && p.every(Number.isFinite));
  if (!targets.length || !targets.every(valid)) return {passed:false,coverage:[],precision:0,completed:0,reason:'empty'};
  const paths=ink.filter(valid), drawnLength=paths.reduce((sum,path)=>sum+pathLength(path),0);
  const targetLength=targets.reduce((sum,path)=>sum+pathLength(path),0);
  if (drawnLength>targetLength*3.5) return {passed:false,coverage:targets.map(()=>0),precision:0,completed:0,drawnLength,targetLength,reason:'extra-ink'};
  const movingPaths=paths.filter(path=>pathLength(path)>.004);
  const near=(point,paths) => paths.some(path=>distanceToPath(point,path)<=tolerance);
  const coverage=targets.map(path=>{const samples=samplePath(path);return samples.filter(p=>near(p,movingPaths)).length/samples.length;});
  const sampledInk=movingPaths.map(path=>samplePath(path,.008)),samples=sampledInk.flat();
  const traversal=targets.map(path=>traversalCoverage(path,sampledInk,tolerance));
  const precision=samples.length ? samples.filter(p=>near(p,targets)).length/samples.length : 0;
  const completed=coverage.filter((value,i)=>value>=requiredCoverage&&traversal[i]>=requiredCoverage*.8).length;
  const enoughInk=drawnLength>=targetLength*.5, notExcessive=drawnLength<=targetLength*3.5;
  const passed=completed===targets.length && precision>=requiredPrecision && enoughInk && notExcessive;
  return {passed,coverage,traversal,precision,completed,drawnLength,targetLength,
    reason:passed?'complete':!enoughInk?'keep-going':completed<targets.length?'coverage':!notExcessive?'extra-ink':'precision'};
}

export function buildQuantityQuestion(value, mode='count', max=10, variant=0) {
  const number=Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
  if (mode==='add') {
    const left=(Math.floor(number/2)+Math.abs(Math.floor(variant)))%(number+1),right=number-left;
    return {answer:number,left,right,prompt:`${left} + ${right} = ?`,spoken:`What is ${left} plus ${right}?`,mode};
  }
  if (mode==='groups') {
    const possibilities=[];
    for(let groups=2;groups<=4;groups++)for(let each=1;each<=5;each++)if(groups*each<=max)possibilities.push({groups,each});
    const selected=possibilities[Math.abs(Math.floor(variant))%possibilities.length]||{groups:2,each:1};
    return {...selected,answer:selected.groups*selected.each,prompt:`${selected.groups} groups of ${selected.each}. How many?`,spoken:`There are ${selected.groups} groups of ${selected.each} dots. How many dots altogether?`,mode};
  }
  return {answer:number,prompt:number===0?'How many dots in the empty frame?':'How many dots can you count?',spoken:number===0?'How many dots are in the empty frame?':'How many dots can you count?',mode:'count'};
}
