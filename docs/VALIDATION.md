# Verification record

Checked on 3 November 2026 (IST).

- `npm test`: 31 passing tests covering SSIM, native-resolution patch sampling, byte-budget allocation, format/animation checks, size limits, encoder-failure fallback, ZIP structure and CRC32, filenames, SHA-256, and attribution.
- `npm run check`: JavaScript syntax checks pass.
- Actual browser sample imports, WebP encoding and ZIP downloads completed. Both benchmark ZIPs were independently read with Python's ZIP reader; all exported image lengths and SHA-256 hashes match their manifests. See [the benchmark](BENCHMARK.md).
- An impossible 1 KB budget reports the minimum accepted bundle and the shortfall. A feasible 2 MB budget upgrades selected candidates and stays within the cap.
- Browser file import accepted a tiny PNG and a transparent PNG. It rejected an animated GIF and a damaged JPEG with individual explanations.
- Selecting JPEG for inputs whose acceptable encodes would be larger retained the original bytes; the interface reported zero reduction.
- The comparison slider changed the actual clipping position, and the methodology dialog opened and closed.
- Desktop and mobile breakpoint checks found no horizontal document overflow. Functional text contrast, file-picker focus and comparison-control focus were improved during review.

The sample benchmark records one browser's output; native encoders can differ elsewhere. The project has not conducted a user study or measured electricity, carbon emissions, real visitor transfers or adoption. The recorded walkthrough in [DEMO.md](DEMO.md) is a script, rather than a completed video recording.
