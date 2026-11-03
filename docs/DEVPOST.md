Live demo: [https://leafbyte-green-shift.codexcirclejerk.chatgpt.site](https://leafbyte-green-shift.codexcirclejerk.chatgpt.site) · [Measured page examples](https://leafbyte-green-shift.codexcirclejerk.chatgpt.site/evidence/) · [Source](https://github.com/ashank-crazy/leafbyte)

# LeafByte

**Turn oversized web images into smaller files visitors can actually use.**

## Environmental impact

LeafByte reduced the image data on our controlled product-layout page from **7.09 MB to 204 KB—97.1% less per cold load**. A second editorial layout went from **5.83 MB to 483 KB—91.7% less**. We used the same images, content, layout, viewport and device pixel ratio; the browser's Resource Timing API recorded each request with caching disabled by the preview server. Both versions and their raw measurements are available in the live evidence page.

This is a direct reduction in **resource use**: smaller image files for storage and transfer. We applied the exported files to working pages, so the browser loads the replacements rather than merely displaying a recommendation.

Using Green Web Foundation **CO2.js 0.19.0 / Sustainable Web Design v4**, the first page's byte difference corresponds to a **modelled 7.70–10.20 kg CO₂e difference at 10,000 hypothetical page views**. The range compares a 25%-returning-visitor cache scenario with fully uncached visits, both on standard hosting. The model, assumptions and traces are documented and exported.

## What it does

Drop images or choose a whole folder. LeafByte generates real encodings locally, checks sampled structural similarity, and selects smaller candidates within a bundle budget. A before/after wipe gives the user a visual check. Originals remain available.

Responsive export creates appropriate **480 / 960 / 1920 px variants** without upscaling and supplies ready-to-use `srcset` and `<picture>` markup. The ZIP includes actual images, exact byte counts, dimensions, SHA-256 hashes, source attribution and a modelled-impact record. The app supports batches up to **200 images / 200 MiB** and needs no account or API key for local processing.

## Evidence beyond one page

The broader benchmark contains **26 licensed photographs** spanning products, food, interiors, animals, textures and landscapes. At an 800 px maximum width and a 0.970 sampled similarity floor:

- **92.4% median file-size reduction**, with a **60.0–99.2%** observed range.
- **21.92 MB → 1.46 MB** of primary images: **93.3% less** in total.
- Responsive variants add **515 KB** of stored files; these are counted separately.

We verified the actual exported ZIP, every output length and every SHA-256 hash. The corpus includes nine unchanged source originals wider than 3000 px; preparation of the other inputs is disclosed before the benchmark. LeafByte also uses its own generated hero thumbnail.

## How it works

Browser-native codecs encode each candidate. Nine native-resolution image patches are compared using local luminance SSIM, then a deterministic budget heuristic chooses among accepted candidates. A dependency-free ZIP writer packages the outputs. The CO₂ model is pinned and bundled locally. Automated tests cover numeric selection, responsive export, hashes, ZIP integrity, animation rejection and model behavior.

## Limitations

The page experiments are controlled examples we built, not external customer adoption. Resizing contributes to savings, and the corpus is varied rather than statistically representative. Sampled similarity can miss artifacts, so users should inspect important details. CO₂ figures are modelled scenarios; actual traffic, marginal energy changes and encoding overhead are outside those estimates. Responsive variants trade extra storage for adaptable transfer sizes.

## Credits and team

Participant/repository owner: [ashank-crazy](https://github.com/ashank-crazy). OpenAI Codex assisted with concept, code, documentation and verification. Photographer credits and license links accompany the corpus; NASA assets retain their separate credits. CO2.js is by Green Web Foundation, under Apache 2.0.

Sources: [W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/), [CO2.js](https://developers.thegreenwebfoundation.org/co2js/overview/), [SWD methodology](https://sustainablewebdesign.org/estimating-digital-emissions/).
