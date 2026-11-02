# LeafByte demonstration

Aim for a 90-second screen recording. Use the working app, actual encodes and the actual downloaded export. No physical experiment, specialized hardware or API key is required.

| Time | Action | Suggested narration |
| --- | --- | --- |
| 0–10 s | Show the app with the sample assets ready. | “Website images often carry more data than their display needs. LeafByte turns them into usable, smaller files and records what changed.” |
| 10–25 s | Load samples, choose an intended width and run optimization. Show the real processing state. | “These are sample files. The browser is encoding actual candidate outputs locally.” |
| 25–45 s | Select an image and drag the comparison control. Inspect a detailed region and show the completed total. | “In our recorded 1920-pixel-maximum run, the bundle went from 3,633,061 to 1,906,332 bytes: 47.53% smaller. One image was resized; three kept their source dimensions. Inspect the result—the score samples structure, not every visual detail.” |
| 45–60 s | Change the bundle budget. Show the resulting selected files and exact total bytes. | “The budget changes which candidates are selected. The totals come from the real files, including any originals kept unchanged.” |
| 60–80 s | Export; extract the ZIP. Show an image, its manifest record and HTML snippets. | “This downloads usable images, their hashes, byte counts and starter references. The manifest lets someone inspect the result independently.” |
| 80–90 s | Show the site's hero asset and its documented payload; finish with the measurement boundary. | “LeafByte uses its own 83,618-byte Amazon thumbnail for this hero, replacing a 1,921,833-byte reference. We measure file reduction, not electricity or emissions.” |

## Recording checks

- Use only numbers visibly produced by the app in that recording. Do not narrate a hypothetical total as an observed result.
- Wait for encoding to finish; do not present a mocked progress animation as computation.
- Open the actual downloaded ZIP and verify that its images work.
- Describe samples as demonstration data, not a customer deployment or field trial.
- Keep the environmental limitation in the recording or on a clearly readable final frame.
- Add captions so the walkthrough remains useful without audio.
- Use source files whose publication rights are documented. Avoid exposing private filenames or personal images during the recording.

## Verified results to cite

The recorded full-width-web benchmark used a 1920 px maximum width, WebP, a 0.970 sampled similarity floor and no bundle budget. It produced **1,906,332 output bytes from 3,633,061 input bytes, a 47.53% reduction**. The glacier image changed from 2286 × 1524 to 1920 × 1280; the other three retained their source dimensions. Results can differ with browser codecs, so any new recording should show its own current output rather than substituting these recorded values.

A separate **480 px thumbnail** run produced **170,226 bytes, 95.31% smaller**. This is a thumbnail-specific resize result, not same-resolution compression. Use it as a clearly named second configuration if the recording has more time; do not conflate it with the 1920 px result.

The shipped hero references the thumbnail run's Amazon output, **83,618 bytes at 480 × 617**, instead of its previous **1,921,833-byte** source reference: a **95.65% smaller referenced image file**. The original remains available for the demonstration, so total repository storage has not fallen. Actual visitor transfers and environmental effects were not measured.

See [the benchmark](BENCHMARK.md) for per-image records and reproduction steps. Exported ZIP CRCs and output SHA-256 hashes were independently checked.

## Submission walkthrough alternative

If using a written walkthrough instead of a video, include screenshots of the input set, a completed real optimization, the comparison, the bundle result and the extracted manifest. Accompany them with the same measurement boundary: exact file reduction, no measured electricity or emissions.
