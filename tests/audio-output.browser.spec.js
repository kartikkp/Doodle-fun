import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../audio.js',import.meta.url),'utf8');
const moduleURL=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

// This is actual browser DSP, independent of host speaker availability. The
// 350–5000 Hz measurement is a repeatable small-speaker stress test, not a
// measured iPhone response or proof of a particular physical listening level.
async function render(page,cases) {
  return page.evaluate(async({moduleURL,cases})=>{
    const {scheduleSound,MAX_MASTER_GAIN}=await import(moduleURL);
    const Audio=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    const results=[];
    for(const entry of cases) {
      const {kind,duration=.3,volume=.55,sampleRate=48000,frequency=392}=entry;
      const context=new Audio(2,Math.ceil((duration+.15)*sampleRate),sampleRate);
      const master=context.createGain();master.gain.value=MAX_MASTER_GAIN*volume;
      const merger=context.createChannelMerger(2),high=context.createBiquadFilter(),low=context.createBiquadFilter();
      high.type='highpass';high.frequency.value=350;high.Q.value=.707;
      low.type='lowpass';low.frequency.value=5000;low.Q.value=.707;
      master.connect(merger,0,0);master.connect(high);high.connect(low);low.connect(merger,0,1);merger.connect(context.destination);
      const scheduled=scheduleSound(context,master,{kind,duration,frequency},.02);
      const buffer=await context.startRendering(),data=buffer.getChannelData(0),band=buffer.getChannelData(1);
      const start=Math.floor(.02*sampleRate),end=Math.floor((duration+.04)*sampleRate);
      let energy=0,bandEnergy=0,peak=0,tail=0,finite=true,hash=0;
      let fundamentalReal=0,fundamentalImaginary=0,octaveReal=0,octaveImaginary=0;
      for(let i=0;i<data.length;i++) {
        finite&&=Number.isFinite(data[i]);peak=Math.max(peak,Math.abs(data[i]));
        if(i>=start&&i<end) {
          energy+=data[i]**2;bandEnergy+=band[i]**2;
          const phase=2*Math.PI*frequency*i/sampleRate;
          fundamentalReal+=data[i]*Math.cos(phase);fundamentalImaginary+=data[i]*Math.sin(phase);
          octaveReal+=data[i]*Math.cos(phase*2);octaveImaginary+=data[i]*Math.sin(phase*2);
        }
        if(i>(duration+.08)*sampleRate)tail=Math.max(tail,Math.abs(data[i]));
        if(i%37===0)hash=(hash+Math.round(data[i]*100000)*(i+1))|0;
      }
      results.push({...entry,rms:Math.sqrt(energy/(end-start)),bandRms:Math.sqrt(bandEnergy/(end-start)),peak,tail,finite,hash,
        fundamental:Math.hypot(fundamentalReal,fundamentalImaginary),octave:Math.hypot(octaveReal,octaveImaginary),
        sourceCount:scheduled.sources.length,nodeCount:scheduled.nodes.length,end:scheduled.end});
    }
    return results;
  },{moduleURL,cases});
}

test('effects retain a substantial audible-band body at default volume and distinct timbres',async({page},info)=>{
  const kinds=['drum','bell','shaker','wood','clap'];
  const cases=[44100,48000].flatMap(sampleRate=>kinds.flatMap(kind=>[.13,.3,.65].map(duration=>({kind,duration,sampleRate}))));
  const results=await render(page,cases);
  await info.attach('effects-signal.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  for(const result of results) {
    const name=`${result.kind}, ${result.duration}s, ${result.sampleRate}Hz`;
    expect(result.finite,name).toBe(true);
    // The previous drum/bell/shaker render failed these useful-output floors,
    // even though the former 'nonzero' check (RMS > .00005) passed.
    expect(result.rms,`${name}: useful body`).toBeGreaterThan(.02);
    expect(result.bandRms,`${name}: midrange presence`).toBeGreaterThan(.02);
    expect(result.peak,`${name}: output headroom`).toBeLessThan(.55);
    expect(result.tail,`${name}: no sound after the release`).toBe(0);
  }
  const sameLength=results.filter(row=>row.sampleRate===48000&&row.duration===.3);
  expect(new Set(sameLength.map(row=>row.hash)).size,'five distinct rendered effects').toBe(kinds.length);
  const levels=sameLength.map(row=>row.bandRms);
  expect(Math.max(...levels)/Math.min(...levels),'no single effect is left almost silent beside its peers').toBeLessThan(3);
});

test('minimum, default and maximum game volumes scale real output without clipping',async({page},info)=>{
  const results=await render(page,['drum','bell','shaker','wood','clap','tone'].flatMap(kind=>[.15,.55,.8].map(volume=>({kind,volume,duration:.65}))));
  await info.attach('volume-signal.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  for(const result of results) {
    expect(result.finite).toBe(true);
    expect(result.peak,`${result.kind} at ${result.volume}: retain digital headroom`).toBeLessThan(.65);
    expect(result.rms).toBeGreaterThan(0);
  }
  for(const kind of ['drum','bell','shaker','wood','clap','tone']) {
    const [low,normal,high]=results.filter(row=>row.kind===kind);
    expect(normal.rms/low.rms).toBeCloseTo(.55/.15,3);
    expect(high.rms/normal.rms).toBeCloseTo(.8/.55,3);
  }
});

test('low and high melody notes stay audible and preserve the requested fundamental pitch',async({page},info)=>{
  const results=await render(page,[100,220,392,880,1600].flatMap(frequency=>[.08,.28,.65].map(duration=>({kind:'tone',frequency,duration}))));
  await info.attach('pitch-signal.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  for(const result of results) {
    expect(result.rms,`${result.frequency}Hz body`).toBeGreaterThan(.04);
    expect(result.bandRms,`${result.frequency}Hz small-speaker stress output`).toBeGreaterThan(.008);
    expect(result.fundamental,`${result.frequency}Hz remains the dominant pitch`).toBeGreaterThan(result.octave*3);
    expect(result.peak).toBeLessThan(.55);
    expect(result.tail).toBe(0);
  }
});

test('stomp, clap and tap have distinct feedback while a rest is completely silent',async({page})=>{
  const results=await render(page,['stomp','clap','tap','rest'].map(kind=>({kind,duration:.2})));
  expect(new Set(results.slice(0,3).map(row=>row.hash)).size).toBe(3);
  for(const result of results.slice(0,3))expect(result.bandRms,`${result.kind} feedback`).toBeGreaterThan(.02);
  const rest=results.at(-1);
  expect(rest.peak).toBe(0);expect(rest.rms).toBe(0);expect(rest.bandRms).toBe(0);
  expect(rest.sourceCount).toBe(0);expect(rest.nodeCount).toBe(0);expect(rest.end).toBeCloseTo(.22,6);
});
