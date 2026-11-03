export const DEMO_PACKS = Object.freeze({
  objects: Object.freeze({
    manifest: 'assets/samples.json',
    label: 'EVERYDAY OBJECTS DEMO · REAL ENCODING RESULTS',
    loadingMessage: 'Bringing in the six Everyday Objects photographs…',
    settings: Object.freeze({ maxWidth: 800, similarityFloor: 0.97, format: 'image/webp', responsive: false }),
  }),
  nasa: Object.freeze({
    manifest: 'assets/nasa-samples.json',
    label: 'NASA REGRESSION PACK · REAL ENCODING RESULTS',
    loadingMessage: 'Bringing in four credited NASA images…',
    settings: Object.freeze({ maxWidth: 1920, similarityFloor: 0.97, format: 'image/webp', responsive: false }),
  }),
});
