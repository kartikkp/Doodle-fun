import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAdventureRound,adventureConfig,shapeStep,fairSharing,sharingStep} from '../adventures.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const opposite={up:'down',down:'up',left:'right',right:'left'},clockwise={up:'right',right:'down',down:'left',left:'up'},mirror={up:'up',down:'down',left:'right',right:'left'};

test('all ages start without a complete solution model',()=>{for(let age=2;age<=10;age++)assert.equal(adventureConfig(age).model,false);});
test('size rounds progress to independently correct length, area and perimeter comparisons without ties',()=>{
  for(let age=2;age<=10;age++)for(let n=0;n<48;n++){
    const q=buildAdventureRound('size-order',age,n,rng(n));const values=q.solution.map(id=>q.pieces.find(p=>p.id===id).value);assert.equal(new Set(values).size,values.length);assert.deepEqual(values,[...values].sort((a,b)=>q.descending?b-a:a-b));
    for(const p of q.pieces){if(age===9)assert.equal(p.value,p.width*p.height);if(age===10)assert.equal(p.value,2*(p.width+p.height));if(age===8)assert.equal(p.value,p.measure.includes('mm')?parseInt(p.measure)/10:parseInt(p.measure));}
    if(age>=6)assert.equal(new Set(q.pieces.map(p=>p.size)).size,1,'Picture size cannot reveal the numeric answer.');
  }
});
test('causal story banks vary and unrelated events are excluded from the required sequence',()=>{
  for(let age=2;age<=10;age++){const stories=new Set();for(let n=0;n<20;n++){const q=buildAdventureRound('picture-sequence',age,n,rng(n));stories.add(q.name);assert.equal(new Set(q.solution).size,q.solution.length);assert.ok(q.solution.every(id=>q.pieces.some(p=>p.id===id&&!p.unrelated)));assert.equal(q.pieces.filter(p=>p.unrelated).length,age>=7?1:0);if(age>=8)assert.equal(q.reverse,n%2===1);}assert.equal(stories.size,5);}
});
test('shown direction clues transform into actual movements, stay on-grid, and reach the stated endpoint',()=>{
  for(let age=2;age<=10;age++)for(let n=0;n<48;n++){
    const q=buildAdventureRound('directions',age,n,rng(n));let expected=[...q.givenCommands];
    if(age===7||age===10)expected=expected.reverse().map(v=>opposite[v]);if(age===8||age===10)expected=expected.map(v=>clockwise[v]);if(age===9)expected=expected.map(v=>mirror[v]);assert.deepEqual(expected,q.commands);
    let cell=q.start;for(const command of expected){const dx={left:-1,right:1,up:0,down:0}[command],dy={left:0,right:0,up:-1,down:1}[command],x=cell%q.size+dx,y=Math.floor(cell/q.size)+dy;assert.ok(x>=0&&x<q.size&&y>=0&&y<q.size);cell=y*q.size+x;}assert.equal(cell,q.goal);
  }
});
test('shape rules accept both valid perimeter directions and reject interior decoys',()=>{
  for(let age=2;age<=10;age++)for(let n=0;n<12;n++){
    const q=buildAdventureRound('make-a-shape',age,n,rng(n));for(const reverse of [false,true]){let path=['0'];for(const value of [...(reverse?q.solution.slice(1).reverse():q.solution.slice(1)),'0'])path=shapeStep(q,path,value);assert.equal(path.length,q.vertices.length+1);}
    for(const dot of q.dots.filter(d=>!q.solution.includes(d.id)))assert.deepEqual(shapeStep(q,['0'],dot.id),['0']);
    for(let a=0;a<q.dots.length;a++)for(let b=a+1;b<q.dots.length;b++)assert.ok(Math.hypot(q.dots[a].x-q.dots[b].x,q.dots[a].y-q.dots[b].y)*2.68>=48,'distinct finger targets on a compact 320px layout');
  }
});
test('picture-rhythm transformations preserve rests and change the required response',()=>{
  for(let age=2;age<=10;age++){const signatures=new Set();for(let n=0;n<24;n++){
    const q=buildAdventureRound('rhythm',age,n,rng(n));let expected=[...q.sequence];if(age>=9)expected=expected.map(v=>v==='clap'?'tap':v==='tap'?'clap':v);if(age===8||age===10)expected.reverse();assert.deepEqual(expected,q.solution);assert.equal(q.sequence.filter(v=>v==='rest').length,q.solution.filter(v=>v==='rest').length);assert.ok(q.solution.every(v=>q.pads.some(p=>p.id===v)));signatures.add(q.solution.join(','));}assert.ok(signatures.size>=2);}
});
test('sharing varies tasks, uses the quotient/remainder, and completion requires all cookies accounted for',()=>{
  for(let age=2;age<=10;age++){const totals=new Set();for(let n=0;n<24;n++){
    const q=buildAdventureRound('sharing',age,n,rng(n));totals.add(q.total);assert.equal(q.each,Math.floor(q.total/q.friends.length));assert.equal(q.remainder,q.total%q.friends.length);assert.ok(q.total<=24);let state={counts:q.friends.map(()=>0),remaining:q.total,leftover:0};assert.equal(fairSharing(q,state),false);for(let i=0;i<q.each;i++)for(let friend=0;friend<q.friends.length;friend++)state=sharingStep(q,state,String(friend));for(let i=0;i<q.remainder;i++)state=sharingStep(q,state,'leftover');assert.equal(fairSharing(q,state),true);}if(age>2)assert.ok(totals.size>=2);}
});

test('older fair shares asks for interpretation after distribution, with one valid reasoning answer',()=>{
  for(const age of [9,10])for(let n=0;n<24;n++){
    const q=buildAdventureRound('sharing',age,n,rng(n));assert.equal(q.reasoning.choices.filter(value=>value===q.reasoning.answer).length,1);
    if(age===9)assert.equal(Number(q.reasoning.answer)+q.remainder,q.friends.length);
    else {const [top,bottom]=q.reasoning.answer.split('/').map(Number);assert.equal(top/bottom*q.friends.length,q.remainder);assert.equal(bottom,q.friends.length);}
  }
});
