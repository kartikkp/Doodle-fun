import test from 'node:test';
import assert from 'node:assert/strict';
import {generateChallenge} from '../challenges.js';
import {getProfile} from '../core.js';
import {getLearningItems,buildQuantityQuestion,evaluateTrace} from '../learning-data.js';

test('fraction frames require equivalent-value and sum reasoning, with correct complements',()=>{
  for(let age=6;age<=10;age++)for(let round=0;round<100;round++) {
    const q=generateChallenge('ten-frame',getProfile({age}),round);
    assert.ok(q.target>=0&&q.target<=q.size);assert.equal(q.target+q.empty,q.size);
    const nums=q.prompt.match(/\d+/g).map(Number);
    if(age===6)assert.equal(nums[0]+nums[1],q.target);
    if(age===7)assert.equal(nums[0]-nums[1],q.target);
    if(age===8)assert.equal(nums[0]/nums[1],q.target/q.size);
    if(age===9)assert.equal(nums[0]/nums[1],q.target/q.size);
    if(age===10)assert.equal((nums[0]+nums[2])/20,(q.ask==='empty'?q.empty:q.target)/q.size);
  }
});
test('each older literacy bank has unique partners with a distinct objective',()=>{
  const goals=new Set();
  for(let age=7;age<=10;age++)for(let round=0;round<40;round++) {
    const q=generateChallenge('letter-match',getProfile({age}),round);goals.add(q.prompt);
    assert.equal(new Set(q.relationships.map(x=>x.upper)).size,q.pairs.length);
    assert.equal(new Set(q.relationships.map(x=>x.lower)).size,q.pairs.length);
    assert.ok(q.relationships.every(x=>x.upper!==x.lower));
  }
  assert.equal(goals.size,4);
});
test('age-specific writing remains in bounds and every true trace passes without rewarding blank ink',()=>{
  for(let age=2;age<=10;age++)for(const set of ['shapes','upper','lower','words','nums']) {
    const items=getLearningItems(set,age);assert.ok(items.length>=4);
    for(const item of items){assert.ok(item.strokes.length);assert.ok(item.strokes.flat().every(p=>p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)),`${age}/${set}/${item.ch}`);assert.ok(evaluateTrace(item.strokes,item.strokes).passed,`${age}/${set}/${item.ch}`);assert.equal(evaluateTrace(item.strokes,[]).passed,false);}
  }
  assert.equal(getLearningItems('words',10)[0].ch,'evidence');
  assert.ok(getLearningItems('nums',9)[0].ch.length>=4);
});
test('older count models include noncanonical units and decimal regrouping with exact integer scoring',()=>{
  for(let age=6;age<=10;age++) {
    const answers=new Set();
    for(let round=0;round<40;round++) {
      const q=buildQuantityQuestion(0,'count',20,round,age);answers.add(q.answer);
      assert.equal(q.answer,q.bundles.reduce((sum,b)=>sum+b.count*b.unit,0));
      assert.ok(q.answer<=q.maxValue);if(age>=9)assert.ok(q.bundles.some(b=>b.count>=10)||round%13<8);
    }
    assert.ok(answers.size>=9);
  }
});
