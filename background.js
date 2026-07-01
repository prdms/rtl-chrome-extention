chrome.runtime.onInstalled.addListener(() => {
  // Clear any old/previous storage to start fresh and remove any incorrect caches
  chrome.storage.local.clear(() => {
    console.log('Cache cleared on installation/update.');
  });
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
      const configVal = (result && result[storageKey]) ? result[storageKey] : {
        enabled: false,
        fontSizeMultiplier: 110,
        alignBlocks: true,
        formatCodeBlocks: false,
        customCss: ""
      };
      sendResponse({ config: configVal });
    });
    return true; // Keep message channel open for async response
  }
});
