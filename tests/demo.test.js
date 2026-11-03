import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { DEMO_PACKS } from '../dist/demo-packs.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root));
const json = async path => JSON.parse(await read(path));

test('primary demo uses exactly the controlled page originals, with matching credits and hashes', async () => {
  const samples = await json(`dist/${DEMO_PACKS.objects.manifest}`);
  const page = (await json('dist/evidence/case-manifest.json')).find(page => page.slug === 'objects');
  const corpus = await json('benchmark-assets/manifest.json');
  assert.equal(samples.length, 6);
  assert.deepEqual(samples.map(sample => sample.path.split('/').at(-1)), page.images);
  let bytes = 0;
  for (const sample of samples) {
    const name = sample.path.split('/').at(-1);
    const source = corpus.find(item => item.path.split('/').at(-1) === name);
    const data = await read(`dist/${sample.path}`);
    assert.equal(data.length, sample.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'), sample.sha256);
    for (const field of ['credit', 'source', 'license', 'licenseUrl', 'preparation', 'sha256']) assert.equal(sample[field], source[field]);
    bytes += data.length;
  }
  assert.equal(bytes, page.beforeImageBytes);
  assert.equal(bytes, 7_086_897);
});

test('primary settings match the measured 800px run while NASA keeps its regression settings', async () => {
  const benchmark = await json('artifacts/corpus-benchmark.json');
  for (const field of ['maxWidth', 'similarityFloor', 'format']) assert.equal(DEMO_PACKS.objects.settings[field], benchmark.settings[field]);
  assert.equal(DEMO_PACKS.objects.settings.responsive, false);
  assert.equal(DEMO_PACKS.nasa.settings.maxWidth, 1920);
  const nasa = await json(`dist/${DEMO_PACKS.nasa.manifest}`);
  assert.equal(nasa.length, 4);
  let total = 0;
  for (const sample of nasa) {
    const data = await read(`dist/${sample.path}`);
    assert.equal(data.length, sample.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'), sample.sha256);
    total += data.length;
  }
  assert.equal(total, 3_633_061);
});

test('worker caches manifests and shell up front, then caches photos on demand', async () => {
  const handlers = new Map(), stored = new Map();
  let installed = [], fetches = 0;
  const cache = {
    addAll: async paths => { installed = Array.from(paths); },
    match: async request => stored.get(request.url),
    put: async (request, response) => stored.set(request.url, response),
  };
  const context = {
    URL, Response,
    self: {
      location: { origin: 'https://leafbyte.example', href: 'https://leafbyte.example/sw.js' },
      addEventListener: (name, handler) => handlers.set(name, handler),
      skipWaiting() {}, clients: { claim() {} },
    },
    caches: { open: async () => cache },
    fetch: async () => { fetches++; return new Response('image bytes'); },
  };
  vm.runInNewContext(await read('dist/sw.js').then(value => value.toString()), context);
  let pending;
  handlers.get('install')({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.ok(installed.includes('./demo-packs.js'));
  for (const pack of Object.values(DEMO_PACKS)) assert.ok(installed.includes(`./${pack.manifest}`));
  assert.ok(!installed.some(path => /\.jpg$/.test(path)), 'Opening the app must not preload the large demo originals.');
  for (const pack of Object.values(DEMO_PACKS)) {
    for (const sample of await json(`dist/${pack.manifest}`)) {
      const request = { method: 'GET', url: `https://leafbyte.example/${sample.path}` };
      const first = fetches;
      handlers.get('fetch')({ request, respondWith(promise) { pending = promise; } });
      await pending;
      handlers.get('fetch')({ request, respondWith(promise) { pending = promise; } });
      await pending;
      assert.equal(fetches, first + 1, `${sample.path} should be fetched once and then served from cache.`);
    }
  }
});
