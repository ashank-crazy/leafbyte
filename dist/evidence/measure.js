document.getElementById('measure').addEventListener('click', () => {
  const resources = performance.getEntriesByType('resource').filter(entry => ['img', 'link', 'script'].includes(entry.initiatorType));
  const images = resources.filter(entry => entry.initiatorType === 'img');
  const navigation = performance.getEntriesByType('navigation')[0];
  const report = {
    url: location.href, timestamp: new Date().toISOString(), viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    imageEncodedBodyBytes: images.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
    imageTransferBytes: images.reduce((sum, entry) => sum + entry.transferSize, 0),
    resourceTransferBytes: resources.reduce((sum, entry) => sum + entry.transferSize, 0),
    pageTransferBytes: (navigation?.transferSize || 0) + resources.reduce((sum, entry) => sum + entry.transferSize, 0),
    documentTransferBytes: navigation?.transferSize || 0,
    allImagesComplete: [...document.images].every(image => image.complete && image.naturalWidth > 0),
    images: [...document.images].map(image => ({source: image.currentSrc, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight})),
    resources: resources.map(entry => ({name: entry.name, type: entry.initiatorType, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize})),
  };
  document.getElementById('resource-report').textContent = JSON.stringify(report, null, 2);
});
