import test from 'node:test';
import assert from 'node:assert/strict';
import CO2 from '../dist/vendor/co2js-0.19.0.js';
import { estimateTransferImpact, CARBON_MODEL } from '../dist/carbon.js';

function close(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should equal ${expected}`);
}

test('pinned official SWD v4 matches its documented segment constants for 1 GB', () => {
  const upstream = new CO2({ model: 'swd', version: 4 });
  // Operational .055+.059+.080; embodied .012+.013+.081 kWh/GB, all 494g/kWh.
  close(upstream.perByte(1_000_000_000, false), 148.2);
  // Green hosting removes only .055*494 of the operational data-center share.
  close(upstream.perByte(1_000_000_000, true), 121.03);
  assert.equal(CARBON_MODEL.version, '0.19.0');
  assert.equal(CARBON_MODEL.modelVersion, 4);
});

test('scenario endpoints are actual upstream outputs for two named configurations', () => {
  const result = estimateTransferImpact({ bytesSaved: 1_000_000_000, transfers: 1 });
  close(result.lowGrams, 111.891);
  close(result.highGrams, 148.2);
  assert.equal(result.scenarios.length, 2);
  assert.equal(result.scenarios[0].id, 'configured-visits');
  assert.equal(result.scenarios[1].id, 'uncached-reference');
  close(result.scenarios[0].assumedTransferredBytesAvoided, 755_000_000);
  assert.match(result.assumptions.rangeMeaning, /not a confidence interval/);
});

test('configured estimate agrees with public perVisitTrace at arbitrary valid settings', () => {
  const inputs = { bytesSaved: 1_726_729, transfers: 10000, returnVisitPercentage: 0.6, dataReloadRatio: 0.3, greenHosting: true };
  const result = estimateTransferImpact(inputs);
  const upstream = new CO2({ model: 'swd', version: 4 });
  const trace = upstream.perVisitTrace(inputs.bytesSaved, true, { firstVisitPercentage: 0.4, returnVisitPercentage: 0.6, dataReloadRatio: 0.3 });
  close(result.scenarios[0].grams, trace.co2 * inputs.transfers);
  assert.deepEqual(result.scenarios[0].upstreamTrace, trace);
  assert.equal(result.scenarios[0].greenHostingFactor, 1);
  assert.equal(result.assumptions.gigabyteBytes, 1_000_000_000);
});

test('green-hosting scenario preserves network, device and embodied emissions', () => {
  const result = estimateTransferImpact({ bytesSaved: 1_000_000_000, transfers: 1, greenHosting: true });
  close(result.lowGrams, 91.37765);
  close(result.highGrams, 148.2);
  assert.ok(result.lowGrams > 0);
});

test('zero saved bytes and zero hypothetical visits produce zero model differences', () => {
  for (const args of [{ bytesSaved: 0 }, { bytesSaved: 12345, transfers: 0 }]) {
    const result = estimateTransferImpact(args);
    assert.equal(result.lowGrams, 0);
    assert.equal(result.highGrams, 0);
    assert.ok(result.scenarios.every(item => item.grams === 0));
  }
});

test('scenarios scale linearly with actual bytes and hypothetical visits', () => {
  const base = estimateTransferImpact({ bytesSaved: 10000, transfers: 10 });
  const bytes = estimateTransferImpact({ bytesSaved: 20000, transfers: 10 });
  const visits = estimateTransferImpact({ bytesSaved: 10000, transfers: 20 });
  close(bytes.lowGrams, base.lowGrams * 2);
  close(bytes.highGrams, base.highGrams * 2);
  close(visits.lowGrams, base.lowGrams * 2);
  close(visits.highGrams, base.highGrams * 2);
});

test('all-new visits agree with the uncached reference and fully cached returns can be zero', () => {
  const allNew = estimateTransferImpact({ bytesSaved: 1_000_000, returnVisitPercentage: 0 });
  close(allNew.lowGrams, allNew.highGrams);
  const allCached = estimateTransferImpact({ bytesSaved: 1_000_000, returnVisitPercentage: 1, dataReloadRatio: 0 });
  assert.equal(allCached.lowGrams, 0);
  assert.ok(allCached.highGrams > 0);
});

test('invalid values and unsafe aggregate bytes fail explicitly', () => {
  for (const bytesSaved of [-1, 1.5, NaN, Infinity, '100', undefined]) assert.throws(() => estimateTransferImpact({ bytesSaved }), /bytesSaved/);
  for (const transfers of [-1, 0.5, NaN, Infinity, '100']) assert.throws(() => estimateTransferImpact({ bytesSaved: 1, transfers }), /transfers/);
  for (const key of ['returnVisitPercentage', 'dataReloadRatio']) {
    for (const value of [-0.1, 1.1, NaN, Infinity, '0.5']) assert.throws(() => estimateTransferImpact({ bytesSaved: 1, [key]: value }), new RegExp(key));
  }
  assert.throws(() => estimateTransferImpact({ bytesSaved: 1, greenHosting: 'yes' }), /boolean/);
  assert.throws(() => estimateTransferImpact({ bytesSaved: Number.MAX_SAFE_INTEGER, transfers: 2 }), /safe integer precision/);
});

test('evidence is serializable and contains model boundary and source provenance', () => {
  const result = estimateTransferImpact({ bytesSaved: 10000 });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  assert.match(result.assumptions.interpretation, /not measured electricity/);
  assert.match(result.assumptions.exclusions, /optimization overhead/);
  assert.ok(result.sources.every(source => source.url.startsWith('https://')));
});
