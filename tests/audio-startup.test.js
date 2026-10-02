import test from 'node:test';
import assert from 'node:assert/strict';
import {beginAudioStartup} from '../audio-startup.js';

function deferred() {
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}
function replaceGlobal(t,name,value) {
  const original=Object.getOwnPropertyDescriptor(globalThis,name);
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
  t.after(()=>{if(original)Object.defineProperty(globalThis,name,original);else delete globalThis[name];});
}
function setup(t,{native=true,state='suspended',resumeThrows=false,nativeThrows=false}={}) {
  let now=0,nextTimer=0;
  const timers=new Map(),calls=[],resumes=[],preparations=[],listeners=new Set();
  t.mock.method(globalThis,'setTimeout',(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;});
  t.mock.method(globalThis,'clearTimeout',id=>timers.delete(id));
  replaceGlobal(t,'navigator',{audioSession:{set type(value){calls.push(`session:${value}`);}}});
  replaceGlobal(t,'webkit',native?{messageHandlers:{doodleAudio:{postMessage(message){
    assert.deepEqual(message,{type:'prepareGameAudio'});calls.push('native');
    if(nativeThrows)throw new Error('Native denied');
    const result=deferred();preparations.push(result);return result.promise;
  }}}}:undefined);
  const context={
    state,
    addEventListener(type,listener){assert.equal(type,'statechange');listeners.add(listener);},
    removeEventListener(type,listener){assert.equal(type,'statechange');listeners.delete(listener);},
    resume(){
      calls.push('resume');
      if(resumeThrows)throw new Error('Resume denied');
      const result=deferred();resumes.push(result);return result.promise;
    },
  };
  function emit(state){context.state=state;for(const listener of [...listeners])listener();}
  const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  async function advance(duration) {
    await flush();const end=now+duration;
    for(;;) {
      const entry=[...timers.entries()].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!entry)break;
      now=entry[1].at;timers.delete(entry[0]);entry[1].fn();await flush();
    }
    now=end;await flush();
  }
  function assertClean(){assert.equal(timers.size,0,'startup timers are removed');assert.equal(listeners.size,0,'startup state listener is removed');}
  return {context,calls,resumes,preparations,timers,listeners,emit,flush,advance,assertClean};
}

test('session preference, native activation and initial resume stay in the original gesture stack',async t=>{
  const f=setup(t);const request=beginAudioStartup(f.context);
  assert.deepEqual(f.calls,['session:playback','native','resume']);
  assert.equal(f.timers.size,1,'only native preparation has a deadline before activation');
  f.emit('suspended');await f.advance(4700);
  assert.equal(f.listeners.size,1,'initial suspension must not abort startup');
  assert.equal(f.calls.filter(call=>call==='resume').length,1);
  f.preparations[0].resolve({ok:true});await f.flush();
  assert.equal(f.resumes.length,2,'one post-activation resume starts even with initial resume pending');
  f.emit('running');
  assert.deepEqual(await request.ready,{status:'ready'});
  f.assertClean();
});

test('native success can prove running without waiting for or retrying the original pending resume',async t=>{
  const f=setup(t),request=beginAudioStartup(f.context);let result;
  request.ready.then(value=>{result=value;});
  f.emit('running');await f.flush();assert.equal(result,undefined,'native activation still owns its phase');
  await f.advance(9000);f.preparations[0].resolve({ok:true});await f.flush();
  assert.deepEqual(result,{status:'ready'});assert.equal(f.resumes.length,1);f.assertClean();
  f.resumes[0].reject(new Error('Late stale rejection'));await f.flush();
  assert.deepEqual(result,{status:'ready'});
});

test('the unchanged 2.5 second output deadline starts only after native preparation succeeds',async t=>{
  const f=setup(t),request=beginAudioStartup(f.context);let result;
  request.ready.then(value=>{result=value;});
  await f.advance(4700);assert.equal(result,undefined);
  f.preparations[0].resolve({ok:true});await f.flush();
  assert.equal(f.resumes.length,2);
  await f.advance(2499);assert.equal(result,undefined);
  await f.advance(1);assert.deepEqual(await request.ready,{status:'failed'});
  assert.equal(f.resumes.length,2,'a watchdog does not repeatedly resume output');f.assertClean();
  f.emit('running');f.resumes.forEach(resume=>resume.resolve());await f.flush();f.assertClean();
});

test('native preparation has a bounded ten-second resource cap and late success cannot resume output',async t=>{
  const f=setup(t),request=beginAudioStartup(f.context);let result;
  request.ready.then(value=>{result=value;});
  await f.advance(9999);assert.equal(result,undefined);
  await f.advance(1);assert.deepEqual(await request.ready,{status:'failed'});f.assertClean();
  f.preparations[0].resolve({ok:true});await f.flush();assert.equal(f.resumes.length,1);f.assertClean();
});

for(const outcome of ['denied','rejected','throw'])test(`native ${outcome} is caught and cleans up without a post-activation resume`,async t=>{
  const f=setup(t,{nativeThrows:outcome==='throw'}),request=beginAudioStartup(f.context);
  assert.equal(f.resumes.length,1,'the gesture resume is still requested synchronously');
  if(outcome==='denied')f.preparations[0].resolve({ok:false});
  if(outcome==='rejected')f.preparations[0].reject(new Error('Denied'));
  assert.deepEqual(await request.ready,{status:'failed'});f.assertClean();
  f.resumes[0].reject(new Error('Late resume rejection'));await f.flush();f.assertClean();
});

test('an initial pre-activation resume rejection can recover once native activation succeeds',async t=>{
  const f=setup(t),request=beginAudioStartup(f.context);let result;
  request.ready.then(value=>{result=value;});
  f.resumes[0].reject(new Error('Session not active'));await f.flush();assert.equal(result,undefined);
  f.preparations[0].resolve({ok:true});await f.flush();assert.equal(f.resumes.length,2);
  f.context.state='running';f.resumes[1].resolve();
  assert.deepEqual(await request.ready,{status:'ready'});f.assertClean();
});

for(const outcome of ['rejected','closed','interrupted'])test(`post-activation ${outcome} fails and removes startup resources`,async t=>{
  const f=setup(t),request=beginAudioStartup(f.context);
  f.preparations[0].resolve({ok:true});await f.flush();
  if(outcome==='rejected')f.resumes[1].reject(new Error('Output unavailable'));else f.emit(outcome);
  assert.deepEqual(await request.ready,{status:'failed'});f.assertClean();
});

for(const phase of ['preparing','starting'])for(const method of ['cancel','supersede'])test(`${method} during ${phase} prevents delayed readiness and further resumes`,async t=>{
  const f=setup(t);let owned=true;
  const request=beginAudioStartup(f.context,{isCurrent:()=>owned});
  if(phase==='starting'){f.preparations[0].resolve({ok:true});await f.flush();}
  const calls=f.resumes.length;
  if(method==='cancel')request.cancel();else owned=false;
  f.preparations[0].resolve({ok:true});f.emit('running');f.resumes.forEach(resume=>resume.resolve());
  assert.deepEqual(await request.ready,{status:'cancelled'});assert.equal(f.resumes.length,calls);f.assertClean();
});

test('an already superseded request makes no activation requests',async t=>{
  const f=setup(t),request=beginAudioStartup(f.context,{isCurrent:()=>false});
  assert.deepEqual(await request.ready,{status:'cancelled'});assert.deepEqual(f.calls,[]);f.assertClean();
});

test('a newer request sharing the context owns its own native reply and resume',async t=>{
  const f=setup(t);let owner=1;
  const first=beginAudioStartup(f.context,{isCurrent:()=>owner===1});
  owner=2;const second=beginAudioStartup(f.context,{isCurrent:()=>owner===2});
  f.preparations[0].resolve({ok:true});await f.flush();
  assert.deepEqual(await first.ready,{status:'cancelled'});assert.equal(f.resumes.length,2);
  f.preparations[1].resolve({ok:true});await f.flush();assert.equal(f.resumes.length,3);
  f.emit('running');assert.deepEqual(await second.ready,{status:'ready'});f.assertClean();
});

for(const outcome of ['running','timeout','rejected','throw'])test(`browser-only ${outcome} retains gesture resume and the 2.5 second cap`,async t=>{
  const f=setup(t,{native:false,resumeThrows:outcome==='throw'}),request=beginAudioStartup(f.context);
  assert.deepEqual(f.calls,['session:playback','resume']);
  if(outcome==='running')f.emit('running');
  if(outcome==='timeout')await f.advance(2500);
  if(outcome==='rejected')f.resumes[0].reject(new Error('Output denied'));
  assert.deepEqual(await request.ready,{status:outcome==='running'?'ready':'failed'});f.assertClean();
});

test('the caller can supply its existing output deadline independently of native preparation',async t=>{
  const f=setup(t),request=beginAudioStartup(f.context,{prepareTimeout:8000,startTimeout:5000});let result;
  request.ready.then(value=>{result=value;});await f.advance(7999);
  f.preparations[0].resolve({ok:true});await f.flush();await f.advance(4999);assert.equal(result,undefined);
  await f.advance(1);assert.deepEqual(await request.ready,{status:'failed'});f.assertClean();
});
