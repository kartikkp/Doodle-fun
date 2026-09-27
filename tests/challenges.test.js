import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGE_INFO,generateChallenge} from '../challenges.js';
import {getProfile} from '../core.js';

const profiles=Array.from({length:9},(_,i)=>getProfile({age:i+2}));
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
      const max=q.maxValue??profile.numberMax;
      assert.ok(q.left>=0&&q.left<=max);assert.ok(q.right>=0&&q.right<=max);
      assert.equal(q.answer,q.left===q.right?'same':(q.direction==='more'?q.left>q.right:q.left<q.right)?'left':'right');
    }
    assert.deepEqual([...answers].sort(),['left','right','same']);
  }
});
test('number paths have unique ordered answers and a shuffled complete tile set',()=>{
  for(const [index,profile]of profiles.entries())for(let round=0;round<60;round++) {
    const q=generateChallenge('number-order',profile,round);
    assert.equal(q.sequence.length,profile.sequenceLength);assert.equal(new Set(q.tiles).size,q.sequence.length);
    assert.deepEqual([...q.tiles].sort((a,b)=>q.direction==='down'?b-a:a-b),q.sequence);
    assert.ok(q.sequence.every((value,i)=>value>=0&&value<=(q.maxValue??profile.numberMax)&&(!i||(q.direction==='down'?value<q.sequence[i-1]:value>q.sequence[i-1]))));
    assert.notDeepEqual(q.tiles,q.sequence);
  }
  const big=generateChallenge('number-order',getProfile({age:9}),1);assert.equal(big.sequence[1]-big.sequence[0],10);
});
test('subtraction and missing-part choices have exactly one mathematically correct answer',()=>{
  for(const profile of profiles)for(let round=0;round<60;round++)for(const id of ['subtraction','number-bonds']) {
    const q=generateChallenge(id,profile,round);
    const max=q.maxValue??profile.numberMax;
    assert.equal(q.answer,id==='subtraction'?(q.ask==='start'?q.removed+q.remaining:q.ask==='removed'?q.start-q.remaining:q.start-q.removed):q.ask==='total'?q.firstPart+q.secondPart:q.total-q.part);
    assert.ok(q.answer>=0&&q.answer<=max);
    assert.equal(q.choices.filter(value=>value===q.answer).length,1);
    assert.equal(new Set(q.choices).size,q.choices.length);
    assert.ok(q.choices.every(value=>value>=0&&value<=max));
    if(id==='subtraction')assert.ok(q.removed>=0&&q.removed<=q.start&&q.start<=max);
    else assert.ok(q.part>=0&&q.part<=q.total&&q.total<=max);
  }
  assert.equal(generateChallenge('subtraction',profiles[0],3).answer,0);
});
test('foundational frames cover every amount; advanced fraction frames vary nontrivial amounts',()=>{
  for(const [index,profile]of profiles.entries()) {
    const size=profile.frameSize,seen=new Set();
    for(let round=0;round<=(profile.numberMax+1)*2;round++){const q=generateChallenge('ten-frame',profile,round);assert.equal(q.size,size);seen.add(q.target);}
    if(profile.challengeAge===10){assert.ok(seen.size>=10);assert.ok([...seen].every(n=>n>0&&n<size));}else assert.deepEqual([...seen].sort((a,b)=>a-b),Array.from({length:profile.numberMax+1},(_,i)=>i));
  }
});
test('letter relationships progress from case through rhyme and meaningful word parts',()=>{
  for(const [index,profile]of profiles.entries())for(let round=0;round<30;round++) {
    const q=generateChallenge('letter-match',profile,round);
    assert.equal(q.pairs.length,profile.letterPairs);assert.equal(new Set(q.pairs).size,q.pairs.length);
    if(q.relationships){assert.deepEqual(q.upper.slice().sort(),q.relationships.map(p=>p.upper).sort());assert.deepEqual(q.lower.slice().sort(),q.relationships.map(p=>p.lower).sort());assert.equal(new Set(q.lower).size,q.pairs.length);}else assert.deepEqual(q.upper.map(ch=>ch.toLowerCase()).sort(),[...q.lower].sort());
  }
});
test('word tiles preserve all letters including repeats, with longer words for older children',()=>{
  for(const [index,profile]of profiles.entries())for(let round=0;round<20;round++) {
    const q=generateChallenge('word-build',profile,round);
    assert.ok(q.word.length>=2&&q.word.length<=8);if(profile.challengeAge>=9)assert.ok(q.word.length>=6);
    assert.deepEqual(q.tiles.filter(tile=>!tile.distractor).map(tile=>tile.letter).sort(),[...q.word].sort());
    assert.equal(new Set(q.tiles.map(tile=>tile.index)).size,q.tiles.length);assert.ok(q.tiles.length<=10);assert.ok(q.picture&&q.clue);
  }
  assert.equal(generateChallenge('word-build',getProfile({age:10}),4).tiles.filter(tile=>tile.letter==='e').length,3);
});

test('older math uses place value without raising the foundational twenty-object limit',()=>{
  const profile=getProfile({age:10});
  assert.ok(generateChallenge('compare',profile).followup);
  assert.equal(generateChallenge('subtraction',profile).ask,'removed');
  assert.equal(generateChallenge('ten-frame',profile).ask,'empty');
  assert.equal(generateChallenge('number-order',profile).direction,'down');
  assert.equal(profile.numberMax,20);
  assert.equal(generateChallenge('subtraction',profile).model,'place-value');
  assert.equal(generateChallenge('subtraction',profile).maxValue,999);
});

test('ages eight, nine and ten progress through larger place values, regrouping and every unknown position',()=>{
  for(const age of [8,9,10]) {
    const profile=getProfile({age}),asks=new Set(),bondAsks=new Set(),steps=new Set();let regrouping=0;
    for(let round=0;round<120;round++) {
      const subtraction=generateChallenge('subtraction',profile,round),bonds=generateChallenge('number-bonds',profile,round),order=generateChallenge('number-order',profile,round),compare=generateChallenge('compare',profile,round);
      asks.add(subtraction.ask);bondAsks.add(bonds.ask);steps.add(order.step);
      assert.ok(subtraction.start>20&&bonds.total>20&&Math.max(...order.sequence)>20);
      if(age>=9)assert.ok(subtraction.start>=100&&bonds.total>=100&&order.sequence.every(value=>value>=100));
      if(subtraction.start%10<subtraction.removed%10)regrouping++;
      assert.equal(bonds.firstPart+bonds.secondPart,bonds.total);
      assert.equal(subtraction.removed+subtraction.remaining,subtraction.start);
      for(const q of [subtraction,bonds]){assert.equal(q.choices.length,4);assert.ok(q.strategy);assert.equal((q.prompt.match(/\?/g)||[]).length,1);}
      if(age>=9){assert.ok(compare.followup);assert.equal(compare.followup.answer,Math.abs(compare.left-compare.right));assert.equal(new Set(compare.followup.choices).size,4);}
    }
    assert.ok(regrouping>30,'Regrouping is part of ordinary play, not a rare edge case');
    assert.ok(steps.size>=3,'Number paths vary the arithmetic step across rounds');
    assert.deepEqual([...asks].sort(),age===8?['remaining']:age===9?['remaining','removed']:['remaining','removed','start']);
    assert.deepEqual([...bondAsks].sort(),age===8?['second']:['first','second','total']);
  }
});

test('younger arithmetic retains counting models and easier per-mode support selects the earlier progression',()=>{
  for(let age=2;age<=7;age++)for(let round=0;round<60;round++)for(const id of ['compare','number-order','subtraction','number-bonds']) {
    const profile=getProfile({age}),q=generateChallenge(id,profile,round);
    assert.equal(q.model,undefined);assert.equal(q.maxValue,undefined);
    if(q.choices)assert.ok(q.choices.every(value=>value<=profile.numberMax));
  }
  assert.deepEqual(generateChallenge('subtraction',getProfile({age:10,challengeOffset:-2})),generateChallenge('subtraction',getProfile({age:8})));
  assert.equal(generateChallenge('subtraction',getProfile({age:10,level:'explorer'})).model,undefined);
});

test('older place-value answers always include a same-ones distractor so units alone cannot solve them',()=>{
  for(const age of [8,9,10])for(let round=0;round<120;round++) {
    const profile=getProfile({age}),compare=generateChallenge('compare',profile,round);
    const questions=['subtraction','number-bonds'].map(id=>generateChallenge(id,profile,round));
    if(compare.followup)questions.push({...compare.followup,id:'compare difference',maxValue:compare.maxValue});
    for(const q of questions) {
      assert.ok(q.choices.some(value=>value!==q.answer&&value%10===q.answer%10),
        `${q.id}, age ${age}, round ${round}: ${q.answer} needs an alternative with the same ones digit in ${q.choices}`);
      assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);
      assert.equal(q.choices.filter(value=>value===q.answer).length,1);
      assert.ok(q.choices.every(value=>Number.isInteger(value)&&value>=0&&value<=q.maxValue));
    }
  }
});
