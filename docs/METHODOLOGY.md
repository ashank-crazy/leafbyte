# Measurement and limitations

## Purpose

LeafByte creates image replacements intended to reduce unnecessary storage and network transfer while letting the owner inspect image quality. The prototype measures file transformations, not a complete environmental life cycle.

The [W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/) recommend compressing and appropriately sizing media before upload. That guidance supports the direction of the intervention; it is not a certification of this application or proof of a specific emissions reduction.

## Exact byte calculations

For input image `i`:

```text
savedBytes[i] = inputFileBytes[i] - selectedOutputFileBytes[i]
bundleSavedBytes = sum(inputFileBytes) - sum(selectedOutputFileBytes)
bundleSavedPercent = 100 * bundleSavedBytes / sum(inputFileBytes)
```

The manifest calculates bytes from the actual original and output data. It does not trust a filename extension or an earlier UI estimate. A retained original has identical input/output bytes and hashes. A zero-byte total uses zero as the displayed percentage rather than dividing by zero.

These totals exclude ZIP headers, generated metadata, documentation, the application itself and any hosting overhead. A ZIP containing images plus documentation can therefore be larger than the sum shown as “output image bytes.” The archive uses ZIP method 0 (store) and does not claim further image compression.

## Encoding and comparison

Browser-native codecs perform the encoding. Encoding a file using a quality setting of 0.8 does not mean “80% quality remains.” Codec settings differ by format, content and browser implementation. Results may differ between browsers and operating systems.

A candidate's similarity value is **mean local luminance SSIM in non-overlapping 8 × 8 blocks across nine native-resolution patches**. The original reference is first resampled to the selected output dimensions. Reference and output then use the same nine patch positions: left/center/right by top/middle/bottom. Each patch is copied at 1:1 resolution without downsampling into a 3 × 3 contact sheet. RGBA samples are composited against white before the luminance calculation.

Each tile dimension is the smaller of 128 pixels and the image dimension rounded down to a multiple of 8. Dimensions smaller than 8 pixels use their full extent. Center positions use the floor of half the remaining extent. Patches can overlap on small images. The aggregate uses the local block scores weighted by the number of pixels in each block; patch edges align to block boundaries except where the image itself is smaller than a block.

This measures encoding changes relative to the already-resized reference. It does **not** measure resolution loss against the full source image. Retained originals receive a score of 1 by file identity; that does not assert anything about the original image's suitability or quality. The score uses luminance, so it can miss color changes; artifacts, small text and fine structures outside the patches are unmeasured. It is a proxy for one aspect of visual similarity. A high score cannot guarantee visual equivalence, readability, accessibility or suitability for medical, scientific, archival or other specialized uses. White-background compositing can hide transparency differences that would appear on other backgrounds.

Inspect outputs at the intended display dimensions. Resizing changes the available resolution and may make an output inappropriate for high-density screens, zooming, printing or later editing. Keep source originals independently as a backup.

## Bundle budget

The budget operates on available candidate image files. It is a selection goal, not a guarantee that every requested budget is feasible. If preserving the required quality or retaining available originals makes the target infeasible, the app must disclose that rather than inventing a smaller output.

The result is based on candidates the app actually generated. It does not establish that the chosen bundle is the theoretical smallest possible encoding, nor that the browser codec outperforms every existing optimizer.

## Evidence export

For every image, `manifest.json` records:

- Original name, exact bytes, original dimensions and SHA-256 hash.
- Export path, exact bytes, output dimensions, MIME type and SHA-256 hash.
- Selected candidate, encoder setting, sampled similarity value and whether the original was retained.
- Saved bytes, saved percentage, processing duration and warnings when supplied by the engine.

Hashes establish the identity of the recorded input and exported output. They do not certify image quality, rights to the source material or environmental benefit. CRC32 provides standard ZIP integrity checks and is not a security signature.

Exported names are sanitized and deduplicated. The ZIP writer rejects traversal paths and does not include a runtime. It does not support ZIP64; browser memory constraints impose practical limits well below very large archive sizes.

## Environmental boundary

The measured quantity is image file reduction. To reduce a particular website's image payload, someone must deploy the replacements and have them requested in place of the originals. Downloading an export or changing a setting does not alter an existing website.

If a scenario is shown, its formula is:

```text
hypotheticalBytesAvoided = bundleSavedBytes * assumedFullBundleLoads
```

This assumes each load requests every selected image and would otherwise request every original. Real caching, responsive variants, lazy loading, partial visits, delivery compression and repeat visits can change the result. The app does not measure those behaviors. Scenario totals are not actual traffic or observed transfers.

Fewer file bytes do not imply a known linear reduction in electricity or emissions. Infrastructure, devices, network technology, caching and energy sources matter. Encoding and running the optimizer also consume resources. LeafByte therefore makes no claim of measured electricity savings, avoided CO2, water savings or net environmental impact.

## Data and privacy

Selected user files are processed in the browser. Loading the app and included sample files involves normal requests to the hosting service. Browser-local processing does not make the hosting service unaware that a page was visited.

Image re-encoding can remove or alter metadata such as color profiles and EXIF information; a kept original can retain its existing metadata. Inspect outputs before publishing. Publication rights and meaningful alternative text remain the website owner's responsibility.

Included demonstration inputs are four credited NASA satellite-observation images totaling 3,633,061 bytes. The Blue Marble image is a documented composite; the Amazon image was proportionally resized to 1867 × 2400 using Lanczos resampling and JPEG quality 80 before inclusion, while the other three bundled JPEGs are unchanged downloads. [Asset credits](ASSETS.md) and [the source manifest](../dist/assets/samples.json) document origins, preparation, dimensions and hashes. No image is AI-generated and NASA does not endorse LeafByte.

The output sizes are actual encoding results; they do not establish real-world adoption, representative average savings, a measured visitor study or measured environmental benefit.

## Verification boundary

Automated checks cover the calculations and packaging that can be checked deterministically. Browser verification is required to establish actual encoding behavior and that the displayed controls work in the tested browser. A successful source check alone is not proof of a working deployed experience.

## Sources

- [W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/).
- [web.dev: Image performance](https://web.dev/learn/performance/image-performance).
- [web.dev: Choose the right image format](https://web.dev/articles/choose-the-right-image-format).

Original application work was assisted by OpenAI Codex. The project makes no claim that AI assistance, submission eligibility or project quality has been approved by the hackathon organizer.
