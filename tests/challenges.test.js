import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGE_INFO,generateChallenge} from '../challenges.js';
import {getProfile} from '../core.js';

const profiles=[3,6,9].map(age=>getProfile({age}));
test('seven different challenges expose stable definitions and deterministic rounds',()=>{
  assert.equal(Object.keys(CHALLENGE_INFO).length,7);
  for(const id of Object.keys(CHALLENGE_INFO))for(const profile of profiles)assert.deepEqual(generateChallenge(id,profile,4),generateChallenge(id,profile,4));
  assert.throws(()=>generateChallenge('missing',profiles[0]),/Unknown challenge/);
});
test('comparison exercises greater, fewer and equal amounts within the child’s range',()=>{
  for(const profile of profiles) {
    const answers=new Set();
    for(let round=0;round<60;round++) {
      const q=generateChallenge('compare',profile,round);answers.add(q.answer);
      assert.ok(q.left>=0&&q.left<=profile.numberMax);assert.ok(q.right>=0&&q.right<=profile.numberMax);
      assert.equal(q.answer,q.left===q.right?'same':(q.direction==='more'?q.left>q.right:q.left<q.right)?'left':'right');
    }
    assert.deepEqual([...answers].sort(),['left','right','same']);
  }
});
test('number paths have unique ascending answers and a shuffled complete tile set',()=>{
  for(const [index,profile]of profiles.entries())for(let round=0;round<60;round++) {
    const q=generateChallenge('number-order',profile,round);
    assert.equal(q.sequence.length,[3,5,6][index]);assert.equal(new Set(q.tiles).size,q.sequence.length);
    assert.deepEqual([...q.tiles].sort((a,b)=>a-b),q.sequence);
    assert.ok(q.sequence.every((value,i)=>value>=0&&value<=profile.numberMax&&(!i||value>q.sequence[i-1])));
    assert.notDeepEqual(q.tiles,q.sequence);
  }
  const big=generateChallenge('number-order',profiles[2],1);assert.equal(big.sequence[1]-big.sequence[0],2);
});
test('subtraction and missing-part choices have exactly one mathematically correct answer',()=>{
  for(const profile of profiles)for(let round=0;round<60;round++)for(const id of ['subtraction','number-bonds']) {
    const q=generateChallenge(id,profile,round);
    assert.equal(q.answer,id==='subtraction'?q.start-q.removed:q.total-q.part);
    assert.ok(q.answer>=0&&q.answer<=profile.numberMax);
    assert.equal(q.choices.filter(value=>value===q.answer).length,1);
    assert.equal(new Set(q.choices).size,q.choices.length);
    assert.ok(q.choices.every(value=>value>=0&&value<=profile.numberMax));
    if(id==='subtraction')assert.ok(q.removed>=0&&q.removed<=q.start&&q.start<=profile.numberMax);
    else assert.ok(q.part>=0&&q.part<=q.total&&q.total<=profile.numberMax);
  }
  assert.equal(generateChallenge('subtraction',profiles[0],3).answer,0);
});
test('five, ten and twenty frames eventually include every quantity, including their endpoints',()=>{
  for(const [index,profile]of profiles.entries()) {
    const size=[5,10,20][index],seen=new Set();
    for(let round=0;round<=size;round++){const q=generateChallenge('ten-frame',profile,round);assert.equal(q.size,size);seen.add(q.target);}
    assert.deepEqual([...seen].sort((a,b)=>a-b),Array.from({length:size+1},(_,i)=>i));
  }
});
test('case matching grows from two supported pairs to six distinct case pairs',()=>{
  for(const [index,profile]of profiles.entries())for(let round=0;round<30;round++) {
    const q=generateChallenge('letter-match',profile,round);
    assert.equal(q.pairs.length,[2,4,6][index]);assert.equal(new Set(q.pairs).size,q.pairs.length);
    assert.deepEqual(q.upper.map(ch=>ch.toLowerCase()).sort(),[...q.lower].sort());
  }
});
test('word tiles preserve all letters including repeats, with longer words for older children',()=>{
  for(const [index,profile]of profiles.entries())for(let round=0;round<20;round++) {
    const q=generateChallenge('word-build',profile,round);
    assert.equal(q.word.length>=([3,4,5][index]),true);assert.equal(q.word.length<=([3,4,6][index]),true);
    assert.deepEqual(q.tiles.map(tile=>tile.letter).sort(),[...q.word].sort());
    assert.equal(new Set(q.tiles.map(tile=>tile.index)).size,q.word.length);assert.ok(q.picture&&q.clue);
  }
  assert.equal(generateChallenge('word-build',profiles[2]).tiles.filter(tile=>tile.letter==='p').length,2);
});
