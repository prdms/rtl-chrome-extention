chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({
    enabled: true,
    fontSizeMultiplier: 110,
    alignBlocks: true,
    formatCodeBlocks: false,
    customCss: ""
  }, (settings) => {
    chrome.storage.local.set(settings);
  });
});
