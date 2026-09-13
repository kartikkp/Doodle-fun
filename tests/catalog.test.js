import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITIES,ACTIVITY_MODES,CATEGORIES,getActivity,getFamily} from '../catalog.js';
test('21 home families consolidate every practice mode exactly once',()=>{
  assert.equal(ACTIVITIES.length,21);
  const modes=ACTIVITIES.flatMap(activity=>activity.modes.map(mode=>mode.id));
  assert.equal(new Set(modes).size,34);
  assert.deepEqual([...modes].sort(),ACTIVITY_MODES.map(mode=>mode.id).sort());
  for(const family of ACTIVITIES){
    assert.ok(CATEGORIES.some(category=>category.id===family.category));
    assert.ok(family.description && family.skill && family.title);
    for(const {id} of family.modes){
      assert.equal(getFamily(id),family);
      assert.equal(getActivity(id).id,id);
      assert.ok(['drawing','learning','discovery','challenges','adventures','listening'].includes(getActivity(id).engine));
    }
  }
  assert.deepEqual(getFamily('coloring').modes.map(mode=>mode.id),['draw','coloring']);
  assert.equal(getFamily('uppercase').id,'trails');
  assert.equal(ACTIVITIES.filter(activity=>activity.category==='listen').length,4);
});
test('family defaults follow age and all original deep links remain specific',()=>{
  assert.equal(getActivity('trails',2).id,'prewriting');
  assert.equal(getActivity('trails',6).id,'uppercase');
  assert.equal(getActivity('trails',10).id,'word-tracing');
  assert.equal(getActivity('number-stories').id,'addition');
  assert.equal(getActivity('lowercase',2).options.set,'lower');
  assert.equal(getActivity('letters').kind,'letters');assert.equal(getActivity('numbers').kind,'numbers');
  assert.equal(getActivity('not-a-game'),undefined);
});
