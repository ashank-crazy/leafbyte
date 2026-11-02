# LeafByte

## Tagline

Turn oversized website images into usable, smaller files—with a quality comparison and an evidence bundle for every export.

## Inspiration

Images are often uploaded at camera resolution and then displayed in a much smaller space. That makes visitors transfer data they may not need. The W3C Web Sustainability Guidelines recommend appropriately sized, compressed media to reduce storage and transfer requirements.

We wanted a sustainability tool that performs a useful change and exposes the calculation behind its result. LeafByte takes source files and produces smaller, usable replacements. The central question is practical: how small can this bundle become while keeping the visual quality its owner considers acceptable?

## What it does

LeafByte runs in a browser. Add supported images or load the included samples, choose the intended dimensions and bundle budget, and generate real encoded candidates. Inspect the original and selected output, adjust the tradeoff, and download a ZIP containing the image files, HTML starter snippets and a machine-readable manifest.

The manifest records exact source and output byte counts, dimensions, SHA-256 hashes, selected settings and limitations. It provides a record of what changed, rather than an unsupported carbon score. An original can be kept when changing it is unnecessary or undesirable.

## Who it is for

Student teams, community organizations and small website owners who want to reduce image payloads without configuring an image CDN or a build pipeline. The prototype requires no account or API key, and selected files are processed in the browser.

## How we built it

The application is a buildless web app using browser-native image decoding, canvas-based encoding and local file handling. Its selection process compares available candidates against a bundle size goal. The interface makes the visible tradeoff inspectable instead of treating one encoder setting as universally correct.

Export uses a dependency-free ZIP writer with standard CRC32 checksums and UTF-8 filenames. Web Crypto computes SHA-256 hashes for the exact original and exported files. The result is a normal ZIP archive whose images can be used without LeafByte.

## Environmental benefit and measurement

The immediate measured result is file-size reduction: original image bytes minus selected output image bytes. That is a concrete reduction in the amount of image data needed to store or transfer these particular outputs once they replace their originals.

In a verified browser run, the four-image demonstration went from **3,633,061 bytes to 1,906,332 bytes—47.53% smaller**—using WebP, a 1920 px maximum width and a 0.970 sampled similarity floor. The glacier image was resized from 2286 to 1920 pixels wide; the other three retained their source dimensions. A separate 480 px thumbnail run produced **170,226 bytes, 95.31% smaller**, explicitly trading source resolution for thumbnail use. The exported ZIPs were independently checked for CRC integrity and output SHA-256 matches.

We put one generated output into the product itself: LeafByte's hero now references an **83,618-byte, 480 × 617 WebP** derived from its 1,921,833-byte Amazon sample. That image reference uses a **95.65% smaller payload** than the earlier original. The original remains an opt-in benchmark input, so this is a replacement of the hero's referenced asset, not a reduction in total repository storage or a measurement of visitor traffic.

The demonstration runs actual encodes on four credited NASA satellite-observation images totaling 3,633,061 input bytes. Their source pages, preparation and hashes are documented in the repository. It is a small demonstration corpus, not a representative average across websites, and it is not evidence of website adoption, real visitor traffic or a field trial. A traffic scenario is a conditional multiplication, not a measurement of transferred bytes. Caching, deployment configuration and actual image requests affect any real deployment result.

LeafByte does not measure electricity, water consumption, avoided emissions or net environmental impact. Encoding itself also consumes resources. We make no conversion from saved bytes to CO2. The next validation step is to compare actual published-page requests under the same cache and viewport conditions and evaluate the outputs with website owners.

## Challenges

A single quality slider hides several decisions: whether to resize an image, which format to use, which images deserve more of the bundle budget and whether the existing file is already preferable. A similarity score also needs boundaries: it is a sampled proxy, not a guarantee that text, colors or fine detail remain acceptable.

The similarity metric is mean local luminance SSIM in non-overlapping 8 × 8 blocks across nine native-resolution patches up to 128 × 128 pixels. The patches sit at left/center/right by top/middle/bottom and are not downsampled; small-image patches can overlap. The reference is first resized to the output dimensions, and transparent pixels are composited on white. This can miss color shifts and artifacts outside the patches, and does not measure resolution loss against the full source image.

We address those limits with actual encoded candidates, a visible comparison, retained originals and an exported record. File naming and packaging also matter: unsafe paths, duplicate names and incorrect checksums would make an otherwise useful result difficult to trust.

## What we learned

A resource-saving tool can be useful without claiming a universal environmental conversion. Exact bytes, usable files and a clear account of what remains unmeasured give the project a stronger foundation than a precise-looking carbon total without a measurement basis.

## What's next

Evaluate the outputs with website owners, add responsive image variants, measure actual deployment requests and continue improving quality assessment. Those are future steps, not completed user studies or measured environmental outcomes.

## Credits and AI disclosure

Built for Green Shift Hacks 2026. OpenAI Codex assisted with concept development, original code, documentation and verification under the participant's instructions. Browser codecs provide the underlying image encoders; LeafByte does not claim to invent a new codec. Organizer approval of AI assistance is not claimed.

Sample imagery: NASA Goddard Space Flight Center / Reto Stöckli and Robert Simmon (Blue Marble); Jeff Schmaltz and the NASA GSFC MODIS teams (Amazon and Vancouver Island); NASA Earth Observatory / Wanmei Liang, using USGS Landsat data (Berg Lake and Steller Glacier). Source links, image preparation and [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) are documented in the project's asset credits. NASA does not endorse the project.

Method sources: [W3C Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/), [web.dev image performance](https://web.dev/learn/performance/image-performance) and [web.dev format selection](https://web.dev/articles/choose-the-right-image-format).

## Built with

JavaScript, HTML, CSS, Canvas, Web Crypto, browser-native image codecs, ZIP, Node.js tests.
