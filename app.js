const API_BASE =
  window.RUNTIME_CONFIG?.API_BASE_URL ||
  document.querySelector('meta[name="kedrix-api-endpoint"]')?.content;

console.log("Kedrix API:", API_BASE);