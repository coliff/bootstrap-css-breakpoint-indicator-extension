/* global chrome:readonly */
(() => {
  "use strict";

  const enabledInput = document.querySelector("#enabled");
  const statusText = document.querySelector("#indicator-status");
  const versionInputs = document.querySelectorAll("input[name='version']");

  function normalizeVersion(version) {
    return ["4", "5", "6"].includes(version) ? version : "5";
  }

  function selectedVersion() {
    const selected = document.querySelector("input[name='version']:checked");
    return normalizeVersion(selected?.value);
  }

  function renderStatus() {
    if (enabledInput.checked) {
      const version = selectedVersion();
      statusText.textContent = `Showing Bootstrap ${version} breakpoints on this tab.`;
      return;
    }

    statusText.textContent = "Off until you turn it on.";
  }

  function findBootstrapVersion() {
    const pattern = /bootstrap(?:@|\/)v?([456])\./iu;

    for (const link of document.querySelectorAll("link[href]")) {
      const match = pattern.exec(link.href);

      if (match) {
        return match[1];
      }
    }

    return null;
  }

  async function detectPageVersion() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (typeof tab?.id !== "number") {
        return null;
      }

      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: findBootstrapVersion,
      });

      return result?.result ?? null;
    } catch {
      // The browser blocks scripts on restricted pages.
      return null;
    }
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get({
      enabled: false,
      version: "5",
    });

    enabledInput.checked = stored.enabled === true;

    const storedVersion = normalizeVersion(stored.version);
    const version = (await detectPageVersion()) ?? storedVersion;
    for (const input of versionInputs) {
      input.checked = input.value === version;
    }

    renderStatus();

    return version !== storedVersion;
  }

  async function applyCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (typeof tab?.id !== "number") {
        return;
      }

      await chrome.runtime.sendMessage({ type: "apply", tabId: tab.id });
    } catch {
      // The browser blocks injection on restricted pages.
    }
  }

  async function saveSettings() {
    renderStatus();

    await chrome.storage.local.set({
      enabled: enabledInput.checked,
      version: selectedVersion(),
    });

    try {
      await self.setToolbarIcon(enabledInput.checked);
    } catch {
      // The service worker also updates the toolbar icon.
    }

    await applyCurrentTab();
  }

  async function init() {
    const versionChanged = await loadSettings();

    const turnedOn = !enabledInput.checked;

    if (turnedOn || versionChanged) {
      enabledInput.checked = true;
      await saveSettings();
    }

    document.body.classList.remove("is-pending");

    enabledInput.addEventListener("change", () => {
      saveSettings();
    });

    for (const input of versionInputs) {
      input.addEventListener("change", () => {
        saveSettings();
      });
    }

    if (!turnedOn && !versionChanged) {
      await applyCurrentTab();
    }
  }

  init().catch(() => {
    document.body.classList.remove("is-pending");
  });
})();
