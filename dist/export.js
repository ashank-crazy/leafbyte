// Local, dependency-free ZIP packaging. ZIP method 0 stores already-compressed images.
const encoder = new TextEncoder();
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

export function crc32(data) {
  if (!(data instanceof Uint8Array)) throw new TypeError('CRC input must be a Uint8Array.');
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function safeFilename(name) {
  let value = String(name || 'image').normalize('NFKC').split(/[\\/]/).pop();
  value = value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069<>:"|?*%]/g, '_').replace(/^\.+/, '').replace(/[.\s]+$/, '').trim();
  if (!value || value === '.' || value === '..') value = 'image';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value)) value = `image_${value}`;
  return Array.from(value).slice(0, 120).join('');
}

function validateZipPath(name) {
  if (typeof name !== 'string' || !name || name.startsWith('/') || /[\\\u0000-\u001f\u007f<>:"|?*]/.test(name)) {
    throw new Error('ZIP entry has an unsafe name.');
  }
  if (name.split('/').some(part => !part || part === '.' || part === '..' || /[.\s]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) {
    throw new Error('ZIP entry has an unsafe path.');
  }
  const bytes = encoder.encode(name);
  if (bytes.length > 65535) throw new Error('ZIP entry name is too long.');
  return bytes;
}

export function createZip(files) {
  if (!Array.isArray(files) || files.length > 65535) throw new Error('ZIP supports at most 65,535 entries.');
  const seen = new Set();
  const entries = files.map(file => {
    const name = validateZipPath(file.name);
    const canonicalName = file.name.normalize('NFKC').toLocaleLowerCase('en-US');
    if (seen.has(canonicalName)) throw new Error('ZIP entry names must be unique.');
    seen.add(canonicalName);
    if (!(file.data instanceof Uint8Array)) throw new TypeError('ZIP entry data must be a Uint8Array.');
    if (file.data.length > 0xffffffff) throw new Error('This export does not support ZIP64.');
    return { name, data: file.data, crc: crc32(file.data), offset: 0 };
  });
  const localSize = entries.reduce((sum, entry) => sum + 30 + entry.name.length + entry.data.length, 0);
  const centralSize = entries.reduce((sum, entry) => sum + 46 + entry.name.length, 0);
  if (localSize + centralSize + 22 > 0xffffffff) throw new Error('This export does not support ZIP64.');
  const archive = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(archive.buffer);
  let cursor = 0;
  for (const entry of entries) {
    entry.offset = cursor;
    view.setUint32(cursor, 0x04034b50, true);
    view.setUint16(cursor + 4, 20, true);
    view.setUint16(cursor + 6, 0x0800, true); // UTF-8 filenames.
    view.setUint16(cursor + 8, 0, true); // Store; no recompression.
    view.setUint16(cursor + 10, 0, true);
    view.setUint16(cursor + 12, 0x0021, true); // Deterministic DOS date: 1980-01-01.
    view.setUint32(cursor + 14, entry.crc, true);
    view.setUint32(cursor + 18, entry.data.length, true);
    view.setUint32(cursor + 22, entry.data.length, true);
    view.setUint16(cursor + 26, entry.name.length, true);
    view.setUint16(cursor + 28, 0, true);
    archive.set(entry.name, cursor + 30);
    archive.set(entry.data, cursor + 30 + entry.name.length);
    cursor += 30 + entry.name.length + entry.data.length;
  }
  const centralOffset = cursor;
  for (const entry of entries) {
    view.setUint32(cursor, 0x02014b50, true);
    view.setUint16(cursor + 4, 20, true);
    view.setUint16(cursor + 6, 20, true);
    view.setUint16(cursor + 8, 0x0800, true);
    view.setUint16(cursor + 10, 0, true);
    view.setUint16(cursor + 12, 0, true);
    view.setUint16(cursor + 14, 0x0021, true);
    view.setUint32(cursor + 16, entry.crc, true);
    view.setUint32(cursor + 20, entry.data.length, true);
    view.setUint32(cursor + 24, entry.data.length, true);
    view.setUint16(cursor + 28, entry.name.length, true);
    view.setUint16(cursor + 30, 0, true);
    view.setUint16(cursor + 32, 0, true);
    view.setUint16(cursor + 34, 0, true);
    view.setUint16(cursor + 36, 0, true);
    view.setUint32(cursor + 38, 0, true);
    view.setUint32(cursor + 42, entry.offset, true);
    archive.set(entry.name, cursor + 46);
    cursor += 46 + entry.name.length;
  }
  view.setUint32(cursor, 0x06054b50, true);
  view.setUint16(cursor + 4, 0, true);
  view.setUint16(cursor + 6, 0, true);
  view.setUint16(cursor + 8, entries.length, true);
  view.setUint16(cursor + 10, entries.length, true);
  view.setUint32(cursor + 12, centralSize, true);
  view.setUint32(cursor + 16, centralOffset, true);
  view.setUint16(cursor + 20, 0, true);
  return archive;
}

async function hash(bytes) {
  if (!globalThis.crypto?.subtle) throw new Error('Evidence export requires a secure browser context (HTTPS or localhost).');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function extension(mime, name) {
  const known = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/avif': 'avif' };
  if (known[mime]) return known[mime];
  return /\.([a-z0-9]{1,8})$/i.exec(name)?.[1]?.toLowerCase() || 'bin';
}

function uniqueBasename(stem, suffix, ext, usedNames) {
  let basename = `${stem}-${suffix}.${ext}`;
  let copy = 2;
  while (usedNames.has(basename.toLocaleLowerCase('en-US'))) basename = `${stem}-${suffix}-${copy++}.${ext}`;
  usedNames.add(basename.toLocaleLowerCase('en-US'));
  return basename;
}

// URL encoding matters especially for srcset: a literal comma separates entries.
function assetUrl(path) { return path.split('/').map(part => encodeURIComponent(part)).join('/'); }

function imageSnippet(record) {
  const source = escapeHtml(assetUrl(record.output.path));
  const dimensions = `width="${escapeHtml(record.output.width)}" height="${escapeHtml(record.output.height)}" alt=""`;
  if (!record.variants.length) return `<img src="${source}" ${dimensions}>`;
  const options = [...record.variants, record.output].sort((a, b) => a.width - b.width);
  const srcset = escapeHtml(options.map(option => `${assetUrl(option.path)} ${option.width}w`).join(', '));
  const sizes = escapeHtml(`(max-width: ${record.output.width}px) 100vw, ${record.output.width}px`);
  return `<picture>\n  <source type="${escapeHtml(record.output.mime)}" srcset="${srcset}" sizes="${sizes}">\n  <img src="${source}" srcset="${srcset}" sizes="${sizes}" ${dimensions}>\n</picture>`;
}

export async function buildExport(results, selections = [], settings = {}) {
  if (!Array.isArray(results) || !results.length) throw new Error('Add and optimize images before exporting.');
  const files = [];
  const records = [];
  const usedNames = new Set();
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    const selectedIndex = selections[index] ?? 0;
    if (!Number.isInteger(selectedIndex) || !result.candidates?.[selectedIndex]) throw new Error('An image selection is invalid.');
    const candidate = result.candidates[selectedIndex];
    if (!result.file?.arrayBuffer || !candidate.blob?.arrayBuffer) throw new Error('An image is missing its original or output data.');
    const outputMime = candidate.mime || candidate.blob.type;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(outputMime)) throw new Error('The selected output is not a supported image format.');
    const originalData = new Uint8Array(await result.file.arrayBuffer());
    const outputData = new Uint8Array(await candidate.blob.arrayBuffer());
    const inputName = result.name || result.file.name || `image-${index + 1}`;
    const sanitized = safeFilename(inputName);
    const stem = sanitized.replace(/\.[^.]+$/, '') || 'image';
    const suffix = candidate.keptOriginal ? 'original' : 'leafbyte';
    const ext = extension(outputMime, sanitized);
    const basename = uniqueBasename(stem, suffix, ext, usedNames);
    const outputPath = `images/${basename}`;
    const [inputSha256, outputSha256] = await Promise.all([hash(originalData), hash(outputData)]);
    const savedBytes = originalData.length - outputData.length;
    files.push({ name: outputPath, data: outputData });
    const outputWidth = candidate.width ?? result.width;
    const outputHeight = candidate.height ?? result.height;
    const variantsByWidth = new Map();
    if (!candidate.keptOriginal && Array.isArray(result.variants)) {
      for (const variant of result.variants) {
        const mime = variant.mime || variant.blob?.type;
        // An unchanged source is never duplicated into a responsive export.
        // Different formats need separate source groups, which this tool does
        // not generate. Larger/equal-width entries are already the primary.
        if (variant.keptOriginal || mime !== outputMime || !Number.isSafeInteger(variant.width) || !Number.isSafeInteger(variant.height) || variant.width < 1 || variant.height < 1 || variant.width >= outputWidth || variant.width > result.originalWidth || !variant.blob?.arrayBuffer) continue;
        const data = new Uint8Array(await variant.blob.arrayBuffer());
        const previous = variantsByWidth.get(variant.width);
        if (!previous || data.length < previous.data.length) variantsByWidth.set(variant.width, { ...variant, mime, data });
      }
    }
    const variants = [];
    for (const variant of [...variantsByWidth.values()].sort((a, b) => a.width - b.width)) {
      const variantPath = `images/${uniqueBasename(stem, `leafbyte-${variant.width}w`, extension(variant.mime, sanitized), usedNames)}`;
      const sha256 = await hash(variant.data);
      files.push({ name: variantPath, data: variant.data });
      variants.push({ path: variantPath, bytes: variant.data.length, width: variant.width, height: variant.height, mime: variant.mime, sha256, encoderQuality: variant.quality ?? null, sampledSimilarity: variant.similarity ?? null });
    }
    records.push({
      input: { name: inputName, relativePath: result.relativePath || result.file.webkitRelativePath || inputName, bytes: originalData.length, width: result.originalWidth, height: result.originalHeight, mime: result.file.type || null, sha256: inputSha256 },
      output: { path: outputPath, bytes: outputData.length, width: outputWidth, height: outputHeight, mime: outputMime, sha256: outputSha256 },
      variants,
      selectedCandidate: selectedIndex,
      encoderQuality: candidate.quality ?? null,
      sampledSimilarity: candidate.similarity ?? null,
      keptOriginal: Boolean(candidate.keptOriginal),
      savedBytes,
      savedPercent: originalData.length ? savedBytes / originalData.length * 100 : 0,
      warnings: Array.isArray(result.warnings) ? result.warnings : [],
      processingDurationMs: result.durationMs ?? null,
    });
  }
  const inputBytes = records.reduce((sum, record) => sum + record.input.bytes, 0);
  const outputBytes = records.reduce((sum, record) => sum + record.output.bytes, 0);
  const additionalVariantBytes = records.reduce((sum, record) => sum + record.variants.reduce((total, variant) => total + variant.bytes, 0), 0);
  const manifest = {
    schema: 'leafbyte-export-v1',
    generatedAt: new Date().toISOString(),
    settings,
    summary: { images: records.length, inputBytes, outputBytes, primaryOutputBytes: outputBytes, additionalVariantBytes, allImageBytes: outputBytes + additionalVariantBytes, variantFiles: records.reduce((sum, record) => sum + record.variants.length, 0), savedBytes: inputBytes - outputBytes, savedPercent: inputBytes ? (inputBytes - outputBytes) / inputBytes * 100 : 0 },
    measurement: {
      bytes: 'Exact file lengths, excluding ZIP overhead and generated documentation. outputBytes and primaryOutputBytes count only selected primary images. additionalVariantBytes counts smaller responsive files. allImageBytes is the actual combined image storage in this archive. savedBytes and savedPercent compare source files with primary outputs only; they are not total archive storage savings.',
      similarity: 'Encoded candidates use mean local luminance SSIM in non-overlapping 8 × 8 blocks across nine native-resolution patches up to 128 × 128 pixels, positioned at left/center/right by top/middle/bottom. Patches are not downsampled and can overlap on small images. The original is first resampled to the output dimensions. RGBA samples are composited on white. Retained originals receive 1 by file identity. This does not measure resolution loss against the full original and can miss color shifts or artifacts outside the patches. It is not a guarantee of perceptual equivalence, legibility, color fidelity or accessibility. Inspect the images yourself.',
      savings: 'Output file reduction only. Storage or transfer benefits require using these files instead of the originals. Cache behavior, repeat visits and encoding overhead are not measured.',
      responsive: 'Responsive variants are additional stored files. The browser chooses among srcset candidates using layout size, pixel density and browser behavior; it does not ordinarily download every variant for one image. Supplied sizes assume full viewport width up to the primary image width and must be adapted to the website layout. Actual candidate selection and transferred bytes are not measured. Original selections omit variants. Folder-relative input paths are recorded for mapping; exported filenames are flattened and deduplicated.',
      environment: 'Electricity, water consumption, avoided emissions and total environmental impact have not been measured. Traffic scenarios, if shown in the app, are hypothetical.',
      hashes: 'SHA-256 of each original input file and each exact exported output file.',
    },
    images: records,
    sources: ['https://www.w3.org/TR/web-sustainability-guidelines/', 'https://web.dev/learn/performance/image-performance'],
  };
  const snippets = records.map(imageSnippet).join('\n');
  const html = `<!doctype html>\n<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>LeafByte exported images</title>\n<style>img{max-width:100%;height:auto}</style>\n<!-- Replace empty alt text with a useful description for meaningful images. Empty alt is suitable only for decorative images. -->\n<!-- Width and height describe the primary asset. Adapt sizes and responsive CSS to your layout. Each picture uses one output format, not a separate legacy-format fallback. -->\n${snippets}\n</html>\n`;
  const nasaNotice = Array.isArray(settings.sampleAttribution) && settings.sampleAttribution.some(asset => /\bNASA\b/i.test(asset.credit || '') || /(?:^|\.)nasa\.gov(?:[/:]|$)/i.test(asset.source || '')) ? 'NASA does not endorse LeafByte. ' : '';
  const attribution = Array.isArray(settings.sampleAttribution) && settings.sampleAttribution.length
    ? `\nSample image credits\n\n${settings.sampleAttribution.map(asset => `${asset.name}: ${asset.credit}\nSource: ${asset.source}\nPreparation: ${asset.preparation}\nUsage: ${asset.licenseUrl}`).join('\n\n')}\n\n${nasaNotice}Preserve these credits when using the sample images. Full attribution metadata is also in manifest.json settings.sampleAttribution.\n`
    : '';
  const readme = `LeafByte image bundle\n\n1. Review each image at its intended display size, including text, colors and transparency.\n2. Copy images/ into your website and replace the old image references. The manifest alone does not change a website.\n3. Use index-snippets.html as a starting point. Add appropriate alternative text and responsive styles. Responsive exports include srcset and sizes; adapt sizes to your actual layout. Single-file or retained-original outputs have no srcset variants.\n4. Check the published page on your target devices. Keep your originals outside this bundle as a backup.\n\nmanifest.json contains exact input/output bytes and SHA-256 hashes. Saved bytes compare primary outputs only. Additional responsive files increase storage: summary.additionalVariantBytes and summary.allImageBytes disclose their exact cost. ZIP container and generated documentation are excluded from image totals. A similarity score is a sampled proxy, not a promise of perceptual equivalence.\n\nFolder-relative source paths are recorded in manifest.json. Output names are flattened and deduplicated; use that mapping when replacing nested assets.\n\nA responsive browser normally chooses one suitable srcset image, rather than transferring every variant. Actual browser selections and traffic are not measured.\n\nThis export measures file reduction. It does not measure electricity, water or greenhouse-gas emissions, and does not prove deployment, adoption or environmental savings. Browser encoding also consumes resources.\n\nImage metadata may be removed or changed during encoding. Originals kept unchanged retain their existing metadata. Review files before publishing them.\n\nThe ZIP uses the standard store method because image formats are already compressed. Extract it with a normal ZIP utility. No runtime or account is required to use the exported images.\n\nMethod sources:\nhttps://www.w3.org/TR/web-sustainability-guidelines/\nhttps://web.dev/learn/performance/image-performance\n${attribution}`;
  files.push({ name: 'manifest.json', data: encoder.encode(`${JSON.stringify(manifest, null, 2)}\n`) });
  files.push({ name: 'index-snippets.html', data: encoder.encode(html) });
  files.push({ name: 'README.txt', data: encoder.encode(readme) });
  return new Blob([createZip(files)], { type: 'application/zip' });
}
