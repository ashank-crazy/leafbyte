// Scenario estimates only: no electricity meter, traffic measurement or hosting check.
import CO2 from './vendor/co2js-0.19.0.js';

export const CARBON_MODEL = Object.freeze({
  library: '@tgwf/co2',
  version: '0.19.0',
  model: 'Sustainable Web Design Model v4',
  modelVersion: 4,
  gridIntensityGramsPerKwh: 494,
  gramsPerUncachedGigabyte: 148.2,
});

export const CARBON_SOURCES = Object.freeze([
  Object.freeze({ title: 'Green Web Foundation: CO2.js models', url: 'https://developers.thegreenwebfoundation.org/co2js/models/overview/' }),
  Object.freeze({ title: 'Green Web Foundation: perVisitTrace options', url: 'https://developers.thegreenwebfoundation.org/co2js/functions/pervisit-trace/' }),
  Object.freeze({ title: 'Sustainable Web Design v4 methodology', url: 'https://sustainablewebdesign.org/estimating-digital-emissions/' }),
  Object.freeze({ title: 'Pinned CO2.js 0.19.0 constants and legacy cache preset', url: 'https://github.com/thegreenwebfoundation/co2.js/blob/v0.19.0/src/constants/index.js' }),
  Object.freeze({ title: 'Official npm package 0.19.0', url: 'https://www.npmjs.com/package/@tgwf/co2/v/0.19.0' }),
]);

let calculator;

function integer(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative safe integer.`);
}

function fraction(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new RangeError(`${name} must be a number between 0 and 1.`);
}

/**
 * Apply the pinned upstream SWD v4 model to a hypothetical reduction per visit.
 * `transfers` is the number of hypothetical page/bundle visits BEFORE caching;
 * it is not a count of already-observed full network transfers. Every visit is
 * assumed to need this image bundle when not satisfied from the assumed cache.
 * The two scenario endpoints are not uncertainty or confidence bounds.
 */
export function estimateTransferImpact({
  bytesSaved,
  transfers = 10000,
  returnVisitPercentage = 0.25,
  dataReloadRatio = 0.02,
  greenHosting = false,
} = {}) {
  integer(bytesSaved, 'bytesSaved');
  integer(transfers, 'transfers');
  fraction(returnVisitPercentage, 'returnVisitPercentage');
  fraction(dataReloadRatio, 'dataReloadRatio');
  if (typeof greenHosting !== 'boolean') throw new TypeError('greenHosting must be a boolean assumption.');
  const uncachedBytes = bytesSaved * transfers;
  if (!Number.isSafeInteger(uncachedBytes)) throw new RangeError('The hypothetical total bytes exceed safe integer precision. Use fewer visits.');

  // Instantiated lazily, so loading the app does not run a model without results.
  calculator ??= new CO2({ model: 'swd', version: 4 });
  function scenario(id, name, green, firstVisit, returning, reload, basis) {
    const trace = calculator.perVisitTrace(bytesSaved, green, {
      firstVisitPercentage: firstVisit,
      returnVisitPercentage: returning,
      dataReloadRatio: reload,
    });
    return {
      id,
      name,
      grams: trace.co2 * transfers,
      gramsPerAssumedVisit: trace.co2,
      visits: transfers,
      bytesSavedPerUncachedVisit: bytesSaved,
      assumedTransferredBytesAvoided: uncachedBytes * (firstVisit + returning * reload),
      greenHosting: green,
      greenHostingFactor: green ? 1 : 0,
      firstVisitPercentage: firstVisit,
      returnVisitPercentage: returning,
      dataReloadRatio: reload,
      basis,
      upstreamTrace: trace,
    };
  }
  const configured = scenario(
    'configured-visits',
    'Configured visitor, cache and hosting assumptions',
    greenHosting,
    1 - returnVisitPercentage,
    returnVisitPercentage,
    dataReloadRatio,
    'Illustrative user-editable scenario. Initial 75% new / 25% returning visits and 2% data reload reuse the documented legacy CO2.js preset; they are not SWD v4 defaults or measured audience behavior.',
  );
  const reference = scenario(
    'uncached-reference',
    'All-new visits, no green hosting: SWD v4 reference',
    false,
    1,
    0,
    0,
    'Pinned SWD v4 default visit mix and green-hosting setting. Every assumed visit downloads the full bundle; no cache reduction is applied.',
  );
  const scenarios = [configured, reference];
  return {
    ...CARBON_MODEL,
    unit: 'gCO2e',
    lowGrams: Math.min(...scenarios.map(item => item.grams)),
    highGrams: Math.max(...scenarios.map(item => item.grams)),
    scenarios,
    assumptions: {
      bytesSavedPerUncachedVisit: bytesSaved,
      hypotheticalVisits: transfers,
      configuredReturnVisitPercentage: returnVisitPercentage,
      configuredDataReloadRatio: dataReloadRatio,
      configuredGreenHosting: greenHosting,
      gridIntensityGramsPerKwh: 494,
      gigabyteBytes: 1_000_000_000,
      rangeMeaning: 'The minimum and maximum of two explicitly named model configurations; not a confidence interval, scientific uncertainty range or guaranteed bounds on actual emissions.',
      hosting: 'Green hosting is an assumption, not a lookup. In SWD v4 it removes the modeled data-center operational component; network, device and embodied components remain.',
      boundary: 'Attributional model of data-center, network and end-user-device operational and embodied emissions, using bytes as a proxy.',
      interpretation: 'A modeled difference under hypothetical visits, not measured electricity or verified avoided emissions. It is not a marginal energy or carbon-saving measurement.',
      exclusions: 'Does not measure real traffic, caching, deployment, optimization overhead, the application payload, or the net life-cycle effect of image replacements.',
    },
    sources: CARBON_SOURCES.map(source => ({ ...source })),
  };
}
