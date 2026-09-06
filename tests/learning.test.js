import test from 'node:test';
import assert from 'node:assert/strict';
import {LETTER_DATA,STROKES,SHAPES,WORDS,getLearningItems,evaluateTrace,samplePath,buildQuantityQuestion} from '../learning-data.js';
import {getProfile} from '../core.js';

test('all uppercase, lowercase and decimal digits have complete in-bounds tracing data',()=>{
  assert.equal(LETTER_DATA.upper.map(item=>item.ch).join(''),'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.equal(LETTER_DATA.lower.map(item=>item.ch).join(''),'abcdefghijklmnopqrstuvwxyz');
  assert.equal(LETTER_DATA.nums.map(item=>item.ch).join(''),'0123456789');
  assert.equal(Object.keys(STROKES).length,62);
  for(const [letter,strokes]of Object.entries(STROKES)) {
    assert.ok(strokes.length,letter);
    for(const stroke of strokes){assert.ok(stroke.length>=2,letter);for(const point of stroke)assert.ok(point.length===2&&point.every(value=>Number.isFinite(value)&&value>=.1&&value<=.95),`${letter}: ${point}`);}
  }
});
test('all 76 activities pass when each real guide path is followed at every age level',()=>{
  assert.equal(SHAPES.length+WORDS.length+Object.keys(STROKES).length,76);
  for(const age of [2,6,10]) {
    const profile=getProfile({age});
    for(const set of ['shapes','upper','lower','nums','words'])for(const item of getLearningItems(set)) {
      const result=evaluateTrace(item.strokes,item.strokes,{tolerance:profile.traceTolerance*(set==='words'?.55:1),coverage:profile.traceCoverage,precision:profile.tracePrecision});
      assert.equal(result.passed,true,`${age}: ${set} ${item.ch}: ${result.reason}`);
    }
  }
});
test('empty input and background taps do not receive completion credit',()=>{
  for(const set of ['shapes','upper','lower','nums','words'])for(const item of getLearningItems(set)) {
    assert.equal(evaluateTrace(item.strokes,[]).passed,false,item.ch);
    assert.equal(evaluateTrace(item.strokes,[[[.01,.01]]]).passed,false,item.ch);
    assert.equal(evaluateTrace(item.strokes,item.strokes.map(path=>[path[0]])).passed,false,item.ch);
  }
});
test('each separate stroke must be covered; letters with dot and crossbar cannot pass on the main stem',()=>{
  for(const letter of ['i','j','t','A','H','X','4','8']) {
    const target=STROKES[letter];
    const partial=target.slice(0,1);
    assert.equal(evaluateTrace(target,partial,{tolerance:.032,coverage:.88,precision:.7}).passed,false,letter);
  }
});
test('fast but accurate sparse events are interpolated along real ink segments',()=>{
  const target=[[[.5,.2],[.5,.8]]];
  const result=evaluateTrace(target,[[[.5,.2],[.5,.8]]]);
  assert.equal(result.passed,true);assert.equal(result.precision,1);assert.deepEqual(result.coverage,[1]);
});
test('coverage alone cannot reward a scribble or repeated excessive ink',()=>{
  const target=STROKES.A;
  const scribble=Array.from({length:80},(_,i)=>[i%2?.94:.06,.05+i/80*.9]);
  assert.equal(evaluateTrace(target,[...target,scribble]).passed,false);
  assert.equal(evaluateTrace(target,[...target,...target,...target,...target]).passed,false);
  const excessive=STROKES['1'].concat([[[.1,.1],[.1,.9],[.9,.9]]]);
  assert.equal(evaluateTrace(STROKES['1'],excessive,{precision:.7}).passed,false);
});
test('scattered guide taps plus a localized scribble cannot fake continuous tracing',()=>{
  const targets=STROKES.A,profile=getProfile({age:9});
  const options={tolerance:profile.traceTolerance,coverage:profile.traceCoverage,precision:profile.tracePrecision};
  const taps=targets.flatMap(path=>samplePath(path,.03).map(point=>[point]));
  const scribble=Array.from({length:45},(_,i)=>i%2?[.507,.20]:[.5,.18]);
  assert.equal(evaluateTrace(targets,[...taps,scribble],options).passed,false);
  const tinyMarks=taps.map(([point])=>[point,[point[0]+.005,point[1]]]);
  assert.equal(evaluateTrace(targets,[...tinyMarks,scribble],options).passed,false);
});
test('smaller learners get more generous spatial support without locking any set',()=>{
  const target=[[[.5,.2],[.5,.8]]],offset=[[[.55,.2],[.55,.8]]];
  const little=getProfile({age:3}),maker=getProfile({age:9});
  assert.equal(evaluateTrace(target,offset,{tolerance:little.traceTolerance,coverage:little.traceCoverage,precision:little.tracePrecision}).passed,true);
  assert.equal(evaluateTrace(target,offset,{tolerance:maker.traceTolerance,coverage:maker.traceCoverage,precision:maker.tracePrecision}).passed,false);
  assert.equal(getLearningItems('nums').length,10);
});
test('malformed ink is ignored and invalid targets cannot pass',()=>{
  assert.equal(evaluateTrace([],[]).passed,false);
  assert.equal(evaluateTrace([[[NaN,.5],[.5,.5]]],STROKES.A).passed,false);
  assert.equal(evaluateTrace(STROKES.A,[null,[[NaN,.5]]]).passed,false);
  assert.deepEqual(samplePath([]),[]);
});
test('counting and addition cover zero through each age-fit range with valid arithmetic',()=>{
  for(const max of [5,10,20])for(let number=0;number<=max;number++)for(const mode of ['count','add']) {
    const question=buildQuantityQuestion(number,mode,max);assert.equal(question.answer,number);
    if(mode==='add'){assert.equal(question.left+question.right,number);assert.ok(question.left>=0&&question.right>=0);}
  }
  assert.match(buildQuantityQuestion(0).prompt,/empty/);
  assert.equal(buildQuantityQuestion(-4).answer,0);
  assert.equal(buildQuantityQuestion(99,'count',5).answer,5);
  assert.equal(buildQuantityQuestion(NaN).answer,0);
});
test('addition varies its operands and equal groups remain visual and inside the support range',()=>{
  const sums=Array.from({length:6},(_,i)=>buildQuantityQuestion(5,'add',20,i));
  assert.equal(new Set(sums.map(question=>question.left)).size,6);
  for(const max of [5,10,20])for(let round=0;round<20;round++) {
    const question=buildQuantityQuestion(0,'groups',max,round);
    assert.equal(question.groups*question.each,question.answer);
    assert.ok(question.groups>=2&&question.groups<=4);
    assert.ok(question.each>=1&&question.each<=5);
    assert.ok(question.answer<=max);
  }
  assert.ok(Array.from({length:20},(_,i)=>buildQuantityQuestion(0,'groups',20,i)).some(question=>question.answer===20));
});
