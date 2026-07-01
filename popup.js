const enabledToggle = document.getElementById('enabled-toggle');
const sizeMultiplier = document.getElementById('size-multiplier');
const multiplierVal = document.getElementById('multiplier-val');

let activeTabId = null;

// Find active tab and load its specific settings
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs && tabs[0]) {
    activeTabId = tabs[0].id;
    const storageKey = `tab_${activeTabId}`;
    
    chrome.storage.local.get({
      [storageKey]: {
        enabled: false,
        fontSizeMultiplier: 110,
        alignBlocks: true,
        formatCodeBlocks: false
      }
    }, (result) => {
      const settings = (result && result[storageKey]) ? result[storageKey] : {
        enabled: false,
        fontSizeMultiplier: 110
      };
      enabledToggle.checked = settings.enabled;
      sizeMultiplier.value = settings.fontSizeMultiplier;
      multiplierVal.textContent = `${settings.fontSizeMultiplier}%`;
    });
  }
});

function saveAndNotify() {
  if (!activeTabId) return;

  const storageKey = `tab_${activeTabId}`;
  const tabConfig = {
    enabled: enabledToggle.checked,
    fontSizeMultiplier: parseInt(sizeMultiplier.value),
    alignBlocks: true,
    formatCodeBlocks: false
  };

  chrome.storage.local.set({ [storageKey]: tabConfig }, () => {
    // Notify the active tab
    chrome.tabs.sendMessage(activeTabId, {
      type: 'UPDATE_CONFIG',
      config: tabConfig
    }, () => {
      if (chrome.runtime.lastError) {
        // Ignored - content script may not be loaded on internal/new tab pages
        return;
      }
    });
  });
}

enabledToggle.addEventListener('change', saveAndNotify);

sizeMultiplier.addEventListener('input', (e) => {
  multiplierVal.textContent = `${e.target.value}%`;
});
sizeMultiplier.addEventListener('change', saveAndNotify);
