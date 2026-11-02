# LeafByte

**Smaller images. The quality you choose. Evidence you can inspect.**

LeafByte is a working browser-based image optimizer built for Green Shift Hacks 2026. It encodes real image files locally, compares candidate outputs, helps select a bundle under a size budget, and exports usable replacements with a measurement manifest.

The environmental goal is to reduce unnecessary image storage and transfer. The prototype measures exact file-size changes. It does not measure electricity, water consumption, greenhouse-gas emissions, deployment or adoption.

## Measured results

A browser run on the four credited sample images reduced **3,633,061 input bytes to 1,906,332 output bytes: 47.53% smaller**, using WebP, a 1920 px maximum width and a 0.970 sampled similarity floor. This includes resizing the 2286 px-wide glacier image to 1920 px; the other three retain their source dimensions. A separate **480 px thumbnail** run produced 170,226 bytes, a **95.31% reduction with deliberate downscaling**. Neither number is a lossless or web-wide savings claim.

LeafByte also uses its own output: its hero image now references an **83,618-byte, 480 × 617 WebP** generated from the 1,921,833-byte Amazon sample, a **95.65% smaller image payload** for that reference. The original remains available for the opt-in demonstration; total repository storage is not reduced by keeping both files. Actual visitor traffic, energy and emissions have not been measured.

See [the reproducible benchmark](docs/BENCHMARK.md) for exact per-image values, settings, browser identification, hashes and the measurement boundary. The downloaded ZIPs were independently checked for CRC integrity and output-file SHA-256 matches.

## Run locally

No dependencies, API key, account or build step are needed. From this directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173 in a modern browser. HTTPS or localhost is required for SHA-256 evidence export. Do not open `index.html` directly as a file: browser module and cryptography restrictions can prevent features from working.

## Try the complete flow

1. Load the included demonstration images or add your own supported images.
2. Set the output dimensions, quality preference and bundle budget.
3. Run optimization. Candidates are actual encoded files, not estimated file sizes.
4. Compare the selected image with its original. Inspect fine detail, text and transparency at the size where the image will be used.
5. Adjust the selection or budget and export the bundle.
6. Extract the ZIP. Use the images and the HTML snippets in a website after reviewing them. Downloading the ZIP alone does not update any website.

The demonstration uses sample source files and actual browser encodes. Its byte reduction is a file transformation result, not a field study or measured environmental savings.

## Export contents

| File | Purpose |
| --- | --- |
| `images/` | The selected output files, including unchanged originals where selected. |
| `manifest.json` | Original/output byte counts, SHA-256 hashes, image dimensions, candidate details, settings and limitations. |
| `index-snippets.html` | Starter image references with encoded dimensions. Add meaningful alternative text and page-specific responsive styles. |
| `README.txt` | Instructions for using and checking the replacements. |

Saved bytes compare source images with selected output images. They exclude ZIP headers, the manifest and documentation. ZIP packaging uses the store method because the selected images are already compressed.

## How it works

The app uses browser image decoding and encoding, evaluates candidates at a common comparison resolution, and chooses among available candidates for the requested budget. The original remains an available fallback. No remote AI service is used to analyze personal images.

The similarity score is mean local luminance SSIM in non-overlapping 8 × 8 blocks across nine native-resolution patches, each up to 128 × 128 pixels, positioned on a 3 × 3 grid. The patches are not downsampled. The original is first resized to the output dimensions; the score therefore does not measure resolution loss against the full original. Transparency is composited on white for comparison, and small-image patches can overlap. The score can miss color shifts or artifacts outside the patches and cannot establish that text remains readable or that an output is appropriate for a particular audience. Encoding quality settings are codec controls, not percentages of retained visual quality. See [the methodology](docs/METHODOLOGY.md) for the measurement boundary and limitations.

The application processes selected files in the browser. Loading the app and its included samples still requires normal requests to the hosting server. A reduced image must replace an original in actual use to reduce that deployment's image payload. The prototype does not calculate net environmental impact, including the resources consumed by encoding and serving the tool itself.

## Verification

```sh
node --test tests/*.test.js
```

The export tests verify standard CRC32, ZIP local headers and central-directory offsets, UTF-8 filenames, path traversal rejection, filename deduplication, SHA-256 values and exact file lengths. Test outcomes and any browser verification should be reported from the current checked-out version.

## Project files

- `dist/`: the complete buildless web app.
- `tests/`: automated correctness checks.
- [Devpost story](docs/DEVPOST.md): a submission narrative with explicit impact limits.
- [Demo script](docs/DEMO.md): a short walkthrough with no physical measurement or special hardware.
- [Methodology](docs/METHODOLOGY.md): data, formulas and limitations.
- [Benchmark](docs/BENCHMARK.md): measured browser encodes and reproduction steps.

## Sources and credits

- [W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/): media optimization, compression, efficient storage and transfer. This is guidance, not certification of LeafByte.
- [web.dev: Image performance](https://web.dev/learn/performance/image-performance): image formats and performance tradeoffs.
- [web.dev: Choose the right image format](https://web.dev/articles/choose-the-right-image-format): lossy encoding and format selection.

The included demonstration corpus contains four NASA satellite-observation images totaling **3,633,061 input bytes**. Blue Marble is an explicitly identified composite; the Amazon image was proportionally resized before inclusion; the other three bundled JPEGs are unchanged downloads. See [the asset credits and preparation](docs/ASSETS.md) and [the machine-readable source manifest](dist/assets/samples.json) for creator credits, source URLs, dimensions, hashes and NASA usage guidelines. NASA does not endorse LeafByte. This small corpus is not a representative web-wide benchmark.

OpenAI Codex assisted with concept development, original implementation, documentation and verification under the participant's instructions. Browser-native image codecs implement the underlying encoders. The project does not claim to invent those codecs or to have organizer approval of AI assistance.

The original application code is available under the [MIT license](LICENSE). Third-party sample assets retain their respective terms.
