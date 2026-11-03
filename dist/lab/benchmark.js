import { optimizeImage, optimizeResponsiveImage, chooseBundle, formatBytes } from '../engine.js';
import { buildExport } from '../export.js';
const $ = id => document.getElementById(id);
let results = [], corpus = [], selections = [], applied = {};
$('run').addEventListener('click', async () => {
  $('run').disabled = true; $('export').disabled = true; results = []; $('results').replaceChildren();
  applied = { maxWidth: Number($('width').value), similarityFloor: Number($('floor').value), format: 'image/webp', responsive: $('responsive').checked };
  const failures = [];
  try {
    const response = await fetch('../../benchmark-assets/manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Serve the repository root to access benchmark-assets/manifest.json.');
    const data = await response.json(); corpus = Array.isArray(data) ? data : data.images;
    for (let index = 0; index < corpus.length; index++) {
      const item = corpus[index], path = item.path.startsWith('benchmark-assets/') ? `../../${item.path}` : `../../benchmark-assets/${item.path}`;
      $('status').textContent = `${index + 1}/${corpus.length}: ${item.name}`;
      try {
        const response = await fetch(path, { cache: 'no-store' }); if (!response.ok) throw new Error(`Could not load ${path}`);
        const blob = await response.blob(); const file = new File([blob], item.path.split('/').pop(), { type: blob.type });
        const result = await (applied.responsive ? optimizeResponsiveImage : optimizeImage)(file, { ...applied, onProgress(progress) { $('status').textContent = `${index + 1}/${corpus.length}: ${item.name} · ${progress.completed}/${progress.total} encodings`; } });
        results.push(result); selections = chooseBundle(results).selections;
        const candidate = result.candidates[selections.at(-1)]; const row = document.createElement('tr');
        for (const value of [item.name, formatBytes(file.size), formatBytes(candidate.bytes), `${((1 - candidate.bytes / file.size) * 100).toFixed(1)}%`, candidate.similarity.toFixed(4)]) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); } $('results').append(row);
      } catch (error) { failures.push({ name: item.name, reason: error.message }); }
    }
    const before = results.reduce((sum, result) => sum + result.originalBytes, 0), after = results.reduce((sum, result, index) => sum + result.candidates[selections[index]].bytes, 0);
    $('status').textContent = `Complete: ${results.length}/${corpus.length} images · ${formatBytes(before)} → ${formatBytes(after)} · ${((1 - after / before) * 100).toFixed(1)}% lighter.${failures.length ? ` Failures: ${JSON.stringify(failures)}` : ''}`;
    applied.failures = failures; $('export').disabled = !results.length;
  } catch (error) { $('status').textContent = error.message; }
  finally { $('run').disabled = false; }
});
$('export').addEventListener('click', async () => {
  $('export').disabled = true;
  try {
    const blob = await buildExport(results, selections, { ...applied, browser: navigator.userAgent, corpus, corpusNote: 'Licensed web-image demonstration corpus; not a representative sample of the whole web.' });
    const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.href = url; link.download = `leafbyte-corpus-${applied.maxWidth}.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  } finally { $('export').disabled = false; }
});
