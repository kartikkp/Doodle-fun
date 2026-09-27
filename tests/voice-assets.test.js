import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {voiceTranscripts} from '../scripts/voice-transcripts.mjs';
import {ACTIVITY_MODES} from '../catalog.js';

const directory=new URL('../assets/voice/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',directory),'utf8'));

test('every current mode and age has the exact coaching recording, with no stale scripts',()=>{
  const expected=voiceTranscripts();
  assert.deepEqual(manifest.clips.map(({id,text,uses})=>({id,text,uses})),expected);
  const uses=manifest.clips.flatMap(clip=>clip.uses.map(({mode,age})=>`${mode}:${age}`));
  assert.equal(new Set(uses).size,ACTIVITY_MODES.length*9);
  assert.equal(uses.length,ACTIVITY_MODES.length*9);
  for(const clip of manifest.clips) {
    assert.ok(clip.text.length>20&&clip.text.length<=240);
    assert.equal(clip.id,createHash('sha256').update(clip.text).digest('hex').slice(0,16));
  }
});

test('bundled AAC files match their manifest and contain finite, non-silent generation evidence',async()=>{
  assert.deepEqual((await readdir(directory)).filter(file=>file.endsWith('.m4a')).sort(),manifest.clips.map(clip=>clip.file).sort());
  let total=0;
  for(const clip of manifest.clips) {
    assert.match(clip.file,/^[a-f0-9]{16}\.m4a$/);
    assert.equal(clip.mime,'audio/mp4');
    const bytes=await readFile(new URL(clip.file,directory));
    assert.equal(bytes.toString('ascii',4,8),'ftyp');
    assert.equal(bytes.length,clip.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
    assert.ok(Number.isFinite(clip.duration)&&clip.duration>1&&clip.duration<35);
    assert.ok(clip.rms>.03&&clip.rms<.3);
    assert.ok(clip.peak>.2&&clip.peak<=.86);
    assert.equal(clip.sampleRate,24000);
    total+=bytes.length;
  }
  assert.ok(total<12*1024*1024,'keep the complete offline coach within its 12 MB asset budget');
});
