(() => {
  "use strict";

  const output = document.getElementById("viewport-width");

  if (!output) {
    return;
  }

  function update() {
    output.textContent = `${document.documentElement.clientWidth}px`;
  }

  update();
  window.addEventListener("resize", update);
})();
