# Measured browser benchmark

These results come from actual LeafByte encodes and downloaded ZIPs on **3 November 2026 (IST)**. They describe four credited demonstration images, not representative web-wide performance, a customer study or measured environmental effects.

The exported manifests are the exact record: [full-width-web run](../artifacts/web-benchmark.json) and [thumbnail run](../artifacts/thumbnail-benchmark.json). Both contain source/output SHA-256 hashes, exact bytes, dimensions, selected encoder settings, warnings and source attribution. The ZIPs were independently checked with a separate ZIP reader for CRC integrity and output-file hashes.

## Configuration

| Setting | Full-width-web run | Thumbnail run |
| --- | --- | --- |
| Maximum width | 1920 px | 480 px |
| Output format | WebP | WebP |
| Sampled similarity floor | 0.970 | 0.970 |
| Bundle budget | None: smallest accepted candidates | None: smallest accepted candidates |
| Images | Same four JPEG inputs | Same four JPEG inputs |
| Export timestamp, UTC | 2026-11-02T20:36:13.436Z | 2026-11-02T20:35:45.094Z |
| Export timestamp, IST | 3 November 2026, 2:06:13 a.m. | 3 November 2026, 2:05:45 a.m. |

Recorded browser identification in both manifests:

```text
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36
```

Browser-native encoders are implementation-dependent. The values below are observed results from this environment, not promised outputs in every browser. The user-agent string is a browser identifier and should not be interpreted as an independently verified host operating-system inventory.

## Full-width web: maximum width 1920 px

| Image | Input dimensions | Output dimensions | Input bytes | Output bytes | Saved bytes | Reduction | Encoder setting | Sampled SSIM |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Blue Marble | 1920 × 1200 | 1920 × 1200 | 569,175 | 128,492 | 440,683 | 77.4249% | 0.52 | 0.977233 |
| Amazon Rainforest | 1867 × 2400 | 1867 × 2400 | 1,921,833 | 1,378,470 | 543,363 | 28.2732% | 0.52 | 0.982660 |
| Berg Lake & Steller Glacier | 2286 × 1524 | 1920 × 1280 | 1,072,533 | 348,438 | 724,095 | 67.5126% | 0.84 | 0.977986 |
| Vancouver Island Bloom | 540 × 540 | 540 × 540 | 69,520 | 50,932 | 18,588 | 26.7376% | 0.84 | 0.982942 |
| **Total** | | | **3,633,061** | **1,906,332** | **1,726,729** | **47.5282%** | | |

The glacier image is downscaled; the other three retain source dimensions. The overall result combines encoding and one resolution change. It is not a lossless or all-same-resolution comparison. None of these selected outputs retained an original; unchanged-original fallback remains an available application behavior and is covered separately by tests.

## Thumbnails: maximum width 480 px

| Image | Input dimensions | Output dimensions | Input bytes | Output bytes | Saved bytes | Reduction | Encoder setting | Sampled SSIM |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Blue Marble | 1920 × 1200 | 480 × 300 | 569,175 | 12,146 | 557,029 | 97.8660% | 0.52 | 0.973859 |
| Amazon Rainforest | 1867 × 2400 | 480 × 617 | 1,921,833 | 83,618 | 1,838,215 | 95.6490% | 0.68 | 0.970657 |
| Berg Lake & Steller Glacier | 2286 × 1524 | 480 × 320 | 1,072,533 | 38,602 | 1,033,931 | 96.4009% | 0.84 | 0.977933 |
| Vancouver Island Bloom | 540 × 540 | 480 × 480 | 69,520 | 35,860 | 33,660 | 48.4177% | 0.84 | 0.980882 |
| **Total** | | | **3,633,061** | **170,226** | **3,462,835** | **95.3145%** | | |

All four images are downscaled in this run. **95.31% is a thumbnail-specific payload reduction, not preservation of original-resolution information.** A similarity score above the floor compares encoding against an already-resized reference.

## A replacement used by LeafByte

The application references `assets/hero.webp` for its hero image. This is the actual Amazon output from the thumbnail run, copied unchanged from the export:

| Property | Value |
| --- | --- |
| Previous referenced image | `assets/amazon.jpg` |
| Previous file | 1,921,833 bytes; 1867 × 2400 JPEG |
| Current referenced image | `assets/hero.webp` |
| Current file | 83,618 bytes; 480 × 617 WebP |
| File reduction for that reference | 1,838,215 bytes; 95.64904963126348% |
| Output SHA-256 | `5ebba90891bed13128483b45e03cf84d0790a39f6c5b26884d353982bc5e13ca` |

The source Amazon image remains available for the opt-in sample benchmark. Consequently, total repository storage is not reduced by this replacement. Actual visitor request counts, cache behavior, transferred bytes, electricity and emissions were not measured. The implemented fact is a reference to a smaller image asset; it is not a field-impact study.

## Reproduce

1. Serve `dist/` over localhost or HTTPS. The README includes the local command.
2. Open LeafByte in a modern browser. Select Balanced / 0.970, WebP, maximum width 1920 px and leave the budget blank.
3. Choose **Or run the NASA regression pack**, then wait for actual encoding to complete. Record the current totals; other browsers may differ.
4. Inspect each image at an appropriate size, including details outside the sampled regions.
5. Export the bundle. Extract it with a normal ZIP utility and compare each output file's byte length and SHA-256 with `manifest.json`.
6. Change maximum width to 480 px, run optimization again and export a second bundle. Label this run “thumbnails” and disclose downscaling.
7. Compare input hashes against `dist/assets/nasa-samples.json` to confirm the corpus. The four input files total 3,633,061 bytes.

## Metric and environmental boundaries

The metric is mean local luminance SSIM in non-overlapping 8 × 8 blocks across nine native-resolution patches up to 128 × 128 pixels on a 3 × 3 grid. The original reference is resized to the output dimensions first. Patches are copied without downsampling and can overlap on small images; transparency is composited on white. The metric can miss color changes, transparency differences on other backgrounds and artifacts outside its patches. It does not measure detail lost through resizing. The [methodology](METHODOLOGY.md) documents the exact sampling procedure.

Exact byte reductions exclude ZIP/container overhead and generated documentation. A hypothetical traffic multiplier is not an observed transfer count. Encoding and operating the optimizer also consume resources. No electricity, water, avoided CO2 or net environmental impact was measured.

See [asset credits](ASSETS.md) for NASA sources, creators, preparation and usage guidelines. NASA does not endorse LeafByte.
