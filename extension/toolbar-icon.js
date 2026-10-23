/* global chrome:readonly */
(() => {
  "use strict";

  const TOOLBAR_SIZES = [16, 19, 20, 24, 28, 32, 38, 40, 48, 64, 128];

  async function iconPixels(file) {
    const response = await fetch(chrome.runtime.getURL(file));
    const blob = await response.blob();
    const source = await createImageBitmap(blob);

    try {
      const imageData = {};

      for (const size of TOOLBAR_SIZES) {
        const canvas = new OffscreenCanvas(size, size);
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = true;
        if ("imageSmoothingQuality" in context) {
          context.imageSmoothingQuality = "high";
        }
        context.drawImage(source, 0, 0, size, size);
        imageData[size] = context.getImageData(0, 0, size, size);
      }

      return imageData;
    } finally {
      source.close();
    }
  }

  self.setToolbarIcon = async (enabled) => {
    const file = enabled ? "icon128.png" : "icon128-gray.png";

    try {
      await chrome.action.setIcon({ imageData: await iconPixels(file) });
    } catch {
      await chrome.action.setIcon({ path: file });
    }
  };
})();
