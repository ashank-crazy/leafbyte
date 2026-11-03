# LeafByte photograph benchmark corpus

This separate corpus contains **26 real stock photographs**, covering product still lifes, food and drink, animals, texture, interiors, architecture, infrastructure, landscapes, and plants. The default demo loads the six Everyday Objects photographs from this corpus; the full 26-image set remains available through the benchmark lab. The corpus contains no AI-generated images and no satellite scenes. All 26 images were visually inspected in a contact sheet.

## Source and permissions

All photographs come from individual official Unsplash pages linked below. On **3 November 2026**, each selected photo page explicitly displayed its free-use status with a link to the [Unsplash License](https://unsplash.com/license), and offered a free download. None displayed an Unsplash+ license marker. The photo image URLs were extracted from those official source pages, and the raster files were downloaded from `images.unsplash.com`. A public [Lorem Picsum photo index](https://picsum.photos/v2/list?limit=100) was used only to discover photographer names and original Unsplash page URLs; its resized images are not included. The source page’s own photographer credit takes precedence over the discovery index.

The Unsplash License permits downloading, copying, modifying and distributing the images, including commercial and noncommercial use. It restricts selling the images without significant modification and compiling them to replicate a competing image service. This small corpus is distributed solely as reproducible software benchmark input. It is freely licensed photography, **not a claim of public-domain or CC0 status**. Names and incidental product brands do not imply endorsement of LeafByte.

## Preparation and provenance

The downloaded original rasters total 42,554,087 bytes. To keep the repository bounded, **17 files are retained byte-for-byte**, including **9 originals at least 3000 pixels wide**. The remaining 9 were proportionally resized to fit within 2000 × 2000 pixels, using Lanczos resampling, then saved as JPEG at quality 88 with 4:4:4 chroma and optimized coding. This preparation happened before the LeafByte benchmark. It must not be counted as LeafByte savings. No image was cropped, upscaled, recolored, composited, or generated.

The bundled input corpus totals **21,923,446 bytes** (21.92 decimal MB, about 20.91 MiB). Full source dimensions, source byte counts, original SHA-256 hashes, bundled dimensions, bundled byte counts, bundled SHA-256 hashes, source URLs, download URLs, license URLs and preparation notes are recorded in [`benchmark-assets/manifest.json`](../benchmark-assets/manifest.json). Manifest paths are relative to the repository root, and the array order and numbered file names are deterministic.

These are stock photographs chosen to cover common web image content and visual complexity. **No claim is made that they were captured with a phone**, or about capture date, camera model or photographic originality by the LeafByte author. Benchmark results describe this corpus only; they do not establish average savings across the web or modern phone-camera originals. This corpus contains JPEG photos only; transparency, animated media and UI screenshot preservation require separate tests.

## Included images

“Original” means byte-for-byte as downloaded from the image URL linked by the official source page. “Prepared” means the declared size and JPEG preparation above.

| File | Category | Input dimensions | Bytes | Preparation | Photographer and official source |
|---|---|---:|---:|---|---|
| `01-laptop-desk.jpg` | product | 5616 × 3744 | 1,989,373 | Original | [Alejandro Escamilla / Unsplash](https://unsplash.com/photos/yC-Yzbqy7PY) |
| `02-creative-workspace.jpg` | product | 3670 × 2462 | 1,647,999 | Original | [Aleks Dorohovich / Unsplash](https://unsplash.com/photos/nJdwUHmaY8A) |
| `03-everyday-accessories.jpg` | product | 2000 × 1316 | 603,580 | Prepared | [Vadim Sherbakov / Unsplash](https://unsplash.com/photos/tCICLJ5ktBE) |
| `04-printed-mug.jpg` | food-drink | 1280 × 901 | 182,597 | Original | [Shyamanta Baruah / Unsplash](https://unsplash.com/photos/aeVA-j1y2BY) |
| `05-camera-components.jpg` | product | 4179 × 2790 | 2,040,465 | Original | [Vadim Sherbakov / Unsplash](https://unsplash.com/photos/osSryggkso4) |
| `06-cat-closeup.jpg` | animal | 2000 × 1367 | 590,860 | Prepared | [Ryan McGuire / Unsplash](https://unsplash.com/photos/N-1XGL54pQg) |
| `07-water-droplets.jpg` | texture | 1280 × 805 | 152,985 | Original | [Nithya Ramanujam / Unsplash](https://unsplash.com/photos/fTKetYpEKNQ) |
| `08-cafe-interior.jpg` | interior | 3456 × 2304 | 702,968 | Original | [Luke Chesser / Unsplash](https://unsplash.com/photos/KR2mdHJ5qMg) |
| `09-city-night-monochrome.jpg` | architecture | 1280 × 831 | 248,356 | Original | [Oleg Chursin / Unsplash](https://unsplash.com/photos/IoCWq07GaG4) |
| `10-white-buildings.jpg` | architecture | 1280 × 792 | 162,187 | Original | [Margaret Barley / Unsplash](https://unsplash.com/photos/Qo51KwK1dKg) |
| `11-bird-on-rope.jpg` | animal | 4608 × 3072 | 3,036,897 | Original | [Tyler Wanlass / Unsplash](https://unsplash.com/photos/L7MpmBGpM94) |
| `12-ocean-monochrome.jpg` | landscape | 2000 × 1333 | 596,322 | Prepared | [Ireneuilia / Unsplash](https://unsplash.com/photos/knYQ6arClBE) |
| `13-mountain-clouds.jpg` | landscape | 3264 × 2176 | 1,263,623 | Original | [Nicholas Swanson / Unsplash](https://unsplash.com/photos/d19by2PLaPc) |
| `14-new-plant.jpg` | plant | 2000 × 1333 | 1,113,915 | Prepared | [Tyler Wanlass / Unsplash](https://unsplash.com/photos/akbHiqZy4Pg) |
| `15-coffee-red.jpg` | food-drink | 5422 × 3050 | 622,883 | Original | [Justin Leibow / Unsplash](https://unsplash.com/photos/ZJsseAxEcqM) |
| `16-railway-tracks.jpg` | infrastructure | 2000 × 1329 | 441,346 | Prepared | [Alexander Shustov / Unsplash](https://unsplash.com/photos/SITaCHf7jjg) |
| `17-foggy-road.jpg` | landscape | 3011 × 2000 | 1,545,585 | Original | [Dorothy Lin / Unsplash](https://unsplash.com/photos/OokBLPrkCNk) |
| `18-lakeside-swing.jpg` | landscape | 2000 × 1333 | 1,189,628 | Prepared | [Jon Eckert / Unsplash](https://unsplash.com/photos/IoIbdFdGCnQ) |
| `19-baseball-glove.jpg` | product | 2000 × 1333 | 460,499 | Prepared | [Jon Eckert / Unsplash](https://unsplash.com/photos/umLpP7uCZs0) |
| `20-sea-pier.jpg` | landscape | 1631 × 1102 | 573,883 | Original | [May Pamintuan / Unsplash](https://unsplash.com/photos/j9nfqTi5T5o) |
| `21-forest-dusk.jpg` | landscape | 2560 × 1920 | 657,047 | Original | [Julie Geiger / Unsplash](https://unsplash.com/photos/dYshDcTI1Js) |
| `22-bridge-night.jpg` | architecture | 1280 × 848 | 149,344 | Original | [Johnny Lam / Unsplash](https://unsplash.com/photos/63qfL0TciY8) |
| `23-city-traffic.jpg` | infrastructure | 1280 × 1707 | 452,355 | Original | [Barcelona / Unsplash](https://unsplash.com/photos/muC_6gTMLR4) |
| `24-grass-backlight.jpg` | plant | 2000 × 1125 | 417,545 | Prepared | [Vectorbeast / Unsplash](https://unsplash.com/photos/rsJtMXn3p_c) |
| `25-barley-wheat.jpg` | plant | 3264 × 2176 | 663,443 | Original | [Laurice Manaligod / Unsplash](https://unsplash.com/photos/ThJIf6Q0b2s) |
| `26-wooden-wagon.jpg` | texture | 2000 × 1329 | 417,761 | Prepared | [Jon Toney / Unsplash](https://unsplash.com/photos/xyDQNmT6vSs) |

## Verification

Every bundled file was decoded as an image; all SHA-256 hashes are unique. A contact sheet of all 26 originals was inspected before finalizing the corpus. The asset manifest was checked for exactly 26 entries, a payload below 25,000,000 bytes, and at least six unchanged originals wider than 3000 pixels (actual: nine). No benchmark output or savings value is precomputed in this corpus.
