# Modelled carbon scenarios

LeafByte uses **Green Web Foundation CO2.js 0.19.0**, explicitly selecting **Sustainable Web Design v4**. The pinned official package is bundled locally in `dist/vendor/co2js-0.19.0.js`; its Apache 2.0 license and notice accompany it. No external carbon API or visitor data is required.

The app passes the measured difference between original and selected primary image bytes to upstream `perVisitTrace()`. It then multiplies the per-visit model result by the user's hypothetical page views. The resulting **g CO₂e are a modelled attributional difference**, distinct from measured file sizes.

Two configurations define the displayed range:

| Configuration | Visit/cache assumptions | Hosting |
| --- | --- | --- |
| Configured scenario | Initially 75% new visitors; 25% returning visitors reloading 2% of the image data. The returning share is editable. | Standard by default; green-hosting assumption is optional. |
| Uncached reference | 100% new visits, each requesting the complete image bundle. | Standard hosting. |

The initial cache preset is illustrative and comes from the historical CO2.js preset. It is not a measured audience or a SWD v4 default. The range is the minimum and maximum of these two explicit configurations, not statistical confidence limits.

The pinned reference model uses a world-average intensity of 494 g/kWh and yields **148.2 g CO₂e per decimal GB** for uncached, standard-hosting visits. With the initial visitor/cache preset, the same GB produces **111.891 g** in the configured scenario. Green hosting removes the model's data-center operational component; the device, network and embodied components remain.

The export includes the library/model versions, assumptions, upstream traces and source URLs. Tests compare LeafByte's results against the actual pinned library and check known constants, caching behavior, scaling, zero inputs and invalid inputs.

## Interpretation

The estimate helps communicate expected environmental benefit under declared usage. It does not measure marginal electricity changes, real traffic, hardware power, or optimization overhead. Responsive images add stored variants; a real browser's selected image and transferred bytes should be measured separately. LeafByte reports primary image reduction and additional variant storage separately.

## Primary sources

- [CO2.js overview](https://developers.thegreenwebfoundation.org/co2js/overview/)
- [Estimation models](https://developers.thegreenwebfoundation.org/co2js/models/overview/)
- [perVisitTrace options](https://developers.thegreenwebfoundation.org/co2js/functions/pervisit-trace/)
- [SWD methodology](https://sustainablewebdesign.org/estimating-digital-emissions/)
- [Pinned source constants](https://github.com/thegreenwebfoundation/co2.js/blob/v0.19.0/src/constants/index.js)
- [Pinned npm release](https://www.npmjs.com/package/@tgwf/co2/v/0.19.0)
