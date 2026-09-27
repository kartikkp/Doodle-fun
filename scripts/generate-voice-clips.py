"""Build-time only. Python 3.12; kokoro-onnx 0.6.1 + soundfile 0.13.1.
Run with --tools pointing to a temporary folder containing kokoro-v1.0.onnx,
voices-v1.0.bin and an isolated Python environment. No model ships in the app.
macOS afconvert needs access to the system AAC codec. See voice provenance.
"""
import argparse, hashlib, json, pathlib, shutil, subprocess, tempfile
import numpy as np
import soundfile as sf
import espeakng_loader
from kokoro_onnx import Kokoro
from kokoro_onnx.config import EspeakConfig

root=pathlib.Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--tools',type=pathlib.Path,required=True)
args=parser.parse_args()
texts=json.loads(subprocess.check_output(['node',str(root/'scripts/voice-transcripts.mjs')]))
output=root/'assets/voice';output.mkdir(parents=True,exist_ok=True)
# espeak's native path buffer cannot accommodate long nested workspace paths.
short=pathlib.Path(tempfile.mkdtemp(prefix='doodle-voice-'))
shutil.copytree(espeakng_loader.get_data_path(),short/'espeak-ng-data')
engine=Kokoro(str(args.tools/'kokoro-v1.0.onnx'),str(args.tools/'voices-v1.0.bin'),espeak_config=EspeakConfig(data_path=str(short/'espeak-ng-data')))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
previous={}
if (output/'manifest.json').exists():previous={c['id']:c for c in json.loads((output/'manifest.json').read_text())['clips']}
clips=[]
try:
    for index,item in enumerate(texts):
        target=output/(item['id']+'.m4a')
        if target.exists() and item['id'] in previous and sha(target)==previous[item['id']]['sha256']:
            clips.append({**previous[item['id']],**item});continue
        samples,rate=engine.create(item['text'],voice='af_heart',speed=.96,lang='en-us')
        samples=np.asarray(samples,dtype=np.float64)
        if not np.isfinite(samples).all() or len(samples)<rate:raise RuntimeError(f'Invalid clip {item["id"]}')
        peak=float(np.abs(samples).max());rms=float(np.sqrt(np.mean(samples*samples)))
        if peak<.01 or rms<.005:raise RuntimeError(f'Silent clip {item["id"]}')
        # Consistent voice level with headroom, without clipping/limiting speech.
        gain=min(.15/rms,.85/peak);samples*=gain
        wav=short/(item['id']+'.wav');sf.write(wav,samples,rate,subtype='PCM_16')
        subprocess.run(['afconvert','-f','m4af','-d','aac','-b','64000',str(wav),str(target)],check=True,capture_output=True)
        clips.append({**item,'file':target.name,'mime':'audio/mp4','duration':round(len(samples)/rate,4),'sampleRate':rate,'rms':round(rms*gain,5),'peak':round(peak*gain,5),'bytes':target.stat().st_size,'sha256':sha(target)})
        wav.unlink()
        print(f'{index+1}/{len(texts)} {item["id"]} {clips[-1]["duration"]}s',flush=True)
        # Resume safely if a lengthy recording run is interrupted.
        (output/'manifest.json').write_text(json.dumps({'generator':'Kokoro-82M v1.0 / kokoro-onnx 0.6.1','voice':'af_heart','speed':.96,'modelSHA256':sha(args.tools/'kokoro-v1.0.onnx'),'voicesSHA256':sha(args.tools/'voices-v1.0.bin'),'clips':clips},indent=2)+'\n')
    manifest={'generator':'Kokoro-82M v1.0 / kokoro-onnx 0.6.1','voice':'af_heart','speed':.96,'modelSHA256':sha(args.tools/'kokoro-v1.0.onnx'),'voicesSHA256':sha(args.tools/'voices-v1.0.bin'),'clips':clips}
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'clips':len(clips),'seconds':round(sum(c['duration'] for c in clips),1),'bytes':sum(c['bytes'] for c in clips)}))
finally:
    shutil.rmtree(short)
