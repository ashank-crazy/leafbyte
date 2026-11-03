"""Build identical before/after page layouts from real LeafByte-exported assets."""
from pathlib import Path
import json, shutil, html

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/evidence'
EXPORT=ROOT/'artifacts/bench-output'
manifest=json.loads((EXPORT/'manifest.json').read_text())
corpus=json.loads((ROOT/'benchmark-assets/manifest.json').read_text())
records={r['input']['name']:r for r in manifest['images']}
sources={Path(r['path']).name:r for r in corpus}
(OUT/'assets').mkdir(parents=True,exist_ok=True)
groups=[('objects','Everyday objects','Good things, considered.', ['01-laptop-desk.jpg','02-creative-workspace.jpg','03-everyday-accessories.jpg','04-printed-mug.jpg','05-camera-components.jpg','15-coffee-red.jpg']),('field-notes','Field notes','A little closer to the outdoors.', ['13-mountain-clouds.jpg','17-foggy-road.jpg','18-lakeside-swing.jpg','20-sea-pier.jpg','21-forest-dusk.jpg','12-ocean-monochrome.jpg'])]
styles='''*{box-sizing:border-box}body{margin:0;font:15px system-ui;background:#f7f5ed;color:#253f30}a{color:inherit}header{padding:20px 5%;border-bottom:1px solid #d8dfcd;display:flex;justify-content:space-between;font-size:13px}.notice{padding:12px 5%;background:#e4edd7;font-size:12px}main{max-width:1200px;margin:auto;padding:50px 5%}h1{font:clamp(40px,5vw,72px)/1.05 Georgia;max-width:700px;margin:15px 0 25px;letter-spacing:-2px}.intro{max-width:650px;line-height:1.8;color:#6b785f}.grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:42px}figure{margin:0}img{width:100%;height:auto;aspect-ratio:1.5;object-fit:cover;display:block;background:#e0e7d4;border-radius:5px}figcaption{font-size:13px;margin:12px 0 25px;color:#607552}figcaption a{font-size:10px}footer{padding:25px 5%;border-top:1px solid #d8dfcd;font-size:11px}#resource-report{white-space:pre-wrap;overflow-wrap:anywhere;background:#e9edde;padding:15px;font-size:11px}button{font:inherit;border:1px solid #b5c5a0;background:#244c36;color:#fff;padding:10px 16px;cursor:pointer}@media(max-width:600px){main{padding-top:35px}.grid{grid-template-columns:1fr;gap:18px}h1{font-size:48px}.notice{font-size:11px}}'''
(OUT/'case.css').write_text(styles)
report=[]
for slug,title,headline,names in groups:
    before=sum(records[n]['input']['bytes'] for n in names)
    after=sum(records[n]['output']['bytes'] for n in names)
    mobile=sum(min([records[n]['output']]+records[n].get('variants',[]),key=lambda r:r['width'])['bytes'] for n in names)
    for mode in ['before','after']:
        folder=OUT/slug/mode; folder.mkdir(parents=True,exist_ok=True)
        cards=[]
        for name in names:
            r=records[name]; src=sources[name]
            original=ROOT/'benchmark-assets'/name
            shutil.copyfile(original,OUT/'assets'/name)
            opts=[r['output']]+r.get('variants',[])
            for image in opts:
                shutil.copyfile(EXPORT/image['path'],OUT/'assets'/Path(image['path']).name)
            selected=r['output']
            if mode=='before':
                img=f'<img src="../../assets/{name}" width="{src["width"]}" height="{src["height"]}" alt="{html.escape(src["name"],quote=True)}">'
            else:
                srcset=', '.join(f'../../assets/{Path(o["path"]).name} {o["width"]}w' for o in sorted(opts,key=lambda r:r['width']))
                img=f'<img src="../../assets/{Path(selected["path"]).name}" srcset="{srcset}" sizes="(max-width:600px) 90vw, (max-width:1200px) 43vw, 500px" width="{selected["width"]}" height="{selected["height"]}" alt="{html.escape(src["name"],quote=True)}">'
            cards.append(f'<figure>{img}<figcaption>{html.escape(src["name"])}<br><a href="{html.escape(src["source"],quote=True)}">{html.escape(src["credit"])}</a></figcaption></figure>')
        other='after' if mode=='before' else 'before'
        document=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} — {mode} LeafByte</title><link rel="stylesheet" href="../../case.css"></head><body><header><a href="../../">LeafByte evidence</a><a href="../{other}/">View {other} →</a></header><div class="notice">Controlled demonstration page · {'Original image files' if mode=='before' else 'Actual LeafByte output with responsive srcset'} · Same layout and content</div><main><p>{title.upper()}</p><h1>{headline}</h1><p class="intro">An editorial collection built to test a practical question: how much image data does this layout need? These are two versions of a page we control, with credited photographs and actual encoded outputs.</p><div class="grid">{''.join(cards)}</div><h2>Inspect this load</h2><p>Measurements below come from this browser's Resource Timing API. All six images load eagerly. Use a fresh URL query or the local no-store server for a cold-load comparison.</p><button id="measure">Read browser measurements</button><pre id="resource-report">Wait for images to load, then inspect.</pre></main><footer>Built and controlled by the LeafByte project. Photos used under the Unsplash License. This is a software deployment experiment.</footer><script src="../../measure.js"></script></body></html>'''
        (folder/'index.html').write_text(document)
    report.append({'slug':slug,'title':title,'images':names,'beforeImageBytes':before,'primaryAfterBytes':after,'smallestVariantBytes':mobile,'primaryReductionPercent':100*(1-after/before)})
(OUT/'case-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
