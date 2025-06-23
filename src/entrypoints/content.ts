export default defineContentScript({
  matches: ['*://*.gcu.edu/*'],
  runAt: 'document_end',
  main() {
    chrome.runtime.sendMessage("HALO_LOADED");
  },
});