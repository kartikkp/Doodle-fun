import test from 'node:test';
import assert from 'node:assert/strict';
import {getProfile,normalizeSettings,readStore,writeStore} from '../core.js';

test('age boundaries choose supportive defaults without hiding activities', () => {
  for (const [age,tier] of [[2,'little'],[4,'little'],[5,'explorer'],[7,'explorer'],[8,'maker'],[10,'maker']]) {
    const profile = getProfile({age});
    assert.equal(profile.tier,tier);
    assert.ok(profile.sizes.includes(profile.brush));
    assert.ok(profile.numberMax >= 3);
  }
});
test('support choice overrides age and settings recover from malformed state', () => {
  assert.equal(getProfile({age:10,level:'little'}).tier,'little');
  assert.equal(getProfile({age:2,level:'maker'}).tier,'maker');
  assert.deepEqual(normalizeSettings({age:99,level:'invalid',sound:'yes'}),{age:10,level:'auto',sound:false,challengeOffset:0});
  assert.equal(normalizeSettings({age:'not a number'}).age,6);
  assert.equal(normalizeSettings(null).age,6);
  for (const age of [null,{},[],true,'',{valueOf:1,toString:1}]) assert.equal(normalizeSettings({age}).age,6);
});
test('every exact age has its own support and challenge configuration',()=>{
  const profiles=Array.from({length:9},(_,i)=>getProfile({age:i+2}));
  assert.deepEqual(profiles.map(profile=>profile.challengeAge),[2,3,4,5,6,7,8,9,10]);
  assert.deepEqual(profiles.map(profile=>profile.numberMax),[3,4,5,8,10,12,15,20,20]);
  assert.equal(new Set(profiles.map(profile=>profile.traceTolerance)).size,9);
  assert.ok(profiles.every(profile=>profile.mazeSize<=6&&profile.memoryPairs<=6&&profile.choiceCount<=4));
});
test('per-activity challenge adjustments apply after support anchors and clamp safely',()=>{
  assert.equal(getProfile({age:6,challengeOffset:1}).challengeAge,7);
  assert.equal(getProfile({age:6,challengeOffset:-2}).challengeAge,4);
  assert.equal(getProfile({age:10,level:'little',challengeOffset:1}).challengeAge,4);
  assert.equal(getProfile({age:2,level:'maker',challengeOffset:-1}).challengeAge,8);
  assert.equal(getProfile({age:2,challengeOffset:-2}).challengeAge,2);
  assert.equal(getProfile({age:10,challengeOffset:2}).challengeAge,10);
  assert.equal(normalizeSettings({challengeOffset:'2'}).challengeOffset,2);
  for(const challengeOffset of [null,{},[],true,'',NaN])assert.equal(normalizeSettings({challengeOffset}).challengeOffset,0);
});
test('a failed storage write still supersedes older persisted data in this session',()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>'{"count":1}',setItem(){throw new Error('Quota exceeded');}}});
  try {
    assert.equal(writeStore('quota',{count:2}),false);
    assert.deepEqual(readStore('quota',{}),{count:2});
  } finally {
    if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;
  }
});
test('storage unavailable or blocked does not prevent local session progress', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('blocked');}});
  try {
    assert.equal(writeStore('test',{done:2}),false);
    assert.deepEqual(readStore('test',{}),{done:2});
    assert.equal(readStore('missing','fallback'),'fallback');
  } finally {
    if (descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else delete globalThis.localStorage;
  }
});
