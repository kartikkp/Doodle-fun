import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../speech.js',import.meta.url),'utf8');
const moduleURL=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
// A known PCM fixture tests real clip decoding/output, not voice naturalness.
const rate=24000,length=Math.round(rate*.8),wave=Buffer.alloc(44+length*2);
wave.write('RIFF',0);wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(1,22);wave.writeUInt32LE(rate,24);wave.writeUInt32LE(rate*2,28);wave.writeUInt16LE(2,32);wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(length*2,40);
for(let i=0;i<length;i++){const envelope=Math.min(1,i/(rate*.02),(length-i)/(rate*.02));wave.writeInt16LE(Math.round(Math.sin(2*Math.PI*660*i/rate)*.2*envelope*32767),44+i*2);}
const dataURL=`data:audio/wav;base64,${wave.toString('base64')}`;

async function setup(page,data=dataURL) {
  await page.setContent('<button id="hear">Hear this clue</button>');
  await page.evaluate(async({moduleURL,data})=>{
    window.messages=[];window.output=[];window.result=null;
    window.webkit={messageHandlers:{doodleNative:{postMessage:message=>window.messages.push(message)},doodleAudio:{postMessage:message=>{window.messages.push(message);return Promise.resolve({ok:true});}}}};
    window.__DOODLE_VOICE_CLIPS__={'Listen to your clue.':data};
    const Native=window.AudioContext||window.webkitAudioContext;
    function Observed(...args){
      const context=new Native(...args),analyser=context.createAnalyser(),samples=new Float32Array(2048);analyser.fftSize=2048;analyser.connect(context.destination);
      const record={context,peak:0,started:0};window.output.push(record);
      const createGain=context.createGain.bind(context);context.createGain=()=>{const gain=createGain(),connect=gain.connect.bind(gain);gain.connect=(node,...args)=>connect(node===context.destination?analyser:node,...args);return gain;};
      const createSource=context.createBufferSource.bind(context);context.createBufferSource=()=>{const source=createSource(),start=source.start.bind(source);source.start=(...args)=>{record.started++;return start(...args);};return source;};
      const timer=setInterval(()=>{analyser.getFloatTimeDomainData(samples);for(const sample of samples)record.peak=Math.max(record.peak,Math.abs(sample));if(context.state==='closed')clearInterval(timer);},10);
      return context;
    }
    Observed.prototype=Native.prototype;Object.setPrototypeOf(Observed,Native);window.AudioContext=Observed;if(window.webkitAudioContext)window.webkitAudioContext=Observed;
    window.speechPlayer=await import(moduleURL);
    document.querySelector('#hear').addEventListener('click',()=>{window.result=null;window.speechPlayer.requestSpeech('Listen to your clue.').then(result=>{window.result=result;});});
  },{moduleURL,data});
}

test('bundled spoken clip stays silent until Hear, then decodes and renders actual audio',async({page},info)=>{
  await setup(page);await page.waitForTimeout(100);
  expect(await page.evaluate(()=>({contexts:output.length,messages:messages.length}))).toEqual({contexts:0,messages:0});
  await page.locator('#hear').click();await expect.poll(()=>page.evaluate(()=>result),{timeout:5000}).toEqual({status:'played',source:'clip'});
  const evidence=await page.evaluate(()=>output.map(record=>({peak:record.peak,started:record.started,state:record.context.state,clock:record.context.currentTime})));
  expect(evidence).toHaveLength(1);expect(evidence[0].peak).toBeGreaterThan(.05);expect(evidence[0].peak).toBeLessThan(.21);expect(evidence[0].started).toBe(1);expect(evidence[0].state).toBe('closed');
  expect(await page.evaluate(()=>messages.filter(message=>message.type==='speak'))).toEqual([]);
  await info.attach('decoded-clip-output.json',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
});

for(const event of ['hashchange','pagehide','doodle-native-inactive'])test(`${event} cancels a requested clip without late fallback or automatic replay`,async({page})=>{
  await setup(page);await page.locator('#hear').click();await expect.poll(()=>page.evaluate(()=>output[0]?.started)).toBe(1);
  await page.evaluate(event=>dispatchEvent(new Event(event)),event);
  await expect.poll(()=>page.evaluate(()=>result)).toEqual({status:'cancelled'});
  await page.waitForTimeout(1000);
  expect(await page.evaluate(()=>output.every(record=>record.context.state==='closed'))).toBe(true);
  expect(await page.evaluate(()=>messages.filter(message=>message.type==='speak'))).toEqual([]);
  await page.locator('#hear').click();await expect.poll(()=>page.evaluate(()=>result),{timeout:5000}).toEqual({status:'played',source:'clip'});
});

test('an unreadable bundled clip falls back once after Hear without a remote audio request',async({page})=>{
  const network=[];page.on('request',request=>network.push(request.url()));
  await setup(page,'data:audio/wav;base64,AAAA');await page.locator('#hear').click();
  await expect.poll(()=>page.evaluate(()=>result)).toEqual({status:'requested',source:'device'});
  expect(await page.evaluate(()=>messages.filter(message=>message.type==='speak'))).toEqual([{type:'speak',text:'Listen to your clue.'}]);
  expect(await page.evaluate(()=>output.every(record=>record.started===0&&record.context.state==='closed'))).toBe(true);
  expect(network.filter(url=>/^https?:/.test(url))).toEqual([]);
});
