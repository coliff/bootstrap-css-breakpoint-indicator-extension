/* global chrome:readonly, importScripts:readonly */
importScripts("toolbar-icon.js");

(() => {
  "use strict";

  const CSS_FILES = ["bootstrap-5.css", "bootstrap-6.css"];
  const BADGE_COLOR = "#7952b3";
  const pendingByTab = new Map();

  function cssFileForVersion(version) {
    return version === "6" ? "bootstrap-6.css" : "bootstrap-5.css";
  }

  function isWebPage(url) {
    return (
      typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://"))
    );
  }

  async function readSettings() {
    const stored = await chrome.storage.local.get({
      enabled: false,
      version: "5",
    });

    return {
      enabled: stored.enabled === true,
      version: stored.version === "6" ? "6" : "5",
    };
  }

  async function updateBadge(settings) {
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
    await chrome.action.setBadgeText({
      text: settings.enabled ? settings.version : "",
    });

    if (typeof chrome.action.setBadgeTextColor === "function") {
      await chrome.action.setBadgeTextColor({ color: "#ffffff" });
    }
  }

  async function updateAction(settings) {
    try {
      await updateBadge(settings);
    } catch {
      // Badge updates are optional if the action is unavailable.
    }

    await self.setToolbarIcon(settings.enabled);
  }

  function refreshAction() {
    readSettings()
      .then((settings) => updateAction(settings))
      .catch(() => {
        // Toolbar updates are optional if the action is unavailable.
      });
  }

  async function removeCss(tabId) {
    await Promise.all(
      CSS_FILES.map(async (file) => {
        try {
          await chrome.scripting.removeCSS({
            target: { tabId, allFrames: false },
            files: [file],
            origin: "USER",
          });
        } catch {
          // This file is not currently injected into the tab.
        }
      }),
    );
  }

  async function updateTab(tabId, settings) {
    await removeCss(tabId);

    if (!settings.enabled) {
      return;
    }

    try {
      await chrome.scripting.insertCSS({
        target: { tabId, allFrames: false },
        files: [cssFileForVersion(settings.version)],
        origin: "USER",
      });
    } catch {
      // The browser blocks injection on restricted pages.
    }
  }

  async function canInject(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);

      if (typeof tab.url !== "string") {
        return true;
      }

      return isWebPage(tab.url);
    } catch {
      return false;
    }
  }

  function applyToTab(tabId) {
    const previous = pendingByTab.get(tabId) ?? Promise.resolve();
    const current = previous
      .catch(() => {
        // Continue after a failed update for this tab.
      })
      .then(async () => {
        if (!(await canInject(tabId))) {
          return;
        }

        const settings = await readSettings();
        await updateTab(tabId, settings);
      });

    pendingByTab.set(tabId, current);
    current.finally(() => {
      if (pendingByTab.get(tabId) === current) {
        pendingByTab.delete(tabId);
      }
    });

    return current;
  }

  chrome.runtime.onInstalled.addListener(() => {
    refreshAction();
  });

  chrome.runtime.onStartup.addListener(() => {
    refreshAction();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || (!changes.enabled && !changes.version)) {
      return;
    }

    refreshAction();
  });

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (sender.id !== chrome.runtime.id || message?.type !== "apply") {
      return;
    }

    if (typeof message.tabId !== "number") {
      return;
    }

    applyToTab(message.tabId).catch(() => {
      // Ignore tabs that disappear while styles are being updated.
    });
  });
})();
