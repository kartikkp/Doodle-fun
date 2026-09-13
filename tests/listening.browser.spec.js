import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {LISTENING_IDS,LISTENING_INFO,buildListeningRound} from '../listening.js';
import {getProfile} from '../core.js';

const backendByBrowser=new Map();
test.beforeEach(async({page,browserName},info)=>{
  const needsLive=/hears real audio|game sound is independent|preview cannot earn/.test(info.title);
  if(!needsLive)return;
  if(!backendByBrowser.has(browserName)) {
    await page.goto('/');
    await page.evaluate(()=>{
      const button=document.createElement('button');button.textContent='Probe audio backend';button.id='qa-audio-probe';document.body.prepend(button);
      button.addEventListener('click',()=>{
        try {
          const Audio=window.AudioContext||window.webkitAudioContext,context=new Audio(),gain=context.createGain(),oscillator=context.createOscillator(),analyser=context.createAnalyser();
          gain.gain.value=.005;oscillator.connect(gain);gain.connect(analyser);analyser.connect(context.destination);oscillator.start();context.resume();
          window.__audioProbe={context,oscillator,analyser,start:context.currentTime};
        }catch(error){window.__audioProbe={error:error.message};}
      });
    });
    await page.locator('#qa-audio-probe').click();
    const evidence=await page.evaluate(async()=>{
      const probe=window.__audioProbe;if(probe.error)return {available:false,error:probe.error};
      const data=new Float32Array(2048);let peak=0;
      for(let i=0;i<20;i++){await new Promise(resolve=>setTimeout(resolve,25));probe.analyser.getFloatTimeDomainData(data);for(const value of data)peak=Math.max(peak,Math.abs(value));}
      const delta=probe.context.currentTime-probe.start,state=probe.context.state;probe.oscillator.stop();await probe.context.close();
      return {available:delta>.05&&peak>.00001,clockAdvance:delta,peak,state};
    });
    backendByBrowser.set(browserName,evidence);
  }
  const evidence=backendByBrowser.get(browserName);
  info.annotations.push({type:'live-audio-backend',description:JSON.stringify(evidence)});
  test.skip(!evidence.available,`No advancing live audio output backend: ${JSON.stringify(evidence)}. OfflineAudioContext synthesis and unavailable/stalled-audio recovery remain tested; this is not a live-playback pass.`);
});

test.afterEach(async({page},info)=>{
  if(page.isClosed())return;
  const rows=await page.evaluate(()=>(window.__listeningAudio||[]).map(record=>({state:record.context.state,currentTime:record.context.currentTime,peak:record.peak,lastRms:record.lastRms,samples:record.samples,outputConnections:record.connections})));
  if(rows.length)await info.attach('real-audio-signal.json',{body:JSON.stringify(rows,null,2),contentType:'application/json'});
});

// Test-only instrumentation observes the real output graph. It neither mocks
// playback nor grants microphone/recording permissions or changes autoplay policy.
async function observeAudio(page,age) {
  await page.addInitScript(age=>{
    localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false}));
    localStorage.setItem('doodle-fun:v2:listening-audio-v1',JSON.stringify({enabled:true,volume:.55}));
    window.__listeningAudio=[];
    const Native=window.AudioContext||window.webkitAudioContext;
    if(!Native)return;
    function ObservedAudio(...args) {
      const context=new Native(...args),analyser=context.createAnalyser();analyser.fftSize=2048;analyser.connect(context.destination);
      const record={context,peak:0,lastRms:0,samples:0,connections:0};window.__listeningAudio.push(record);
      const createGain=context.createGain.bind(context);
      context.createGain=(...args)=>{
        const node=createGain(...args),connect=node.connect.bind(node);
        node.connect=(destination,...rest)=>{if(destination===context.destination){record.connections++;return connect(analyser,...rest);}return connect(destination,...rest);};
        return node;
      };
      const data=new Float32Array(analyser.fftSize);
      setInterval(()=>{analyser.getFloatTimeDomainData(data);let sum=0;for(const value of data){sum+=value*value;record.peak=Math.max(record.peak,Math.abs(value));}record.lastRms=Math.sqrt(sum/data.length);record.samples++;},15);
      return context;
    }
    ObservedAudio.prototype=Native.prototype;Object.setPrototypeOf(ObservedAudio,Native);
    window.AudioContext=ObservedAudio;if(window.webkitAudioContext)window.webkitAudioContext=ObservedAudio;
  },age);
}
async function start(page,id,age) {
  // The capability probe already visited /. A query change forces a fresh
  // document so init scripts run instead of making only a hash navigation.
  await observeAudio(page,age);await page.goto(`/?listening-qa=${age}#${id}`);
  await expect(page.getByRole('heading',{name:LISTENING_INFO[id].title,exact:true})).toBeVisible();
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','waiting');
  expect(await page.evaluate(()=>window.__listeningAudio.length),'opening never autoplays').toBe(0);
  return buildListeningRound(id,getProfile({age}),0);
}
async function listen(page) {
  await page.locator('[data-listening-listen]').click();
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','ready');
  await expect.poll(()=>page.evaluate(()=>Math.max(0,...window.__listeningAudio.map(record=>record.peak)))).toBeGreaterThan(.0001);
}
async function previewDone(page){await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-preview-busy','false');}
async function playCorrect(page,id,q) {
  if(id==='sound-match'||id==='pitch-path')await page.locator(`[data-listening-answer="${q.answer}"]`).click();
  else if(id==='melody-echo')for(const pad of q.sequence){await page.locator(`[data-listening-pad="${pad}"]`).click();await previewDone(page);}
  else {
    const drum=page.locator('[data-listening-drum]');await drum.scrollIntoViewIfNeeded();const rect=await drum.boundingBox();
    let due=Date.now();
    for(let i=0;i<q.times.length;i++) {
      if(i){due+=q.gaps[i-1]*1000;await page.waitForTimeout(Math.max(0,due-Date.now()));}
      await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
    }
    await previewDone(page);await page.locator('[data-listening-check]').click();
  }
  await expect(page.getByTestId('listening-feedback')).toHaveClass(/is-complete/);
}
for(const age of [2,3,4,5,6,7,8,9,10])for(const id of LISTENING_IDS) {
  test(`${id}: age ${age} hears real audio, retries, uses a hint and completes`,async({page})=>{
    await page.setViewportSize(age%3===0?{width:667,height:375}:{width:375,height:667});
    const q=await start(page,id,age);
    if(age>2)await expect(page.locator('[data-listening-model]')).toBeHidden();
    if(id==='sound-match'||id==='pitch-path')for(const choice of await page.locator('[data-listening-answer]').all())await expect(choice).toBeDisabled();
    await listen(page);
    if(id==='sound-match') {
      const wrong=q.choices.find(value=>value!==q.answer);
      await page.locator(`[data-listening-preview="${q.answer}"]`).click();
      await expect(page.locator(`[data-listening-answer="${q.answer}"]`)).toBeDisabled();await previewDone(page);
      await expect(page.getByTestId('listening-feedback')).not.toHaveClass(/is-complete/);
      await page.locator(`[data-listening-answer="${wrong}"]`).click();
    } else if(id==='pitch-path')await page.locator(`[data-listening-answer="${q.choices.find(value=>value!==q.answer)}"]`).click();
    else if(id==='melody-echo'){await page.locator(`[data-listening-pad="${(q.sequence[0]+1)%q.frequencies.length}"]`).click();await previewDone(page);await expect(page.locator('.listening-echo-slot.is-filled')).toHaveCount(0);}
    else {await page.locator('[data-listening-drum]').click();await previewDone(page);await page.locator('[data-listening-check]').click();}
    await expect(page.getByTestId('listening-feedback')).not.toHaveClass(/is-complete/);
    await page.getByRole('button',{name:'Try again',exact:true}).click();
    await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','waiting');
    await page.locator('[data-listening-hint]').click();await expect(page.locator('[data-listening-model]')).toBeVisible();
    await listen(page);await playCorrect(page,id,q);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('doodle-fun:v2:listening-progress-v1')));
    expect(stored.stars[`${id}:${age}:0`]).toBe(true);expect(Object.keys(stored.stars)).toHaveLength(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const controls=await page.locator('.listening-screen button,.listening-screen input').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>{const r=node.getBoundingClientRect();return {label:node.getAttribute('aria-label')||node.textContent,width:r.width,height:r.height,left:r.left,right:r.right};}));
    for(const control of controls){expect(control.width,`${control.label} width`).toBeGreaterThanOrEqual(48);expect(control.height,`${control.label} height`).toBeGreaterThanOrEqual(48);expect(control.left).toBeGreaterThanOrEqual(0);expect(control.right).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));}
  });
}

test('game sound is independent of narration; off, modal and route cancel unheard playback',async({page})=>{
  await start(page,'melody-echo',10);
  await expect(page.locator('#coach-sound')).toHaveAttribute('aria-pressed','false');
  await page.locator('[data-listening-listen]').click();
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','playing');
  await page.locator('[data-listening-sound]').click();
  await expect(page.locator('[data-listening-listen]')).toBeDisabled();
  await page.waitForTimeout(2600);await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','waiting');
  expect(await page.evaluate(()=>localStorage.getItem('doodle-fun:v2:listening-progress-v1'))).toBeNull();
  await page.locator('[data-listening-sound]').click();await listen(page);
  await page.locator('#coach-open').click();await expect(page.locator('#coach-dialog')).toBeVisible();
  await page.getByRole('button',{name:'Close coach',exact:true}).click();
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','waiting');
  await page.locator('[data-listening-listen]').click();await page.getByRole('button',{name:'Back to activities',exact:true}).click();
  await expect(page.locator('.listening-screen')).toHaveCount(0);await page.waitForTimeout(100);
  expect(await page.evaluate(()=>window.__listeningAudio.every(record=>record.context.state!=='running'))).toBe(true);
});

test('preview cannot earn progress, a melody pad before Listen only explores, completed retry is idempotent',async({page})=>{
  await start(page,'melody-echo',2);await page.locator('[data-listening-pad="0"]').click();await previewDone(page);
  await expect(page.locator('.listening-echo-slot.is-filled')).toHaveCount(0);
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','waiting');
  await page.goto('/#sound-match');const q=buildListeningRound('sound-match',2);
  for(let count=0;count<2;count++){await listen(page);await playCorrect(page,'sound-match',q);if(!count)await page.getByRole('button',{name:'Try again',exact:true}).click();}
  expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('doodle-fun:v2:listening-progress-v1')).stars).length)).toBe(1);
});

test('an unavailable AudioContext produces a retry message and cannot score an unheard challenge',async({page})=>{
  await page.addInitScript(()=>{window.AudioContext=function(){throw new Error('Audio unavailable for this test');};window.webkitAudioContext=window.AudioContext;});
  await page.goto('/#pitch-path');await page.locator('[data-listening-listen]').click();
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','waiting');
  await expect(page.getByTestId('listening-feedback')).toContainText('Audio unavailable');
  for(const answer of await page.locator('[data-listening-answer]').all())await expect(answer).toBeDisabled();
  expect(await page.evaluate(()=>localStorage.getItem('doodle-fun:v2:listening-progress-v1'))).toBeNull();
});

test('a stalled audio clock exits Listening with retry feedback and never enables an answer',async({page})=>{
  await page.addInitScript(()=>{
    const Native=window.AudioContext||window.webkitAudioContext;
    window.AudioContext=function(...args){const context=new Native(...args);Object.defineProperty(context,'currentTime',{get:()=>0});return context;};
  });
  await page.goto('/#pitch-path');await page.locator('[data-listening-listen]').click();
  await expect(page.getByTestId('listening-feedback')).toContainText('Sound could not start');
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','waiting');
  await expect(page.locator('[data-listening-listen]')).toBeEnabled();
  for(const answer of await page.locator('[data-listening-answer]').all())await expect(answer).toBeDisabled();
  expect(await page.evaluate(()=>localStorage.getItem('doodle-fun:v2:listening-progress-v1'))).toBeNull();
});

test('null, array, primitive and malformed audio preferences cannot prevent any sound game from opening',async({page})=>{
  for(const [index,raw] of ['null','[]','"oops"','{broken'].entries()) {
    await page.goto(`/?prefs-setup=${index}`);await page.evaluate(raw=>localStorage.setItem('doodle-fun:v2:listening-audio-v1',raw),raw);
    for(const id of LISTENING_IDS){await page.goto(`/?prefs-case=${index}-${id}#${id}`);await expect(page.getByRole('heading',{name:LISTENING_INFO[id].title,exact:true})).toBeVisible();await expect(page.locator('[data-listening-sound]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-listening-listen]')).toBeEnabled();}
  }
});

test('actual OfflineAudioContext rendering has bounded nonzero, distinct voices and all four game signals',async({page})=>{
  await page.goto('/');
  const source=await readFile(new URL('../audio.js',import.meta.url),'utf8');
  const moduleURL=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const cases=[...['drum','bell','shaker','wood'].map(kind=>({name:kind,events:[{kind,time:0,duration:.3}]})),...LISTENING_IDS.flatMap(id=>[2,10].map(age=>({name:`${id}-${age}`,events:buildListeningRound(id,age).events})))];
  const results=await page.evaluate(async({moduleURL,cases})=>{
    const {scheduleSound,MAX_MASTER_GAIN}=await import(moduleURL),Audio=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    const rows=[];
    for(const entry of cases){
      const duration=Math.max(...entry.events.map(e=>e.time+e.duration))+.2,context=new Audio(1,Math.ceil(duration*44100),44100),master=context.createGain();master.gain.value=MAX_MASTER_GAIN*.55;master.connect(context.destination);
      entry.events.forEach(event=>scheduleSound(context,master,event,event.time+.02));
      const buffer=await context.startRendering(),data=buffer.getChannelData(0);let sum=0,peak=0,hash=0;
      for(let i=0;i<data.length;i++){sum+=data[i]*data[i];peak=Math.max(peak,Math.abs(data[i]));if(i%37===0)hash=(hash+Math.round(data[i]*100000)*(i+1))|0;}
      rows.push({name:entry.name,rms:Math.sqrt(sum/data.length),peak,hash});
    }return rows;
  },{moduleURL,cases});
  for(const row of results){expect(row.rms,`${row.name}: nonzero output`).toBeGreaterThan(.00005);expect(row.peak,`${row.name}: bounded peak`).toBeLessThan(.2);}
  expect(new Set(results.slice(0,4).map(row=>row.hash)).size,'four distinct rendered percussion waveforms').toBe(4);
});
