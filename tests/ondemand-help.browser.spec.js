import {test,expect} from '@playwright/test';
import {buildDiscoveryRound} from '../discovery.js';
import {buildAdventureRound} from '../adventures.js';

async function observe(page,{age=2,legacySound=true}={}) {
  await page.addInitScript(({age,legacySound})=>{
    localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:legacySound}));
    window.__spokenMessages=[];window.__spokenOutput=[];
    window.webkit={messageHandlers:{doodleNative:{postMessage:message=>window.__spokenMessages.push(message)},doodleAudio:{postMessage:()=>Promise.resolve({ok:true})}}};
    const Native=window.AudioContext||window.webkitAudioContext;
    function Observed(...args){
      const context=new Native(...args),analyser=context.createAnalyser(),data=new Float32Array(2048);analyser.fftSize=2048;analyser.connect(context.destination);
      const record={context,peak:0};window.__spokenOutput.push(record);
      const createGain=context.createGain.bind(context);context.createGain=()=>{const gain=createGain(),connect=gain.connect.bind(gain);gain.connect=(node,...args)=>connect(node===context.destination?analyser:node,...args);return gain;};
      const timer=setInterval(()=>{analyser.getFloatTimeDomainData(data);for(const sample of data)record.peak=Math.max(record.peak,Math.abs(sample));if(context.state==='closed')clearInterval(timer);},15);
      return context;
    }
    Observed.prototype=Native.prototype;Object.setPrototypeOf(Observed,Native);window.AudioContext=Observed;if(window.webkitAudioContext)window.webkitAudioContext=Observed;
  },{age,legacySound});
}
async function expectQuiet(page) {
  expect(await page.evaluate(()=>window.__spokenMessages.filter(message=>message.type==='speak'))).toEqual([]);
  expect(await page.evaluate(()=>window.__spokenOutput.length)).toBe(0);
}

test('legacy narration opt-in cannot speak discovery answers or visual hints',async({page})=>{
  await observe(page);await page.goto('/#shape-match');await expectQuiet(page);
  const round=buildDiscoveryRound('shape-match',2,0);
  // Distractors are randomized in the running app. Choose a visible wrong
  // answer, rather than generating a second, unrelated set in the test.
  await page.locator(`[data-choice]:not([data-choice="${round.answer}"])`).first().click();await expectQuiet(page);
  await page.locator('.discover-hint').click();await expectQuiet(page);
  await page.locator(`[data-choice="${round.answer}"]`).click();await expect(page.locator('.discover-status')).toHaveClass(/is-success/);await expectQuiet(page);
  await page.locator('.discover-next').click();await expectQuiet(page);
});

test('legacy narration opt-in cannot speak adventure answers or visual hints',async({page})=>{
  await observe(page);await page.goto('/#size-order');await expectQuiet(page);
  const round=buildAdventureRound('size-order',2,0);
  await page.locator(`[data-piece="${round.solution[1]}"]`).click();await expectQuiet(page);
  await page.locator('.adventure-hint').click();await expectQuiet(page);
  for(const value of round.solution)await page.locator(`[data-piece="${value}"]`).click();
  await expect(page.locator('.adventure-status')).toHaveClass(/is-success/);await expectQuiet(page);
});

for(const [route,selector] of [['shape-match','.discover-hear'],['size-order','.adventure-hear'],['counting','.learn-listen'],['subtraction','[data-challenge-speech]']])test(`${route} Hear remains explicit and available with the retired preference off`,async({page})=>{
  await observe(page,{legacySound:false});await page.goto(`/#${route}`);await expectQuiet(page);
  await expect(page.locator('#sound-toggle,#coach-sound,#settings-sound')).toHaveCount(0);
  const hear=page.locator(selector).first();await expect(hear).toBeVisible();await expect(hear).toBeEnabled();
  // This assertion targets the dynamic text fallback; the recorded path has
  // separate real-DSP coverage below and never falls back to pass that test.
  await page.evaluate(()=>{window.__DOODLE_VOICE_CLIPS__={};});await hear.click();
  await expect.poll(()=>page.evaluate(()=>window.__spokenMessages.filter(message=>message.type==='speak').length)).toBe(1);
  const spoken=await page.evaluate(()=>window.__spokenMessages.find(message=>message.type==='speak').text);
  if(route==='subtraction')expect(spoken).toBe(await page.locator('.challenge-card h2').textContent());
  else expect(spoken.length).toBeGreaterThan(10);
});

test('bundled Coach recording completes offline only after Hear and can be stopped',async({page,context},info)=>{
  await observe(page,{age:6,legacySound:false});await page.goto('/#draw');await page.locator('#coach-open').click();await expectQuiet(page);
  const transcript=await page.evaluate(()=>`${document.querySelector('#coach-start').textContent} ${document.querySelector('#coach-strategy').textContent}`.trim().replace(/\s+/g,' '));
  expect(await page.evaluate(text=>window.__DOODLE_VOICE_CLIPS__?.[text]?.startsWith('data:audio/'),transcript),'the exact current coaching script has a bundled clip').toBe(true);
  await context.setOffline(true);await page.locator('#coach-hear').click();await expect(page.locator('#coach-hear')).toHaveText('Stop spoken help');
  await expect(page.locator('#coach-speech-status')).toHaveText('Spoken help finished.',{timeout:35000});
  const evidence=await page.evaluate(()=>window.__spokenOutput.map(record=>({peak:record.peak,state:record.context.state,clock:record.context.currentTime})));
  expect(evidence).toHaveLength(1);expect(evidence[0].peak).toBeGreaterThan(.005);expect(evidence[0].peak).toBeLessThan(1.01);expect(evidence[0].state).toBe('closed');
  expect(await page.evaluate(()=>window.__spokenMessages.filter(message=>message.type==='speak'))).toEqual([]);
  await info.attach('bundled-coaching-output.json',{body:JSON.stringify({transcript,evidence},null,2),contentType:'application/json'});
  await page.locator('#coach-hear').click();await expect(page.locator('#coach-hear')).toHaveText('Stop spoken help');await page.locator('#coach-hear').click();
  await expect(page.locator('#coach-speech-status')).toHaveText('Spoken help stopped.');await expect(page.locator('#coach-hear')).toHaveText('Hear these tips');
  await expect.poll(()=>page.evaluate(()=>window.__spokenOutput.every(record=>record.context.state==='closed'))).toBe(true);
});
