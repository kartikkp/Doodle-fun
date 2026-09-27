import {ACTIVITY_MODES} from '../catalog.js';
import {coachingText} from '../coaching.js';
import {createHash} from 'node:crypto';
export function voiceTranscripts() {
  const unique=new Map();
  for(const {id:mode} of ACTIVITY_MODES)for(let age=2;age<=10;age++) {
    const text=coachingText(mode,age),id=createHash('sha256').update(text).digest('hex').slice(0,16);
    if(!unique.has(id))unique.set(id,{id,text,uses:[]});
    unique.get(id).uses.push({mode,age});
  }
  return [...unique.values()];
}
if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href)console.log(JSON.stringify(voiceTranscripts(),null,2));
