import test from 'node:test';
import assert from 'node:assert/strict';
import {getProfile,normalizeSettings,readStore,writeStore} from '../core.js';

test('age boundaries choose supportive defaults without hiding activities', () => {
  for (const [age,tier] of [[2,'little'],[4,'little'],[5,'explorer'],[7,'explorer'],[8,'maker'],[10,'maker']]) {
    const profile = getProfile({age});
    assert.equal(profile.tier,tier);
    assert.ok(profile.sizes.includes(profile.brush));
    assert.ok(profile.numberMax >= 5);
  }
});
test('support choice overrides age and settings recover from malformed state', () => {
  assert.equal(getProfile({age:10,level:'little'}).tier,'little');
  assert.equal(getProfile({age:2,level:'maker'}).tier,'maker');
  assert.deepEqual(normalizeSettings({age:99,level:'invalid',sound:'yes'}),{age:10,level:'auto',sound:false});
  assert.equal(normalizeSettings({age:'not a number'}).age,6);
  assert.equal(normalizeSettings(null).age,6);
  for (const age of [null,{},[],true,'',{valueOf:1,toString:1}]) assert.equal(normalizeSettings({age}).age,6);
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
