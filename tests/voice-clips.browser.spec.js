import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {voiceTranscripts} from '../scripts/voice-transcripts.mjs';

const manifest=JSON.parse(await readFile(new URL('../assets/voice/manifest.json',import.meta.url),'utf8'));
const expected=voiceTranscripts().map(transcript=>{
  const clip=manifest.clips.find(clip=>clip.id===transcript.id&&clip.text===transcript.text);
  if(!clip)throw new Error(`Missing current coaching recording: ${transcript.id}`);
  return {id:clip.id,text:clip.text,duration:clip.duration,bytes:clip.bytes};
});

test('every current coaching AAC clip decodes offline to finite nonzero bounded PCM',async({page,context},info)=>{
  test.setTimeout(90000);
  await page.goto('/');await context.setOffline(true);
  const result=await page.evaluate(async expected=>{
    const clips=globalThis.__DOODLE_VOICE_CLIPS__||{},Audio=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
    const context=new Audio(1,1,24000),results=[];
    for(const entry of expected){
      const url=clips[entry.text];
      if(typeof url!=='string'||!url.startsWith('data:audio/mp4;base64,')){results.push({id:entry.id,error:'Missing embedded AAC'});continue;}
      try{
        const bytes=Uint8Array.from(atob(url.split(',')[1]),character=>character.charCodeAt(0));
        const payloadBytes=bytes.length; // Chromium transfers/detaches the input during decode.
        const buffer=await context.decodeAudioData(bytes.buffer);let peak=0,sum=0,finite=true,count=0;
        for(let channel=0;channel<buffer.numberOfChannels;channel++)for(const sample of buffer.getChannelData(channel)){
          finite=finite&&Number.isFinite(sample);peak=Math.max(peak,Math.abs(sample));sum+=sample*sample;count++;
        }
        results.push({id:entry.id,bytes:payloadBytes,duration:buffer.duration,channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate,finite,peak,rms:Math.sqrt(sum/count)});
      }catch(error){results.push({id:entry.id,error:String(error)});}
    }
    return {runtime:document.querySelector('meta[name="doodle-build"]')?.content,embeddedCount:Object.keys(clips).length,results};
  },expected);
  await info.attach('all-bundled-aac-decode.json',{body:JSON.stringify(result,null,2),contentType:'application/json'});
  expect(result.embeddedCount).toBe(expected.length);expect(result.results).toHaveLength(expected.length);
  for(const [index,row] of result.results.entries()){
    expect(row.error,`${row.id}: decode`).toBeUndefined();expect(row.finite,`${row.id}: finite PCM`).toBe(true);
    expect(row.bytes,`${row.id}: embedded payload`).toBe(expected[index].bytes);
    expect(row.channels).toBe(1);expect(row.sampleRate).toBe(24000);
    expect(Math.abs(row.duration-expected[index].duration),`${row.id}: complete duration`).toBeLessThan(.15);
    expect(row.peak,`${row.id}: peak`).toBeGreaterThan(.05);expect(row.peak,`${row.id}: digital headroom`).toBeLessThanOrEqual(1);
    expect(row.rms,`${row.id}: nonzero speech`).toBeGreaterThan(.005);
  }
});
