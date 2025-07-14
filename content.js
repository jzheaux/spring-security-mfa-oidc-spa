// Content script for the Web Article Augmenter
// This script is injected into webpages and will handle DOM manipulation.

console.log("Content script loaded for Web Article Augmenter.");

// Function to send page content to the background script for processing
function processPageForAugmentation() {
  const pageContent = document.body.innerText; // Simplified content extraction
  console.log("Sending page content to background script for analysis.");

  chrome.runtime.sendMessage({ action: "processPage", content: pageContent }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message to background script:", chrome.runtime.lastError.message);
      return;
    }
    if (response && response.status === "success") {
      console.log("Received analysis from background script:", response.analysis);
      applyAugmentations(response.analysis);
    } else {
      console.error("Failed to get analysis from background script:", response);
    }
  });
}

// Creates a mapping from a clean, text-only version of the page
// back to the original DOM nodes.
function createDomTextMapper() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // Skip text within our own UI, scripts, and styles
                if (node.parentElement.closest('.web-augmenter-popup, .web-augmenter-overlay-container, script, style')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let cleanText = '';
    const charToDomMap = [];
    let node;

    while ((node = walker.nextNode())) {
        for (let i = 0; i < node.nodeValue.length; i++) {
            cleanText += node.nodeValue[i];
            charToDomMap.push({ node: node, offset: i });
        }
    }

    return { cleanText, charToDomMap };
}


// Function to apply augmentations to the page
function applyAugmentations(analysis) {
  if (!analysis || !analysis.annotations || analysis.annotations.length === 0) {
    console.log("No augmentations to apply.");
    return;
  }

  // Separate annotations by type
  const overlayAnnotations = analysis.annotations
    .filter(a => a.category !== 'auto-wikipedia')
    .sort((a, b) => b.textToHighlight.length - a.textToHighlight.length);

  const domModifyingAnnotations = analysis.annotations
    .filter(a => a.category === 'auto-wikipedia')
    .sort((a, b) => b.textToHighlight.length - a.textToHighlight.length);

  // Create the DOM map once, before any modifications
  const { cleanText, charToDomMap } = createDomTextMapper();
  if (!cleanText || charToDomMap.length === 0) {
    console.log("Could not process page content.");
    return;
  }

  const appliedRanges = []; // Keep track of applied ranges to avoid overlaps

  // --- Pass 1: Overlays (Non-Destructive) ---
  console.log("Starting Pass 1 for overlays.");
  let overlayContainer = document.getElementById('web-augmenter-overlay-container');
  if (!overlayContainer) {
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'web-augmenter-overlay-container';
    overlayContainer.className = 'web-augmenter-overlay-container';
    document.body.appendChild(overlayContainer);
  }

  overlayAnnotations.forEach(annotation => {
    const searchText = annotation.textToHighlight;
    let startIndex = 0;
    let matchIndex;

    while ((matchIndex = cleanText.toLowerCase().indexOf(searchText.toLowerCase(), startIndex)) !== -1) {
      const endIndex = matchIndex + searchText.length - 1;

      const overlaps = appliedRanges.some(r => matchIndex < r.end && endIndex > r.start);
      if (overlaps) {
        startIndex = matchIndex + 1;
        continue;
      }

      const startDomInfo = charToDomMap[matchIndex];
      const endDomInfo = charToDomMap[endIndex];

      if (startDomInfo && endDomInfo) {
        const range = document.createRange();
        range.setStart(startDomInfo.node, startDomInfo.offset);
        range.setEnd(endDomInfo.node, endDomInfo.offset + 1);

        if (annotation.category === 'fact-checker') {
          createFactCheckerOverlay(range, annotation, overlayContainer);
        } else if (annotation.category === 'people-watcher') {
          createPeopleWatcherOverlay(range, annotation, overlayContainer);
        } else if (annotation.category === 'tone-detector') {
          createToneDetectorOverlay(range, annotation, overlayContainer);
        } else if (annotation.category === 'good-question') {
          createGoodQuestionMarker(range, annotation, overlayContainer);
        } else if (annotation.category === 'jargon-buster') {
            createJargonBusterOverlay(range, annotation, overlayContainer);
        } else if (annotation.category === 'literary-device') {
            createLiteraryDeviceOverlay(range, annotation, overlayContainer);
        } else if (annotation.category === 'bias-tracker') {
            createBiasTrackerOverlay(range, annotation, overlayContainer);
        }

        appliedRanges.push({ start: matchIndex, end: endIndex });
      }
      startIndex = endIndex + 1;
    }
  });

  // --- Pass 2: DOM Modifications ---
  console.log("Starting Pass 2 for DOM modifications.");
  domModifyingAnnotations.forEach(annotation => {
    const searchText = annotation.textToHighlight;
    let startIndex = 0;
    let matchIndex;

    while ((matchIndex = cleanText.toLowerCase().indexOf(searchText.toLowerCase(), startIndex)) !== -1) {
      const endIndex = matchIndex + searchText.length - 1;

      const overlaps = appliedRanges.some(r => matchIndex < r.end && endIndex > r.start);
      if (overlaps) {
        startIndex = matchIndex + 1;
        continue;
      }

      const startDomInfo = charToDomMap[matchIndex];
      const endDomInfo = charToDomMap[endIndex];

      if (startDomInfo && endDomInfo) {
        const range = document.createRange();
        range.setStart(startDomInfo.node, startDomInfo.offset);
        range.setEnd(endDomInfo.node, endDomInfo.offset + 1);

        if (range.startContainer.parentElement.closest('a') || range.cloneContents().querySelector('*')) {
          console.log("Skipping 'auto-wikipedia' due to existing link or complex content.");
        } else {
          const link = document.createElement('a');
          link.href = annotation.url;
          link.className = 'auto-wikipedia-link';
          link.title = annotation.comment;
          link.target = '_blank';
          range.surroundContents(link);
          appliedRanges.push({ start: matchIndex, end: endIndex });
        }
      }
      startIndex = endIndex + 1;
    }
  });
}

function createFactCheckerOverlay(range, annotation, container) {
  const rects = range.getClientRects();
  for (const rect of rects) {
    if (rect.width > 0 && rect.height > 0) {
      const overlayElement = document.createElement('div');
      overlayElement.className = 'web-augmenter-overlay-element fact-check';
      if (annotation.severity) {
        overlayElement.classList.add(`fact-check-sev-${annotation.severity}`);
      }

      overlayElement.style.top = `${rect.top + window.scrollY}px`;
      overlayElement.style.left = `${rect.left + window.scrollX}px`;
      overlayElement.style.width = `${rect.width}px`;
      overlayElement.style.height = `${rect.height}px`;

      let popupTimeout;
      overlayElement.addEventListener('mouseenter', () => {
        popupTimeout = setTimeout(() => {
          createPopup(overlayElement, `Fact Check: ${annotation.comment}`);
        }, 300);
      });
      overlayElement.addEventListener('mouseleave', () => {
        clearTimeout(popupTimeout);
        removePopup(overlayElement);
      });

      container.appendChild(overlayElement);
    }
  }
}

function createPeopleWatcherOverlay(range, annotation, container) {
    const rects = range.getClientRects();
    for (const rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
            const overlayElement = document.createElement('div');
            overlayElement.className = 'web-augmenter-overlay-element people-watcher';

            overlayElement.style.top = `${rect.top + window.scrollY}px`;
            overlayElement.style.left = `${rect.left + window.scrollX}px`;
            overlayElement.style.width = `${rect.width}px`;
            overlayElement.style.height = `${rect.height}px`;

            let popupTimeout;
            overlayElement.addEventListener('mouseenter', () => {
                popupTimeout = setTimeout(() => {
                    createPopup(overlayElement, `Person: ${annotation.comment}`);
                }, 300);
            });
            overlayElement.addEventListener('mouseleave', () => {
                clearTimeout(popupTimeout);
                removePopup(overlayElement);
            });

            container.appendChild(overlayElement);
        }
    }
}

function createToneDetectorOverlay(range, annotation, container) {
    const isDark = isElementOnDarkBackground(range.startContainer.parentElement);
    const toneClass = `tone-${annotation.tone}-${isDark ? 'dark' : 'light'}`;

    const rects = range.getClientRects();
    for (const rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
            const overlayElement = document.createElement('div');
            overlayElement.className = `web-augmenter-overlay-element tone-highlight ${toneClass}`;

            overlayElement.style.top = `${rect.top + window.scrollY}px`;
            overlayElement.style.left = `${rect.left + window.scrollX}px`;
            overlayElement.style.width = `${rect.width}px`;
            overlayElement.style.height = `${rect.height}px`;
            overlayElement.style.zIndex = '2147483645'; // Slightly lower z-index for backgrounds

            let popupTimeout;
            overlayElement.addEventListener('mouseenter', () => {
                popupTimeout = setTimeout(() => {
                    createPopup(overlayElement, `Tone: ${annotation.comment}`);
                }, 300);
            });
            overlayElement.addEventListener('mouseleave', () => {
                clearTimeout(popupTimeout);
                removePopup(overlayElement);
            });

            container.appendChild(overlayElement);
        }
    }
}

function createGoodQuestionMarker(range, annotation, container) {
    const parentParagraph = range.startContainer.parentElement.closest('p');
    if (!parentParagraph) {
        console.warn("Could not find parent paragraph for 'good-question'.");
        return;
    }

    const pRect = parentParagraph.getBoundingClientRect();
    if (!pRect || pRect.width === 0) return;

    const marker = document.createElement('div');
    marker.className = 'good-question-marker';
    marker.textContent = '?';

    // Position marker at the bottom-right of the paragraph
    marker.style.top = `${pRect.bottom + window.scrollY - 20}px`; // Align with bottom
    marker.style.left = `${pRect.right + window.scrollX + 5}px`; // Place just outside

    let popupTimeout;
    marker.addEventListener('mouseenter', () => {
        popupTimeout = setTimeout(() => {
            createPopup(marker, `Question: ${annotation.comment}`);
        }, 300);
    });
    marker.addEventListener('mouseleave', () => {
        clearTimeout(popupTimeout);
        removePopup(marker);
    });

    container.appendChild(marker);
}

// Helper function to check if an element is on a dark background
function isElementOnDarkBackground(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const bgColor = style.backgroundColor;

    // Simple check for RGB(A) color. More robust checks could parse HSL.
    if (bgColor && (bgColor.startsWith('rgb') || bgColor.startsWith('rgba'))) {
        const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
            // Luminance formula to determine brightness
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
        }
    }
    // If background is transparent, check parent
    if (bgColor === 'transparent' || !bgColor) {
        return isElementOnDarkBackground(element.parentElement);
    }
    return false; // Default to light background
}

function createJargonBusterOverlay(range, annotation, container) {
    const rects = range.getClientRects();
    for (const rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
            const overlayElement = document.createElement('div');
            overlayElement.className = 'web-augmenter-overlay-element jargon-buster';

            overlayElement.style.top = `${rect.top + window.scrollY}px`;
            overlayElement.style.left = `${rect.left + window.scrollX}px`;
            overlayElement.style.width = `${rect.width}px`;
            overlayElement.style.height = `${rect.height}px`;

            let popupTimeout;
            overlayElement.addEventListener('mouseenter', () => {
                popupTimeout = setTimeout(() => {
                    createPopup(overlayElement, `Jargon: ${annotation.comment}`);
                }, 300);
            });
            overlayElement.addEventListener('mouseleave', () => {
                clearTimeout(popupTimeout);
                removePopup(overlayElement);
            });

            container.appendChild(overlayElement);
        }
    }
}

function createLiteraryDeviceOverlay(range, annotation, container) {
    const rects = range.getClientRects();
    for (const rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
            const overlayElement = document.createElement('div');
            overlayElement.className = 'web-augmenter-overlay-element literary-device';

            overlayElement.style.top = `${rect.top + window.scrollY}px`;
            overlayElement.style.left = `${rect.left + window.scrollX}px`;
            overlayElement.style.width = `${rect.width}px`;
            overlayElement.style.height = `${rect.height}px`;

            let popupTimeout;
            overlayElement.addEventListener('mouseenter', () => {
                popupTimeout = setTimeout(() => {
                    createPopup(overlayElement, `Literary Device: ${annotation.comment}`);
                }, 300);
            });
            overlayElement.addEventListener('mouseleave', () => {
                clearTimeout(popupTimeout);
                removePopup(overlayElement);
            });

            container.appendChild(overlayElement);
        }
    }
}

function createBiasTrackerOverlay(range, annotation, container) {
    const rects = range.getClientRects();
    for (const rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
            const overlayElement = document.createElement('div');
            overlayElement.className = 'web-augmenter-overlay-element bias-tracker';
            if (annotation.severity) {
                overlayElement.classList.add(`bias-tracker-sev-${annotation.severity}`);
            }

            overlayElement.style.top = `${rect.top + window.scrollY}px`;
            overlayElement.style.left = `${rect.left + window.scrollX}px`;
            overlayElement.style.width = `${rect.width}px`;
            overlayElement.style.height = `${rect.height}px`;

            let popupTimeout;
            overlayElement.addEventListener('mouseenter', () => {
                popupTimeout = setTimeout(() => {
                    createPopup(overlayElement, `Potential Bias: ${annotation.comment}`);
                }, 300);
            });
            overlayElement.addEventListener('mouseleave', () => {
                clearTimeout(popupTimeout);
                removePopup(overlayElement);
            });

            container.appendChild(overlayElement);
        }
    }
}


// --- Generic Popup Creation and Removal Functions ---

let popupRemovalTimeout; // Timer to manage popup removal delay

function createPopup(element, content, url = null) {
  // Clear any pending removals
  clearTimeout(popupRemovalTimeout);

  // Remove any existing popups first
  const existingPopups = document.querySelectorAll('.web-augmenter-popup');
  existingPopups.forEach(p => p.remove());

  const popup = document.createElement('div');
  popup.className = 'web-augmenter-popup';

  // When mouse enters the popup, cancel any pending removal
  popup.addEventListener('mouseenter', () => {
    clearTimeout(popupRemovalTimeout);
  });

  // When mouse leaves the popup, remove it immediately
  popup.addEventListener('mouseleave', () => {
    popup.remove();
  });

  // Populate popup content
  const text = document.createElement('p');
  text.textContent = content;
  text.style.margin = '0';
  text.style.padding = '0';
  popup.appendChild(text);

  if (url) {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = "Read more...";
    link.target = '_blank';
    link.style.color = '#0645ad';
    link.style.display = 'block';
    link.style.marginTop = '8px';
    popup.appendChild(link);
  }

  document.body.appendChild(popup);

  // Position the popup
  const rect = element.getBoundingClientRect();
  let popupTop = rect.bottom + 8;
  let popupLeft = rect.left;

  if (popupLeft + popup.offsetWidth > window.innerWidth - 10) {
    popupLeft = window.innerWidth - popup.offsetWidth - 10;
  }
  if (popupTop + popup.offsetHeight > window.innerHeight - 10) {
    popupTop = rect.top - popup.offsetHeight - 8;
  }
  if (popupTop < 10) popupTop = 10;
  if (popupLeft < 10) popupLeft = 10;

  popup.style.left = `${popupLeft}px`;
  popup.style.top = `${popupTop}px`;

  // Store reference for removal
  element._webAugmenterPopup = popup;
}

function removePopup(element) {
    // Use a timeout to delay the removal, allowing the mouse to move into the popup
    popupRemovalTimeout = setTimeout(() => {
        if (element._webAugmenterPopup) {
            element._webAugmenterPopup.remove();
            element._webAugmenterPopup = null;
        }
    }, 200); // 200ms delay
}


function clearPreviousAugmentations() {
  console.log("Clearing previous augmentations.");
  const overlayContainer = document.getElementById('web-augmenter-overlay-container');
  if (overlayContainer) {
    overlayContainer.remove();
  }
  // Also remove any lingering popups
  const existingPopups = document.querySelectorAll('.web-augmenter-popup');
  existingPopups.forEach(p => p.remove());
}


// Listen for a message from the popup to start processing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzePage") {
    console.log("Content script received analyzePage request from popup.");
    // Clear previous augmentations before applying new ones
    clearPreviousAugmentations();
    processPageForAugmentation();
    sendResponse({status: "processing"});
  }
});
