import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDiscoveryRound,mazeRoute,mazeCheckpointProgress} from '../discovery.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};

test('property clues have exactly one qualifying geometry, without requiring target-name matching',()=>{
  for(let age=2;age<=10;age++)for(let index=0;index<48;index++){
    const q=buildDiscoveryRound('shape-match',age,index,rng(index));
    assert.ok(q.choices.length>=2);assert.equal(new Set(q.choices.map(c=>c.id)).size,q.choices.length);
    if(age>=4){const qualifying=q.choices.filter(c=>q.criteria.every(([property,value])=>c[property]===value));assert.equal(qualifying.length,1);assert.equal(qualifying[0].id,q.answer);assert.ok(q.objective.includes('side')||q.objective.includes('corner')||q.objective.includes('rectangle'));}
  }
});
test('color relationships produce a distinct answer and preserve given inputs separately',()=>{
  for(let age=2;age<=10;age++)for(let n=0;n<24;n++){
    const q=buildDiscoveryRound('color-match',age,n,rng(n));assert.equal(q.choices.filter(c=>c.id===q.answer).length,1);
    assert.equal(new Set(q.choices.map(c=>c.color)).size,q.choices.length);
    if([4,5,6,7,9,10].includes(age))assert.ok(q.inputs.length>0&&q.inputs.every(c=>c.id!==q.answer));
    if(age===6||age===7||age===9){const channels=c=>c.slice(1).match(/../g).map(x=>parseInt(x,16)),base=channels(q.inputs[0].color),answer=channels(q.target.color);assert.ok(answer.every((x,i)=>age===7?x<base[i]:x>base[i]));}
    if(age===10){const pairs={red:'green',green:'red',blue:'orange',orange:'blue',yellow:'purple',purple:'yellow'};assert.equal(q.answer,pairs[q.inputs[0].id]);}
  }
});
test('classification rules match independently computed properties and every basket is represented',()=>{
  for(let age=4;age<=10;age++)for(let n=0;n<24;n++){
    const q=buildDiscoveryRound('sorting',age,n,rng(n));assert.equal(new Set(q.items.map(i=>i.id)).size,q.items.length);
    for(const item of q.items){assert.ok(q.categories.some(c=>c.id===item.category));if(age>=6&&age<=8)assert.equal(item.category,item.value%(age===6?2:age===7?3:4)===0?'yes':'no');if(age===9)assert.equal(item.category,item.value%3===0?(item.value%4===0?'both':'first'):(item.value%4===0?'second':'neither'));if(age===10)assert.equal(item.category,item.numerator*2<item.denominator?'both':item.numerator*2===item.denominator?'first':'second');}
    for(const category of q.categories)assert.ok(q.items.some(i=>i.category===category.id),`${age}/${n}/${category.id} must have a real example`);
  }
});
test('oddity has a single rule exception among nonidentical valid examples',()=>{
  for(let age=4;age<=10;age++)for(let n=0;n<24;n++){
    const q=buildDiscoveryRound('odd-one-out',age,n,rng(n));
    const fits=v=>age===4?v.red:age===5?v.curved:age===6?v.corners===4:age===7?v.red&&v.corners===4:age===10?v.numerator*2===v.denominator:age===8?q.whole%v.number===0:v.number%q.divisor===0;
    const wrong=q.choices.filter(c=>!fits(c.value));assert.equal(wrong.length,1);assert.equal(wrong[0].id,q.answer);
    assert.ok(new Set(q.choices.filter(c=>fits(c.value)).map(c=>c.value.name)).size>=2);
  }
});
test('memory relationships carry independently equal meaning with no overlapping pair answers',()=>{
  for(let age=5;age<=10;age++)for(let n=0;n<24;n++){
    const q=buildDiscoveryRound('memory',age,n,rng(n)),meanings=new Set();
    const value=c=>c.parts?c.parts[0]/c.parts[1]:c.dots??(age===6?c.text.toLowerCase():c.text.includes('×')?c.text.split('×').map(Number).reduce((a,b)=>a*b):c.text.includes('+')?c.text.split('+').map(Number).reduce((a,b)=>a+b):c.text.includes('/')?c.text.split('/').map(Number).reduce((a,b)=>a/b):Number(c.text));
    for(const id of new Set(q.cards.map(c=>c.id))){const pair=q.cards.filter(c=>c.id===id);assert.equal(pair.length,2);assert.equal(value(pair[0]),value(pair[1]));assert.ok(!meanings.has(value(pair[0])));meanings.add(value(pair[0]));}
    assert.equal(meanings.size,q.pairs);
  }
});
test('picture patterns vary phase and include an interior blank before numeric rules',()=>{
  for(let age=2;age<=8;age++){
    const phases=new Set(),missing=new Set();for(let n=0;n<24;n++){const q=buildDiscoveryRound('patterns',age,n,rng(n));phases.add(q.sequence.length%q.repeat.length);missing.add(q.missingIndex);const position=q.missingIndex??q.sequence.length;assert.equal(q.answer,q.repeat[position%q.repeat.length].id);}
    assert.ok(phases.size>=2);if(age>=6)assert.ok([...missing].some(Number.isInteger));
  }
});
test('planning mazes expose ordered, reachable checkpoints from age seven, not a correct route',()=>{
  for(let age=7;age<=10;age++)for(let n=0;n<24;n++){
    const q=buildDiscoveryRound('maze',age,n,rng(n));assert.ok(q.checkpoints.length);let path=[q.start];for(const goal of [...q.checkpoints,q.goal])path.push(...mazeRoute(q,path.at(-1),goal).slice(1));assert.equal(mazeCheckpointProgress(q,path),q.checkpoints.length);assert.equal(path.at(-1),q.goal);
  }
});

test('older polygon clues describe the rendered vertices, not hand-entered answer names',()=>{
  const seen=new Set();
  for(const age of [8,9,10])for(let n=0;n<26;n++){
    const q=buildDiscoveryRound('shape-match',age,n,rng(n));assert.ok(q.criteria.length>=4);assert.ok(q.choices.some(c=>c.id!==q.answer&&c.sides===q.target.sides),'A same-side distractor makes the other stated properties matter');
    for(const shape of q.choices){
      seen.add(shape.id);const points=shape.points,edges=points.map((p,i)=>{const other=points[(i+1)%points.length];return[other[0]-p[0],other[1]-p[1]];}),norm=([x,y])=>Math.sqrt(x*x+y*y);
      const sideSquares=edges.map(([x,y])=>x*x+y*y);assert.equal(shape.sides,points.length);assert.equal(shape.equalSides,Math.max(...sideSquares)-Math.min(...sideSquares)<1);
      let rights=0,obtuse=0,parallels=0;
      for(let i=0;i<edges.length;i++){
        const [x,y]=edges[i],[u,v]=edges[(i+1)%edges.length],turn=(x*u+y*v)/(norm([x,y])*norm([u,v]));if(Math.abs(turn)<.001)rights++;else if(turn>0)obtuse++;
        for(let j=0;j<i;j++){const [a,b]=edges[j];if(Math.abs(x*b-y*a)/(norm([x,y])*norm([a,b]))<.001)parallels++;}
      }
      assert.equal(shape.rightAngles,rights);assert.equal(shape.obtuseAngles,obtuse);assert.equal(shape.parallelPairs,parallels);
      const knownSymmetry={square:4,rectangle:2,rhombus:2,parallelogram:0,trapezoid:1,kite:1,'equilateral-triangle':3,'right-triangle':0,'obtuse-triangle':1,pentagon:5,hexagon:6,'irregular-pentagon':0,'irregular-hexagon':0};assert.equal(shape.symmetry,knownSymmetry[shape.id]);
      assert.ok(shape.svg.includes('<polygon points='),'rendering uses the same actual polygon geometry');
    }
  }
  assert.equal(seen.size,13);
});
