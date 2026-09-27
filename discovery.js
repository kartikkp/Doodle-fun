import { getProfile, readStore, writeStore } from './core.js';
import { canSpeak, requestSpeech, stopSpeaking } from './speech.js';
import { objectArt } from './activity-art.js';

export const DISCOVERY_IDS = ['shape-match', 'color-match', 'patterns', 'sorting', 'odd-one-out', 'memory', 'maze'];
const META = {
  'shape-match': ['Shape detective', 'Look closely. Find the shape.', '◇'],
  'color-match': ['Color buddies', 'Look for a matching color.', '●'],
  patterns: ['Pattern parade', 'What comes next?', '✦'],
  sorting: ['Sort it out', 'Find a home for every picture.', '▧'],
  'odd-one-out': ['Spot the difference', 'One picture has something different.', '◉'],
  memory: ['Memory garden', 'Turn two cards. Find a matching pair.', '❀'],
  maze: ['Little pathfinder', 'Help Bunny find the carrot.', '↝'],
};
const SHAPES = [
  { id: 'circle', name: 'Circle', clue: 'It is round, with no corners.', svg: '<circle cx="50" cy="50" r="35"/>' },
  { id: 'square', name: 'Square', clue: 'It has four equal sides and four square corners.', svg: '<rect x="18" y="18" width="64" height="64" rx="2"/>' },
  { id: 'triangle', name: 'Triangle', clue: 'It has three sides and three corners.', svg: '<path d="M50 12 90 85H10Z"/>' },
  { id: 'rectangle', name: 'Rectangle', clue: 'It has four square corners. This one is longer than it is tall.', svg: '<rect x="9" y="28" width="82" height="44" rx="2"/>' },
  { id: 'oval', name: 'Oval', clue: 'It is a stretched circle, with no corners.', svg: '<ellipse cx="50" cy="50" rx="42" ry="27"/>' },
  { id: 'star', name: 'Star', clue: 'It has five points.', svg: '<path d="m50 7 13 28 31 4-23 22 6 32-27-15-27 15 6-32L6 39l31-4Z"/>' },
  { id: 'pentagon', name: 'Pentagon', clue: 'It has five straight sides.', svg: '<path d="m50 9 41 30-16 48H25L9 39Z"/>' },
  { id: 'hexagon', name: 'Hexagon', clue: 'It has six straight sides.', svg: '<path d="M28 12h44l22 38-22 38H28L6 50Z"/>' },
];
const COLORS = [
  { id: 'red', name: 'Red', color: '#db5058' }, { id: 'blue', name: 'Blue', color: '#398ace' },
  { id: 'yellow', name: 'Yellow', color: '#edc93e' }, { id: 'green', name: 'Green', color: '#389365' },
  { id: 'orange', name: 'Orange', color: '#eb9037' }, { id: 'purple', name: 'Purple', color: '#825abe' },
  { id: 'pink', name: 'Pink', color: '#e591be' }, { id: 'brown', name: 'Brown', color: '#926445' },
  { id: 'navy', name: 'Navy blue', color: '#253b74' }, { id: 'turquoise', name: 'Turquoise', color: '#2ca5a2' },
];
const TOKENS = [
  { id: 'sun', name: 'Sun', emoji: '☀️' }, { id: 'moon', name: 'Moon', emoji: '🌙' },
  { id: 'star', name: 'Star', emoji: '⭐' }, { id: 'flower', name: 'Flower', emoji: '🌸' },
  { id: 'leaf', name: 'Leaf', emoji: '🍃' }, { id: 'rainbow', name: 'Rainbow', emoji: '🌈' },
];
const MEMORY = [
  { id: 'cat', name: 'Cat', emoji: '🐱' }, { id: 'frog', name: 'Frog', emoji: '🐸' },
  { id: 'fox', name: 'Fox', emoji: '🦊' }, { id: 'butterfly', name: 'Butterfly', emoji: '🦋' },
  { id: 'bee', name: 'Bee', emoji: '🐝' }, { id: 'ladybug', name: 'Ladybug', emoji: '🐞' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰' }, { id: 'owl', name: 'Owl', emoji: '🦉' },
];
export function discoveryConfig(value) {
  const age = Math.max(2, Math.min(10, Math.round(Number(value) || ({little:3,explorer:6,maker:9}[value]) || 6))), i = age - 2;
  const fields = {
    choices:[2,2,3,3,4,4,5,6,6], memoryPairs:[2,2,3,3,4,4,5,6,6], mazeSize:[3,3,4,4,5,5,6,6,6],
    sortCategories:[2,2,2,4,2,2,2,4,3], sortItemsEach:[2,3,3,2,3,2,2,3,3],
    shapePool:[2,3,4,5,6,7,8,8,8], colorPool:[4,5,6,7,8,8,9,10,10], oddCount:[3,3,3,4,4,5,5,6,6],
  };
  return {age,tier:age<=4?'little':age<=7?'explorer':'maker',...Object.fromEntries(Object.entries(fields).map(([key,values])=>[key,values[i]]))};
}
function shuffle(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1)))); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function choicesFor(target, pool, count, random) { return shuffle([target, ...shuffle(pool.filter(item => item.id !== target.id), random).slice(0, count - 1)], random); }
export function makeMaze(size, random = Math.random) {
  const cells = Array.from({ length: size * size }, () => []), visited = new Set([0]), stack = [0];
  while (stack.length) {
    const current = stack[stack.length - 1], x = current % size, y = Math.floor(current / size);
    const candidates = [x > 0 ? current - 1 : -1, x < size - 1 ? current + 1 : -1, y > 0 ? current - size : -1, y < size - 1 ? current + size : -1].filter(next => next >= 0 && !visited.has(next));
    if (!candidates.length) { stack.pop(); continue; }
    const next = shuffle(candidates, random)[0];
    cells[current].push(next); cells[next].push(current); visited.add(next); stack.push(next);
  }
  // Put the carrot at the farthest reachable cell, never next to the start.
  const distances = Array(size * size).fill(-1), queue = [0]; distances[0] = 0;
  for (let i = 0; i < queue.length; i++) for (const next of cells[queue[i]]) if (distances[next] < 0) { distances[next] = distances[queue[i]] + 1; queue.push(next); }
  return { size, cells, start: 0, goal: distances.indexOf(Math.max(...distances)) };
}
export function mazeStep(maze, path, next) {
  return Number.isInteger(next) && maze.cells[path[path.length - 1]]?.includes(next) ? [...path, next] : path;
}
function numberToken(value) { return {id:`number-${value}`,name:String(value),text:String(value)}; }
function numberPattern(age,index,random) {
  const n=Math.max(0,Math.floor(index)),kind=n%3,start=4+n%7,step=3+n%5,values=[start];
  let rule;
  for(let i=0;i<6;i++) {
    const previous=values.at(-1);
    values.push(age===9 ? kind===0?previous+step:kind===1?previous*2:previous+(i%2===0?step:2)
      : kind===0?previous+(i%2===0?step+2:-2):kind===1?previous+(i+2):i%2===0?previous*2:previous-3);
  }
  if(age===9)rule=kind===0?`Add ${step} each time.`:kind===1?'Double each number.':`Take turns: add ${step}, then add 2.`;
  else rule=kind===0?`Take turns: add ${step+2}, then subtract 2.`:kind===1?'Add 2, then 3, then 4: the amount added grows by 1 each time.':'Take turns: double, then subtract 3.';
  const missingIndex=[2,4,6][Math.floor(n/3)%3],target=numberToken(values[missingIndex]);
  const alternatives=new Set([target.text, String(values[missingIndex-1]), String(values[missingIndex-1]+1), String(values[missingIndex]+step)]);
  for(let delta=2;alternatives.size<4;delta++)alternatives.add(String(values[missingIndex]+delta));
  const choices=shuffle([...alternatives].slice(0,4).map(Number).map(numberToken),random);
  return {id:'patterns',tier:'maker',age,kind:'number-rule',values,missingIndex,rule,sequence:values.map(numberToken),target,choices,answer:target.id};
}
function relatedMemory(age,index,random) {
  const n=Math.max(0,Math.floor(index)),pairs=discoveryConfig(age).memoryPairs;
  const values=Array.from({length:8},(_,i)=>i+2);
  const relations=age===5?values.map(value=>({id:`quantity-${value}`,faces:[{dots:value,name:`${value} dots`},{text:String(value),name:String(value)}],meaning:`${value} dots and the numeral ${value}`}))
    :age===6?['A','B','D','G','H','M','Q','R'].map(letter=>({id:`letter-${letter}`,faces:[{text:letter,name:letter},{text:letter.toLowerCase(),name:letter.toLowerCase()}],meaning:`${letter} and ${letter.toLowerCase()} are the same letter`}))
    :age===7?values.map(value=>({id:`sum-${value+3}`,faces:[{text:`${value} + 3`,name:`${value} plus 3`},{text:String(value+3),name:String(value+3)}],meaning:`${value} + 3 = ${value+3}`}))
    :age===8?[[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5]].map(([a,b])=>({id:`part-${a}-${b}`,faces:[{text:`${a}/${b}`,name:`${a}/${b}`},{parts:[a,b],name:`${a} of ${b} equal parts shaded`}],meaning:`${a} of ${b} equal parts is ${a}/${b}`}))
    :age===9?[[3,4],[3,6],[4,6],[4,7],[5,7],[6,7],[6,8],[7,8]].map(([a,b])=>({id:`product-${a*b}`,faces:[{text:`${a} × ${b}`,name:`${a} times ${b}`},{text:String(a*b),name:String(a*b)}],meaning:`${a} × ${b} = ${a*b}`}))
    :[[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5]].map(([a,b],i)=>{const scale=2+(n+i)%3;return{id:`fraction-${a}-${b}`,faces:[{text:`${a}/${b}`,name:`${a}/${b}`},{text:`${a*scale}/${b*scale}`,name:`${a*scale}/${b*scale}`}],meaning:`${a}/${b} = ${a*scale}/${b*scale}`};});
  const relation=({5:'quantities',6:'letters',7:'sums',8:'parts',9:'products',10:'fractions'})[age];
  return {id:'memory',tier:discoveryConfig(age).tier,age,pairs,relation,cards:shuffle(shuffle(relations,random).slice(0,pairs).flatMap(pair=>pair.faces.map((face,i)=>({...face,id:pair.id,key:`${pair.id}-${i}`,meaning:pair.meaning}))),random)};
}
export function mazeRoute(maze,start,goal) {
  const queue=[[start]],seen=new Set([start]);
  for(let i=0;i<queue.length;i++){const path=queue[i],cell=path.at(-1);if(cell===goal)return path;for(const next of maze.cells[cell]||[])if(!seen.has(next)){seen.add(next);queue.push([...path,next]);}}
  return [];
}
export function mazeCheckpointProgress(maze,path) {
  let collected=0;for(const cell of path)if(cell===maze.checkpoints?.[collected])collected++;
  return collected;
}
function planningMaze(age,config,random) {
  const maze=makeMaze(config.mazeSize,random),direct=mazeRoute(maze,maze.start,maze.goal),interior=maze.cells.map((_,i)=>i).filter(i=>i!==maze.start&&i!==maze.goal);
  // An off-route checkpoint requires a detour. A corridor-only maze instead
  // visits a far point before a near point, so the plan still needs backtracking.
  const offRoute=interior.filter(i=>!direct.includes(i));
  const first=offRoute.length?shuffle(offRoute,random)[0]:direct[Math.max(2,direct.length-3)];
  const second=direct[1];
  return {id:'maze',tier:'maker',age,...maze,checkpoints:age===7||age===9?[first]:[first,second]};
}
const SHAPE_FACTS={circle:{sides:0,corners:0,rightAngles:0,equalSides:false},square:{sides:4,corners:4,rightAngles:4,equalSides:true},triangle:{sides:3,corners:3,rightAngles:0,equalSides:false},rectangle:{sides:4,corners:4,rightAngles:4,equalSides:false},oval:{sides:0,corners:0,rightAngles:0,equalSides:false},star:{sides:10,corners:10,rightAngles:0,equalSides:false},pentagon:{sides:5,corners:5,rightAngles:0,equalSides:true},hexagon:{sides:6,corners:6,rightAngles:0,equalSides:true}};
function polygon(name,id,points) {
  const edges=points.map((point,i)=>[points[(i+1)%points.length][0]-point[0],points[(i+1)%points.length][1]-point[1]]),lengths=edges.map(([x,y])=>Math.hypot(x,y));
  let parallelPairs=0,rightAngles=0,obtuseAngles=0;
  edges.forEach((edge,i)=>{for(let j=i+1;j<edges.length;j++)if(Math.abs(edge[0]*edges[j][1]-edge[1]*edges[j][0])/(lengths[i]*lengths[j])<.001)parallelPairs++;
    const previous=edges[(i+edges.length-1)%edges.length],dot=-previous[0]*edge[0]-previous[1]*edge[1],normalized=dot/(lengths[i]*lengths[(i+edges.length-1)%edges.length]);if(Math.abs(normalized)<.001)rightAngles++;else if(normalized<0)obtuseAngles++;
  });
  const center=points.reduce((sum,[x,y])=>[sum[0]+x/points.length,sum[1]+y/points.length],[0,0]),axes=[];
  for(let i=0;i<points.length;i++)for(const point of [points[i],[(points[i][0]+points[(i+1)%points.length][0])/2,(points[i][1]+points[(i+1)%points.length][1])/2]]){
    const dx=point[0]-center[0],dy=point[1]-center[1],length=Math.hypot(dx,dy);if(length<.001)continue;const ux=dx/length,uy=dy/length;
    if(axes.some(([x,y])=>Math.abs(x*uy-y*ux)<.001))continue;
    if(points.every(([x,y])=>{const px=x-center[0],py=y-center[1],projection=px*ux+py*uy,rx=2*projection*ux-px+center[0],ry=2*projection*uy-py+center[1];return points.some(([a,b])=>Math.hypot(a-rx,b-ry)<.01);}))axes.push([ux,uy]);
  }
  return{id,name,points,svg:`<polygon points="${points.map(point=>point.join(',')).join(' ')}"/>`,sides:points.length,corners:points.length,rightAngles,obtuseAngles,parallelPairs,symmetry:axes.length,equalSides:Math.max(...lengths)-Math.min(...lengths)<.01};
}
const regular=(count)=>Array.from({length:count},(_,i)=>[50+38*Math.cos(-Math.PI/2+i*Math.PI*2/count),50+38*Math.sin(-Math.PI/2+i*Math.PI*2/count)]);
const PROPERTY_SHAPES=[
  polygon('Square','square',[[20,20],[80,20],[80,80],[20,80]]),polygon('Rectangle','rectangle',[[12,28],[88,28],[88,72],[12,72]]),
  polygon('Rhombus','rhombus',[[50,8],[82,50],[50,92],[18,50]]),polygon('Parallelogram','parallelogram',[[30,20],[88,20],[70,80],[12,80]]),
  polygon('Trapezoid','trapezoid',[[28,20],[72,20],[90,80],[10,80]]),polygon('Kite','kite',[[50,10],[83,50],[50,85],[17,50]]),
  polygon('Equilateral triangle','equilateral-triangle',regular(3)),polygon('Right triangle','right-triangle',[[20,15],[20,85],[80,85]]),
  polygon('Obtuse triangle','obtuse-triangle',[[10,75],[50,45],[90,75]]),polygon('Regular pentagon','pentagon',regular(5)),polygon('Regular hexagon','hexagon',regular(6)),polygon('Irregular pentagon','irregular-pentagon',[[15,20],[75,15],[90,50],[60,85],[20,75]]),polygon('Irregular hexagon','irregular-hexagon',[[28,12],[65,16],[90,43],[78,82],[29,87],[12,52]]),
];
function propertyShapeRound(age,index,random,config){
  const targets=age===10?PROPERTY_SHAPES.filter(shape=>shape.sides===4):PROPERTY_SHAPES,target=targets[index%targets.length];
  const criteria=age===8?[['sides',target.sides],['rightAngles',target.rightAngles],['obtuseAngles',target.obtuseAngles],['parallelPairs',target.parallelPairs],['equalSides',target.equalSides]]:age===9?[['sides',target.sides],['symmetry',target.symmetry],['rightAngles',target.rightAngles],['equalSides',target.equalSides]]:[['sides',4],['parallelPairs',target.parallelPairs],['rightAngles',target.rightAngles],['equalSides',target.equalSides],['symmetry',target.symmetry]];
  const objective=age===8?`Find a ${target.sides}-sided shape with ${target.rightAngles} right angles, ${target.obtuseAngles} obtuse angles and ${target.parallelPairs} pairs of parallel sides, with ${target.equalSides?'all sides equal':'some unequal sides'}.`:age===9?`Find a ${target.sides}-sided shape with ${target.symmetry} lines of symmetry, ${target.rightAngles} right angles, and ${target.equalSides?'all sides equal':'some unequal sides'}.`:`Find a quadrilateral with ${target.parallelPairs} pairs of parallel sides, ${target.rightAngles} right angles, ${target.symmetry} lines of symmetry, and ${target.equalSides?'all sides equal':'some unequal sides'}.`;
  const pool=PROPERTY_SHAPES.filter(shape=>shape.id===target.id||!criteria.every(([key,value])=>shape[key]===value));
  const contrast=pool.find(shape=>shape.id!==target.id&&shape.sides===target.sides);
  const selected=contrast?shuffle([...choicesFor(target,pool.filter(shape=>shape.id!==contrast.id),config.choices-1,random),contrast],random):choicesFor(target,pool,config.choices,random);
  const choices=selected.map((shape,i)=>({...shape,svg:`<g transform="rotate(${[0,25,45,70][(index+i)%4]} 50 50)">${shape.svg}</g>`}));
  const clue=`${target.name} fits all the properties. A right angle is a square corner; parallel lines never meet. A symmetry line folds a shape into matching halves.`;
  return{id:'shape-match',tier:config.tier,age,target:{...target,clue},criteria,objective,choices,answer:target.id,hint:`${target.name}: ${clue}`};
}
function shapeRound(age,index,random,config) {
  if(age>=8)return propertyShapeRound(age,index,random,config);
  const pool=SHAPES.slice(0,Math.max(3,config.shapePool)).map(shape=>({...shape,...SHAPE_FACTS[shape.id]}));
  let target=pool[index%pool.length],criteria=[],objective;
  if(age<=3)objective=`Find the ${target.name.toLowerCase()}.`;
  else {
    const eligible=pool.filter(shape=>shape.sides>0&&shape.id!=='star');target=eligible[index%eligible.length];
    if(age>=6&&index%2===0)target=pool.find(shape=>shape.id===(index%4===0?'square':'rectangle'))||target;
    criteria=[['sides',target.sides]];
    objective=`Find a shape with ${target.sides} straight sides.`;
    if(target.sides===4){criteria.push(['equalSides',target.equalSides]);objective+=target.equalSides?' All four sides are equal.':' Two sides are long and two are short.';}
    if(age>=7){criteria.push(['rightAngles',target.rightAngles]);objective+=target.rightAngles?` It has ${target.rightAngles} square corners.`:' It has no square corners.';}
    if(age===9&&target.sides===4)objective=`Find a quadrilateral with four square corners and ${target.equalSides?'four equal sides':'two long and two short sides'}.`;
    if(age===10&&target.sides===4)objective=`A square is also a rectangle. Find ${target.equalSides?'the rectangle with all sides equal':'the rectangle whose sides are not all equal'}.`;
  }
  const fits=shape=>criteria.every(([key,value])=>shape[key]===value);
  const candidates=criteria.length?pool.filter(shape=>shape.id===target.id||!fits(shape)):pool;
  const choices=choicesFor(target,candidates,config.choices,random).map(shape=>({...shape,svg:age>=5?`<g transform="rotate(${[0,20,45,70][(index+pool.indexOf(shape))%4]} 50 50)">${shape.svg}</g>`:shape.svg}));
  return{id:'shape-match',tier:config.tier,age,target,criteria,objective,choices,answer:target.id,hint:`${target.name}: ${target.clue}`};
}
function colorRound(age,index,random,config) {
  const n=index%3,base=COLORS[[0,1,2][n]],mixes=[[0,2,4],[0,1,5],[1,2,3]];
  let target,objective,inputs=[],pool=COLORS,task='name';
  if(age<=3){target=COLORS[index%config.colorPool];objective=`Find ${target.name.toLowerCase()}.`;}
  else if(age<=5){const [a,b,c]=mixes[index%3];target=COLORS[c];inputs=[COLORS[a],COLORS[b]];objective=`Mix ${COLORS[a].name.toLowerCase()} and ${COLORS[b].name.toLowerCase()} paint. Which color does this make?`;task='paint-mix';}
  else if(age===6||age===7||age===9){
    const tint=age!==7,channels=base.color.slice(1).match(/../g).map(value=>parseInt(value,16));
    const shade=(lighter)=>'#'+channels.map(value=>Math.round(lighter?value+(255-value)*.48:value*.45).toString(16).padStart(2,'0')).join('');
    target={id:`${base.id}-${tint?'tint':'shade'}`,name:`${tint?'Light':'Dark'} ${base.name.toLowerCase()}`,color:shade(tint)};
    const opposite={id:`${base.id}-${tint?'shade':'tint'}`,name:`${tint?'Dark':'Light'} ${base.name.toLowerCase()}`,color:shade(!tint)};
    pool=[target,base,opposite,COLORS[n+3]];inputs=[base];task=tint?'tint':'shade';
    objective=age===9?`Keep the same hue as ${base.name.toLowerCase()}, but make it lighter. Which sample fits both rules?`:`Add ${tint?'white':'black'} to ${base.name.toLowerCase()} paint. Choose the ${tint?'lighter tint':'darker shade'}.`;
  }else if(age===8){const warm=[COLORS[0],COLORS[2],COLORS[4]],cool=[COLORS[1],COLORS[3],COLORS[5]],wanted=index%2?cool:warm,others=index%2?warm:cool;target=wanted[index%3];pool=[target,...others];task='temperature';objective=`Choose the ${index%2?'cool':'warm'} color for this palette.`;}
  else {const pairs=[[0,3],[1,4],[2,5],[3,0],[4,1],[5,2]],[a,b]=pairs[index%pairs.length];inputs=[COLORS[a]];target=COLORS[b];task='complement';objective=`On a six-color paint wheel, which color is opposite ${COLORS[a].name.toLowerCase()}?`;}
  return{id:'color-match',tier:config.tier,age,target,objective,inputs,task,choices:choicesFor(target,pool,Math.min(4,config.choices),random),answer:target.id,hint:`Choose ${target.name.toLowerCase()}. ${task==='complement'?'Opposite pairs are red/green, blue/orange and yellow/purple.':task==='temperature'?'Red, orange and yellow are warm; blue, green and purple are cool.':'Compare the rule with each sample.'}`};
}
function attributeSort(age,index,random,config) {
  let categories,items,objective;
  if(age===4||age===5){
    categories=age===4?[{id:'curved',name:'Curved edge',emoji:'○'},{id:'straight',name:'Only straight edges',emoji:'△'}]:[{id:'red-round',name:'Red + round'},{id:'red-straight',name:'Red + straight'},{id:'blue-round',name:'Blue + round'},{id:'blue-straight',name:'Blue + straight'}];
    items=Array.from({length:age===4?6:8},(_,i)=>{const shape=SHAPES[[0,1,2,4][(i+index)%4]],round=shape.sides===0||['circle','oval'].includes(shape.id),red=i%2===0,color=red?'#db5058':'#398ace';return{id:`shape-${i}`,name:`${red?'Red':'Blue'} ${shape.name.toLowerCase()}`,svg:`<g style="fill:${color}">${shape.svg}</g>`,category:age===4?(round?'curved':'straight'):`${red?'red':'blue'}-${round?'round':'straight'}`};});
    objective=age===4?'Sort by edges: curved or only straight.':'Use both rules: color and edge type.';
  }else {
    const factor=age===6?2:age===7?3:age===8?4:age===9?3:2;
    categories=age>=9?[{id:'both',name:age===10?'Less than 1/2':`Multiple of 3 and 4`},{id:'first',name:age===10?'Equal to 1/2':'Multiple of 3 only'},{id:'second',name:age===10?'Greater than 1/2':'Multiple of 4 only'},...(age===9?[{id:'neither',name:'Neither'}]:[])]:[{id:'yes',name:age===6?'Even':`Multiple of ${factor}`},{id:'no',name:age===6?'Odd':`Not a multiple of ${factor}`}];
    const bank=age===9?[12,15,16,17,24,27,28,29].map(value=>value+12*(index%4)):[...Array(8)].map((_,i)=>i+2+index%5);
    items=bank.map((value,i)=>{if(age===10){const denominator=4+2*((i+index)%3),numerator=denominator/2+[-1,0,1][i%3];return{id:`fraction-${i}`,name:`${numerator}/${denominator}`,text:`${numerator}/${denominator}`,category:numerator*2<denominator?'both':numerator*2===denominator?'first':'second',numerator,denominator};}return{id:`value-${value}`,name:String(value),text:String(value),value,category:age===9?value%3===0?(value%4===0?'both':'first'):(value%4===0?'second':'neither'):value%factor===0?'yes':'no'};});
    objective=age===10?'Compare each fraction with one half.':age===9?'Sort using both divisibility rules.':age===6?'Sort numbers into even and odd.':`Does each number divide into groups of ${factor} with none left over?`;
  }
  return{id:'sorting',tier:config.tier,age,categories,items:shuffle(items,random),objective};
}
function ruleOddity(age,index,random,config){
  if(age<=7){
    const rule=age===4?'All but one picture are red. Ignore the shape.':age===5?'All but one shape have a curved edge.':age===6?'All but one shape have four corners.':'All but one shape are red AND have four corners.';
    const choices=Array.from({length:config.oddCount},(_,i)=>{
      const wrong=i===0,shape=age===4?SHAPES[(i+index)%4]:age===5?SHAPES[wrong?2:i%2?0:4]:SHAPES[wrong&&age===6?2:i%2?1:3],red=age===4||age===7?!wrong:i%2===0;
      const color=red?'#db5058':'#398ace',name=`${red?'Red':'Blue'} ${shape.name.toLowerCase()}`;
      return{id:String(i),value:{...shape,id:`item-${i}`,name,red,corners:SHAPE_FACTS[shape.id].corners,curved:['circle','oval'].includes(shape.id),svg:`<g style="fill:${color}">${shape.svg}</g>`}};
    });
    return{id:'odd-one-out',tier:config.tier,age,rule,property:'rule',choices:shuffle(choices,random),answer:'0',same:{name:'pictures that fit the rule'},different:choices[0].value};
  }
  if(age===10){const choices=Array.from({length:config.oddCount},(_,i)=>{const denominator=4+2*((i+index)%6),numerator=denominator/2+(i===0?1:0);return{id:String(i),value:{id:`fraction-${i}`,name:`${numerator}/${denominator}`,text:`${numerator}/${denominator}`,numerator,denominator}};});return{id:'odd-one-out',tier:config.tier,age,property:'fraction rule',rule:'All but one fraction equal one half. Which fraction breaks the rule?',choices:shuffle(choices,random),answer:'0',same:{name:'fractions equal to one half'},different:choices[0].value};}
  const factorTargets=[12,18,24,30,36],whole=factorTargets[index%factorTargets.length],divisor=age===8?whole:6+(index%2)*6;
  const valid=age===8?Array.from({length:whole},(_,i)=>i+1).filter(value=>whole%value===0).slice(0,config.oddCount-1):Array.from({length:config.oddCount-1},(_,i)=>(i+2+index%3)*divisor);
  let exception=age===8?whole-1:valid[0]+1;while(valid.includes(exception)||(age===8?whole%exception===0:exception%divisor===0))exception++;
  const values=[exception,...valid],choices=shuffle(values.map((value,i)=>({id:String(i),value:{id:`number-${value}`,text:String(value),name:String(value),number:value}})),random);
  return{id:'odd-one-out',tier:config.tier,age,property:age===8?'factor rule':'common-multiple rule',rule:age===8?`All but one number are factors of ${whole}. Which number does not divide ${whole} exactly?`:`All but one number are multiples of BOTH ${divisor===6?'2 and 3':'3 and 4'}. Which number breaks the rule?`,divisor,whole,choices,answer:'0',same:{name:age===8?`factors of ${whole}`:`common multiples of ${divisor===6?'2 and 3':'3 and 4'}`},different:choices.find(item=>item.id==='0').value};
}
export function buildDiscoveryRound(id, difficulty = 6, index = 0, random = Math.random) {
  const config = discoveryConfig(difficulty), {age,tier} = config;
  if(id==='shape-match')return shapeRound(age,index,random,config);
  if(id==='color-match')return colorRound(age,index,random,config);
  if (id === 'patterns') {
    if(age>=9)return numberPattern(age,index,random);
    const forms = age <= 3 ? [[0,1]] : age === 4 ? [[0,1],[0,0,1]] : age <= 6 ? [[0,1],[0,0,1],[0,1,2]] : age === 7 ? [[0,1,2],[0,0,1,1]] : age === 8 ? [[0,0,1,1],[0,1,1,2]] : age === 9 ? [[0,1,0,1,2],[0,0,1,1]] : [[0,0,1,0,2],[0,1,1,2,2]];
    const form = forms[index % forms.length], symbols = shuffle(TOKENS, random), repeat = form.map(i => symbols[i]);
    const length = repeat.length * 2 + index % repeat.length;
    const sequence = Array.from({ length }, (_, i) => repeat[i % repeat.length]), target = repeat[length % repeat.length];
    const missingIndex=age>=6&&index%2===1?repeat.length+index%repeat.length:undefined;
    const answerTarget=missingIndex===undefined?target:sequence[missingIndex];
    return { id, tier, age, repeat, sequence, target:answerTarget, missingIndex, choices: choicesFor(answerTarget, TOKENS, Math.min(4, config.choices), random), answer: answerTarget.id };
  }
  if (id === 'sorting') {
    if(age>=4)return attributeSort(age,index,random,config);
    const categories = age >= 7 ? [
      { id: 'land', name: age === 10 ? 'On roads' : 'On land', emoji: '🛣️', items: [['car', 'Car', '🚗'], ['bus', 'Bus', '🚌'], ['bike', 'Bicycle', '🚲']] },
      { id: 'air', name: 'In the air', emoji: '☁️', items: [['plane', 'Airplane', '✈️'], ['helicopter', 'Helicopter', '🚁'], ['small-plane', 'Small plane', '🛩️']] },
      { id: 'water', name: 'On water', emoji: '🌊', items: [['sailboat', 'Sailboat', '⛵'], ['canoe', 'Canoe', '🛶'], ['ship', 'Ship', '🚢']] },
    ] : [
      { id: 'animals', name: 'Animals', emoji: '🐾', items: [['cat', 'Cat', '🐱'], ['dog', 'Dog', '🐶'], ['fish', 'Fish', '🐟']] },
      { id: 'fruit', name: 'Fruit', emoji: '🍎', items: [['apple', 'Apple', '🍎'], ['banana', 'Banana', '🍌'], ['pear', 'Pear', '🍐']] },
      { id: 'vehicles', name: 'Vehicles', emoji: '🛞', items: [['car', 'Car', '🚗'], ['bus', 'Bus', '🚌'], ['bike', 'Bicycle', '🚲']] },
    ].slice(0, config.sortCategories);
    if(age===10) categories.push({id:'rails',name:'On rails',emoji:'🛤️',items:[['train','Train','🚂'],['metro','Metro','🚇'],['tram','Tram','🚋']]});
    return { id, tier, age, categories: categories.map(({ items, ...category }) => category), items: shuffle(categories.flatMap(category => category.items.slice(0,config.sortItemsEach).map(([itemId, name, emoji]) => ({ id: itemId, name, emoji, category: category.id }))), random) };
  }
  if (id === 'odd-one-out') {
    if(age>=4)return ruleOddity(age,index,random,config);
    const property = age <= 3 ? 'color' : age <= 5 ? 'shape' : age <= 7 ? ['color','shape'][index%2] : ['shape','number'][index%2];
    const count = config.oddCount, dots = age >= 9 ? age - 3 : 4;
    const same = property === 'color' ? COLORS[index % 4] : property === 'shape' ? SHAPES[index % 5] : { id: 'same-count', name: `${dots} dots`, dots };
    const different = property === 'color' ? COLORS[(index + 1) % 4] : property === 'shape' ? SHAPES[(index + 1) % 5] : { id: 'different-count', name: `${dots+1} dots`, dots:dots+1 };
    const items = shuffle(Array.from({ length: count }, (_, i) => ({ id: String(i), value: i === 0 ? different : same })), random);
    return { id, tier, age, property, same, different, choices: items, answer: '0' };
  }
  if (id === 'memory') {
    if(age>=5)return relatedMemory(age,index,random);
    if(age===4){const shapes=shuffle(SHAPES.filter(shape=>!['star','oval'].includes(shape.id)),random).slice(0,config.memoryPairs);return{id,tier,age,pairs:config.memoryPairs,relation:'shapes',cards:shuffle(shapes.flatMap(shape=>[0,1].map((face)=>({...shape,key:`${shape.id}-${face}`,svg:`<g transform="rotate(${face?35:0} 50 50)" style="fill:${face?'#398ace':'#db5058'}">${shape.svg}</g>`,meaning:`The ${shape.name.toLowerCase()} keeps its shape when turned.`}))),random)};}
    const pairs = shuffle(MEMORY, random).slice(0, config.memoryPairs);
    return { id, tier, age, pairs: config.memoryPairs, cards: shuffle(pairs.flatMap(item => [{ ...item, key: `${item.id}-a` }, { ...item, key: `${item.id}-b`, scale:age===3?.72:1 }]), random) };
  }
  if (id === 'maze') return age>=7?planningMaze(age,config,random):{ id, tier, age, ...makeMaze(config.mazeSize, random) };
  throw new Error(`Unknown discovery activity: ${id}`);
}

const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
function button(label, className, action) { const node = element('button', className, label); node.type = 'button'; node.addEventListener('click', action); return node; }
function shapePicture(shape) {
  const wrap = element('span', 'discover-shape');
  wrap.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${shape.svg}</svg>`;
  return wrap;
}
function tokenPicture(item) {
  if(item.parts){const [filled,total]=item.parts,node=element('span','discover-fraction-parts');node.setAttribute('aria-hidden','true');node.style.display='grid';node.style.gridTemplateColumns=`repeat(${total}, 1fr)`;node.style.width='100%';node.style.height='44px';for(let i=0;i<total;i++){const part=element('i');part.style.background=i<filled?'#5754d6':'#fff';part.style.border='2px solid #28334d';node.append(part);}return node;}
  if (item.text!==undefined) { const number=element('span','discover-number',item.text);number.setAttribute('aria-hidden','true');return number; }
  if (item.svg) return shapePicture(item);
  if (item.color) { const swatch = element('span', 'discover-swatch'); swatch.style.background = item.color; swatch.setAttribute('aria-hidden', 'true'); return swatch; }
  if (item.dots) { const dots = element('span', 'discover-dot-group'); dots.setAttribute('aria-hidden', 'true'); for (let i = 0; i < item.dots; i++) dots.append(element('i')); return dots; }
  const emoji = element('span', 'discover-emoji');if(item.scale)emoji.style.transform=`scale(${item.scale})`;const art=objectArt(item.id);if(art)emoji.innerHTML=art;else emoji.textContent=item.emoji||'▧'; emoji.setAttribute('aria-hidden', 'true'); return emoji;
}
function getProgress() {
  const stored = readStore('discovery-progress-v1', {});
  return Object.fromEntries(DISCOVERY_IDS.map(id => [id, typeof stored?.[id] === 'number' && Number.isFinite(stored[id]) ? Math.max(0, Math.min(100000, Math.floor(stored[id]))) : 0]));
}
export function createDiscovery(container, { getSettings, getTitle=()=>null, onBack = () => {}, onNotice = () => {}, onProgress = () => {} }) {
  const sessions = new Map();
  let currentId = 'shape-match', profile = getProfile(getSettings()), current, active = false, progress = getProgress();
  let title, objective, play, status, nextButton, restartButton, hearButton, counter;
  container.classList.add('discover-screen');
  container.innerHTML = `<header class="activity-header discover-header"><button class="icon-button discover-back" aria-label="Back to activities">←</button><div class="discover-heading"><p class="discover-eyebrow">LITTLE DISCOVERIES</p><h1 class="discover-title"></h1></div><button class="button discover-hear" aria-label="Hear the instructions">♪ <span>Hear it</span></button></header><div class="discover-main"><div class="discover-intro"><span class="discover-activity-icon" aria-hidden="true"></span><div><p class="discover-level"></p><h2 class="discover-objective"></h2></div></div><div class="discover-play"></div><div class="discover-feedback"><p class="discover-status" role="status" aria-live="polite"></p><p class="discover-round-count"></p></div><div class="discover-footer"><button class="button discover-hint">✦ Hint</button><button class="button discover-restart">↶ Start again</button><button class="button button-primary discover-next">New round <span aria-hidden="true">→</span></button></div></div>`;
  const $ = selector => container.querySelector(selector);
  title = $('.discover-title'); objective = $('.discover-objective'); play = $('.discover-play'); status = $('.discover-status');
  nextButton = $('.discover-next'); restartButton = $('.discover-restart'); hearButton = $('.discover-hear'); counter = $('.discover-round-count');
  function speak(text) { if(active) requestSpeech(text); }
  function report() { onProgress({ source: 'discovery', completedCount: Object.values(progress).reduce((sum, count) => sum + count, 0) }); }
  function fresh(index = 0) { return { index, round: buildDiscoveryRound(currentId, profile.challengeAge, index), done: false, recorded: false, selected: null, sorted: new Set(), flipped: [], matched: new Set(), path: [0], message: '', feedback: '' }; }
  function getSession() { const key = `${currentId}:${profile.challengeAge}`; if (!sessions.has(key)) sessions.set(key, fresh()); current = sessions.get(key); }
  function message(text, kind = '') { current.message = text; current.feedback = kind; status.textContent = text; status.className = `discover-status ${kind ? `is-${kind}` : ''}`; }
  function complete(text) {
    current.done = true;
    if (!current.recorded) { current.recorded = true; progress[currentId] = Math.min(100000, progress[currentId] + 1); writeStore('discovery-progress-v1', progress); report(); }
    message(`✓ ${text}`, 'success'); nextButton.classList.add('is-ready'); updateCounter();
  }
  function updateCounter() { counter.textContent = `${progress[currentId]} ${progress[currentId] === 1 ? 'discovery' : 'discoveries'} made`; }
  function choiceButton(item, label, action) { const node = button('', 'discover-choice', action); node.dataset.choice = item.id; node.setAttribute('aria-label', label); node.append(tokenPicture(item), element('span', 'discover-choice-label', item.name)); return node; }
  function selectChoice(value, node) {
    if (current.done) return;
    if (value !== current.round.answer) {
      node.classList.add('is-try'); node.setAttribute('aria-label', `${node.dataset.label || node.getAttribute('aria-label')}. Try another picture`);
      message(currentId === 'patterns' ? current.round.kind==='number-rule'?'Check how the numbers change. Use Hint for the rule, then try again.':'Have another look at the part that repeats.' : currentId === 'odd-one-out' ? `Look for a different ${current.round.property}. You can try again.` : 'Take another look. You can try again.', 'retry');
      return;
    }
    node.classList.remove('is-try'); node.classList.add('is-correct');
    const text = currentId === 'shape-match' ? `${current.round.target.name}! ${current.round.target.clue}` : currentId === 'color-match' ? `${current.round.target.name} fits the color rule!` : currentId === 'patterns' ? current.round.kind==='number-rule'?`${current.round.target.name} fits the missing space. ${current.round.rule}`:`${current.round.target.name} ${current.round.missingIndex!==undefined?'fits the missing space':'comes next'}. The pattern repeats!` : `You spotted the different ${current.round.property}!`;
    complete(text);
    play.querySelectorAll('[data-choice]').forEach(button => { button.disabled = true; });
  }
  function renderChoices() {
    const round = current.round, stage = element('div', 'discover-choice-stage');
    if (currentId === 'shape-match' || currentId === 'color-match') {
      objective.textContent=round.objective;
      const model=element('div','discover-model discover-model-clue');
      const clue=element('span','discover-model-spark','?');clue.setAttribute('aria-hidden','true');model.append(clue);
      if(round.inputs?.length){const inputs=element('div','discover-color-inputs');inputs.setAttribute('aria-label','Colors in the question');round.inputs.forEach(input=>{const chip=element('span');chip.append(tokenPicture(input),element('span','',input.name));inputs.append(chip);});model.append(inputs);}
      model.append(element('p','discover-tip','Use the question to choose. Hint can show an example.'));stage.append(model);
    } else if (currentId === 'patterns') {
      const numeric=round.kind==='number-rule';
      objective.textContent = numeric?'Which number is missing?':round.missingIndex!==undefined?'Which picture is missing?':'Which picture comes next?';
      const line = element('div', 'discover-pattern-strip'); line.setAttribute('role', 'list'); line.setAttribute('aria-label', numeric?'Number pattern to complete':'Pattern to complete');
      round.sequence.forEach((item, index) => {
        const missing=index===round.missingIndex,token=element('div',`discover-pattern-token${missing?' discover-pattern-blank':''}`);
        token.setAttribute('role','listitem');token.setAttribute('aria-label',`${index+1}: ${missing?'missing number':item.name}`);
        if(missing)token.textContent='?';else token.append(tokenPicture(item));line.append(token);
      });
      if(!numeric&&round.missingIndex===undefined){const blank=element('div','discover-pattern-token discover-pattern-blank','?');blank.setAttribute('aria-label','What comes next?');line.append(blank);}
      stage.append(line);
      stage.append(element('p','discover-tip',numeric?'Look at every step. The same rule must fit before and after the missing number.':profile.tier==='little'?'Look, say the pictures, then keep it going.':'Find the repeating part. Then choose the next picture.'));
    } else {
      objective.textContent = round.rule || `Find the different ${round.property}.`;
      stage.append(element('p', 'discover-tip', round.rule?'Check each choice against the same rule.':`All but one have the same ${round.property}. Which one stands out?`));
    }
    const grid = element('div', `discover-choice-grid ${round.choices.length > 4 ? 'discover-six' : ''}`); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Choose an answer');
    round.choices.forEach((entry, index) => {
      const item = currentId === 'odd-one-out' ? entry.value : entry;
      const label = currentId === 'odd-one-out' ? `Picture ${index + 1}: ${item.name}` : item.name;
      const node = choiceButton(item, label, () => selectChoice(entry.id, node)); node.dataset.choice = entry.id; node.dataset.label = label;
      if (currentId === 'odd-one-out') node.querySelector('.discover-choice-label').textContent = `${index + 1}. ${item.name}`;
      if (current.done) { node.disabled = true; if (entry.id === round.answer) node.classList.add('is-correct'); }
      grid.append(node);
    });
    stage.append(grid); play.append(stage);
  }
  function renderSorting() {
    const round = current.round;
    objective.textContent = round.objective || 'Put each picture in its basket.';
    play.append(element('p', 'discover-tip', '1. Tap a picture.   2. Tap its basket.'));
    const items = element('div', 'discover-sort-items'); items.setAttribute('role', 'group'); items.setAttribute('aria-label', 'Pictures to sort');
    round.items.forEach(item => {
      const node = button('', `discover-sort-item ${current.sorted.has(item.id) ? 'is-sorted' : ''}`, () => {
        current.selected = item.id; message(`${item.name} is ready. Tap its basket.`); render();
      }); node.dataset.item = item.id; node.setAttribute('aria-label', `${item.name}${current.sorted.has(item.id) ? ', sorted' : ''}`); node.setAttribute('aria-pressed', String(current.selected === item.id)); node.disabled = current.sorted.has(item.id);
      node.append(tokenPicture(item), element('span', '', item.name)); if (current.sorted.has(item.id)) node.append(element('span', 'discover-tick', '✓')); items.append(node);
    });
    const baskets = element('div', 'discover-baskets'); baskets.style.setProperty('--baskets', round.categories.length);
    round.categories.forEach(category => {
      const node = button('', 'discover-basket', () => {
        if (current.done) return;
        const selected = round.items.find(item => item.id === current.selected);
        if (!selected) { message('Choose a picture first, then tap its basket.', 'retry'); return; }
        if (selected.category !== category.id) { message(`Check ${selected.name} against the basket rule. Try another basket, or ask for a hint.`, 'retry'); return; }
        current.sorted.add(selected.id); current.selected = null;
        if (current.sorted.size === round.items.length) complete('Every item fits its basket rule. Lovely sorting!');
        else message(`${selected.name} found its basket. Choose another picture.`, 'success');
        render();
      }); node.dataset.category = category.id; node.setAttribute('aria-label', `${category.name} basket`); node.disabled = current.done;
      const sorted = round.items.filter(item => item.category === category.id && current.sorted.has(item.id));
      node.append(tokenPicture(category), element('strong', '', category.name));
      const collection = element('span', 'discover-basket-collection', sorted.length ? sorted.map(item => item.emoji||item.text||'✓').join(' ') : '＋'); collection.setAttribute('aria-hidden', 'true'); node.append(collection); baskets.append(node);
    });
    play.append(items, baskets, element('p', 'discover-tip', `${current.sorted.size} of ${round.items.length} pictures sorted`));
  }
  function renderMemory() {
    const round = current.round;
    objective.textContent=({shapes:'Match the same shape, even when it is turned or colored differently.',quantities:'Match dots to the numeral.',letters:'Match big and small forms of the same letter.',sums:'Match each sum to its total.',parts:'Match shaded parts to a fraction.',products:'Match each multiplication to its answer.',fractions:'Match fractions with the same value.'})[round.relation]||`Find ${round.pairs} matching pairs.`;
    play.append(element('p','discover-tip',round.relation?`Find ${round.pairs} pairs. Match the meaning as well as remembering its place.`:'Tap two cards. Remember where the pictures live.'));
    const grid = element('div', `discover-memory-grid ${round.pairs === 2 ? 'discover-memory-small' : ''}`);
    round.cards.forEach((card, index) => {
      const faceUp = current.flipped.includes(index) || current.matched.has(card.id), matched = current.matched.has(card.id);
      const node = button('', `discover-memory-card ${faceUp ? 'is-open' : ''} ${matched ? 'is-matched' : ''}`, () => {
        if (current.done || current.flipped.length === 2 || current.flipped.includes(index) || current.matched.has(card.id)) return;
        current.flipped.push(index);
        if (current.flipped.length === 2) {
          const [a, b] = current.flipped.map(i => round.cards[i]);
          if (a.id === b.id) {
            current.matched.add(a.id); current.flipped = [];
            if (current.matched.size === round.pairs) complete('You found every pair. What a memory!');
            else message(round.relation?`${a.meaning}. You found the relationship!`:`A pair of ${a.name.toLowerCase()} pictures! Keep exploring.`, 'success');
          } else message(round.relation?'Those cards do not make a pair under this rule. Look again, then turn them over.':'Two different pictures. Look carefully, then turn them over.', 'retry');
        } else message(`${card.name}. ${round.relation?'Find its partner under the rule.':'Can you find its matching picture?'}`);
        render();
      });
      node.dataset.card = String(index); node.dataset.matched = String(matched); node.setAttribute('aria-label', `Card ${index + 1}, ${matched ? `matched ${card.name}` : faceUp ? card.name : 'face down'}`);
      node.disabled = matched || faceUp || current.flipped.length === 2 || current.done;
      if (faceUp) { node.append(tokenPicture(card)); if (matched) node.append(element('span', 'discover-tick', '✓')); }
      else { node.append(element('span', 'discover-card-flower', '✿'), element('span', 'discover-card-number', String(index + 1))); }
      grid.append(node);
    });
    play.append(grid, element('p', 'discover-tip', `${current.matched.size} of ${round.pairs} pairs found`));
    if (current.flipped.length === 2) {
      const reset = button('↶ Turn them over', 'button discover-memory-hide', () => { current.flipped = []; message('Try another pair. The pictures stay in the same places.'); render(); });
      play.append(reset); reset.focus({ preventScroll: true });
    }
  }
  function moveMaze(next) {
    if (current.done) return;
    const path = mazeStep(current.round, current.path, next);
    if (path === current.path) { message('Follow a glowing square next to Bunny. Watch for the walls.', 'retry'); return; }
    current.path = path;
    const checkpoints=current.round.checkpoints||[],collected=mazeCheckpointProgress(current.round,path);
    if(next===current.round.goal&&collected===checkpoints.length)complete(checkpoints.length?'Bunny visited every checkpoint in order and found the carrot. Good planning!':'Bunny found the carrot. You followed the whole trail!');
    else if(next===current.round.goal)message(`Visit checkpoint ${collected+1} before finishing at the carrot. Plan the return trip.`, 'retry');
    else if(checkpoints.includes(next))message(collected===checkpoints.length?'All checkpoints visited. Now find the carrot.':`Next: checkpoint ${collected+1}. A later checkpoint only counts when it is its turn.`);
    else message('Keep going! Tap a glowing square or use the arrows.');
    render();
  }
  function renderMaze() {
    const round = current.round, position = current.path[current.path.length - 1];
    const checkpoints=round.checkpoints||[],collected=mazeCheckpointProgress(round,current.path);
    objective.textContent=checkpoints.length?`Visit ${checkpoints.map((_,i)=>i+1).join(' then ')}, then the carrot.`:'Guide Bunny to the carrot.';
    play.append(element('p','discover-tip',checkpoints.length?`${collected} of ${checkpoints.length} checkpoints visited in order. Plan your route; you may need to retrace a path.`:'Tap a glowing neighbor. You can also use the arrow buttons.'));
    const layout = element('div', 'discover-maze-layout'), board = element('div', 'discover-maze-grid'); board.style.setProperty('--maze-size', round.size); board.setAttribute('aria-label', 'Bunny maze');
    round.cells.forEach((neighbors, index) => {
      const x = index % round.size, y = Math.floor(index / round.size), possible = round.cells[position].includes(index);
      const node = button('', `discover-maze-cell ${possible && !current.done ? 'is-neighbor' : ''} ${current.path.includes(index) ? 'is-trail' : ''} ${index === position ? 'is-bunny' : ''}`, () => moveMaze(index));
      const checkpoint=checkpoints.indexOf(index);node.dataset.checkpoint=checkpoint<0?'':String(checkpoint+1);
      node.dataset.cell = String(index); node.dataset.neighbors = neighbors.join(','); node.dataset.goal = String(index === round.goal); node.dataset.current = String(index === position);
      node.setAttribute('aria-label', `Row ${y + 1}, column ${x + 1}${index === position ? ', Bunny' : index === round.goal ? ', carrot' : possible ? ', next step' : ''}${checkpoint>=0?`, checkpoint ${checkpoint+1}${checkpoint<collected?', visited':''}`:''}`);
      node.tabIndex = index === position ? 0 : -1;
      node.style.borderTopColor = neighbors.includes(index - round.size) ? 'transparent' : '#657387';
      node.style.borderBottomColor = neighbors.includes(index + round.size) ? 'transparent' : '#657387';
      node.style.borderLeftColor = x > 0 && neighbors.includes(index - 1) ? 'transparent' : '#657387';
      node.style.borderRightColor = x < round.size - 1 && neighbors.includes(index + 1) ? 'transparent' : '#657387';
      if(index===position||index===round.goal){const art=objectArt(index===position?'rabbit':'carrot');if(art){node.innerHTML=art;node.querySelector('svg').style.width='80%';node.querySelector('svg').style.height='80%';}else node.textContent=index===position?'🐰':'🥕';}else node.textContent=checkpoint>=0?String(checkpoint+1):possible&&!current.done?'·':current.path.includes(index)?'·':'';
      if(checkpoint>=0){node.classList.add('discover-checkpoint');node.classList.toggle('is-visited',checkpoint<collected);}
      board.append(node);
    });
    const controls = element('div', 'discover-maze-controls');
    const arrows = element('div', 'discover-maze-arrows');
    [['up', '↑', position - round.size], ['left', '←', position - 1], ['down', '↓', position + round.size], ['right', '→', position + 1]].forEach(([direction, symbol, next]) => {
      const node = button(symbol, `button discover-arrow discover-${direction}`, () => moveMaze(next)); node.setAttribute('aria-label', `Move ${direction}`); node.disabled = current.done || !round.cells[position].includes(next); arrows.append(node);
    });
    const undo = button('↶ One step back', 'button discover-maze-undo', () => { current.path.pop(); current.done = false; message('One step back. Find your next turn.'); render(); }); undo.disabled = current.path.length <= 1;
    controls.append(arrows, undo, element('p', 'discover-tip', 'Follow the open paths. Take your time.')); layout.append(board, controls); play.append(layout);
  }
  function render() {
    const meta = META[currentId]; title.textContent = getTitle() || meta[0]; $('.discover-activity-icon').textContent = meta[2]; $('.discover-level').textContent = `${profile.name} · round ${current.index + 1}`;
    hearButton.disabled = !canSpeak(); hearButton.title = hearButton.disabled ? 'Spoken instructions are unavailable on this device' : 'Hear these instructions';
    play.replaceChildren(); nextButton.classList.toggle('is-ready', current.done); container.dataset.discovery = currentId;
    if (currentId === 'sorting') renderSorting(); else if (currentId === 'memory') renderMemory(); else if (currentId === 'maze') renderMaze(); else renderChoices();
    const openingMessage = current.round.kind === 'number-rule' ? 'Find the number that fits the rule.' : current.round.checkpoints?.length ? 'Visit each checkpoint in order, then find the carrot.' : currentId==='patterns'&&current.round.missingIndex!==undefined?'Find the picture that fits the missing space.':currentId==='color-match'?'Use the color relationship in the question.':meta[1];
    message(current.message || openingMessage, current.feedback); updateCounter();
  }
  function hint() {
    if(!active || current.done) return;
    const round=current.round;
    play.querySelectorAll('.is-hint').forEach(node=>node.classList.remove('is-hint'));
    let text='';
    if(currentId==='shape-match') {
      text=`${round.hint} Match this shape to one of the pictures.`;
      const model=play.querySelector('.discover-model');
      model.querySelector('.discover-model-spark')?.remove();
      if(!model.querySelector('.discover-shape')) model.prepend(shapePicture(round.target));
    } else if(currentId==='color-match') {text=round.hint;const model=play.querySelector('.discover-model');model.querySelector('.discover-model-spark')?.remove();model.prepend(tokenPicture(round.target));}
    else if(currentId==='patterns') {
      if(round.kind==='number-rule'){
        text=`Rule: ${round.rule} The missing number is ${round.target.name}. Try the rule on both sides to check it.`;
        play.querySelector('.discover-pattern-blank').classList.add('is-hint');
      }else{
        text=`The repeating part is ${round.repeat.map(item=>item.name.toLowerCase()).join(', ')}. Start that part again.`;
        [...play.querySelectorAll('.discover-pattern-token')].slice(0,round.repeat.length).forEach(node=>node.classList.add('is-hint'));
      }
    } else if(currentId==='sorting') {
      const item=round.items.find(item=>item.id===current.selected)||round.items.find(item=>!current.sorted.has(item.id));
      const category=round.categories.find(category=>category.id===item.category);
      text=`Choose ${item.name.toLowerCase()}, then the ${category.name.toLowerCase()} basket.`;
      play.querySelector(`[data-item="${item.id}"]`).classList.add('is-hint'); play.querySelector(`[data-category="${category.id}"]`).classList.add('is-hint');
    } else if(currentId==='odd-one-out') text=`Most pictures show ${round.same.name.toLowerCase()}. Look for ${round.different.name.toLowerCase()} instead.`;
    else if(currentId==='memory') {
      if(current.flipped.length===2) text='Look at both pictures, then tap Turn them over. Their places will stay the same.';
      else {
        const first=current.flipped[0] ?? round.cards.findIndex(card=>!current.matched.has(card.id));
        const partner=round.cards.findIndex((card,index)=>index!==first && card.id===round.cards[first].id);
        current.flipped=[first]; render();
        play.querySelector(`[data-card="${partner}"]`).classList.add('is-hint');
        text=`This is ${round.cards[first].name.toLowerCase()}. Try the outlined card for its partner.`;
      }
    } else {
      const collected=mazeCheckpointProgress(round,current.path),target=round.checkpoints?.[collected]??round.goal;
      const route=mazeRoute(round,current.path.at(-1),target);
      play.querySelector(`[data-cell="${route[1]}"]`)?.classList.add('is-hint');
      text=`The outlined square is one step toward ${target===round.goal?'the carrot':`checkpoint ${collected+1}`}. Follow its open path.`;
    }
    message(text,'hint');
  }
  $('.discover-back').addEventListener('click', onBack);
  hearButton.addEventListener('click', () => speak(`${objective.textContent} ${$('.discover-tip')?.textContent || ''}`));
  $('.discover-hint').addEventListener('click', hint);
  nextButton.addEventListener('click', () => { const key = `${currentId}:${profile.challengeAge}`; current = fresh(current.index + 1); sessions.set(key, current); render(); objective.focus({ preventScroll: true }); });
  restartButton.addEventListener('click', () => { const { round, index, recorded } = current; current = { ...fresh(index), round, recorded }; sessions.set(`${currentId}:${profile.challengeAge}`, current); render(); message('A fresh start. Have another go.'); });
  objective.tabIndex = -1;
  document.addEventListener('keydown', event => {
    if (!active || currentId !== 'maze' || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) || event.target.closest?.('dialog, input, select, textarea')) return;
    event.preventDefault(); const position = current.path[current.path.length - 1], offset = { ArrowUp: -current.round.size, ArrowDown: current.round.size, ArrowLeft: -1, ArrowRight: 1 }[event.key]; moveMaze(position + offset);
  });
  function settingsChanged() { const next = getProfile(getSettings()), tierChanged = next.challengeAge !== profile.challengeAge; profile = next; if (!getSettings().sound) stopSpeaking(); if (active) { if (tierChanged) { getSession(); render(); } else { hearButton.disabled=!canSpeak(); hearButton.title=hearButton.disabled?'Spoken instructions unavailable':'Hear these instructions'; } } }
  report();
  return {
    open(id) { if (!DISCOVERY_IDS.includes(id)) throw new Error(`Unknown discovery activity: ${id}`); active = true; currentId = id; profile = getProfile(getSettings()); getSession(); render(); },
    close() { active = false; stopSpeaking(); },
    settingsChanged,
    hint,
  };
}
