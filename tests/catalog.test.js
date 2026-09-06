import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITIES,CATEGORIES,getActivity} from '../catalog.js';
test('24 distinct activity routes resolve to specific supported experiences',()=>{
  assert.equal(ACTIVITIES.length,24);
  assert.equal(new Set(ACTIVITIES.map(a=>a.id)).size,24);
  for(const activity of ACTIVITIES){
    assert.equal(getActivity(activity.id),activity);
    assert.ok(CATEGORIES.some(category=>category.id===activity.category));
    assert.ok(activity.description && activity.skill && activity.title);
    assert.ok(['drawing','learning','discovery','challenges'].includes(activity.engine));
  }
  assert.equal(ACTIVITIES.filter(a=>a.engine==='discovery').length,7);
  assert.equal(ACTIVITIES.filter(a=>a.engine==='challenges').length,7);
  assert.equal(new Set(ACTIVITIES.filter(a=>a.engine==='learning').map(a=>JSON.stringify(a.options))).size,8);
});
test('legacy activity links remain available and unknown routes are safely ignored',()=>{
  assert.equal(getActivity('letters').kind,'letters');assert.equal(getActivity('numbers').kind,'numbers');
  assert.equal(getActivity('not-a-game'),undefined);
});
