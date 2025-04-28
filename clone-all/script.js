// Adicione aqui seus scripts personalizados

document.cookie = "VtexWorkspace=master%3A-; expires=Sun, 27 Apr 2025 02:51:35 GMT; path=/; secure; samesite=none";

function handleCSSFallback() {
  var fallbackTemplate = document.querySelector('template#stylesFallback');
  var fallbackContent = fallbackTemplate.content.cloneNode(true);
  document.head.appendChild(fallbackContent);
}

window.setZeroTimeout = setImmediate;
window.__HAS_HYDRATED__ = false;
window.addEventListener('DOMContentLoaded', function(){
  window.__DOM_READY__ = true;
});
