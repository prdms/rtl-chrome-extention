// Default configuration baked in from generation
let config = {
  enabled: false,
  fontSizeMultiplier: 110,
  alignBlocks: true,
  formatCodeBlocks: false,
  customCss: ""
};

const BLOCK_CLASS = 'vazir-enhanced-text-block';
const INLINE_CLASS = 'vazir-enhanced-text-inline';
const PERSIAN_REGEX = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFC]/;
const PROCESSED_ATTR = 'data-vazir-enhanced';

// Load stored settings or default to initial config from background script
function loadConfigAndApply() {
  chrome.runtime.sendMessage({ type: 'GET_TAB_CONFIG' }, (response) => {
    if (response && response.config) {
      config = { ...config, ...response.config };
    } else {
      config = { ...config, enabled: false };
    }
    applyToPage();
  });
}

chrome.runtime.sendMessage({ type: 'GET_TAB_CONFIG' }, (response) => {
  if (response && response.config) {
    config = { ...config, ...response.config };
  }
  init();
});

// Handle bfcache (back-forward cache) restoration
window.addEventListener('pageshow', () => {
  loadConfigAndApply();
});

// Real-time updates from popup without reload
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_CONFIG') {
    config = { ...config, ...message.config };
    applyToPage();
    sendResponse({ status: 'applied' });
  }
});

function init() {
  applyToPage();

  const observer = new MutationObserver((mutations) => {
    if (!config.enabled) return;
    
    let shouldProcess = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
        break;
      }
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        shouldProcess = true;
      }
    }

    if (shouldProcess) {
      requestAnimationFrame(() => {
        processElement(document.body);
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function hasPersian(text) {
  return PERSIAN_REGEX.test(text);
}

function processElement(rootElement) {
  if (!config.enabled || !rootElement) return;

  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'textarea', 'input', 'noscript'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Avoid code blocks if setting is off
        if (!config.formatCodeBlocks && (tagName === 'code' || tagName === 'pre' || parent.closest('pre') || parent.closest('code'))) {
          return NodeFilter.FILTER_REJECT;
        }

        if (hasPersian(node.nodeValue)) {
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  let textNode;
  const elementsToProcess = new Set();

  while (textNode = walker.nextNode()) {
    elementsToProcess.add(textNode.parentElement);
  }

  elementsToProcess.forEach(el => {
    applyStylesToElement(el);
  });
}

function applyStylesToElement(el) {
  if (el.hasAttribute(PROCESSED_ATTR)) {
    updateElementStyles(el);
    return;
  }

  const style = window.getComputedStyle(el);
  const display = style.display;
  const isBlock = ['block', 'flex', 'grid', 'table', 'list-item', 'paragraph', 'section', 'article'].includes(display) || 
                  ['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'article', 'section', 'aside'].includes(el.tagName.toLowerCase());

  el.setAttribute(PROCESSED_ATTR, isBlock ? 'block' : 'inline');
  updateElementStyles(el);
}

function updateElementStyles(el) {
  const type = el.getAttribute(PROCESSED_ATTR);
  const isEnabled = config.enabled;

  if (!isEnabled) {
    el.classList.remove(BLOCK_CLASS, INLINE_CLASS);
    el.style.fontSize = '';
    el.style.direction = '';
    el.style.textAlign = '';
    return;
  }

  if (type === 'block') {
    el.classList.add(BLOCK_CLASS);
    if (!config.alignBlocks) {
      el.style.direction = 'ltr';
      el.style.textAlign = 'left';
    } else {
      el.style.direction = '';
      el.style.textAlign = '';
    }
  } else {
    el.classList.add(INLINE_CLASS);
  }

  if (config.fontSizeMultiplier && config.fontSizeMultiplier !== 100) {
    el.style.fontSize = `${config.fontSizeMultiplier}%`;
  } else {
    el.style.fontSize = '';
  }
}

function applyToPage() {
  if (config.enabled) {
    let customStyleTag = document.getElementById('vazir-custom-css');
    if (config.customCss) {
      if (!customStyleTag) {
        customStyleTag = document.createElement('style');
        customStyleTag.id = 'vazir-custom-css';
        document.head.appendChild(customStyleTag);
      }
      customStyleTag.textContent = config.customCss;
    } else if (customStyleTag) {
      customStyleTag.remove();
    }

    processElement(document.body);
  } else {
    document.querySelectorAll(`.${BLOCK_CLASS}, .${INLINE_CLASS}`).forEach(el => {
      el.classList.remove(BLOCK_CLASS, INLINE_CLASS);
      el.style.fontSize = '';
      el.style.direction = '';
      el.style.textAlign = '';
    });
    const customStyleTag = document.getElementById('vazir-custom-css');
    if (customStyleTag) customStyleTag.remove();
  }
}