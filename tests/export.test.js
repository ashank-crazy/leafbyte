import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { crc32, createZip, safeFilename, buildExport } from '../dist/export.js';

if (!globalThis.crypto?.subtle) globalThis.crypto = webcrypto;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function entries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = new Map();
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const expectedCrc = view.getUint32(offset + 14, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extraLength;
    const data = bytes.subarray(start, start + size);
    assert.equal(flags, 0x0800);
    assert.equal(method, 0);
    assert.equal(crc32(data), expectedCrc);
    result.set(name, data);
    offset = start + size;
  }
  const centralStart = offset;
  for (const [name, data] of result) {
    assert.equal(view.getUint32(offset, true), 0x02014b50);
    const nameLength = view.getUint16(offset + 28, true);
    assert.equal(decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength)), name);
    assert.equal(view.getUint32(offset + 16, true), crc32(data));
    assert.equal(view.getUint32(offset + 24, true), data.length);
    assert.equal(view.getUint32(view.getUint32(offset + 42, true), true), 0x04034b50);
    offset += 46 + nameLength;
  }
  assert.equal(view.getUint32(offset, true), 0x06054b50);
  assert.equal(view.getUint16(offset + 10, true), result.size);
  assert.equal(view.getUint32(offset + 12, true), offset - centralStart);
  assert.equal(view.getUint32(offset + 16, true), centralStart);
  assert.equal(offset + 22, bytes.length);
  return result;
}

test('CRC32 matches the published standard check vector', () => {
  assert.equal(crc32(encoder.encode('123456789')), 0xcbf43926);
  assert.equal(crc32(new Uint8Array()), 0);
});

test('ZIP local headers, central directory, CRC and UTF-8 names round-trip', () => {
  const files = [{ name: 'images/café.webp', data: new Uint8Array([0, 255, 128, 2]) }, { name: 'manifest.json', data: encoder.encode('{"ok":true}') }];
  const unpacked = entries(createZip(files));
  for (const file of files) assert.deepEqual(unpacked.get(file.name), file.data);
  assert.deepEqual(createZip(files), createZip(files));
});

test('ZIP rejects traversal, duplicate entries and invalid bytes', () => {
  for (const name of ['../escape', '/absolute', 'C:/escape', 'images/../escape', 'images\\escape', 'x//y', 'bad\u0000name', 'images/file:stream', 'images/NUL.png', 'images/name.', 'images/name ']) {
    assert.throws(() => createZip([{ name, data: new Uint8Array() }]), /unsafe/);
  }
  assert.throws(() => createZip([{ name: 'a', data: new Uint8Array() }, { name: 'a', data: new Uint8Array() }]), /unique/);
  assert.throws(() => createZip([{ name: 'images/Photo.jpg', data: new Uint8Array() }, { name: 'IMAGES/photo.jpg', data: new Uint8Array() }]), /unique/);
  assert.throws(() => createZip([{ name: 'a', data: 'text' }]), /Uint8Array/);
});

test('safeFilename removes paths, control characters and reserved Windows names', () => {
  assert.equal(safeFilename('../../photo.jpg'), 'photo.jpg');
  assert.equal(safeFilename('C:\\folder\\photo.jpg'), 'photo.jpg');
  assert.equal(safeFilename('..'), 'image');
  assert.equal(safeFilename('CON.png'), 'image_CON.png');
  assert.equal(safeFilename('café<bad>.jpg'), 'café_bad_.jpg');
  assert.equal(safeFilename('bad\u0000name.jpg'), 'bad_name.jpg');
  assert.equal(safeFilename('bad\u202ename.jpg'), 'bad_name.jpg');
});

function result(name = 'Photo.jpg', original = 'original input bytes', output = 'small') {
  return {
    name, file: new Blob([original], { type: 'image/jpeg' }), originalBytes: 999,
    originalWidth: 1200, originalHeight: 800, width: 600, height: 400,
    candidates: [{ blob: new Blob([output], { type: 'image/webp' }), bytes: 999, mime: 'image/webp', width: 600, height: 400, quality: 0.8, similarity: 0.97, keptOriginal: false }],
    warnings: [], durationMs: 12,
  };
}

test('export manifest hashes and counts exact files rather than trusting stale metadata', async () => {
  const zip = await buildExport([result()], [0], { budgetBytes: 1000 });
  assert.equal(zip.type, 'application/zip');
  const unpacked = entries(new Uint8Array(await zip.arrayBuffer()));
  const manifest = JSON.parse(decoder.decode(unpacked.get('manifest.json')));
  assert.equal(manifest.summary.inputBytes, encoder.encode('original input bytes').length);
  assert.equal(manifest.summary.outputBytes, 5);
  assert.equal(manifest.summary.savedBytes, 15);
  const expectedHash = Buffer.from(await webcrypto.subtle.digest('SHA-256', encoder.encode('small'))).toString('hex');
  assert.equal(manifest.images[0].output.sha256, expectedHash);
  assert.equal(manifest.images[0].output.bytes, unpacked.get(manifest.images[0].output.path).length);
  assert.match(manifest.measurement.environment, /have not been measured/);
  assert.match(decoder.decode(unpacked.get('index-snippets.html')), /width="600" height="400" alt=""/);
  assert.ok(unpacked.has('README.txt'));
});

test('export filenames are deduplicated safely and original-retained bytes stay identical', async () => {
  const first = result('../../Photo.jpg');
  const second = result('photo.jpg');
  const third = result('keep.png');
  third.candidates[0] = { blob: third.file, keptOriginal: true, mime: 'image/jpeg', width: 1200, height: 800, similarity: 1, quality: null };
  const unpacked = entries(new Uint8Array(await (await buildExport([first, second, third], [0, 0, 0])).arrayBuffer()));
  const manifest = JSON.parse(decoder.decode(unpacked.get('manifest.json')));
  assert.deepEqual(manifest.images.map(image => image.output.path), ['images/Photo-leafbyte.webp', 'images/photo-leafbyte-2.webp', 'images/keep-original.jpg']);
  assert.equal(manifest.images[2].input.sha256, manifest.images[2].output.sha256);
  assert.equal(manifest.images[2].savedBytes, 0);
});

test('export refuses missing or invalid image selections', async () => {
  await assert.rejects(buildExport([], []), /Add and optimize/);
  await assert.rejects(buildExport([result()], [9]), /invalid/);
  await assert.rejects(buildExport([result()], [-1]), /invalid/);
  await assert.rejects(buildExport([result()], [0.5]), /invalid/);
  const invalid = result();
  invalid.candidates[0].mime = 'text/html';
  await assert.rejects(buildExport([invalid], [0]), /supported image format/);
});

test('sample credits survive in readable export instructions and the manifest', async () => {
  const sampleAttribution = [{ name: 'Earth', credit: 'NASA', source: 'https://science.nasa.gov/', preparation: 'Demonstration input.', licenseUrl: 'https://www.nasa.gov/nasa-brand-center/images-and-media/' }];
  const unpacked = entries(new Uint8Array(await (await buildExport([result()], [0], { sampleAttribution })).arrayBuffer()));
  assert.match(decoder.decode(unpacked.get('README.txt')), /Earth: NASA/);
  assert.match(decoder.decode(unpacked.get('README.txt')), /NASA does not endorse/);
  assert.deepEqual(JSON.parse(decoder.decode(unpacked.get('manifest.json'))).settings.sampleAttribution, sampleAttribution);
});
