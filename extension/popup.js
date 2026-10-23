/* global chrome:readonly */
(() => {
  "use strict";

  const enabledInput = document.querySelector("#enabled");
  const statusText = document.querySelector("#indicator-status");
  const versionInputs = document.querySelectorAll("input[name='version']");

  function selectedVersion() {
    const selected = document.querySelector("input[name='version']:checked");
    return selected?.value === "6" ? "6" : "5";
  }

  function renderStatus() {
    if (enabledInput.checked) {
      const version = selectedVersion();
      statusText.textContent = `Showing Bootstrap ${version} breakpoints on this tab.`;
      return;
    }

    statusText.textContent = "Off until you turn it on.";
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get({
      enabled: false,
      version: "5",
    });

    enabledInput.checked = stored.enabled === true;

    const version = stored.version === "6" ? "6" : "5";
    for (const input of versionInputs) {
      input.checked = input.value === version;
    }

    renderStatus();
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
    await loadSettings();

    const turnedOn = !enabledInput.checked;

    if (turnedOn) {
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

    if (!turnedOn) {
      await applyCurrentTab();
    }
  }

  init().catch(() => {
    document.body.classList.remove("is-pending");
  });
})();
