import test from 'node:test';
import assert from 'node:assert/strict';
import {guidedAccessStatus} from '../guided-access.js';

test('Guided Access reports active sessions without confusing a Settings switch or an app PIN',()=>{
  assert.match(guidedAccessStatus(false,{native:true,pinSaved:true}),/^Doodle Fun PIN saved\. Guided Access session not active/);
  assert.match(guidedAccessStatus(false,{native:true}),/may already be set up in Settings/);
  assert.match(guidedAccessStatus(true,{native:true}),/session active\. End the session before opening Settings/);
  assert.match(guidedAccessStatus(undefined,{native:true}),/status unavailable/);
  for(const active of [true,false,undefined])assert.match(guidedAccessStatus(active),/browser cannot check/);
});
