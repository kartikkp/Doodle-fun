import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeParentControls,makeParentCredential,verifyParentSecret} from '../parent-controls.js';
import {getProfile} from '../core.js';

test('parent preferences safely normalize damaged local values',()=>{
  for(const value of [null,[],false,'oops'])assert.deepEqual(normalizeParentControls(value),{version:1,hints:'on',lockSettings:false,credential:null,failures:0,retryAfter:0});
  const result=normalizeParentControls({hints:'ask',lockSettings:true,credential:{salt:'bad',hash:'bad'},failures:Infinity,retryAfter:Infinity});
  assert.equal(result.hints,'ask');assert.equal(result.credential,null);assert.equal(result.retryAfter,0);
});
test('salted PIN and recovery verifiers reject wrong secrets and accept the displayed recovery format',async()=>{
  const first=await makeParentCredential('473829','ABCD1234ABCD');
  const second=await makeParentCredential('473829','ABCD1234ABCD');
  assert.notEqual(first.salt,second.salt);assert.notEqual(first.hash,second.hash);
  assert.equal(await verifyParentSecret(first,'473829'),true);
  assert.equal(await verifyParentSecret(first,'473828'),false);
  assert.equal(await verifyParentSecret(first,'abcd–1234–abcd',true),true);
  assert.equal(await verifyParentSecret(first,'abcd–1234–abce',true),false);
  assert.equal(JSON.stringify(first).includes('473829'),false);
  assert.equal(JSON.stringify(first).includes('ABCD1234ABCD'),false);
  for(const pin of ['123','1234567','123a',' 1234'])await assert.rejects(()=>makeParentCredential(pin,'ABCD1234ABCD'));
});
test('an explicit practice step spans the curriculum without changing the child age',()=>{
  for(let age=2;age<=10;age++)for(let practiceStep=2;practiceStep<=10;practiceStep++){
    const profile=getProfile({age,practiceStep});assert.equal(profile.age,age);assert.equal(profile.challengeAge,practiceStep);
  }
  for(const practiceStep of [0,11,2.5,'8',null,NaN,{},true])assert.equal(getProfile({age:6,practiceStep}).challengeAge,6);
});
