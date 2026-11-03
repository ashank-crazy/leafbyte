"""Add warm, scene-synchronized neural narration to the existing LeafByte walkthrough."""
from pathlib import Path
import asyncio,hashlib,json,shutil,subprocess,time
import edge_tts

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'artifacts/narration'
WORK.mkdir(exist_ok=True)
CONFIG=json.loads((ROOT/'artifacts/demo-narration.json').read_text())
CHAPTERS=json.loads((ROOT/'artifacts/demo-chapters.json').read_text())
if len(CONFIG['chapters']) != len(CHAPTERS):
    raise ValueError('Narration and visual chapters must match.')

def run(command):
    return subprocess.run(command,check=True,capture_output=True,text=True)

def duration(file):
    return float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(file)]).stdout)

def stamp(seconds,separator='.'):
    return f'{int(seconds//3600):02d}:{int(seconds//60)%60:02d}:{seconds%60:06.3f}'.replace('.',separator)

timeline=[];cursor=0;wav_files=[];vtt=['WEBVTT',''];srt=[]
for index,(chapter,text) in enumerate(zip(CHAPTERS,CONFIG['chapters'])):
    seconds=chapter['durationSeconds']
    key=hashlib.sha256(f"{CONFIG['provider']}:{CONFIG['voice']}:{CONFIG['rate']}:{text}".encode()).hexdigest()[:12]
    raw=WORK/f'{index:02d}-{key}.mp3'
    if not raw.exists() or raw.stat().st_size <= 1000:
        for attempt in range(3):
            try:
                asyncio.run(edge_tts.Communicate(text, CONFIG['voice'], rate=CONFIG['rate'], receive_timeout=20).save(str(raw)))
                if duration(raw) <= 0:raise ValueError('The speech service returned no audio.')
                break
            except Exception:
                raw.unlink(missing_ok=True)
                if attempt == 2:raise
                print(f'Retrying chapter {index+1} after a temporary speech-service error.',flush=True)
                time.sleep(2*(attempt+1))
    spoken=duration(raw)
    if spoken > seconds-0.30:
        raise ValueError(f'Chapter {index+1} needs shorter narration: {spoken:.2f}s in a {seconds}s scene.')
    segment=WORK/f'{index:02d}.wav'
    filters=f'adelay=180,apad,atrim=duration={seconds},afade=t=in:st=0:d=0.025,afade=t=out:st={seconds-0.05}:d=0.04'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(raw),'-af',filters,'-ar','48000','-ac','1','-c:a','pcm_s16le',str(segment)])
    wav_files.append(segment)
    start=cursor+0.18;end=cursor+0.18+spoken
    vtt += [f'{stamp(start)} --> {stamp(end)}',text,'']
    srt += [str(index+1),f'{stamp(start,",")} --> {stamp(end,",")}',text,'']
    timeline.append({'chapter':index+1,'sceneStartSeconds':cursor,'sceneDurationSeconds':seconds,'speechStartSeconds':start,'speechEndSeconds':end,'text':text})
    cursor+=seconds
    print(f'Chapter {index+1}: {spoken:.2f}s spoken / {seconds}s scene',flush=True)

concat=WORK/'concat.txt'
concat.write_text('\n'.join(f"file '{file.as_posix()}'" for file in wav_files)+'\n')
narration=WORK/'narration.wav'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-af','highpass=f=65,lowpass=f=10500,loudnorm=I=-18:TP=-2:LRA=6','-ar','48000','-ac','1','-t',str(cursor),str(narration)])
(ROOT/'dist/evidence/demo.vtt').write_text('\n'.join(vtt))
subtitles=WORK/'narration.srt';subtitles.write_text('\n'.join(srt))
video=ROOT/'dist/evidence/demo.mp4'
backup=WORK/'silent-demo.mp4'
if not backup.exists():shutil.copyfile(video,backup)
output=WORK/'demo-with-narration.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(backup),'-i',str(narration),'-i',str(subtitles),'-map','0:v:0','-map','1:a:0','-map','2:s:0','-c:v','copy','-c:a','aac','-b:a','128k','-c:s','mov_text','-metadata:s:a:0','language=eng','-metadata:s:a:0','title=Calm English narration','-metadata:s:s:0','language=eng','-metadata:s:s:0','title=English narration captions','-disposition:s:0','0','-t',str(cursor),'-movflags','+faststart',str(output)])
if abs(duration(output)-cursor) >0.05:raise ValueError('Narrated video duration changed unexpectedly.')
shutil.copyfile(output,video)
(ROOT/'artifacts/demo-narration-timing.json').write_text(json.dumps({'voice':CONFIG['voice'],'provider':CONFIG['provider'],'rate':CONFIG['rate'],'durationSeconds':cursor,'chapters':timeline},indent=2)+'\n')
print(f'Added {cursor}-second narration, preserving the original video stream.',flush=True)
