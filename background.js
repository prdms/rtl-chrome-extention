chrome.runtime.onInstalled.addListener(() => {
  // Initialization if needed
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`tab_${tabId}`);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAB_CONFIG') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (!tabId) {
      sendResponse({ config: null });
      return;
    }
    const storageKey = `tab_${tabId}`;
    chrome.storage.local.get({
      [storageKey]: {
        enabled: false,
        fontSizeMultiplier: 110,
        alignBlocks: true,
        formatCodeBlocks: false,
        customCss: ""
      }
    }, (result) => {
      sendResponse({ config: result[storageKey] });
    });
    return true; // Keep message channel open for async response
  }
});
