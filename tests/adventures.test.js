import test from 'node:test';
import assert from 'node:assert/strict';
import {ADVENTURE_IDS,adventureConfig,buildAdventureRound,sequenceStep,shapeStep,sharingStep,fairSharing} from '../adventures.js';
function rng(seed=1){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
for(let age=2;age<=10;age++){
  test(`age ${age}: all six adventures generate valid, solvable, appropriately sized rounds`,()=>{
    const config=adventureConfig(age);
    for(let index=0;index<12;index++){
      const size=buildAdventureRound('size-order',age,index,rng(index));
      assert.equal(size.pieces.length,config.sizeCount);
      const ordered=size.solution.map(id=>size.pieces.find(piece=>piece.id===id).size);
      assert.deepEqual(ordered,[...ordered].sort((a,b)=>size.descending?b-a:a-b));
      assert.equal(new Set(ordered).size,ordered.length);
      const story=buildAdventureRound('picture-sequence',age,index,rng(index));
      assert.equal(story.solution.length,config.storyCount);
      assert.equal(new Set(story.solution).size,story.pieces.length);
      assert.ok(story.pieces.every(piece=>piece.name&&piece.emoji));
      const directions=buildAdventureRound('directions',age,index,rng(index));
      assert.equal(directions.commands.length,config.directionSteps);
      assert.notEqual(directions.start,directions.goal);
      directions.positions.forEach((position,i)=>{assert.ok(position>=0&&position<directions.size**2);if(i){const prev=directions.positions[i-1];assert.equal(Math.abs(position%directions.size-prev%directions.size)+Math.abs(Math.floor(position/directions.size)-Math.floor(prev/directions.size)),1);}});
      const shape=buildAdventureRound('make-a-shape',age,index,rng(index));
      assert.equal(shape.vertices.length,config.vertices);
      for(const reverse of [false,true]){let path=['0'];const order=reverse?[...shape.solution.slice(1)].reverse():shape.solution.slice(1);for(const id of [...order,'0'])path=shapeStep(shape,path,id);assert.equal(path.length,shape.vertices.length+1);}
      for(let a=0;a<shape.dots.length;a++)for(let b=a+1;b<shape.dots.length;b++)assert.ok(Math.hypot(shape.dots[a].x-shape.dots[b].x,shape.dots[a].y-shape.dots[b].y)*3.19>=48,'dot hit targets must not overlap on a 375px phone');
      const rhythm=buildAdventureRound('rhythm',age,index,rng(index));
      assert.equal(rhythm.sequence.length,config.beatLength);
      assert.ok(rhythm.sequence.every(id=>rhythm.pads.some(pad=>pad.id===id)));
      const sharing=buildAdventureRound('sharing',age,index,rng(index));
      assert.ok(Number.isSafeInteger(sharing.total)&&sharing.total>0);
      assert.equal(sharing.remainder,age===9?2:age===10?3:0);
      let state={counts:Array(sharing.friends.length).fill(0),leftover:0,remaining:sharing.total};
      assert.equal(fairSharing(sharing,state),false);
      for(let n=0;n<sharing.each;n++)for(let friend=0;friend<sharing.friends.length;friend++)state=sharingStep(sharing,state,String(friend));
      for(let n=0;n<sharing.remainder;n++)state=sharingStep(sharing,state,'leftover');
      assert.equal(fairSharing(sharing,state),true);
      assert.equal(sharingStep(sharing,state,'0'),state);
      assert.ok(sharing.remainder<sharing.friends.length);
    }
  });
}
test('wrong sequence choices, diagonals, and invalid gifts cannot change state',()=>{
  const path=[];assert.equal(sequenceStep(['a','b'],path,'b'),path);assert.deepEqual(sequenceStep(['a','b'],path,'a'),['a']);
  const shape=buildAdventureRound('make-a-shape',9),edge=['0'];assert.equal(shapeStep(shape,edge,'2'),edge);assert.equal(shapeStep(shape,edge,'5'),edge);
  const round=buildAdventureRound('sharing',4),state={counts:[0,0],remaining:round.total,leftover:0};for(const invalid of ['leftover','-1','2','1.2','oops'])assert.equal(sharingStep(round,state,invalid),state);
  assert.deepEqual(state.counts,[0,0]);
});
test('six distinct routes and nine distinct configurations remain available',()=>{
  assert.equal(ADVENTURE_IDS.length,6);assert.equal(new Set(Array.from({length:9},(_,i)=>JSON.stringify(adventureConfig(i+2)))).size,9);
  assert.throws(()=>buildAdventureRound('unknown'),/Unknown adventure/);
});
