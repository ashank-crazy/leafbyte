# Demo image sources and credits

These four real raster images were obtained from official NASA Science pages on 3 November 2026. They are satellite-observation imagery, including the explicitly identified Blue Marble composite; none is an AI-generated picture. No NASA seal, logo, or identifiable person is included.

## Usage basis

NASA’s [Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) allow factual educational/informational use of NASA content and say that NASA content generally is not subject to copyright in the United States. NASA must be acknowledged; its use does not imply NASA endorsement. Third-party copyright exceptions still apply. The selected pages identify the NASA/NASA–USGS creators below and do not mark these selected images as third-party copyrighted. The manifest uses the accurate NASA media-usage description rather than claiming a universal CC0 license.

The images are credited factual benchmark inputs for LeafByte. Their source and preparation are disclosed here and in `dist/assets/samples.json`. The demo calculates optimization results from its actual runtime image inputs; the images are not evidence of measured environmental savings.

## Blue Marble

- Local file: `dist/assets/earth.jpg`
- Source: [Blue Marble](https://science.nasa.gov/resource/blue-marble/)
- Direct NASA image: [download](https://assets.science.nasa.gov/content/dam/science/esd/climate/2023/12/ImageWall5_1920x1200-80.jpg)
- Credit: NASA Goddard Space Flight Center; Reto Stöckli and Robert Simmon
- Content: Earth in true color: a composite made from real satellite observations, visualization date August 2, 2002.
- Bundled dimensions/bytes: 1920 × 1200; 569,175 bytes.
- Preparation: Unchanged downloaded JPEG.
- SHA-256: `739d86617a6d82a031979e87caafcfda83fb7fbfbc1f1addfb5955451361e43c`

## Amazon Rainforest

- Local file: `dist/assets/amazon.jpg`
- Source: [Amazon Rainforest](https://science.nasa.gov/earth/earth-observatory/afternoon-clouds-over-the-amazon-rainforest-39936/)
- Direct NASA image: [download](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/39000/39936/Brazil_AMO_2009231_lrg.jpg)
- Credit: Jeff Schmaltz, MODIS Rapid Response at NASA GSFC
- Content: Natural-color Aqua MODIS observation of cloud patterns over the Amazon Rainforest, August 19, 2009.
- Bundled dimensions/bytes: 1867 × 2400; 1,921,833 bytes.
- Preparation: Original observation image proportionally resized to 1867 × 2400 pixels using Lanczos resampling, JPEG quality 80; no generative content.
- SHA-256: `60b9a3360c2964e96347bbc1e9bab3eaf38e77d14cba7f2edbd39e9d143a783c`

## Berg Lake & Steller Glacier

- Local file: `dist/assets/glacier.jpg`
- Source: [Berg Lake & Steller Glacier](https://science.nasa.gov/earth/earth-observatory/a-glacial-lakes-evolution-154628/)
- Direct NASA image: [download](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/154000/154628/berglake_oli_20240629_lrg.jpg)
- Credit: NASA Earth Observatory / Wanmei Liang, using Landsat data from the U.S. Geological Survey
- Content: Natural-color Landsat observation of Berg Lake and the Steller Glacier in Alaska, June 29, 2024.
- Bundled dimensions/bytes: 2286 × 1524; 1,072,533 bytes.
- Preparation: Unchanged downloaded JPEG.
- SHA-256: `a403cf4aade9b58dd4b766cab953c4d991fdf4e13950fc8c43fd51380f3bbbd2`

## Vancouver Island Bloom

- Local file: `dist/assets/ocean.jpg`
- Source: [Vancouver Island Bloom](https://science.nasa.gov/earth/earth-observatory/phytoplankton-off-vancouver-island-16887/)
- Direct NASA image: [download](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/16000/16887/Vancouver_AMO_2006176.jpg)
- Credit: Jeff Schmaltz, MODIS Land Rapid Response Team at NASA GSFC
- Content: Aqua MODIS observation of ocean phytoplankton off Vancouver Island, June 25, 2006. Includes original NASA annotation.
- Bundled dimensions/bytes: 540 × 540; 69,520 bytes.
- Preparation: Unchanged downloaded 540 × 540 JPEG; deliberately retained as a small input.
- SHA-256: `6d14e3f39459d9993d33acc36a3e6b02145922984ac942324930476fef92479e`

## Corpus scope

Total bundled image bytes: 3,633,061. All four are JPEG files. The small Vancouver image is included deliberately so a compression system can show when an already-small input should be preserved. This is a small demonstrative corpus, not a representative web-wide benchmark.
