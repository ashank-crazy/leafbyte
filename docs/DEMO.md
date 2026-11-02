# LeafByte demonstration

Aim for a 90-second screen recording. Use the working app, actual encodes and the actual downloaded export. No physical experiment, specialized hardware or API key is required.

| Time | Action | Suggested narration |
| --- | --- | --- |
| 0–10 s | Show the app with the sample assets ready. | “Website images often carry more data than their display needs. LeafByte turns them into usable, smaller files and records what changed.” |
| 10–25 s | Load samples, choose an intended width and run optimization. Show the real processing state. | “These are sample files. The browser is encoding actual candidate outputs locally.” |
| 25–45 s | Select an image and drag the comparison control. Inspect a detailed region. | “I can inspect the visual tradeoff. This score is a sampled similarity proxy, so the image owner still decides what is acceptable.” |
| 45–60 s | Change the bundle budget. Show the resulting selected files and exact total bytes. | “The budget changes which candidates are selected. The totals come from the real files, including any originals kept unchanged.” |
| 60–80 s | Export; extract the ZIP. Show an image, its manifest record and HTML snippets. | “This downloads usable images, their hashes, byte counts and starter references. The manifest lets someone inspect the result independently.” |
| 80–90 s | Return to the result and its limitations. | “The measured result is smaller image files. Those files must replace the originals to reduce a website's payload. We have not measured electricity or emissions.” |

## Recording checks

- Use only numbers visibly produced by the app in that recording. Do not narrate a hypothetical total as an observed result.
- Wait for encoding to finish; do not present a mocked progress animation as computation.
- Open the actual downloaded ZIP and verify that its images work.
- Describe samples as demonstration data, not a customer deployment or field trial.
- Keep the environmental limitation in the recording or on a clearly readable final frame.
- Add captions so the walkthrough remains useful without audio.
- Use source files whose publication rights are documented. Avoid exposing private filenames or personal images during the recording.

## Submission walkthrough alternative

If using a written walkthrough instead of a video, include screenshots of the input set, a completed real optimization, the comparison, the bundle result and the extracted manifest. Accompany them with the same measurement boundary: exact file reduction, no measured electricity or emissions.
