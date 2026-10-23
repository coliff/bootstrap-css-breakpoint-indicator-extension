/* global chrome:readonly */
(() => {
  "use strict";

  const TOOLBAR_ICONS = {
    on: {
      16: "icon16.png",
      19: "icon19.png",
      24: "icon24.png",
      32: "icon32.png",
      38: "icon38.png",
      48: "icon48.png",
      128: "icon128.png",
    },
    off: {
      16: "icon16-gray.png",
      19: "icon19-gray.png",
      24: "icon24-gray.png",
      32: "icon32-gray.png",
      38: "icon38-gray.png",
      48: "icon48-gray.png",
      128: "icon128-gray.png",
    },
  };

  self.setToolbarIcon = async (enabled) => {
    const files = enabled ? TOOLBAR_ICONS.on : TOOLBAR_ICONS.off;
    const file = enabled ? "icon128.png" : "icon128-gray.png";

    try {
      await chrome.action.setIcon({ path: file });
    } catch {
      await chrome.action.setIcon({ path: files });
    }
  };
})();
