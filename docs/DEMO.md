# Captioned walkthrough

The completed **90-second video** is in [`dist/evidence/demo.mp4`](../dist/evidence/demo.mp4), with calm English narration and [WebVTT captions](../dist/evidence/demo.vtt). It is an edited walkthrough assembled from actual browser captures of the working app and controlled page loads. The existing chapter captions are burned into the video, and selectable English captions follow the voiceover.

The first 14 seconds show the real controlled product-layout page before and after: 7.09 MB to 204 KB of image bodies, 97.1% less. The next chapters show the second page, a real 26-image folder batch, an original/output comparison, the broader corpus, the editable CO2.js scenario and the export evidence.

The captures show actual results, not an interface mockup or a customer deployment. All source imagery has linked usage terms. No private files, personal browsing or outreach appears in the video.

## Rebuild

Browser captures are retained locally under `artifacts/demo-frames/` and excluded from Git. `scripts/build-walkthrough.py` adds explanatory captions and creates the MP4, VTT and chapter list. It requires Pillow and ffmpeg. The source captions and durations are in that script; the current generated chapter record is `artifacts/demo-chapters.json`.

The narration uses the Andrew neural voice, with natural pitch, a gentle −8% rate adjustment, short scene pauses and normalized speech volume. Its figures describe measured bytes and separate modelled scenarios. See [page measurements](PAGE-MEASUREMENTS.md), [the model](CO2-MODEL.md) and [corpus sources](CORPUS.md).


## Rebuild the narration

After rebuilding the visual walkthrough, install `scripts/requirements-narration.txt` in a Python environment, then run `python scripts/add-narration.py`. The script uses pinned edge-tts 7.3.1, Microsoft Edge’s online neural speech service and ffmpeg. No API key is required; the public narration text is sent to that speech service. This is an authoring step and does not change the app’s browser-local image processing. `artifacts/demo-narration.json` contains the reusable script, and `artifacts/demo-narration-timing.json` records the actual speech timing against each scene. The original H.264 video stream is copied unchanged while the narration and selectable English captions are added.
