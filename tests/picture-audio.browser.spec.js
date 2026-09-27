import {test,expect} from '@playwright/test';

test.use({hasTouch:true,viewport:{width:390,height:844}});
const backends=new Map();

async function probeOutput(page) {
  await page.goto('/');
  await page.evaluate(()=>{
    const button=document.createElement('button');button.id='picture-audio-probe';button.textContent='Probe audio';document.body.prepend(button);
    button.addEventListener('click',()=>{
      try {
        const Audio=window.AudioContext||window.webkitAudioContext,context=new Audio(),analyser=context.createAnalyser(),voice=context.createOscillator(),gain=context.createGain();
        gain.gain.value=.005;voice.connect(gain);gain.connect(analyser);analyser.connect(context.destination);voice.start();context.resume();
        window.__pictureProbe={context,analyser,voice,start:context.currentTime};
      }catch(error){window.__pictureProbe={error:String(error)};}
    });
  });
  await page.locator('#picture-audio-probe').tap();
  return page.evaluate(async()=>{
    const probe=window.__pictureProbe;if(probe.error)return {available:false,error:probe.error};
    const data=new Float32Array(2048);let peak=0;
    for(let n=0;n<20;n++){await new Promise(resolve=>setTimeout(resolve,25));probe.analyser.getFloatTimeDomainData(data);for(const value of data)peak=Math.max(peak,Math.abs(value));}
    const advance=probe.context.currentTime-probe.start,state=probe.context.state;
    probe.voice.stop();await probe.context.close();
    return {available:advance>.05&&peak>.00001,advance,peak,state};
  });
}

test.beforeEach(async({page,browserName},info)=>{
  if(!info.title.includes('live'))return;
  if(!backends.has(browserName))backends.set(browserName,await probeOutput(page));
  const evidence=backends.get(browserName);
  info.annotations.push({type:'live-audio-backend',description:JSON.stringify(evidence)});
  test.skip(!evidence.available,`No advancing live output backend: ${JSON.stringify(evidence)}. Offline signal tests are separate; this is not a live playback pass.`);
});
test.afterEach(async({page},info)=>{
  if(page.isClosed())return;
  const rows=await page.evaluate(()=>(window.__pictureAudio||[]).map(record=>({state:record.context.state,time:record.context.currentTime,peak:record.peak,sources:record.sources,connections:record.connections})));
  if(rows.length)await info.attach('picture-audio-signal.json',{body:JSON.stringify(rows,null,2),contentType:'application/json'});
});

async function start(page,{legacyAudio={enabled:true,volume:.55},age=8}={}) {
  await page.addInitScript(({legacyAudio,age})=>{
    localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false}));
    localStorage.setItem('doodle-fun:v2:listening-audio-v1',JSON.stringify(legacyAudio));
    const getItem=Storage.prototype.getItem;window.__legacyAudioReads=0;
    Storage.prototype.getItem=function(key){if(key==='doodle-fun:v2:listening-audio-v1')window.__legacyAudioReads++;return getItem.call(this,key);};
    localStorage.removeItem('doodle-fun:v2:adventures-progress-v1');
    window.__pictureAudio=[];
    const Native=window.AudioContext||window.webkitAudioContext;if(!Native)return;
    function ObservedAudio(...args) {
      const context=new Native(...args),analyser=context.createAnalyser();analyser.fftSize=2048;analyser.connect(context.destination);
      const record={context,analyser,peak:0,sources:0,connections:0};window.__pictureAudio.push(record);
      const createGain=context.createGain.bind(context);
      context.createGain=(...args)=>{
        const node=createGain(...args),connect=node.connect.bind(node);
        node.connect=(destination,...rest)=>{if(destination===context.destination){record.connections++;return connect(analyser,...rest);}return connect(destination,...rest);};return node;
      };
      for(const method of ['createOscillator','createBufferSource']) {
        const create=context[method].bind(context);context[method]=(...args)=>{record.sources++;return create(...args);};
      }
      const samples=new Float32Array(analyser.fftSize);
      const timer=setInterval(()=>{analyser.getFloatTimeDomainData(samples);for(const value of samples)record.peak=Math.max(record.peak,Math.abs(value));if(context.state==='closed')clearInterval(timer);},10);
      return context;
    }
    ObservedAudio.prototype=Native.prototype;Object.setPrototypeOf(ObservedAudio,Native);
    window.AudioContext=ObservedAudio;if(window.webkitAudioContext)window.webkitAudioContext=ObservedAudio;
  },{legacyAudio,age});
  // A new document runs instrumentation even after the output capability probe.
  await page.goto(`/?picture-audio-qa=${age}#rhythm`);
  await expect(page.locator('.adventure-listen')).toBeVisible();
  expect(await page.evaluate(()=>window.__pictureAudio.length),'opening picture practice never starts audio').toBe(0);
  const sequence=await page.locator('.adventure-beat-token').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label').split(': ')[1].toLowerCase()));
  if(await page.locator('.adventure-ready').count())await page.locator('.adventure-ready').tap();
  const swapped=sequence.map(value=>value==='clap'?'tap':value==='tap'?'clap':value);
  if(age===8||age===10)await expect(page.locator('.adventure-objective')).toContainText('reverse');
  return age===8?[...sequence].reverse():age===9?swapped:age===10?[...swapped].reverse():sequence;
}
const progress=page=>page.evaluate(()=>localStorage.getItem('doodle-fun:v2:adventures-progress-v1'));
const heard=page=>expect.poll(()=>page.evaluate(()=>window.__pictureAudio.at(-1)?.peak||0)).toBeGreaterThan(.005);
async function silencePrevious(page) {
  await page.waitForTimeout(350);
  await page.evaluate(()=>{for(const row of window.__pictureAudio)row.peak=0;});
}

// This explicitly listens to an analyser on the actual output graph. Oscillator
// creation alone would miss the user's quiet/inaudible effects regression.
test('live picture pads produce real clap, tap and stomp audio; rest remains silent',async({page})=>{
  await start(page);
  await expect(page.locator('#coach-sound,#sound-toggle,#settings-sound')).toHaveCount(0);
  for(const kind of ['clap','tap','stomp']) {
    await silencePrevious(page);await page.locator(`[data-beat="${kind}"]`).tap();await heard(page);
  }
  await silencePrevious(page);
  const before=await page.evaluate(()=>window.__pictureAudio.reduce((sum,row)=>sum+row.sources,0));
  await page.locator('[data-beat="rest"]').tap();await page.waitForTimeout(350);
  expect(await page.evaluate(()=>window.__pictureAudio.reduce((sum,row)=>sum+row.sources,0))).toBe(before);
  expect(await page.evaluate(()=>Math.max(0,...window.__pictureAudio.map(row=>row.peak)))).toBe(0);
  expect(await progress(page)).toBeNull();
});

test('live Listen to pattern plays sound without answering or earning visual progress',async({page})=>{
  const sequence=await start(page);await page.locator('.adventure-listen').tap();
  await expect(page.locator('.adventure-listen')).toHaveText('Stop pattern');
  for(const pad of await page.locator('[data-beat]').all())await expect(pad).toBeDisabled();
  await heard(page);
  await expect(page.locator('.adventure-listen')).toHaveText('Listen to pattern',{timeout:sequence.length*600+3000});
  await expect(page.locator('.adventure-beat-token.is-done')).toHaveCount(0);
  expect(await progress(page)).toBeNull();
  for(const value of sequence){await page.locator(`[data-beat="${value}"]`).tap();await page.waitForTimeout(300);}
  await expect(page.locator('.adventure-next')).toHaveClass(/is-ready/);
  expect(JSON.parse(await progress(page)).rhythm).toBe(1);
});

for(const action of ['stop','coach','route','native inactivity'])test(`live pattern cancellation through ${action} cannot play late or award stale progress`,async({page})=>{
  const sequence=await start(page);await page.locator('.adventure-listen').tap();await heard(page);
  const count=await page.evaluate(()=>window.__pictureAudio.length);
  if(action==='stop')await page.locator('.adventure-listen').tap();
  if(action==='coach'){await page.locator('#coach-open').tap();await page.getByRole('button',{name:'Close coach',exact:true}).tap();}
  if(action==='route'){await page.locator('[data-activity-mode="melody-echo"]').tap();await page.locator('[data-activity-mode="rhythm"]').tap();}
  if(action==='native inactivity')await page.evaluate(()=>{if(document.hidden)throw new Error('Test requires visible document');window.dispatchEvent(new Event('doodle-native-inactive'));window.dispatchEvent(new Event('doodle-native-inactive'));});
  await expect(page.locator('.adventure-listen')).toHaveText('Listen to pattern');
  await expect.poll(()=>page.evaluate(()=>window.__pictureAudio.every(row=>row.context.state==='closed'))).toBe(true);
  await page.waitForTimeout(sequence.length*550+300);
  expect(await page.evaluate(()=>window.__pictureAudio.length)).toBe(count);
  await expect(page.locator('.adventure-beat-token.is-done')).toHaveCount(0);expect(await progress(page)).toBeNull();
  await page.locator('[data-beat="clap"]').tap();await heard(page);
  expect(await page.evaluate(()=>window.__pictureAudio.length)).toBe(count+1);
});

test('live picture practice and listening ignore legacy muted low volume without autoplay on mode changes',async({page})=>{
  const sequence=await start(page,{legacyAudio:{enabled:false,volume:.15}});
  await expect(page.locator('.adventure-sound,.adventure-volume,input[type="range"]')).toHaveCount(0);
  await expect(page.locator('.adventure-listen')).toBeEnabled();
  await expect(page.locator('#coach-sound,#sound-toggle,#settings-sound')).toHaveCount(0);
  for(const value of sequence){await page.locator(`[data-beat="${value}"]`).tap();await page.waitForTimeout(300);}
  await heard(page);await expect(page.locator('.adventure-next')).toHaveClass(/is-ready/);
  expect(JSON.parse(await progress(page)).rhythm).toBe(1);
  const count=await page.evaluate(()=>window.__pictureAudio.length);
  await page.locator('[data-activity-mode="melody-echo"]').tap();
  await expect(page.locator('[data-listening-sound],.listening-volume,input[type="range"]')).toHaveCount(0);
  await expect(page.locator('[data-listening-listen]')).toBeEnabled();
  expect(await page.evaluate(()=>window.__pictureAudio.length),'mode changes never autoplay').toBe(count);
  await page.locator('[data-listening-listen]').tap();await heard(page);
  await page.locator('[data-activity-mode="rhythm"]').tap();
  await expect(page.locator('.adventure-listen')).toBeEnabled();
  await expect.poll(()=>page.evaluate(()=>window.__pictureAudio.every(row=>row.context.state==='closed'))).toBe(true);
  expect(await page.evaluate(()=>window.__pictureAudio.length),'returning to picture practice never autoplays').toBe(count+1);
  expect(await page.evaluate(()=>window.__legacyAudioReads),'neither controller reads retired mute/volume preferences').toBe(0);
  expect(await page.evaluate(()=>localStorage.getItem('doodle-fun:v2:listening-audio-v1'))).toBe(JSON.stringify({enabled:false,volume:.15}));
});

for(const [name,legacyAudio] of [['muted',{enabled:false,volume:.15}],['low-volume',{enabled:true,volume:.001}]])test(`legacy ${name} preferences cannot restore picture controls or autoplay`,async({page})=>{
  await start(page,{legacyAudio});
  await expect(page.locator('.adventure-sound,.adventure-volume,input[type="range"]')).toHaveCount(0);
  await expect(page.locator('.adventure-listen')).toBeEnabled();
  expect(await page.evaluate(()=>window.__pictureAudio.length)).toBe(0);
  expect(await page.evaluate(()=>window.__legacyAudioReads)).toBe(0);
  await page.locator('[data-activity-mode="melody-echo"]').tap();
  await expect(page.locator('[data-listening-sound],.listening-volume,input[type="range"]')).toHaveCount(0);
  await expect(page.locator('[data-listening-listen]')).toBeEnabled();
  expect(await page.evaluate(()=>window.__pictureAudio.length)).toBe(0);
  expect(await page.evaluate(()=>window.__legacyAudioReads)).toBe(0);
});
