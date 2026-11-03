# Matched browser page measurements

Measured on 3 November 2026 using the browser Resource Timing API. The local preview sends `Cache-Control: no-store`; every recorded image had positive transfer bytes and had completed. Both versions share layout, content, CSS and measurement script.

| Page | Original image bytes | Output image bytes | Reduction | Full page transfer before → after |
| --- | ---: | ---: | ---: | ---: |
| Everyday objects | 7,086,897 | 204,236 | 97.1% | 7,095,054 → 213,542 |
| Field notes | 5,826,088 | 483,238 | 91.7% | 5,834,171 → 492,443 |

Viewport: 1280×720 CSS pixels, device pixel ratio 2, matched between versions. Images load eagerly to make a full-page image comparison. Transfer sizes include the browser-reported request overhead; encoded image-body bytes are reported separately.

## Reproduce

Start `python3 scripts/preview.py --port 4328`. Open each `/dist/evidence/<objects|field-notes>/<before|after>/` page in the same browser viewport. Wait for image completion, then click **Read browser measurements**. Copy the visible JSON. Compare `imageEncodedBodyBytes`, `imageTransferBytes` and `pageTransferBytes`, and confirm `allImagesComplete` is true.

Raw records are in `artifacts/*-desktop.json` and the paired results/model traces are in `artifacts/page-results.json`. Published copies accompany the evidence page in `dist/evidence/records/`.

These are controlled software deployment examples built by this project, rather than independent customer sites. Measurements were collected on the no-store local preview; public-host compression/cache behavior can differ. `srcset` lets the browser choose a candidate according to layout and pixel density. The two page measurements selected the 800 px outputs; smaller variants remain available for smaller display requirements.
