/**
 * LeafByte's local image optimizer. All inputs stay in the browser.
 *
 * Similarity is mean local luminance SSIM in non-overlapping 8 x 8 blocks,
 * sampled from nine native-resolution patches of up to 128 x 128 pixels at
 * left/center/right by top/middle/bottom. Small images have overlapping patches.
 * RGBA samples are composited on white. The reference is resampled to the
 * selected output dimensions first: the score assesses compression at that
 * resolution, not lost resolution. Patches themselves are never downsampled.
 */

export const LIMITS = Object.freeze({ maxBytes: 20 * 1024 * 1024, maxPixels: 40_000_000, maxOutputDimension: 8192 });
const QUALITIES = [0.92, 0.84, 0.76, 0.68, 0.60, 0.52];
const textAt = (bytes, start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
const uint32 = (b, i, little = false) => new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(i, little);

/** Inspect bytes rather than trusting a filename or a supplied MIME type. */
export function sniffImage(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  const result = { mime: null, extension: null, animated: false, supported: false, width: null, height: null, reason: null };
  if (b.length >= 6 && /^GIF8[79]a$/.test(textAt(b, 0, 6))) {
    return { ...result, mime: 'image/gif', extension: 'gif', reason: 'GIF is not supported; animation must be preserved.' };
  }
  if (b.length >= 8 && b[0] === 137 && textAt(b, 1, 3) === 'PNG' && b[4] === 13 && b[5] === 10 && b[6] === 26 && b[7] === 10) {
    Object.assign(result, { mime: 'image/png', extension: 'png' });
    let position = 8;
    let sawHeader = false;
    let sawEnd = false;
    while (position + 12 <= b.length) {
      const length = uint32(b, position);
      if (length > b.length - position - 12) break;
      const kind = textAt(b, position + 4, 4);
      if (kind === 'IHDR' && length === 13 && position === 8) {
        sawHeader = true;
        result.width = uint32(b, position + 8);
        result.height = uint32(b, position + 12);
      }
      if (kind === 'acTL') result.animated = true;
      position += length + 12;
      if (kind === 'IEND') { sawEnd = true; break; }
    }
    result.supported = sawHeader && sawEnd && result.width > 0 && result.height > 0 && !result.animated;
    result.reason = result.animated ? 'Animated PNG is not supported; frames would be lost.' : result.supported ? null : 'The PNG is truncated or has an invalid structure.';
    return result;
  }
  if (b.length >= 12 && textAt(b, 0, 4) === 'RIFF' && textAt(b, 8, 4) === 'WEBP') {
    Object.assign(result, { mime: 'image/webp', extension: 'webp' });
    const declaredEnd = uint32(b, 4, true) + 8;
    let position = 12;
    let sawImage = false;
    let structurallyValid = declaredEnd <= b.length && declaredEnd >= 12;
    while (position + 8 <= Math.min(declaredEnd, b.length)) {
      const kind = textAt(b, position, 4);
      const length = uint32(b, position + 4, true);
      const data = position + 8;
      if (length > declaredEnd - data || length > b.length - data) { structurallyValid = false; break; }
      if (kind === 'ANIM' || kind === 'ANMF') result.animated = true;
      if (kind === 'VP8X' && length >= 10) {
        result.animated ||= Boolean(b[data] & 2);
        result.width = 1 + b[data + 4] + (b[data + 5] << 8) + (b[data + 6] << 16);
        result.height = 1 + b[data + 7] + (b[data + 8] << 8) + (b[data + 9] << 16);
      }
      if (kind === 'VP8 ' && length >= 10) {
        sawImage = true;
        if (b[data + 3] === 0x9d && b[data + 4] === 1 && b[data + 5] === 0x2a) {
          result.width ??= (b[data + 6] | (b[data + 7] << 8)) & 0x3fff;
          result.height ??= (b[data + 8] | (b[data + 9] << 8)) & 0x3fff;
        }
      }
      if (kind === 'VP8L' && length >= 5 && b[data] === 0x2f) {
        sawImage = true;
        result.width ??= 1 + b[data + 1] + ((b[data + 2] & 0x3f) << 8);
        result.height ??= 1 + (b[data + 2] >> 6) + (b[data + 3] << 2) + ((b[data + 4] & 0xf) << 10);
      }
      position = data + length + (length % 2);
    }
    result.supported = structurallyValid && position === declaredEnd && sawImage && !result.animated;
    result.reason = result.animated ? 'Animated WebP is not supported; frames would be lost.' : result.supported ? null : 'The WebP is truncated or has an invalid structure.';
    return result;
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    Object.assign(result, { mime: 'image/jpeg', extension: 'jpg' });
    let position = 2;
    while (position + 4 <= b.length && b[position] === 0xff) {
      while (position < b.length && b[position] === 0xff) position++;
      const marker = b[position++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (position + 2 > b.length) break;
      const length = (b[position] << 8) + b[position + 1];
      if (length < 2 || position + length > b.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 8) {
        result.height = (b[position + 3] << 8) + b[position + 4];
        result.width = (b[position + 5] << 8) + b[position + 6];
        break;
      }
      position += length;
    }
    result.supported = result.width > 0 && result.height > 0;
    result.reason = result.supported ? null : 'The JPEG has no readable dimensions or its header is truncated.';
    return result;
  }
  return { ...result, reason: 'Choose a still JPEG, PNG or WebP image. SVG, GIF and other formats are not supported.' };
}

/** Pure numeric SSIM. Arrays may contain luminance or interleaved RGBA bytes. */
export function sampledSSIM(a, b, width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error('SSIM dimensions must be positive integers.');
  const pixels = width * height;
  const aa = a?.data ?? a;
  const bb = b?.data ?? b;
  if (!aa || !bb || ![pixels, pixels * 4].includes(aa.length) || ![pixels, pixels * 4].includes(bb.length)) throw new Error('SSIM samples must match the supplied dimensions.');
  const luminance = (sample, index) => {
    if (sample.length === pixels) return sample[index];
    const p = index * 4;
    const alpha = sample[p + 3] / 255;
    return (0.2126 * sample[p] + 0.7152 * sample[p + 1] + 0.0722 * sample[p + 2]) * alpha + 255 * (1 - alpha);
  };
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  let weighted = 0;
  for (let top = 0; top < height; top += 8) {
    for (let left = 0; left < width; left += 8) {
      let sumA = 0, sumB = 0, sumAA = 0, sumBB = 0, sumAB = 0, count = 0;
      for (let y = top; y < Math.min(top + 8, height); y++) {
        for (let x = left; x < Math.min(left + 8, width); x++) {
          const index = y * width + x;
          const av = luminance(aa, index);
          const bv = luminance(bb, index);
          if (!Number.isFinite(av) || !Number.isFinite(bv)) throw new Error('SSIM samples must contain finite numeric values.');
          sumA += av; sumB += bv; sumAA += av * av; sumBB += bv * bv; sumAB += av * bv; count++;
        }
      }
      const meanA = sumA / count, meanB = sumB / count;
      const varianceA = Math.max(0, sumAA / count - meanA * meanA);
      const varianceB = Math.max(0, sumBB / count - meanB * meanB);
      const covariance = sumAB / count - meanA * meanB;
      const value = ((2 * meanA * meanB + c1) * (2 * covariance + c2)) / ((meanA ** 2 + meanB ** 2 + c1) * (varianceA + varianceB + c2));
      weighted += value * count;
    }
  }
  return Math.max(0, Math.min(1, weighted / pixels));
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Your browser does not provide a 2D canvas.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  return { canvas, context };
}

async function decode(blob) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch { /* Try the browser image decoder next. */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('This image could not be decoded. It may be damaged or unsupported.'));
      image.src = url;
    });
    return image;
  } finally { URL.revokeObjectURL(url); }
}

function encode(canvas, mime, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not encode this image.')), mime, quality));
}

export function patchSamplePlan(width, height) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) throw new Error('The sample dimensions are invalid.');
  // Keeping tile edges on block boundaries prevents synthetic seams from
  // entering an 8 x 8 block. Images smaller than a block use their full extent.
  const tileWidth = width < 8 ? width : Math.min(128, Math.floor(width / 8) * 8);
  const tileHeight = height < 8 ? height : Math.min(128, Math.floor(height / 8) * 8);
  const positions = [];
  const xs = [0, Math.floor((width - tileWidth) / 2), width - tileWidth];
  const ys = [0, Math.floor((height - tileHeight) / 2), height - tileHeight];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) positions.push({ x: xs[column], y: ys[row], outputX: column * tileWidth, outputY: row * tileHeight });
  }
  return { width: tileWidth * 3, height: tileHeight * 3, tileWidth, tileHeight, positions };
}

function sample(drawable, plan) {
  const sampled = makeCanvas(plan.width, plan.height);
  for (const position of plan.positions) {
    sampled.context.drawImage(drawable, position.x, position.y, plan.tileWidth, plan.tileHeight, position.outputX, position.outputY, plan.tileWidth, plan.tileHeight);
  }
  const data = sampled.context.getImageData(0, 0, plan.width, plan.height).data;
  sampled.canvas.width = 1; sampled.canvas.height = 1;
  return data;
}

/** Keep extreme panoramas/portraits within a portable canvas dimension limit. */
export function outputDimensions(originalWidth, originalHeight, maxWidth = 1920) {
  if (!Number.isSafeInteger(originalWidth) || !Number.isSafeInteger(originalHeight) || originalWidth < 1 || originalHeight < 1) throw new Error('The image dimensions are invalid.');
  if (!Number.isFinite(maxWidth) || maxWidth < 1 || maxWidth > 8192) throw new Error('Maximum width must be between 1 and 8192 pixels.');
  const ratio = Math.min(1, Math.floor(maxWidth) / originalWidth, LIMITS.maxOutputDimension / originalHeight);
  return { width: Math.max(1, Math.round(originalWidth * ratio)), height: Math.max(1, Math.round(originalHeight * ratio)), ratio };
}

/** Decode once; produce only candidates smaller than the original and above floor. */
export async function optimizeImage(file, { maxWidth = 1920, similarityFloor = 0.97, format = 'image/webp', onProgress = () => {} } = {}) {
  const start = performance.now();
  if (!(file instanceof Blob) || !file.size) throw new Error('Choose a non-empty image file.');
  if (file.size > LIMITS.maxBytes) throw new Error('Images must be 20 MiB or smaller.');
  if (!Number.isFinite(maxWidth) || maxWidth < 1 || maxWidth > 8192) throw new Error('Maximum width must be between 1 and 8192 pixels.');
  if (!Number.isFinite(similarityFloor) || similarityFloor < 0 || similarityFloor > 1) throw new Error('The similarity floor must be between 0 and 1.');
  if (!['image/webp', 'image/jpeg', 'image/png'].includes(format)) throw new Error('Choose WebP, JPEG or PNG output.');
  const floor = Math.min(0.999, similarityFloor);
  const inspection = sniffImage(new Uint8Array(await file.arrayBuffer()));
  if (!inspection.supported) throw new Error(inspection.reason);
  if (inspection.width * inspection.height > LIMITS.maxPixels) throw new Error('Images must contain no more than 40 megapixels.');
  const original = await decode(file);
  let target;
  try {
    const originalWidth = original.naturalWidth || original.width;
    const originalHeight = original.naturalHeight || original.height;
    if (!originalWidth || !originalHeight || originalWidth * originalHeight > LIMITS.maxPixels) throw new Error('Images must contain valid dimensions and no more than 40 megapixels.');
    const { width, height, ratio } = outputDimensions(originalWidth, originalHeight, maxWidth);
    target = makeCanvas(width, height);
    if (format === 'image/jpeg') {
      target.context.fillStyle = '#fff';
      target.context.fillRect(0, 0, width, height);
    }
    target.context.drawImage(original, 0, 0, width, height);
    const samplePlan = patchSamplePlan(width, height);
    const reference = sample(target.canvas, samplePlan);
    const warnings = [];
    if (originalHeight > LIMITS.maxOutputDimension && height === LIMITS.maxOutputDimension) warnings.push('The output height was limited to 8,192 pixels for browser canvas compatibility; its aspect ratio is retained.');
    if (ratio < 1) warnings.push('Similarity compares compression at the resized dimensions; it does not measure detail lost through downscaling.');
    if (format === 'image/jpeg' && inspection.mime !== 'image/jpeg') warnings.push('JPEG places transparent areas on a white background.');
    warnings.push('Similarity uses nine full-resolution patches up to 128 × 128 pixels, with 8 × 8 luminance SSIM blocks and transparency composited on white. It can miss color shifts or artifacts outside the patches; inspect important details. Small-image patches can overlap.');
    const candidates = [{ blob: file, bytes: file.size, quality: 1, similarity: 1, mime: inspection.mime, width: originalWidth, height: originalHeight, keptOriginal: true }];
    const seen = new Set();
    for (let index = 0; index < QUALITIES.length; index++) {
      const quality = QUALITIES[index];
      let blob;
      try { blob = await encode(target.canvas, format, quality); }
      catch { warnings.push('The browser could not complete this encoding. The original and any earlier accepted outputs are retained.'); break; }
      if (blob.type !== format) { warnings.push(`This browser cannot encode ${format.split('/')[1]}; the original is retained.`); break; }
      if (blob.size < file.size) {
        let decoded;
        try { decoded = await decode(blob); }
        catch { warnings.push('The browser could not decode its encoded output for comparison. The original and any earlier accepted outputs are retained.'); break; }
        try {
          const comparison = sample(decoded, samplePlan);
          const similarity = sampledSSIM(reference, comparison, samplePlan.width, samplePlan.height);
          // Identical lossless encodes need not appear once for every quality.
          const key = `${blob.size}:${similarity.toFixed(9)}`;
          if (similarity >= floor && !seen.has(key)) {
            seen.add(key);
            candidates.push({ blob, bytes: blob.size, quality, similarity, mime: blob.type, width, height, keptOriginal: false });
          }
        } finally { decoded.close?.(); }
      }
      onProgress({ completed: index + 1, total: QUALITIES.length, quality });
      // Give input and rendering a chance to run between native encodes.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (candidates.length === 1) warnings.push('No tested encoding was both smaller and above your similarity floor. The original is retained.');
    const name = typeof file.name === 'string' && file.name ? file.name : 'image';
    return { file, name, originalBytes: file.size, originalWidth, originalHeight, width, height, originalUrl: URL.createObjectURL(file), candidates, warnings, durationMs: performance.now() - start };
  } finally {
    original.close?.();
    if (target) { target.canvas.width = 1; target.canvas.height = 1; }
  }
}

/**
 * Select the smallest accepted encodes, or spend a byte budget on greedy SSIM
 * upgrades. This is a deterministic heuristic, not a globally optimal solver.
 */
export function chooseBundle(results, budgetBytes = null) {
  if (!Array.isArray(results)) throw new Error('A bundle must contain an array of image results.');
  if (budgetBytes !== null && (!Number.isFinite(budgetBytes) || budgetBytes < 0)) throw new Error('The byte budget must be a non-negative number.');
  const options = results.map(result => {
    if (!Array.isArray(result.candidates) || !result.candidates.length) throw new Error('Every image must contain at least one candidate.');
    const limit = result.originalBytes ?? Infinity;
    const valid = result.candidates.map((candidate, index) => ({ ...candidate, index })).filter(candidate => Number.isFinite(candidate.bytes) && candidate.bytes >= 0 && candidate.bytes <= limit && Number.isFinite(candidate.similarity) && candidate.similarity >= 0 && candidate.similarity <= 1);
    if (!valid.length) throw new Error('Every image must contain a valid candidate no larger than its original.');
    return valid.sort((a, b) => a.bytes - b.bytes || b.similarity - a.similarity || a.index - b.index);
  });
  const selections = options.map(candidates => candidates[0].index);
  const minimumBytes = options.reduce((sum, candidates) => sum + candidates[0].bytes, 0);
  let totalBytes = minimumBytes;
  if (budgetBytes !== null && totalBytes <= Math.floor(budgetBytes)) {
    const cap = Math.floor(budgetBytes);
    for (;;) {
      let best = null;
      for (let image = 0; image < results.length; image++) {
        const current = results[image].candidates[selections[image]];
        for (const candidate of options[image]) {
          const cost = candidate.bytes - current.bytes;
          const gain = candidate.similarity - current.similarity;
          if (gain <= 1e-12 || cost < 0 || totalBytes + cost > cap) continue;
          const efficiency = cost === 0 ? Infinity : gain / cost;
          if (!best || efficiency > best.efficiency || (efficiency === best.efficiency && gain > best.gain)) best = { image, candidate, cost, gain, efficiency };
        }
      }
      if (!best) break;
      selections[best.image] = best.candidate.index;
      totalBytes += best.cost;
    }
  }
  return { selections, totalBytes, budgetMet: budgetBytes === null || totalBytes <= Math.floor(budgetBytes), minimumBytes };
}

export function formatBytes(value) {
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 1000) return `${Math.round(value)} B`;
  const exponent = Math.min(3, Math.floor(Math.log10(value) / 3));
  return `${(value / 1000 ** exponent).toFixed(1)} ${['B', 'KB', 'MB', 'GB'][exponent]}`;
}

export async function sha256(blob) {
  if (!globalThis.crypto?.subtle) throw new Error('Evidence hashing requires HTTPS or localhost.');
  const data = blob instanceof Blob ? await blob.arrayBuffer() : blob;
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
