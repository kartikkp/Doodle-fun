import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';

const {outputFiles}=await build({entryPoints:[fileURLToPath(new URL('../audio.js',import.meta.url))],bundle:true,format:'esm',write:false});
const source=outputFiles[0].text;
const moduleURL=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

// This is actual browser DSP, independent of host speaker availability. The
// 350–5000 Hz measurement is a repeatable small-speaker stress test, not a
// measured iPhone response or proof of a particular physical listening level.
async function render(page,cases) {
  return page.evaluate(async({moduleURL,cases})=>{
    const {scheduleSound,createSoundOutput,OUTPUT_CEILING}=await import(moduleURL);
    const Audio=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    const results=[];
    for(const entry of cases) {
      const {kind,duration=.3,sampleRate=48000,frequency=392,overlap=1,spacing=0}=entry;
      const lastStart=.02+(overlap-1)*spacing;
      const context=new Audio(2,Math.ceil((duration+lastStart+.15)*sampleRate),sampleRate);
      const master=context.createGain(),output=createSoundOutput(context,master);
      const merger=context.createChannelMerger(2),high=context.createBiquadFilter(),low=context.createBiquadFilter();
      high.type='highpass';high.frequency.value=350;high.Q.value=.707;
      low.type='lowpass';low.frequency.value=5000;low.Q.value=.707;
      master.connect(merger,0,0);master.connect(high);high.connect(low);low.connect(merger,0,1);merger.connect(context.destination);
      const scheduled=Array.from({length:overlap},(_,i)=>scheduleSound(context,output.input,{kind:kind==='mixed'?['drum','bell','wood','shaker','tone','clap'][i%6]:kind,duration,frequency},.02+i*spacing));
      const buffer=await context.startRendering(),data=buffer.getChannelData(0),band=buffer.getChannelData(1);
      const start=Math.floor(.02*sampleRate),end=Math.floor((duration+lastStart+.02)*sampleRate);
      let energy=0,bandEnergy=0,onsetEnergy=0,onsetBandEnergy=0,peak=0,tail=0,finite=true,hash=0;
      let fundamentalReal=0,fundamentalImaginary=0,octaveReal=0,octaveImaginary=0;
      for(let i=0;i<data.length;i++) {
        finite&&=Number.isFinite(data[i]);peak=Math.max(peak,Math.abs(data[i]));
        if(i>=start&&i<end) {
          energy+=data[i]**2;bandEnergy+=band[i]**2;
          const phase=2*Math.PI*frequency*i/sampleRate;
          fundamentalReal+=data[i]*Math.cos(phase);fundamentalImaginary+=data[i]*Math.sin(phase);
          octaveReal+=data[i]*Math.cos(phase*2);octaveImaginary+=data[i]*Math.sin(phase*2);
        }
        if(i>=start&&i<start+.06*sampleRate){onsetEnergy+=data[i]**2;onsetBandEnergy+=band[i]**2;}
        if(i>(duration+lastStart+.08)*sampleRate)tail=Math.max(tail,Math.abs(data[i]));
        if(i%37===0)hash=(hash+Math.round(data[i]*100000)*(i+1))|0;
      }
      results.push({...entry,rms:Math.sqrt(energy/(end-start)),bandRms:Math.sqrt(bandEnergy/(end-start)),peak,tail,finite,hash,ceiling:OUTPUT_CEILING,onsetRms:Math.sqrt(onsetEnergy/(.06*sampleRate)),onsetBandRms:Math.sqrt(onsetBandEnergy/(.06*sampleRate)),
        fundamental:Math.hypot(fundamentalReal,fundamentalImaginary),octave:Math.hypot(octaveReal,octaveImaginary),
        sourceCount:scheduled.reduce((sum,voice)=>sum+voice.sources.length,0),nodeCount:scheduled.reduce((sum,voice)=>sum+voice.nodes.length,0),end:Math.max(...scheduled.map(voice=>voice.end))});
    }
    return results;
  },{moduleURL,cases});
}

test('fixed-output effects retain a substantial audible-band body and distinct timbres',async({page},info)=>{
  const kinds=['drum','bell','shaker','wood','clap'];
  const cases=[44100,48000].flatMap(sampleRate=>kinds.flatMap(kind=>[.08,.13,.16,.3,.65].map(duration=>({kind,duration,sampleRate}))));
  const results=await render(page,cases);
  await info.attach('effects-signal.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  for(const result of results) {
    const name=`${result.kind}, ${result.duration}s, ${result.sampleRate}Hz`;
    expect(result.finite,name).toBe(true);
    // Build 2 still had .5 × .55 default attenuation. These floors reject that
    // regression while allowing naturally shorter clap/wood releases.
    expect(result.rms,`${name}: useful body`).toBeGreaterThan(.08);
    expect(result.bandRms,`${name}: midrange presence`).toBeGreaterThan(.08);
    expect(result.peak,`${name}: output headroom`).toBeLessThan(.9);
    expect(result.tail,`${name}: no sound after the release`).toBe(0);
  }
  const sameLength=results.filter(row=>row.sampleRate===48000&&row.duration===.3);
  expect(new Set(sameLength.map(row=>row.hash)).size,'five distinct rendered effects').toBe(kinds.length);
  const levels=sameLength.map(row=>row.bandRms);
  expect(Math.max(...levels)/Math.min(...levels),'no single effect is left almost silent beside its peers').toBeLessThan(3);
});

test('short Beat Studio feedback has a strong body even in the first 60 milliseconds',async({page},info)=>{
  const results=await render(page,[44100,48000].flatMap(sampleRate=>['drum','wood','tap'].flatMap(kind=>[.08,.13,.16].map(duration=>({kind,duration,sampleRate})))));
  await info.attach('short-tap-signal.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  for(const result of results) {
    const name=`${result.kind} ${result.duration}s at ${result.sampleRate}Hz`;
    // Beat input accepts a new tap at 95ms; with the scheduling lead-in the
    // old note can be replaced after only ~60ms. Its onset must carry sound.
    expect(result.onsetRms,`${name}: initial body`).toBeGreaterThan(.28);
    expect(result.onsetBandRms,`${name}: initial phone-band body`).toBeGreaterThan(.28);
    expect(result.rms,`${name}: complete short note`).toBeGreaterThan(.2);
    expect(result.bandRms,`${name}: complete short note in band`).toBeGreaterThan(.2);
  }
});

test('the fixed output mix retains headroom with normal, rapid and simultaneous notes',async({page},info)=>{
  const cases=[44100,48000].flatMap(sampleRate=>['drum','tone','mixed'].flatMap(kind=>[
    {kind,sampleRate,overlap:8,spacing:.55,duration:.16},
    {kind,sampleRate,overlap:8,spacing:.095,duration:.16},
    {kind,sampleRate,overlap:16,spacing:0,duration:.3},
  ]));
  const results=await render(page,cases);
  await info.attach('mixed-output-signal.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  for(const result of results) {
    expect(result.finite).toBe(true);
    expect(result.peak,`${result.kind}, spacing ${result.spacing}: bounded mixed output`).toBeLessThanOrEqual(result.ceiling+.000001);
    expect(result.rms).toBeGreaterThan(.08);
    expect(result.tail).toBe(0);
  }
});

test('low and high melody notes stay audible and preserve the requested fundamental pitch',async({page},info)=>{
  const results=await render(page,[100,220,392,880,1600].flatMap(frequency=>[.08,.28,.65].map(duration=>({kind:'tone',frequency,duration}))));
  await info.attach('pitch-signal.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  for(const result of results) {
    expect(result.rms,`${result.frequency}Hz body`).toBeGreaterThan(.2);
    expect(result.bandRms,`${result.frequency}Hz small-speaker stress output`).toBeGreaterThan(.03);
    expect(result.fundamental,`${result.frequency}Hz remains the dominant pitch`).toBeGreaterThan(result.octave*3);
    expect(result.peak).toBeLessThan(.9);
    expect(result.tail).toBe(0);
  }
});

test('stomp, clap and tap have distinct feedback while a rest is completely silent',async({page})=>{
  const results=await render(page,['stomp','clap','tap','rest'].map(kind=>({kind,duration:.2})));
  expect(new Set(results.slice(0,3).map(row=>row.hash)).size).toBe(3);
  for(const result of results.slice(0,3))expect(result.bandRms,`${result.kind} feedback`).toBeGreaterThan(.08);
  const rest=results.at(-1);
  expect(rest.peak).toBe(0);expect(rest.rms).toBe(0);expect(rest.bandRms).toBe(0);
  expect(rest.sourceCount).toBe(0);expect(rest.nodeCount).toBe(0);expect(rest.end).toBeCloseTo(.22,6);
});
