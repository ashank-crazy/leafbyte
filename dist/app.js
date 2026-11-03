import { optimizeImage, optimizeResponsiveImage, chooseBundle, formatBytes, sniffImage, LIMITS } from './engine.js';
import { buildExport, safeFilename } from './export.js';
import { estimateTransferImpact } from './carbon.js';

const $ = id => document.getElementById(id);
const state = { entries: [], active: null, busy: false, samples: [], nextId: 1, selected: [], appliedSettings: null, outputUrl: null, toastTimer: null, completedAt: null };
const controls = ['demo-button', 'stage-demo', 'file-input', 'folder-input', 'folder-button', 'responsive', 'clear-button', 'fidelity', 'max-width', 'output-format', 'budget', 'optimize-button'];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function settings() {
  return { maxWidth: Number($('max-width').value), similarityFloor: Number($('fidelity').value), format: $('output-format').value, responsive: $('responsive').checked };
}
function budgetBytes() {
  const raw = $('budget').value.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 100000) * 1000 : null;
}
function goodEntries() { return state.entries.filter(entry => entry.result); }
function chosen(entry) {
  const index = goodEntries().findIndex(item => item.id === entry.id);
  return entry.result?.candidates[state.selected[index] ?? 0];
}
function announce(message) { $('run-status').textContent = message; }
function showError(message) {
  $('error-message').textContent = message;
  $('error-message').hidden = !message;
}
function toast(message) {
  clearTimeout(state.toastTimer);
  $('toast').textContent = message; $('toast').hidden = false;
  state.toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
}
function setBusy(value) {
  state.busy = value;
  for (const id of controls) $(id).disabled = value;
  $('clear-button').disabled = value || !state.entries.length;
  $('optimize-button').disabled = value || !state.entries.length;
  $('export-button').disabled = value || !goodEntries().length;
  $('progress-track').hidden = !value;
  if (!value) $('progress-fill').style.width = '0%';
}
function revokeResult(entry) {
  if (entry.result?.originalUrl) URL.revokeObjectURL(entry.result.originalUrl);
  entry.result = null; entry.error = null;
}
function clearAll() {
  if (state.busy) return;
  for (const entry of state.entries) { URL.revokeObjectURL(entry.previewUrl); revokeResult(entry); }
  state.entries = []; state.active = null; state.selected = []; state.appliedSettings = null; state.completedAt = null;
  $('file-input').value = ''; showError(''); announce('Add images to get started.'); render(); setBusy(false);
}
async function addFiles(files, sampleInfo = []) {
  if (state.busy) return;
  setBusy(true);
  const errors = [];
  try {
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (state.entries.length >= 200) { errors.push('A bundle can contain up to 200 images.'); break; }
    if (!file.size || file.size > LIMITS.maxBytes) { errors.push(`${file.name}: choose a non-empty image up to 20 MiB.`); continue; }
    if (state.entries.reduce((sum, item) => sum + item.file.size, 0) + file.size > 200 * 1024 * 1024) { errors.push('Keep the whole input bundle under 200 MiB.'); break; }
    try {
      const info = sniffImage(new Uint8Array(await file.arrayBuffer()));
      if (!info.supported) { errors.push(`${file.name}: ${info.reason}`); continue; }
      if (info.width * info.height > LIMITS.maxPixels) { errors.push(`${file.name}: images must be 40 megapixels or smaller.`); continue; }
      const entry = { id: state.nextId++, file, previewUrl: URL.createObjectURL(file), result: null, info, error: null, sample: sampleInfo[index] || null };
      state.entries.push(entry); state.active ??= entry.id;
    } catch { errors.push(`${file.name}: this image could not be read.`); }
  }
  state.selected = [];
  showError(errors.join('\n'));
  allocate(); render();
  announce(state.entries.length ? `${state.entries.length} image${state.entries.length === 1 ? '' : 's'} ready. Find your fit, then lighten the bundle.` : 'Add a supported still image to get started.');
  } finally { setBusy(false); render(); }
}
async function loadDemo() {
  if (state.busy) return;
  clearAll(); setBusy(true); announce('Bringing in four credited NASA images…');
  showError('');
  try {
    if (!state.samples.length) state.samples = await fetch('assets/samples.json').then(response => { if (!response.ok) throw new Error('The sample list could not be loaded.'); return response.json(); });
    const files = await Promise.all(state.samples.map(async item => {
      const response = await fetch(item.path);
      if (!response.ok) throw new Error('A sample image could not be loaded. Try adding your own images.');
      const blob = await response.blob();
      return new File([blob], item.path.split('/').pop(), { type: blob.type || 'image/jpeg' });
    }));
    setBusy(false); await addFiles(files, state.samples);
    $('library-label').textContent = 'NASA SAMPLE PACK · REAL ENCODING RESULTS';
    await runOptimization();
    $('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { setBusy(false); showError(error.message); announce('Could not load the sample pack.'); }
}
function allocate() {
  const results = goodEntries().map(entry => entry.result);
  state.selected = results.length ? chooseBundle(results, budgetBytes()).selections : [];
}
async function runOptimization() {
  if (state.busy || !state.entries.length) return;
  const selectedSettings = settings();
  setBusy(true); showError('');
  state.appliedSettings = selectedSettings; state.completedAt = null; state.selected = [];
  const errors = [];
  try {
    for (let index = 0; index < state.entries.length; index++) {
      const entry = state.entries[index]; revokeResult(entry); state.active = entry.id;
      announce(`Encoding ${index + 1} of ${state.entries.length}: ${entry.file.name}`);
      render();
      try {
        entry.result = await (selectedSettings.responsive ? optimizeResponsiveImage : optimizeImage)(entry.file, { ...selectedSettings, onProgress(progress) {
          $('progress-fill').style.width = `${100 * (index + progress.completed / progress.total) / state.entries.length}%`;
          announce(`${index + 1}/${state.entries.length} · ${entry.file.name} · comparing option ${progress.completed}/${progress.total}`);
        } });
      } catch (error) { entry.error = error.message; errors.push(`${entry.file.name}: ${error.message}`); }
      allocate(); render();
    }
    state.active = goodEntries()[0]?.id ?? state.entries[0]?.id ?? null;
    state.completedAt = new Date().toISOString();
    const count = goodEntries().length;
    announce(count ? `${count} image${count === 1 ? '' : 's'} processed. Review the output and export your bundle.` : 'No images could be processed. Review the messages below.');
    showError(errors.length ? `${errors.join('\n')}\nThese images are excluded from the export.` : '');
  } finally { setBusy(false); render(); }
}
function renderLibrary() {
  $('file-count').textContent = state.entries.length;
  $('clear-button').disabled = state.busy || !state.entries.length;
  $('optimize-button').disabled = state.busy || !state.entries.length;
  const list = $('file-list');
  if (!state.entries.length) {
    list.replaceChildren();
    const box = element('div', 'empty-library'); box.append(element('span', '', '↳'), element('p', '', 'A product page. A portfolio.\nA photo story.\nEvery byte has a place to start.')); list.append(box);
    $('library-label').textContent = 'YOUR NEXT LIGHTER PAGE STARTS HERE'; return;
  }
  if (!state.entries.every(entry => entry.sample)) $('library-label').textContent = 'YOUR IMAGE BUNDLE · LOCAL FILES';
  list.replaceChildren();
  for (const entry of state.entries) {
    const selection = chosen(entry);
    const row = element('button', `file-row${entry.id === state.active ? ' selected' : ''}`);
    row.type = 'button'; row.setAttribute('aria-pressed', String(entry.id === state.active)); row.setAttribute('aria-label', `Inspect ${entry.file.name}`);
    const img = element('img', 'file-thumb'); img.src = entry.previewUrl; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    const details = element('span', 'file-details');
    details.append(element('span', 'file-name', entry.sample?.name || entry.file.name), element('span', 'file-sizes', `${formatBytes(entry.file.size)}${selection ? ` → ${formatBytes(selection.bytes)}` : ''}`));
    const saving = selection ? selection.keptOriginal ? 'Kept' : `−${((1 - selection.bytes / entry.file.size) * 100).toFixed(0)}%` : entry.error ? 'Error' : 'Ready';
    row.append(img, details, element('span', `file-saving${selection ? '' : ' pending'}`, saving));
    row.addEventListener('click', () => { state.active = entry.id; renderLibrary(); renderInspector(); }); list.append(row);
  }
}
function renderInspector() {
  if (state.outputUrl) { URL.revokeObjectURL(state.outputUrl); state.outputUrl = null; }
  const entry = state.entries.find(item => item.id === state.active);
  $('stage-empty').hidden = Boolean(entry); $('comparison').hidden = !entry; $('candidate-row').hidden = !entry?.result;
  if (!entry) {
    $('inspector-name').textContent = 'The view stays beautiful.'; $('image-dimensions').textContent = 'Make room for less.';
    for (const id of ['stat-original', 'stat-output', 'stat-reduction', 'stat-similarity']) $(id).textContent = '—';
    $('comparison-hint').textContent = 'A real before-and-after, down to the byte.'; return;
  }
  const candidate = chosen(entry);
  $('original-image').src = entry.previewUrl;
  if (candidate) { state.outputUrl = URL.createObjectURL(candidate.blob); $('optimized-image').src = state.outputUrl; }
  else $('optimized-image').src = entry.previewUrl;
  $('inspector-name').textContent = entry.sample?.name || entry.file.name;
  const width = candidate?.width || entry.info.width, height = candidate?.height || entry.info.height;
  $('image-dimensions').textContent = width && height ? `${width} × ${height} px` : 'Local image';
  $('stat-original').textContent = formatBytes(entry.file.size);
  $('stat-output').textContent = candidate ? formatBytes(candidate.bytes) : '—';
  $('stat-reduction').textContent = candidate ? `${((1 - candidate.bytes / entry.file.size) * 100).toFixed(1)}%` : '—';
  $('stat-similarity').textContent = candidate ? candidate.similarity.toFixed(3) : '—';
  $('comparison-hint').textContent = entry.error ? entry.error : !candidate ? 'Original preview · ready to optimize.' : candidate.keptOriginal ? 'Original retained · byte-for-byte unchanged.' : `${candidate.mime.split('/')[1].toUpperCase()} · encoding quality ${Math.round(candidate.quality * 100)}`;
  $('inspection-note').textContent = candidate?.keptOriginal ? 'This original is unchanged. Choose a smaller accepted encoding below, if one is available.' : 'Compare fine details and colors. Sampled SSIM assesses compression at the output size; it does not assess detail lost through resizing.';
  $('candidate-buttons').replaceChildren();
  if (entry.result) {
    const good = goodEntries(), resultIndex = good.findIndex(item => item.id === entry.id);
    entry.result.candidates.forEach((option, index) => {
      const button = element('button', `candidate-button${state.selected[resultIndex] === index ? ' active' : ''}`, option.keptOriginal ? 'Original' : `Q${Math.round(option.quality * 100)}`);
      button.title = `${formatBytes(option.bytes)} · SSIM ${option.similarity.toFixed(4)}`; button.disabled = state.busy;
      button.setAttribute('aria-label', `${option.keptOriginal ? 'Keep original' : `Choose quality ${Math.round(option.quality * 100)}`} for ${entry.file.name}`);
      button.setAttribute('aria-pressed', String(state.selected[resultIndex] === index));
      button.addEventListener('click', () => { state.selected[resultIndex] = index; render(); }); $('candidate-buttons').append(button);
    });
  }
  $('single-download').disabled = state.busy;
}
function renderSummary() {
  const good = goodEntries();
  const original = state.entries.reduce((sum, entry) => sum + entry.file.size, 0);
  const processedOriginal = good.reduce((sum, entry) => sum + entry.file.size, 0);
  const output = good.reduce((sum, entry) => sum + chosen(entry).bytes, 0);
  const percent = processedOriginal ? 100 * (1 - output / processedOriginal) : 0;
  $('bundle-original').textContent = good.length ? formatBytes(processedOriginal) : original ? formatBytes(original) : '—';
  $('bundle-output').textContent = good.length ? formatBytes(output) : '—';
  $('bundle-headline').textContent = good.length ? `${percent.toFixed(1)}% lighter. ${formatBytes(processedOriginal - output)} less.` : original ? 'Ready for a little less.' : 'A lighter bundle starts here.';
  $('export-button').disabled = state.busy || !good.length;
  const budget = budgetBytes();
  $('budget-status').classList.toggle('warning', Boolean(budget && output > budget));
  let text = '';
  if (good.length && budget !== null) {
    const minimum = chooseBundle(good.map(entry => entry.result), budget).minimumBytes;
    text = output <= budget ? `Within your ${formatBytes(budget)} budget. You can inspect or change individual encodings.` : minimum > budget ? `The smallest accepted bundle is ${formatBytes(minimum)}—above your ${formatBytes(budget)} budget. Try a smaller width or a lower similarity floor.` : `Your manual selections exceed the ${formatBytes(budget)} budget. Change the budget to rebalance.`;
  } else if (good.length) text = 'Selected encodings shown. Add a byte budget to balance bundle size and sampled similarity.';
  if (good.length && good.length !== state.entries.length) text += ` ${state.entries.length - good.length} image(s) are pending or excluded; export totals include processed images only.`;
  const variants = good.flatMap(entry => chosen(entry)?.keptOriginal ? [] : entry.result.variants || []);
  if (variants.length) text += ` Responsive export: ${variants.length} additional files (${formatBytes(variants.reduce((sum, image) => sum + image.bytes, 0))} of extra storage).`;
  $('budget-status').textContent = text;
  const count = Math.min(1e6, Math.max(0, Math.floor(Number($('transfer-count').value) || 0)));
  const saved = Math.max(0, processedOriginal - output);
  $('transfer-savings').textContent = good.length ? formatBytes(saved * count) : '—';
  $('scenario-original').textContent = good.length ? formatBytes(processedOriginal * count) : '—';
  $('scenario-output').textContent = good.length ? formatBytes(output * count) : '—';
  $('original-bar').style.width = good.length ? '100%' : '0%';
  $('output-bar').style.width = good.length ? `${100 * output / processedOriginal}%` : '0%';
  if (good.length) {
    const impact = estimateTransferImpact({ bytesSaved: saved, transfers: count, returnVisitPercentage: Number($('return-rate').value), greenHosting: $('green-hosting').checked });
    const unit = impact.highGrams >= 1000 ? 'kg' : 'g';
    const divisor = unit === 'kg' ? 1000 : 1;
    $('carbon-savings').textContent = `${(impact.lowGrams / divisor).toFixed(2)}–${(impact.highGrams / divisor).toFixed(2)} ${unit} CO₂e`;
    $('carbon-scenarios').textContent = `${Number($('return-rate').value) * 100}% returning visitors ↔ fully uncached reference · SWD v4`;
  } else $('carbon-savings').textContent = '—';
}
function render() { renderLibrary(); renderInspector(); renderSummary(); }
function download(blob, name) {
  const url = URL.createObjectURL(blob), link = element('a'); link.href = url; link.download = safeFilename(name); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function exportBundle() {
  if (state.busy || !goodEntries().length) return;
  const good = goodEntries();
  const selectedSnapshot = state.selected.slice();
  const appliedSnapshot = { ...state.appliedSettings };
  setBusy(true); render();
  $('export-button').textContent = 'Preparing evidence…';
  announce('Packaging images and checking their SHA-256 hashes…');
  try {
    const blob = await buildExport(good.map(entry => entry.result), selectedSnapshot, { ...appliedSnapshot, budgetBytes: budgetBytes(), optimizationCompletedAt: state.completedAt, modelledImpact: estimateTransferImpact({bytesSaved: good.reduce((sum, entry, i) => sum + entry.file.size - entry.result.candidates[selectedSnapshot[i]].bytes, 0), transfers: Math.min(1e6, Math.max(0, Math.floor(Number($('transfer-count').value) || 0))), returnVisitPercentage: Number($('return-rate').value), greenHosting: $('green-hosting').checked}), metric: 'mean local 8×8 luminance SSIM on nine full-resolution patches, each up to 128×128, on a 3×3 grid at output resolution', browser: navigator.userAgent, sampleAttribution: good.filter(entry => entry.sample).map(entry => entry.sample), excludedImages: state.entries.filter(entry => !entry.result).map(entry => ({ name: entry.file.name, reason: entry.error || 'Not processed' })) });
    download(blob, 'leafbyte-bundle.zip'); toast('Your images and evidence report are ready.');
    announce('Bundle exported. Extract it and use the images on your site.');
  } catch (error) { showError(error.message); }
  finally { $('export-button').textContent = 'Export bundle ↓'; setBusy(false); render(); }
}
function invalidate() {
  if (state.busy) return;
  for (const entry of state.entries) revokeResult(entry);
  state.selected = []; state.completedAt = null; render();
  announce(state.entries.length ? 'Settings changed. Lighten the bundle again to compare new outputs.' : 'Add images to get started.');
}
function openMethod() { if (!$('method-dialog').open) $('method-dialog').showModal(); }
$('demo-button').addEventListener('click', loadDemo); $('stage-demo').addEventListener('click', loadDemo);
$('clear-button').addEventListener('click', clearAll);
$('optimize-button').addEventListener('click', runOptimization);
$('export-button').addEventListener('click', exportBundle);
$('file-input').addEventListener('change', async event => { await addFiles(Array.from(event.target.files)); event.target.value = ''; });
for (const id of ['fidelity', 'max-width', 'output-format', 'responsive']) $(id).addEventListener('change', invalidate);
$('budget').addEventListener('input', () => { if (!state.busy) { allocate(); render(); } });
$('transfer-count').addEventListener('input', renderSummary);
$('return-rate').addEventListener('change', renderSummary);
$('green-hosting').addEventListener('change', renderSummary);
$('carbon-method').addEventListener('click', openMethod);
$('folder-button').addEventListener('click', () => $('folder-input').click());
$('folder-input').addEventListener('change', async event => { await addFiles(Array.from(event.target.files).filter(file => /\.(jpe?g|png|webp)$/i.test(file.name))); event.target.value = ''; });
$('wipe-slider').addEventListener('input', event => { $('original-layer').style.clipPath = `inset(0 ${100 - Number(event.target.value)}% 0 0)`; $('wipe-line').style.left = `${event.target.value}%`; });
$('single-download').addEventListener('click', () => {
  const entry = state.entries.find(item => item.id === state.active); const candidate = entry && chosen(entry);
  if (!candidate) return;
  const ext = candidate.mime === 'image/webp' ? 'webp' : candidate.mime === 'image/png' ? 'png' : 'jpg';
  download(candidate.blob, `${entry.file.name.replace(/\.[^.]+$/, '')}-${candidate.keptOriginal ? 'original' : 'leafbyte'}.${ext}`);
});
for (const id of ['method-nav', 'method-footer', 'ssim-info']) $(id).addEventListener('click', openMethod);
$('close-method').addEventListener('click', () => $('method-dialog').close());
$('method-dialog').addEventListener('click', event => { if (event.target === $('method-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
for (const event of ['dragenter', 'dragover']) $('dropzone').addEventListener(event, event => { event.preventDefault(); if (!state.busy) $('dropzone').classList.add('dragging'); });
for (const event of ['dragleave', 'drop']) $('dropzone').addEventListener(event, event => { event.preventDefault(); $('dropzone').classList.remove('dragging'); });
$('dropzone').addEventListener('drop', event => { if (!state.busy) addFiles(Array.from(event.dataTransfer.files)); });
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());
fetch('assets/samples.json').then(response => response.ok ? response.json() : []).then(samples => {
  state.samples = samples;
  const cover = samples.find(item => item.path.includes('amazon')) || samples[0];
  if (cover) $('hero-photo').style.backgroundImage = "url('assets/hero.webp')";
  const credits = $('sample-credits');
  for (const sample of samples) { const line = element('span'); const link = element('a', '', sample.name); link.href = sample.source; link.target = '_blank'; link.rel = 'noopener'; line.append(document.createElement('br'), link, document.createTextNode(` — ${sample.credit}. ${sample.preparation}`)); credits.append(line); }
}).catch(() => {});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
render();
