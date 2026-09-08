import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITIES} from '../catalog.js';
import {COACHING,coachingFor,normalizeAdjustments} from '../coaching.js';
import {drawingIdeas,coloringIdeas} from '../draw.js';
import {getProfile} from '../core.js';

test('every activity has a specific starting step, strategy, reflection and real-world extension',()=>{
  for(const {id} of ACTIVITIES){
    assert.ok(COACHING[id],id);
    assert.equal(COACHING[id].length,4);
    assert.equal(new Set(COACHING[id]).size,4);
    for(const text of COACHING[id])assert.ok(text.length>30,id);
    assert.equal(coachingFor(id,2).together,true);
    assert.equal(coachingFor(id,10).together,false);
  }
});
test('each age offers distinct creative challenges and a usable brush',()=>{
  const prompts=new Set();
  for(let age=2;age<=10;age++){
    const ideas=drawingIdeas(age);assert.ok(ideas.length>=3);
    assert.ok(coloringIdeas(age).length>=2);assert.notDeepEqual(coloringIdeas(age),ideas);
    for(const idea of ideas){assert.ok(!prompts.has(idea));prompts.add(idea);}
    const profile=getProfile({age});assert.ok(profile.sizes.includes(profile.brush));
  }
});
test('per-game support survives corrupt storage without accepting unknown routes or unsafe offsets',()=>{
  const ids=ACTIVITIES.map(a=>a.id);
  assert.deepEqual(normalizeAdjustments(null,ids),{});
  assert.deepEqual(normalizeAdjustments([],ids),{});
  assert.deepEqual(normalizeAdjustments({draw:-99,counting:99,memory:'1',maze:NaN,unknown:1},ids),{draw:-2,counting:2});
});
