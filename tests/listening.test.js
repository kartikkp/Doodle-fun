import test from 'node:test';
import assert from 'node:assert/strict';
import {LISTENING_IDS,LISTENING_INFO,soundProfile,buildListeningRound,evaluateBeat} from '../listening.js';
import {getProfile} from '../core.js';
import {TIMBRES,MAX_MASTER_GAIN} from '../audio.js';

test('four sound activities and all nine effective-age profiles have distinct, bounded challenges',()=>{
  assert.equal(new Set(LISTENING_IDS).size,4);
  const profiles=Array.from({length:9},(_,i)=>soundProfile(getProfile({age:i+2})));
  assert.equal(new Set(profiles.map(p=>JSON.stringify({...p,age:0}))).size,9);
  assert.equal(soundProfile(getProfile({age:10,challengeOffset:-2})).age,8);
  assert.equal(soundProfile(getProfile({age:2,level:'maker'})).age,9);
  assert.equal(soundProfile(-5).age,2);assert.equal(soundProfile(900).age,10);
  assert.ok(MAX_MASTER_GAIN<=.2);
  profiles.forEach(p=>{assert.ok(p.padCount<=5);assert.ok(p.melodyLength<=6);assert.ok(p.beatCount<=7);assert.ok(p.timbreChoices<=4);});
});
test('every generated sound, pitch, melody and rhythm is internally correct across ages and rounds',()=>{
  for(let age=2;age<=10;age++)for(let round=0;round<24;round++)for(const id of LISTENING_IDS) {
    const q=buildListeningRound(id,getProfile({age}),round);assert.equal(q.age,age);assert.ok(LISTENING_INFO[id].title);assert.ok(q.events.length>=1);
    for(const [index,event] of q.events.entries()){assert.ok(event.duration>0&&event.duration<=.65);assert.ok(event.time>=0);if(index)assert.ok(event.time>q.events[index-1].time);if(event.kind==='tone')assert.ok(event.frequency>=100&&event.frequency<=1600);else assert.ok(TIMBRES[event.kind]);}
    if(id==='sound-match'){assert.equal(q.sounds[q.position],q.answer);assert.ok(q.choices.includes(q.answer));assert.deepEqual(q.events.map(e=>e.kind),q.sounds);}
    if(id==='pitch-path'){
      assert.ok(q.choices.includes(q.answer));const changes=q.frequencies.slice(1).map((f,i)=>Math.sign(f-q.frequencies[i]));
      if(q.answer==='up')assert.ok(changes.every(c=>c===1));if(q.answer==='down')assert.ok(changes.every(c=>c===-1));if(q.answer==='same')assert.ok(changes.every(c=>c===0));
      if(q.answer==='hill'||q.answer==='valley'){assert.ok(changes.includes(1)&&changes.includes(-1));assert.equal(changes.find(c=>c!==0),q.answer==='hill'?1:-1);}
    }
    if(id==='melody-echo'){assert.equal(q.sequence.length,q.profile.melodyLength);q.sequence.forEach((pad,i)=>{assert.ok(pad>=0&&pad<q.frequencies.length);assert.equal(q.events[i].frequency,q.frequencies[pad]);});assert.ok(new Set(q.sequence).size>1);}
    if(id==='beat-studio'){assert.equal(q.times.length,q.profile.beatCount);q.gaps.forEach((gap,i)=>assert.ok(Math.abs(q.times[i+1]-q.times[i]-gap)<1e-9));if(age>3)assert.equal(new Set(q.gapUnits).size,2);}
  }
});
test('pitch challenge narrows intervals, expands contours and never reveals a default older-child melody model',()=>{
  assert.ok(soundProfile(2).pitchSemitones>soundProfile(10).pitchSemitones);
  assert.equal(soundProfile(2).contourChoices.length,2);assert.equal(soundProfile(10).contourChoices.length,5);
  assert.equal(soundProfile(2).modelByDefault,true);for(let age=3;age<=10;age++)assert.equal(soundProfile(age).modelByDefault,false);
  for(const age of [2,5,8,10]){const seen=new Set(Array.from({length:25},(_,round)=>buildListeningRound('pitch-path',age,round).answer));assert.deepEqual(seen,new Set(soundProfile(age).contourChoices));}
});
test('beat evaluator accepts matching relative gaps at different tempos and unlimited first-tap delay',()=>{
  for(let age=2;age<=10;age++) {
    const q=buildListeningRound('beat-studio',age);
    for(const scale of [.7,1,1.8]){const taps=q.times.map(t=>500000+t*1000*scale);assert.equal(evaluateBeat(taps,q.gaps,q.profile).passed,true,`age ${age}, tempo ${scale}`);}
    const wobble=q.times.map((t,i)=>9000+t*1000+(i%2?35:-20));assert.equal(evaluateBeat(wobble,q.gaps,q.profile).passed,true,`age ${age}, modest relative jitter`);
    assert.equal(evaluateBeat(q.times.slice(1).map(t=>t*1000),q.gaps,q.profile).passed,false);
    assert.equal(evaluateBeat([...q.times.map(t=>t*1000),99999],q.gaps,q.profile).passed,false);
  }
});
test('beat evaluator rejects a uniform or reversed-gap stream in older tasks, while toddlers can count untimed',()=>{
  for(let age=4;age<=10;age++) {
    const q=buildListeningRound('beat-studio',age),uniform=q.times.map((_,i)=>i*650);
    assert.equal(evaluateBeat(uniform,q.gaps,q.profile).passed,false,`uniform age ${age}`);
    const reversed=[0];q.gapUnits.forEach(unit=>reversed.push(reversed.at(-1)+(unit===1?2:1)*550));
    assert.equal(evaluateBeat(reversed,q.gaps,q.profile).passed,false,`inverse gap age ${age}`);
    assert.equal(evaluateBeat(q.times.map((_,i)=>i*50),q.gaps,q.profile).passed,false);
  }
  assert.equal(evaluateBeat([0,12000],[.65],soundProfile(2)).passed,true);
  assert.equal(evaluateBeat([0,600,9000],[.65,.65],soundProfile(3)).passed,true);
  assert.equal(evaluateBeat([1,1],[.65],soundProfile(2)).passed,false);
  assert.equal(evaluateBeat([0,NaN],[.65],soundProfile(2)).passed,false);
});
