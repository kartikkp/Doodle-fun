import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile, writeFile, mkdir, mkdtemp, rm, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {instrumentNativeAudioController, collectNativeAudioDiagnostics} from '../scripts/native-audio-diagnostics.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const observer = await readFile(path.join(root, 'ios/DoodleFunTests/Fixtures/native-audio-diagnostics.js'), 'utf8');
const traceDirectory = `doodle-audio-qa-${'a'.repeat(32)}`;
function sandbox() {
  const context = vm.createContext({});
  vm.runInContext(`
    const captured = [], timers = new Map(); let timerId = 0;
    const webkit = {messageHandlers:{doodleQASpeech:{postMessage:event=>captured.push(event)}}};
    globalThis.webkit=webkit; const window = globalThis; const performance = {now:()=>100};
    const documentEvents = {}, statusElement = {textContent:''}; let statusMutation;
    const document = {hidden:false, addEventListener(name,callback){documentEvents[name]=callback;}, querySelector(){return statusElement;}};
    class MutationObserver { constructor(callback){statusMutation=callback;} observe(){} }
    function addEventListener() {}
    function setTimeout(callback, delay, ...args) { const id=++timerId; timers.set(id,{callback,delay,args}); return id; }
    function clearTimeout(id) { timers.delete(id); }
    class AudioContext {
      state='suspended'; currentTime=0; listeners={};
      addEventListener(name,callback) { this.listeners[name]=callback; }
      resume() { this.state='running'; return this.resumed = this.resumeError ? Promise.reject(this.resumeError) : Promise.resolve(); }
      decodeAudioData() { return this.decoded = this.decodeError ? Promise.reject(this.decodeError) : Promise.resolve({duration:9.952,sampleRate:48000}); }
      close() { this.state='closed'; return this.closed = Promise.resolve(); }
      createBufferSource() { return {buffer:null, addEventListener(){}, start(){return 17;}, stop(){return 18;}}; }
    }
    globalThis.AudioContext=AudioContext;
    const nativeAll=Promise.all;
    let originalAggregate;
    Promise.all=function(...args) { return originalAggregate=Reflect.apply(nativeAll,this,args); };
  `, context);
  vm.runInContext(observer, context);
  return context;
}

test('observer preserves original audio and aggregate promises, source return values and native readiness', async () => {
  const context=sandbox();
  await vm.runInContext(`(async()=>{
    const audio=new AudioContext();
    const resumed=audio.resume(), decoded=audio.decodeAudioData(new ArrayBuffer(3));
    const prepared=Promise.resolve({ok:true});
    const joined=Promise.all([prepared,resumed,decoded]);
    const same={resume:resumed===audio.resumed, decode:decoded===audio.decoded, aggregate:joined===originalAggregate};
    await joined; await Promise.resolve();
    const source=audio.createBufferSource(); source.buffer={duration:9.952};
    globalThis.result={same,start:source.start(),stop:source.stop(),events:captured};
  })()`,context);
  const result=JSON.parse(JSON.stringify(context.result));
  assert.deepEqual(result.same,{resume:true,decode:true,aggregate:true});
  assert.equal(result.start,17);assert.equal(result.stop,18);
  assert.ok(result.events.some(event=>event.event==='preparation-resolved'&&event.ok));
  assert.ok(result.events.some(event=>event.event==='startup-join-resolved'&&event.state==='running'&&event.duration===9.952));
});

test('observer distinguishes rejected preparation and nonrunning startup without recording child text or audio', async () => {
  const context=sandbox();
  await vm.runInContext(`(async()=>{
    const audio=new AudioContext();
    const decoded=audio.decodeAudioData(new ArrayBuffer(123));
    await Promise.all([Promise.reject(new Error('private child text')),Promise.resolve(),decoded]).catch(()=>{});
    await Promise.all([Promise.resolve({ok:false,reason:'inactive'}),Promise.resolve(),audio.decodeAudioData(new ArrayBuffer(2))]);
    globalThis.result=captured;
  })()`,context);
  const events=JSON.parse(JSON.stringify(context.result));
  assert.ok(events.some(event=>event.event==='preparation-rejected'&&event.errorName==='Error'));
  assert.ok(events.some(event=>event.event==='startup-join-rejected'));
  assert.ok(events.some(event=>event.event==='preparation-resolved'&&event.reason==='inactive'&&!event.ok));
  assert.ok(events.some(event=>event.event==='startup-join-resolved'&&event.state==='suspended'));
  assert.doesNotMatch(JSON.stringify(events),/private child text|errorMessage|base64|buffer/);
});

test('resume and decode rejections keep their original promises and identify the failing operation', async () => {
  for(const operation of ['resume','decode']){
    const context=sandbox();context.operation=operation;
    await vm.runInContext(`(async()=>{
      const audio=new AudioContext();audio[operation+'Error']=new Error('private text');
      const resumed=audio.resume(),decoded=audio.decodeAudioData(new ArrayBuffer(1));
      const joined=Promise.all([Promise.resolve({ok:true}),resumed,decoded]);
      const same=[resumed===audio.resumed,decoded===audio.decoded,joined===originalAggregate];
      await joined.catch(()=>{});globalThis.result={same,events:captured};
    })()`,context);
    const result=JSON.parse(JSON.stringify(context.result));
    assert.deepEqual(result.same,[true,true,true]);
    assert.ok(result.events.some(event=>event.event===`${operation==='decode'?'decodeAudioData':operation}-rejected`));
    assert.ok(result.events.some(event=>event.event==='startup-join-rejected'));
    assert.doesNotMatch(JSON.stringify(result),/private text/);
  }
});

test('unrelated Promise.all arrays and iterables retain their exact promises without startup events', async () => {
  const context=sandbox();
  await vm.runInContext(`(async()=>{
    const first=Promise.all([Promise.resolve(1),2,3]),firstSame=first===originalAggregate;
    const second=Promise.all(new Set([4,5])),secondSame=second===originalAggregate;
    globalThis.result={firstSame,secondSame,first:await first,second:await second,events:captured};
  })()`,context);
  const result=JSON.parse(JSON.stringify(context.result));
  assert.equal(result.firstSame,true);assert.equal(result.secondSame,true);
  assert.deepEqual(result.first,[1,2,3]);assert.deepEqual(result.second,[4,5]);
  assert.equal(result.events.some(event=>event.event.startsWith('startup-join')||event.event.startsWith('preparation-')),false);
});

test('diagnostics preserve the existing 5 second deadline, callbacks, arguments and cancellation', () => {
  const context=sandbox();
  vm.runInContext(`
    let received;
    const id=setTimeout(function(value){received=[this.marker,value];return 42;},5000,'original');
    const scheduled=timers.get(id);
    const value=scheduled.callback.call({marker:'receiver'},...scheduled.args);
    clearTimeout(id);
    const other=setTimeout(()=>{},4000);
    globalThis.result={id,value,received,delay:scheduled.delay,cleared:!timers.has(id),otherDelay:timers.get(other).delay,events:captured};
  `,context);
  const result=JSON.parse(JSON.stringify(context.result));
  assert.equal(result.value,42);assert.deepEqual(result.received,['receiver','original']);
  assert.equal(result.delay,5000);assert.equal(result.otherDelay,4000);assert.equal(result.cleared,true);
  assert.deepEqual(result.events.filter(event=>event.event.startsWith('startup-timer')).map(event=>event.event),
    ['startup-timer-scheduled','startup-timer-fired','startup-timer-cleared']);
});

test('all production Coach statuses map to fixed enums without retaining displayed text', async () => {
  const source=await readFile(path.join(root,'app.js'),'utf8');
  const statuses=['Playing spoken help…','Spoken help finished.','Spoken help requested.','Spoken help stopped.','Spoken help could not play. Try Hear again.'];
  for(const status of statuses)assert.ok(source.includes(status));
  const context=sandbox();
  context.values=statuses;
  vm.runInContext(`documentEvents.DOMContentLoaded(); for(const value of values){statusElement.textContent=value;statusMutation();}
    statusElement.textContent='private child text';statusMutation();globalThis.result=captured;`,context);
  const events=JSON.parse(JSON.stringify(context.result));
  assert.deepEqual(events.filter(event=>event.event==='coach-status').map(event=>event.status),['playing','finished','requested','stopped','failed','other']);
  assert.doesNotMatch(JSON.stringify(events),/Spoken help|private child text/);
});

test('observer stops recording at 500 events while continuing original calls', () => {
  const context=sandbox();
  vm.runInContext(`for(let i=0;i<700;i++)setTimeout(()=>{},5000); globalThis.result={events:captured.length,timers:timers.size};`,context);
  assert.equal(context.result.events,500);assert.equal(context.result.timers,700);
});

test('copied controller instrumentation fails closed on changed anchors and all additions are DEBUG gated', async () => {
  const original=await readFile(path.join(root,'ios/DoodleFun/DoodleViewController.swift'),'utf8');
  const result=instrumentNativeAudioController(original,observer,traceDirectory);
  assert.match(result.source,/let originalReply = replyHandler/);
  assert.match(result.source,/originalReply\(value, error\)/);
  assert.match(result.source,/count < 600/);
  // Remove inserted DEBUG blocks; the release source must remain identical.
    const removeDebug=source=>source.replace(/^[ \t]*#if DEBUG\n[\s\S]*?^[ \t]*#endif\n/gm,'').replace(/\n{3,}/g,'\n\n').trim();
  assert.equal(removeDebug(result.source),removeDebug(original));
  assert.throws(()=>instrumentNativeAudioController(original.replace('try session.setActive(true)','try session.setActive(false)'),observer,traceDirectory),/anchor changed/);
  assert.throws(()=>instrumentNativeAudioController(original,observer,'../outside'),/Invalid/);
});

test('runner opt-in preserves source, packaged HTML and existing trusted test while default copy has no observer', async () => {
  const temp=await mkdtemp(path.join(tmpdir(),'doodle-audio-diagnostics-'));
  const files=['ios/DoodleFun/DoodleViewController.swift','ios/DoodleFun/Resources/index.html','ios/DoodleFun.xcodeproj/project.pbxproj','ios/DoodleFunUITests/ActivityCatalogUITests.swift'];
  const originals=await Promise.all(files.map(file=>readFile(path.join(root,file))));
  try{
    for(const enabled of [false,true]){
      const output=path.join(temp,String(enabled));
      const result=spawnSync(process.execPath,['scripts/run-iphone-qa.mjs','--prepare-only','--without-gameplay','--output',output,
        ...(enabled?['--audio-diagnostics']:[]),'--only','DoodleFunUITests/ActivityCatalogUITests/testTrustedCoachClipCompletesOnlyAfterHearAndCancelsOnBackground'],{cwd:root,encoding:'utf8',timeout:30000});
      assert.equal(result.status,0,result.stderr);
      const metadata=JSON.parse(await readFile(path.join(output,'qa-build.json'),'utf8'));
      assert.equal(Boolean(metadata.audioDiagnostics),enabled);
      const controller=await readFile(path.join(output,'project',files[0]),'utf8');
      assert.equal(controller.includes('DoodleQAAudioTrace'),enabled);
      for(const i of [1,2,3])assert.deepEqual(await readFile(path.join(output,'project',files[i])),originals[i]);
    }
    for(const [i,file] of files.entries())assert.deepEqual(await readFile(path.join(root,file)),originals[i]);
    const workflow=await readFile(path.join(root,'.github/workflows/qa.yml'),'utf8');
    assert.match(workflow,/--without-gameplay --audio-diagnostics/);
    assert.match(workflow,/DoodleFun-native-audio-qa\/audio-diagnostics\/\*\*/);
  }finally{await rm(temp,{recursive:true,force:true});}
});

test('collection retains per-launch JSONL only from the exact generated QA directory', async () => {
  const temp=await mkdtemp(path.join(tmpdir(),'doodle-audio-collection-'));
  try{
    const applicationsDirectory=path.join(temp,'apps'),output=path.join(temp,'output');
    const directory=path.join(applicationsDirectory,'app','tmp',traceDirectory);
    await mkdir(directory,{recursive:true});
    const name='11111111-1111-1111-1111-111111111111.jsonl';
    await writeFile(path.join(directory,name),' {"event":"source-start"}\n');
    await writeFile(path.join(directory,'unrelated.txt'),'not a diagnostic');
    await mkdir(path.join(applicationsDirectory,'another','tmp'),{recursive:true});
    await writeFile(path.join(applicationsDirectory,'another','tmp','private.jsonl'),'private');
    const result=await collectNativeAudioDiagnostics({applicationsDirectory,traceDirectory,output});
    assert.equal(result.files.length,1);assert.equal(result.files[0].events,1);
    assert.deepEqual(await readdir(path.join(output,'audio-diagnostics')),[name]);
    assert.doesNotMatch(JSON.stringify(result),/private/);
  }finally{await rm(temp,{recursive:true,force:true});}
});
