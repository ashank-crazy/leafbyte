"""Create a captioned walkthrough from actual, verified browser captures."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,subprocess,textwrap

ROOT=Path(__file__).resolve().parents[1]
frames=ROOT/'artifacts/demo-frames'
rendered=frames/'rendered';rendered.mkdir(exist_ok=True)
font_path='/System/Library/Fonts/Helvetica.ttc'
font=ImageFont.truetype(font_path,26)
small=ImageFont.truetype(font_path,16)
chapters=[
 ('objects-before.jpg',7,'This controlled page loads7.09 MB of original image data.'),
 ('objects-after.jpg',7,'Same content and layout. LeafByte outputs reduce image data to204 KB:97.1% less.'),
 ('field-after.jpg',8,'A second controlled page drops from5.83 MB to483 KB:91.7% less image data.'),
 ('workspace.jpg',10,'Choose a whole folder. This real batch contains26 licensed photographs.'),
 ('compare.jpg',10,'Inspect actual output pixels. This laptop image goes from1.99 MB to20 KB at800 px.'),
 ('corpus.jpg',10,'Across26 photos, the median file-size reduction is92.4%, with resizing for web display.'),
 ('carbon.jpg',12,'CO2.js / SWD v4 models the benefit under editable traffic, cache and hosting scenarios.'),
 ('evidence-cases.jpg',10,'For the first page,10,000 hypothetical views imply a modelled7.70–10.20 kg CO2e difference.'),
 ('compare.jpg',8,'Export usable images, responsive srcset, exact byte counts and SHA-256 hashes.'),
 ('evidence-top.jpg',8,'Measured bytes. Explicit model assumptions. Reproducible evidence in the repository.'),
]
for i,(name,duration,caption) in enumerate(chapters):
 for a,b in [('loads7','loads 7'),('to204','to 204'),(':97',': 97'),('from5','from 5'),('to483','to 483'),(':91',': 91'),('contains26','contains 26'),('from1','from 1'),('to20','to 20'),('at800','at 800'),('Across26','Across 26'),('is92','is 92'),('page,10','page, 10'),('modelled7','modelled 7')]:caption=caption.replace(a,b)
 chapters[i]=(name,duration,caption)
 image=Image.open(frames/name).convert('RGB');image.thumbnail((1280,650))
 canvas=Image.new('RGB',(1280,800),'#f7f7ef');canvas.paste(image,((1280-image.width)//2,0))
 draw=ImageDraw.Draw(canvas);draw.rectangle((0,650,1280,800),fill='#244c36')
 draw.text((28,663),f'LEAFBYTE · {i+1:02d} / {len(chapters):02d}',fill='#bed59d',font=small)
 lines=textwrap.wrap(caption,width=88)
 for line_index,line in enumerate(lines):draw.text((28,696+line_index*33),line,fill='#fffef5',font=font)
 canvas.save(rendered/f'{i:02d}.png')
concat=[]
for i,(_,duration,_) in enumerate(chapters):concat+=[f"file '{(rendered/f'{i:02d}.png').as_posix()}'",f'duration {duration}']
concat.append(f"file '{(rendered/f'{len(chapters)-1:02d}.png').as_posix()}'")
(frames/'concat.txt').write_text('\n'.join(concat)+'\n')
def stamp(seconds,separator='.'):
 return f'{int(seconds//3600):02d}:{int(seconds//60)%60:02d}:{seconds%60:06.3f}'.replace('.',separator)
vtt=['WEBVTT',''];srt=[];cursor=0
for i,(_,duration,caption) in enumerate(chapters):
 vtt += [f'{stamp(cursor)} --> {stamp(cursor+duration)}',caption,'']
 srt += [str(i+1),f'{stamp(cursor,",")} --> {stamp(cursor+duration,",")}',caption,''];cursor+=duration
(ROOT/'dist/evidence/demo.vtt').write_text('\n'.join(vtt));(ROOT/'artifacts/demo.srt').write_text('\n'.join(srt))
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(frames/'concat.txt'),'-vf','fps=12','-t',str(cursor),'-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'dist/evidence/demo.mp4')],check=True)
(ROOT/'artifacts/demo-chapters.json').write_text(json.dumps([{'frame':name,'durationSeconds':duration,'caption':caption} for name,duration,caption in chapters],indent=2)+'\n')
print(f'Created {cursor}-second captioned walkthrough.')
