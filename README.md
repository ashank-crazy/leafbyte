**Live demo:** [https://leafbyte-green-shift.codexcirclejerk.chatgpt.site](https://leafbyte-green-shift.codexcirclejerk.chatgpt.site) · [Evidence](https://leafbyte-green-shift.codexcirclejerk.chatgpt.site/evidence/) · [Narrated walkthrough](https://leafbyte-green-shift.codexcirclejerk.chatgpt.site/evidence/demo.mp4?v=andrew)

# LeafByte

**A lighter website, with the reduction you can inspect.**

LeafByte optimizes image bundles locally, exports responsive files and records exact byte savings alongside explicitly modelled carbon scenarios.

| Evidence | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Controlled product-layout page: image body bytes | 7.09 MB | 204 KB | **97.1%** |
| Controlled editorial page: image body bytes | 5.83 MB | 483 KB | **91.7%** |
| 26-photo corpus, primary files at max800 px | 21.92 MB | 1.46 MB | **93.3% aggregate; 92.4% median** |

These page results are matched cold-load measurements on pages controlled by this project. See [page measurements](docs/PAGE-MEASUREMENTS.md), [corpus sources](docs/CORPUS.md), [raw benchmark](artifacts/corpus-benchmark.json) and [the model](docs/CO2-MODEL.md). The original four-image NASA regression benchmark remains in [BENCHMARK.md](docs/BENCHMARK.md).

## Use it

1. Add images or choose a whole folder, up to 200 files / 200 MiB.
2. Choose intended dimensions and a similarity floor. Optionally enable responsive variants and set a primary-file byte budget.
3. Run optimization and visually compare the actual files.
4. Export the ZIP. It includes images, `srcset`/`<picture>` snippets, a manifest, hashes, source credits and model assumptions.
5. Replace the website's image references with the output and check the published result.

Selected images stay on the device. The browser uses native codecs; normal page and demo-asset requests still go to hosting. Responsive variants are additional stored files and their byte cost is reported separately.

## Run and reproduce locally

No installation, account or API key is required for the app:

```sh
python3 scripts/preview.py --port 4328
```

Open `http://127.0.0.1:4328/dist/`. This preview sends `Cache-Control: no-store` for repeatable cold-load comparisons. The corpus benchmark is at `/dist/lab/benchmark.html`. Run it at 800 px, WebP, similarity floor 0.970, with responsive variants enabled. Source photos are included in `benchmark-assets/` with a license and provenance manifest.

```sh
npm test
npm run check
```

## Carbon estimate

The app uses pinned **CO2.js 0.19.0**, explicitly selecting **SWD v4**. The model applies measured byte reductions to an editable number of hypothetical page views, showing configured cache/hosting assumptions alongside an uncached reference. The controlled product-layout example gives **7.70–10.20 kg CO₂e at 10,000 hypothetical views**. This is a modelled attributional difference, rather than measured avoided emissions; details and source constants are in [CO2-MODEL.md](docs/CO2-MODEL.md).

## Project and submission

- [Impact-first Devpost story](docs/DEVPOST.md)
- [Narrated walkthrough and reproduction notes](docs/DEMO.md)
- [Browser page measurements](docs/PAGE-MEASUREMENTS.md)
- [Measurement and quality method](docs/METHODOLOGY.md)
- [Verification record](docs/VALIDATION.md)

## Limitations and credits

The deployment experiments use pages we built; no external customer adoption is claimed. Resizing contributes to file reduction. Sampled luminance SSIM can miss color changes or artifacts outside its patches, and the photo corpus is not a statistical sample of all websites. The model excludes actual traffic measurement, marginal electricity changes and encoding overhead.

OpenAI Codex assisted with concept, implementation, documentation and verification. Original application code is MIT licensed. The pinned CO2.js component retains its Apache 2.0 license and notice. Unsplash photographs and NASA images retain their respective terms and linked credits: [corpus](docs/CORPUS.md), [NASA assets](docs/ASSETS.md). No people or organizations were contacted for this project.
