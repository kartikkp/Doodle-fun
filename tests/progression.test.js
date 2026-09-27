import test from 'node:test';
import assert from 'node:assert/strict';
import {readStore,writeStore} from '../core.js';

let instance=0;
async function fresh(){writeStore('medal-progress-v1',{version:1,entries:{}});return import(`../progression.js?test=${++instance}`);}
function round(p,mode,key,{age=6,step=age,mistake=false,hint=false}={}){p.beginRound({mode,age,step,roundKey:String(key)});if(mistake)p.recordMistake();if(hint)p.recordHint();return p.completeRound();}

test('short sets have explicit Gold, Silver and Bronze boundaries at every content step',async()=>{
  const p=await fresh();
  for(let step=2;step<=10;step++)for(const imperfect of [0,1,2]){
    const mode=`score-${step}-${imperfect}`,required=p.roundsRequired(mode,step);
    for(let i=0;i<required;i++)round(p,mode,i,{age:10,step,mistake:i<imperfect});
    const progress=p.getModeProgress(mode,10,step);
    assert.equal(progress.completed,required);
    assert.equal(progress.bestMedal,['gold','silver','bronze'][imperfect]);
    assert.equal(progress.result.clean,required-imperfect);
  }
  assert.equal(p.roundsRequired('maze',10),3);
  assert.equal(p.roundsRequired('memory',10),3);
  assert.equal(p.roundsRequired('word-tracing',10),3);
});

test('retry, hint dismissal, duplicate completion and reload cannot erase attempt evidence',async()=>{
  let p=await fresh();
  p.beginRound({mode:'counting',age:3,step:3,roundKey:'0'});p.recordHint();p.recordHint();p.recordMistake();
  p.beginRound({mode:'counting',age:3,step:3,roundKey:'0'});
  p=await import(`../progression.js?reload=${++instance}`);
  p.beginRound({mode:'counting',age:3,step:3,roundKey:'0'});
  assert.deepEqual(p.getModeProgress('counting',3,3).rounds['0'],{mistake:true,hint:true,done:false});
  p.completeRound();p.completeRound();p.beginRound({mode:'counting',age:3,step:3,roundKey:'0'});p.completeRound();
  assert.equal(p.getModeProgress('counting',3,3).completed,1);
  round(p,'counting',1,{age:3});round(p,'counting',2,{age:3});
  assert.equal(p.getModeProgress('counting',3,3).bestMedal,'silver');
  assert.equal(p.getRoundCursor('counting',3,3),3);
});

test('fresh content can improve a medal and a later result never removes the best',async()=>{
  const p=await fresh();
  for(let i=0;i<3;i++)round(p,'maze',i,{mistake:true});
  assert.equal(p.getModeProgress('maze',6,6).bestMedal,'bronze');
  for(let i=3;i<6;i++)round(p,'maze',i);
  assert.equal(p.getModeProgress('maze',6,6).bestMedal,'gold');
  for(let i=6;i<9;i++)round(p,'maze',i,{hint:true});
  assert.equal(p.getModeProgress('maze',6,6).result.medal,'bronze');
  assert.equal(p.getModeProgress('maze',6,6).bestMedal,'gold');
  assert.equal(p.getModeProgress('maze',6,6).nextStep,7);
  p.beginRound({mode:'maze',age:6,step:6,roundKey:'0'});p.completeRound();
  assert.equal(p.getModeProgress('maze',6,6).completed,3,'old completions cannot start or fill a new set');
});

test('an explicit fresh set lets a finite word bank improve without counting replay or reload twice',async()=>{
  let p=await fresh();const words=['words:cat','words:dog','words:sun'];
  for(const word of words)round(p,'word-tracing',word,{age:10,hint:true});
  assert.equal(p.getModeProgress('word-tracing',10,10).bestMedal,'bronze');
  p.beginRound({mode:'word-tracing',age:10,step:10,roundKey:'words:fourth',automaticSets:false});p.completeRound();
  assert.equal(p.getModeProgress('word-tracing',10,10).completed,3,'finite banks wait for the explicit fresh-set action');
  assert.equal(p.getModeProgress('word-tracing',10,10).rounds['words:fourth'],undefined);
  assert.equal(p.beginNewAttempt({mode:'word-tracing',age:10,step:10}).completed,0);
  assert.equal(p.getModeProgress('word-tracing',10,10).sessionId,2);
  round(p,'word-tracing',words[0],{age:10});
  p=await import(`../progression.js?finite=${++instance}`);
  round(p,'word-tracing',words[0],{age:10});
  assert.equal(p.getModeProgress('word-tracing',10,10).completed,1);
  for(const word of words.slice(1))round(p,'word-tracing',word,{age:10});
  assert.equal(p.getModeProgress('word-tracing',10,10).bestMedal,'gold');
  assert.equal(p.getModeProgress('word-tracing',10,10).result.clean,3);
});

test('a fresh-set request cannot clear mistakes from an unfinished set',async()=>{
  const p=await fresh();p.beginRound({mode:'word-tracing',age:10,step:10,roundKey:'words:cat'});p.recordMistake();
  const before=p.getModeProgress('word-tracing',10,10);
  assert.equal(p.beginNewAttempt({mode:'word-tracing',age:10,step:10}),null);
  assert.deepEqual(p.getModeProgress('word-tracing',10,10),before);
  assert.equal(p.getCurrentRound().roundKey,'words:cat');
});

test('age and skill step preserve distinct histories and step fixes the scoring denominator',async()=>{
  const p=await fresh();
  for(let i=0;i<3;i++)round(p,'counting',i,{age:2,step:2});
  round(p,'counting',0,{age:10,step:2,mistake:true});
  round(p,'counting',0,{age:10,step:10});
  assert.equal(p.getModeProgress('counting',2,2).bestMedal,'gold');
  assert.equal(p.getModeProgress('counting',10,2).required,3);
  assert.equal(p.getModeProgress('counting',10,2).completed,1);
  assert.equal(p.getModeProgress('counting',10,10).required,5);
  assert.equal(p.getModeProgress('counting',10,10).completed,1);
});

test('skipping an unfinished question cannot produce a perfect set',async()=>{
  const p=await fresh();
  p.beginRound({mode:'counting',age:2,step:2,roundKey:'0'});
  for(let i=1;i<=3;i++)round(p,'counting',i,{age:2});
  assert.equal(p.getModeProgress('counting',2,2).bestMedal,'silver');
  round(p,'counting',0,{age:2});
  assert.equal(p.getModeProgress('counting',2,2).completed,3,'revisiting skipped content cannot overflow a finished set');
});

test('creative activities and explicitly unscored practice never acquire medals',async()=>{
  const p=await fresh();
  for(const mode of ['draw','coloring','beat-maker','mirror-free'])for(let i=0;i<5;i++)round(p,mode,i);
  p.beginRound({mode:'make-a-shape',age:6,step:6,roundKey:'free',scored:false});p.recordHint();p.completeRound();
  assert.deepEqual(p.getProgress().entries,{});
  assert.equal(p.getCurrentRound().scored,false);
});

test('progress subscriptions report context changes for hint relocking',async()=>{
  const p=await fresh(),updates=[];
  const stop=p.subscribeProgress(value=>updates.push(value.currentRound));
  p.beginRound({mode:'counting',age:6,step:4,roundKey:'0'});
  p.beginRound({mode:'counting',age:6,step:4,roundKey:'0'});
  p.beginRound({mode:'counting',age:7,step:4,roundKey:'0'});
  assert.equal(updates.length,2);assert.equal(updates[1].age,7);
  stop();p.recordHint();assert.equal(updates.length,2);
});

test('legacy practice remains intact and malformed medal storage fails safely',async()=>{
  writeStore('learning-progress-v1',{'upper:A':true});
  writeStore('discovery-progress-v1',{'maze':35});
  writeStore('medal-progress-v1',{version:1,entries:{bad:{mode:'counting',rounds:[]},'maze:6:6:v1':{mode:'maze',age:6,step:6,cursor:'wrong',attempt:1}}});
  const p=await import(`../progression.js?bad=${++instance}`);
  assert.deepEqual(p.getProgress().entries,{});
  assert.deepEqual(readStore('learning-progress-v1',{}),{'upper:A':true});
  assert.deepEqual(readStore('discovery-progress-v1',{}),{maze:35});
});
