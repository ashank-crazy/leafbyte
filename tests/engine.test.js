import test from 'node:test';
import assert from 'node:assert/strict';
import { sampledSSIM, chooseBundle, sniffImage, formatBytes, sha256, optimizeImage, optimizeResponsiveImage, responsiveWidths, outputDimensions, patchSamplePlan, LIMITS } from '../dist/engine.js';

test('SSIM is 1 for identical images, including partial edge blocks', () => {
  const pixels = Uint8Array.from({ length: 11 * 13 }, (_, i) => (i * 23) % 256);
  assert.equal(sampledSSIM(pixels, pixels, 11, 13), 1);
});

test('SSIM detects a strong structural change and remains symmetric', () => {
  const original = Uint8Array.from({ length: 64 }, (_, i) => i % 2 ? 220 : 30);
  const changed = Uint8Array.from(original, n => 250 - n);
  const score = sampledSSIM(original, changed, 8, 8);
  assert.ok(score < 0.1);
  assert.equal(score, sampledSSIM(changed, original, 8, 8));
});

test('small brightness perturbation is less damaging than severe contrast reversal', () => {
  const original = Uint8Array.from({ length: 256 }, (_, i) => 40 + i % 150);
  const small = Uint8Array.from(original, n => n + 2);
  const severe = Uint8Array.from(original, n => 255 - n);
  assert.ok(sampledSSIM(original, small, 16, 16) > 0.99);
  assert.ok(sampledSSIM(original, severe, 16, 16) < 0.5);
});

test('RGBA sampling composites transparent colors on white', () => {
  assert.equal(sampledSSIM(Uint8Array.from([0, 0, 0, 0]), Uint8Array.from([255, 255, 255, 255]), 1, 1), 1);
});

test('SSIM rejects inconsistent dimensions and non-finite samples', () => {
  assert.throws(() => sampledSSIM([1], [1], 0, 1), /dimensions/);
  assert.throws(() => sampledSSIM([1, 2], [1], 1, 1), /dimensions/);
  assert.throws(() => sampledSSIM([NaN], [1], 1, 1), /finite/);
});

const bundle = [
  { originalBytes: 100, candidates: [{ bytes: 100, similarity: 1 }, { bytes: 20, similarity: 0.97 }, { bytes: 40, similarity: 0.99 }] },
  { originalBytes: 80, candidates: [{ bytes: 80, similarity: 1 }, { bytes: 30, similarity: 0.98 }, { bytes: 50, similarity: 0.99 }] }
];

test('no budget selects the smallest accepted candidates', () => {
  assert.deepEqual(chooseBundle(bundle), { selections: [1, 1], totalBytes: 50, budgetMet: true, minimumBytes: 50 });
});

test('impossible budgets return the minimum and explicitly fail the budget', () => {
  const result = chooseBundle(bundle, 49);
  assert.equal(result.totalBytes, 50);
  assert.equal(result.minimumBytes, 50);
  assert.equal(result.budgetMet, false);
});

test('exact-minimum and fractional budgets never overflow the cap', () => {
  assert.equal(chooseBundle(bundle, 50).totalBytes, 50);
  const result = chooseBundle(bundle, 69.9);
  assert.equal(result.totalBytes, 50);
  assert.equal(result.budgetMet, true);
});

test('greedy allocator prefers more similarity per extra byte', () => {
  const result = chooseBundle(bundle, 70);
  assert.deepEqual(result.selections, [2, 1]);
  assert.equal(result.totalBytes, 70);
});

test('a sufficiently large budget can retain all originals', () => {
  const result = chooseBundle(bundle, 1000);
  assert.deepEqual(result.selections, [0, 0]);
  assert.equal(result.totalBytes, 180);
});

test('allocator excludes encodes larger than their original and validates inputs', () => {
  assert.equal(chooseBundle([{ originalBytes: 10, candidates: [{ bytes: 10, similarity: 1 }, { bytes: 12, similarity: 1 }] }], 20).totalBytes, 10);
  assert.throws(() => chooseBundle(bundle, -1), /budget/);
  assert.throws(() => chooseBundle([{ candidates: [] }]), /candidate/);
  assert.deepEqual(chooseBundle([], 0), { selections: [], totalBytes: 0, budgetMet: true, minimumBytes: 0 });
});

test('allocator satisfies the cap for every feasible integer budget', () => {
  for (let cap = 0; cap <= 200; cap++) {
    const result = chooseBundle(bundle, cap);
    const actualBytes = result.selections.reduce((sum, index, image) => sum + bundle[image].candidates[index].bytes, 0);
    assert.equal(result.totalBytes, actualBytes);
    assert.equal(result.budgetMet, cap >= 50);
    if (result.budgetMet) assert.ok(actualBytes <= cap);
    for (let image = 0; image < bundle.length; image++) {
      const chosen = bundle[image].candidates[result.selections[image]];
      assert.ok(chosen.bytes <= bundle[image].originalBytes);
      assert.ok(chosen.similarity >= bundle[image].candidates[1].similarity);
    }
  }
});

function chunk(type, data = []) {
  const buffer = new Uint8Array(data.length + 12);
  new DataView(buffer.buffer).setUint32(0, data.length);
  buffer.set(Array.from(type, c => c.charCodeAt(0)), 4);
  buffer.set(data, 8);
  return buffer;
}
function png(animated = false) {
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, 16);
  new DataView(ihdr.buffer).setUint32(4, 24);
  const parts = [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr)];
  if (animated) parts.push(chunk('acTL', new Uint8Array(8)));
  parts.push(chunk('IDAT'), chunk('IEND'));
  return Uint8Array.from(parts.flatMap(p => Array.from(p)));
}
function webp(animated = false) {
  const kind = animated ? 'ANIM' : 'VP8L';
  const data = animated ? [0, 0, 0, 0, 0, 0] : [0x2f, 3, 0, 1, 0];
  const size = 8 + data.length + data.length % 2;
  const output = new Uint8Array(12 + size);
  output.set(Array.from('RIFF', c => c.charCodeAt(0)));
  new DataView(output.buffer).setUint32(4, 4 + size, true);
  output.set(Array.from('WEBP', c => c.charCodeAt(0)), 8);
  output.set(Array.from(kind, c => c.charCodeAt(0)), 12);
  new DataView(output.buffer).setUint32(16, data.length, true);
  output.set(data, 20);
  return output;
}

test('PNG sniffing reads dimensions and rejects APNG', () => {
  const still = sniffImage(png());
  assert.equal(still.mime, 'image/png');
  assert.equal(still.width, 16);
  assert.equal(still.height, 24);
  assert.equal(still.supported, true);
  const animation = sniffImage(png(true));
  assert.equal(animation.animated, true);
  assert.equal(animation.supported, false);
  assert.match(animation.reason, /Animated PNG/);
});

test('WebP sniffing parses lossless dimensions and rejects animation', () => {
  const still = sniffImage(webp());
  assert.equal(still.supported, true);
  assert.equal(still.width, 4);
  assert.equal(still.height, 5);
  const animation = sniffImage(webp(true));
  assert.equal(animation.supported, false);
  assert.equal(animation.animated, true);
});

test('WebP animation flag rejects a container even without an ANIM chunk', () => {
  const bytes = new Uint8Array(30);
  bytes.set(new TextEncoder().encode('RIFF'), 0);
  new DataView(bytes.buffer).setUint32(4, 22, true);
  bytes.set(new TextEncoder().encode('WEBPVP8X'), 8);
  new DataView(bytes.buffer).setUint32(16, 10, true);
  bytes[20] = 2;
  const result = sniffImage(bytes);
  assert.equal(result.animated, true);
  assert.equal(result.supported, false);
});

test('malformed PNG/WebP and unknown signatures are not accepted', () => {
  assert.equal(sniffImage(png().slice(0, -2)).supported, false);
  assert.equal(sniffImage(webp().slice(0, -2)).supported, false);
  assert.equal(sniffImage(new TextEncoder().encode('<svg></svg>')).supported, false);
  assert.equal(sniffImage(new Uint8Array()).supported, false);
});

test('GIF is unsupported and JPEG signature is recognized', () => {
  assert.equal(sniffImage(new TextEncoder().encode('GIF89a')).supported, false);
  const jpeg = sniffImage(Uint8Array.from([255, 216, 255, 217]));
  assert.equal(jpeg.mime, 'image/jpeg');
  assert.equal(jpeg.supported, false);
  assert.match(jpeg.reason, /dimensions/);
  const header = Uint8Array.from([255, 216, 255, 192, 0, 17, 8, 0, 24, 0, 16, 3, 1, 0, 0, 2, 0, 0, 3, 0, 0, 255, 217]);
  const sized = sniffImage(header);
  assert.equal(sized.supported, true);
  assert.equal(sized.width, 16);
  assert.equal(sized.height, 24);
});

test('optimizer validates malformed, animated and oversized inputs before decoding', async () => {
  await assert.rejects(optimizeImage(new Blob([])), /non-empty/);
  await assert.rejects(optimizeImage(new Blob([png(true)])), /Animated PNG/);
  await assert.rejects(optimizeImage(new Blob(['<svg/>'])), /still JPEG/);
  await assert.rejects(optimizeImage(new Blob([png()]), { maxWidth: 0 }), /Maximum width/);
  await assert.rejects(optimizeImage(new Blob([png()]), { similarityFloor: NaN }), /similarity floor/);
  await assert.rejects(optimizeImage(new Blob([png()]), { format: 'image/avif' }), /WebP, JPEG or PNG/);
  const excessiveDimensions = png();
  new DataView(excessiveDimensions.buffer).setUint32(16, 10_000);
  new DataView(excessiveDimensions.buffer).setUint32(20, 10_000);
  await assert.rejects(optimizeImage(new Blob([excessiveDimensions])), /40 megapixels/);
});

test('output dimensions respect requested width, never upscale and cap extreme portraits', () => {
  assert.deepEqual(outputDimensions(2400, 1600, 1200), { width: 1200, height: 800, ratio: 0.5 });
  assert.deepEqual(outputDimensions(100, 50, 1920), { width: 100, height: 50, ratio: 1 });
  const portrait = outputDimensions(200, 100_000, 1920);
  assert.equal(portrait.height, LIMITS.maxOutputDimension);
  assert.ok(portrait.width <= 1920);
  assert.ok(Math.abs(portrait.width / portrait.height - 200 / 100_000) <= 1 / portrait.height);
  assert.throws(() => outputDimensions(0, 1), /dimensions/);
});

test('native-resolution patch plan samples corners, edges and center without scaling', () => {
  const plan = patchSamplePlan(1920, 1080);
  assert.equal(plan.tileWidth, 128);
  assert.equal(plan.tileHeight, 128);
  assert.equal(plan.width, 384);
  assert.equal(plan.height, 384);
  assert.equal(plan.positions.length, 9);
  assert.deepEqual(plan.positions[0], { x: 0, y: 0, outputX: 0, outputY: 0 });
  assert.deepEqual(plan.positions[4], { x: 896, y: 476, outputX: 128, outputY: 128 });
  assert.deepEqual(plan.positions[8], { x: 1792, y: 952, outputX: 256, outputY: 256 });
});

test('small-image patch plans stay in bounds with block-aligned tile seams', () => {
  for (const [width, height] of [[11, 13], [3, 2], [128, 128], [65, 129]]) {
    const plan = patchSamplePlan(width, height);
    for (const position of plan.positions) {
      assert.ok(position.x >= 0 && position.x + plan.tileWidth <= width);
      assert.ok(position.y >= 0 && position.y + plan.tileHeight <= height);
    }
    if (width >= 8) assert.equal(plan.tileWidth % 8, 0);
    if (height >= 8) assert.equal(plan.tileHeight % 8, 0);
  }
});

test('native encoder failure keeps the original as an exportable fallback', async () => {
  const savedDocument = globalThis.document;
  const savedBitmap = globalThis.createImageBitmap;
  let closed = false;
  globalThis.createImageBitmap = async () => ({ width: 16, height: 24, close() { closed = true; } });
  globalThis.document = { createElement() { return {
    width: 0, height: 0,
    getContext() { return { drawImage() {}, fillRect() {}, getImageData(x, y, width, height) { return { data: new Uint8ClampedArray(width * height * 4) }; } }; },
    toBlob(callback) { callback(null); }
  }; } };
  try {
    const file = new Blob([png()], { type: 'image/png' });
    const result = await optimizeImage(file);
    assert.equal(result.candidates.length, 1);
    assert.equal(result.candidates[0].blob, file);
    assert.equal(result.candidates[0].keptOriginal, true);
    assert.equal(result.candidates[0].similarity, 1);
    assert.ok(result.warnings.some(warning => /could not complete/.test(warning)));
    assert.equal(closed, true);
    URL.revokeObjectURL(result.originalUrl);
  } finally {
    if (savedDocument === undefined) delete globalThis.document; else globalThis.document = savedDocument;
    if (savedBitmap === undefined) delete globalThis.createImageBitmap; else globalThis.createImageBitmap = savedBitmap;
  }
});

test('responsive width presets never upscale or duplicate the primary width', () => {
  assert.deepEqual(responsiveWidths(320, 1920), []);
  assert.deepEqual(responsiveWidths(480, 480), []);
  assert.deepEqual(responsiveWidths(800, 1920), [480]);
  assert.deepEqual(responsiveWidths(2400, 1920), [480, 960]);
  assert.deepEqual(responsiveWidths(3840, 3840), [480, 960, 1920]);
  assert.throws(() => responsiveWidths(0, 1920), /positive integers/);
});

test('responsive optimization returns accepted smaller outputs and releases extra source URLs', async () => {
  const savedDocument = globalThis.document;
  const savedBitmap = globalThis.createImageBitmap;
  const createUrl = URL.createObjectURL;
  const revokeUrl = URL.revokeObjectURL;
  const created = [], revoked = [], progress = [];
  URL.createObjectURL = function(blob) { const url = createUrl.call(this, blob); created.push(url); return url; };
  URL.revokeObjectURL = function(url) { revoked.push(url); revokeUrl.call(this, url); };
  globalThis.createImageBitmap = async blob => ({ width: blob.sampleWidth || 2400, height: blob.sampleHeight || 1600, close() {} });
  globalThis.document = { createElement() { return {
    width: 0, height: 0,
    getContext() { return { drawImage() {}, fillRect() {}, getImageData(x, y, width, height) { return { data: new Uint8ClampedArray(width * height * 4) }; } }; },
    toBlob(callback, mime, quality) {
      const blob = new Blob([new Uint8Array(Math.max(1, Math.ceil(this.width * this.height * quality / 100_000)))], { type: mime });
      blob.sampleWidth = this.width; blob.sampleHeight = this.height;
      callback(blob);
    }
  }; } };
  let result;
  try {
    const file = new Blob([png()], { type: 'image/png' });
    Object.defineProperty(file, 'webkitRelativePath', { value: 'website/images/photo.png' });
    result = await optimizeResponsiveImage(file, { maxWidth: 1920, onProgress: update => progress.push(update) });
    assert.equal(result.width, 1920);
    assert.equal(result.relativePath, 'website/images/photo.png');
    assert.deepEqual(result.variants.map(variant => variant.width), [480, 960]);
    for (const variant of result.variants) {
      assert.equal(variant.keptOriginal, false);
      assert.equal(variant.mime, 'image/webp');
      assert.ok(variant.similarity >= 0.97);
      assert.ok(variant.bytes < file.size);
      assert.ok(variant.width < result.width);
    }
    assert.equal(created.length, 3);
    assert.equal(revoked.length, 2);
    assert.ok(!revoked.includes(result.originalUrl));
    assert.equal(progress.at(-1).completed, progress.at(-1).total);
    assert.ok(result.candidates[0].keptOriginal);
  } finally {
    if (result) revokeUrl.call(URL, result.originalUrl);
    URL.createObjectURL = createUrl; URL.revokeObjectURL = revokeUrl;
    if (savedDocument === undefined) delete globalThis.document; else globalThis.document = savedDocument;
    if (savedBitmap === undefined) delete globalThis.createImageBitmap; else globalThis.createImageBitmap = savedBitmap;
  }
});

test('byte formatting and SHA-256 evidence hashes are deterministic', async () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1200), '1.2 KB');
  assert.equal(formatBytes(-1), '—');
  assert.equal(await sha256(new Blob(['abc'])), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
