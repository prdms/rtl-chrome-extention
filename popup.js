const enabledToggle = document.getElementById('enabled-toggle');
const sizeMultiplier = document.getElementById('size-multiplier');
const multiplierVal = document.getElementById('multiplier-val');
const alignBlocksToggle = document.getElementById('align-blocks-toggle');
const formatCodeToggle = document.getElementById('format-code-toggle');

// Load stored settings with defaults fallback
chrome.storage.local.get({
  enabled: true,
  fontSizeMultiplier: 110,
  alignBlocks: true,
  formatCodeBlocks: false
}, (settings) => {
  enabledToggle.checked = settings.enabled;
  sizeMultiplier.value = settings.fontSizeMultiplier;
  multiplierVal.textContent = `${settings.fontSizeMultiplier}%`;
  alignBlocksToggle.checked = settings.alignBlocks;
  formatCodeToggle.checked = settings.formatCodeBlocks;
});

function saveAndNotify() {
  const config = {
    enabled: enabledToggle.checked,
    fontSizeMultiplier: parseInt(sizeMultiplier.value),
    alignBlocks: alignBlocksToggle.checked,
    formatCodeBlocks: formatCodeToggle.checked
  };

  chrome.storage.local.set(config, () => {
    // Notify the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'UPDATE_CONFIG',
          config: config
        }, () => {
          if (chrome.runtime.lastError) {
            // Ignored - content script may not be loaded on internal/new tab pages
            return;
          }
        });
      }
    });
  });
}

enabledToggle.addEventListener('change', saveAndNotify);
alignBlocksToggle.addEventListener('change', saveAndNotify);
formatCodeToggle.addEventListener('change', saveAndNotify);

sizeMultiplier.addEventListener('input', (e) => {
  multiplierVal.textContent = `${e.target.value}%`;
});
sizeMultiplier.addEventListener('change', saveAndNotify);
