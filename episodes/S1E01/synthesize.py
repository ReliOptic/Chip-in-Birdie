import os
os.environ['OMP_NUM_THREADS']='4'
import pathlib,json,re,numpy as np,soundfile as sf
from kokoro_onnx import Kokoro
import argparse
p=argparse.ArgumentParser();p.add_argument('--models',required=True);p.add_argument('--out',required=True);args=p.parse_args()
r=pathlib.Path(__file__).resolve().parent;out=pathlib.Path(args.out);out.mkdir(parents=True,exist_ok=True)
k=Kokoro(str(pathlib.Path(args.models)/'kokoro.onnx'),str(pathlib.Path(args.models)/'voices.bin'))
text=(r/'script.en.txt').read_text().replace('Hsinchu','Shin choo')
sentences=re.split(r'(?<=[.!?])\s+',text.strip());audio=[];timeline=[];offset=0;sr=24000
for i,s in enumerate(sentences):
 a,sr=k.create(s,voice='bm_george',speed=0.94,lang='en-us');start=offset/sr;audio.append(a);offset+=len(a)
 timeline.append(dict(index=i,text=s,start=start,end=offset/sr,word_timing_status='NOT_ALIGNED'))
 audio.append(np.zeros(int(sr*.25),np.float32));offset+=int(sr*.25)
 if i%10==0: print(i,offset/sr,flush=True)
a=np.concatenate(audio);sf.write(out/'narration.wav',a,sr);import subprocess;subprocess.run(['ffmpeg','-v','error','-y','-i',str(out/'narration.wav'),'-c:a','libvorbis','-q:a','5',str(out/'narration.ogg')],check=True);(r/'vo-sentences.json').write_text(json.dumps(dict(voice='Kokoro bm_george',sample_rate=sr,duration=len(a)/sr,sentences=timeline,word_alignment='Pending actual forced alignment; no estimated word timings presented as observed'),indent=2));print('DONE',len(a)/sr,flush=True)
