(() => {
  "use strict";

  const output = document.getElementById("viewport-width");
  const indicatorCss = document.getElementById("indicator-css");
  const toggleButton = document.getElementById("toggle-indicator");

  function updateWidth() {
    output.textContent = `${document.documentElement.clientWidth}px`;
  }

  if (output) {
    updateWidth();
    window.addEventListener("resize", updateWidth);
  }

  if (indicatorCss && toggleButton) {
    toggleButton.addEventListener("click", () => {
      indicatorCss.disabled = !indicatorCss.disabled;
      toggleButton.setAttribute("aria-pressed", String(!indicatorCss.disabled));
      toggleButton.textContent = indicatorCss.disabled
        ? "Turn on page indicator"
        : "Turn off page indicator";
    });
  }
})();
