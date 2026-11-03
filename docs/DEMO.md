# Captioned walkthrough

The completed **90-second video** is in [`dist/evidence/demo.mp4`](../dist/evidence/demo.mp4), with [WebVTT captions](../dist/evidence/demo.vtt). It is an edited walkthrough assembled from actual browser captures of the working app and controlled page loads. Captions are also burned into the video, so it works without audio.

The first 14 seconds show the real controlled product-layout page before and after: 7.09 MB to 204 KB of image bodies, 97.1% less. The next chapters show the second page, a real 26-image folder batch, an original/output comparison, the broader corpus, the editable CO2.js scenario and the export evidence.

The captures show actual results, not an interface mockup or a customer deployment. All source imagery has linked usage terms. No private files, personal browsing or outreach appears in the video.

## Rebuild

Browser captures are retained locally under `artifacts/demo-frames/` and excluded from Git. `scripts/build-walkthrough.py` adds explanatory captions and creates the MP4, VTT and chapter list. It requires Pillow and ffmpeg. The source captions and durations are in that script; the current generated chapter record is `artifacts/demo-chapters.json`.

The video is silent with complete captions. Its figures describe measured bytes and separate modelled scenarios. See [page measurements](PAGE-MEASUREMENTS.md), [the model](CO2-MODEL.md) and [corpus sources](CORPUS.md).
