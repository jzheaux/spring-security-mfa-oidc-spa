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

// Function to apply augmentations to the page
function applyAugmentations(analysis) {
  if (!analysis || !analysis.annotations || analysis.annotations.length === 0) {
    console.log("No augmentations to apply.");
    return;
  }

  analysis.annotations.forEach(annotation => {
    console.log("Applying annotation:", annotation);
    // This is a placeholder.
    // In the next step, we will implement the actual DOM manipulation
    // to highlight text, create popups, and add links.
    // For now, we'll just log what we would do.

    const elements = findTextNodes(document.body, annotation.textToHighlight);
    elements.forEach(textNode => {
      const parent = textNode.parentNode;
      const highlightedText = annotation.textToHighlight;
      const text = textNode.nodeValue;
      const startIndex = text.indexOf(highlightedText);

      if (startIndex === -1) return;

      const beforeText = text.substring(0, startIndex);
      const afterText = text.substring(startIndex + highlightedText.length);

      if (beforeText) {
        parent.insertBefore(document.createTextNode(beforeText), textNode);
      }

      const span = document.createElement('span');
      span.textContent = highlightedText;

      if (annotation.type === 'highlight') {
        span.style.backgroundColor = 'yellow'; // Simple highlight
        span.title = annotation.comment;
      } else if (annotation.type === 'popup') {
        span.style.borderBottom = '2px dotted blue';
        span.style.cursor = 'pointer';
        span.addEventListener('mouseover', () => {
          // Basic popup - will be improved
          const popup = document.createElement('div');
          popup.textContent = annotation.popupContent || annotation.comment;
          popup.style.position = 'absolute';
          popup.style.backgroundColor = 'white';
          popup.style.border = '1px solid black';
          popup.style.padding = '5px';
          popup.style.zIndex = '10000';
          // Position popup near the element - can be improved
          const rect = span.getBoundingClientRect();
          popup.style.left = `${window.scrollX + rect.left}px`;
          popup.style.top = `${window.scrollY + rect.bottom + 5}px`;
          document.body.appendChild(popup);
          span._popup = popup; // Store reference to remove later
        });
        span.addEventListener('mouseout', () => {
          if (span._popup) {
            span._popup.remove();
            span._popup = null;
          }
        });
      } else if (annotation.type === 'link') {
        const link = document.createElement('a');
        link.href = annotation.url || '#'; // Add a URL property to annotation for links
        link.textContent = highlightedText;
        link.title = annotation.comment;
        link.target = '_blank'; // Open in new tab
        span.innerHTML = ''; // Clear the span
        span.appendChild(link); // Put the link inside the span (or replace span with link)
         // No specific styling for link, but could be added
      }
       parent.insertBefore(span, textNode);
       if (afterText) {
        parent.insertBefore(document.createTextNode(afterText), textNode);
      }
      parent.removeChild(textNode);
    });
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

  const { cleanText, charToDomMap } = createDomTextMapper();
  if (!cleanText || charToDomMap.length === 0) {
    console.log("Could not process page content.");
    return;
  }

  let overlayContainer = document.getElementById('web-augmenter-overlay-container');
  if (!overlayContainer) {
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'web-augmenter-overlay-container';
    overlayContainer.className = 'web-augmenter-overlay-container';
    document.body.appendChild(overlayContainer);
  }

  // Sort annotations to handle longer ones first, preventing nested conflicts
  const sortedAnnotations = analysis.annotations.sort((a, b) => b.textToHighlight.length - a.textToHighlight.length);

  const appliedRanges = []; // Keep track of applied ranges to avoid overlaps

  sortedAnnotations.forEach(annotation => {
    console.log("Processing annotation:", annotation);
    const searchText = annotation.textToHighlight;
    let startIndex = 0;
    let matchIndex;

    // Find all occurrences of the text in the clean string
    while ((matchIndex = cleanText.toLowerCase().indexOf(searchText.toLowerCase(), startIndex)) !== -1) {
      const endIndex = matchIndex + searchText.length - 1;

      // Check if this range overlaps with an already applied one
      const overlaps = appliedRanges.some(r => matchIndex < r.end && endIndex > r.start);
      if (overlaps) {
        startIndex = matchIndex + 1; // Move to the next possible start
        continue;
      }

      // Get DOM mapping for start and end of the match
      const startDomInfo = charToDomMap[matchIndex];
      const endDomInfo = charToDomMap[endIndex];

      if (startDomInfo && endDomInfo) {
        const range = document.createRange();
        range.setStart(startDomInfo.node, startDomInfo.offset);
        range.setEnd(endDomInfo.node, endDomInfo.offset + 1);

        // --- Apply annotation using the created range ---
        if (annotation.category === 'auto-wikipedia') {
          // Conflict check: is the range inside a link or does it contain elements?
          if (range.startContainer.parentElement.closest('a') || range.cloneContents().querySelector('*')) {
            console.log("Skipping 'auto-wikipedia' due to existing link or complex content.");
          } else {
            const link = document.createElement('a');
            link.href = annotation.url;
            link.className = 'auto-wikipedia-link';
            link.title = annotation.comment;
            link.target = '_blank';
            range.surroundContents(link);
          }
        }
        else if (annotation.category === 'fact-checker') {
          const rect = range.getBoundingClientRect();
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

            overlayContainer.appendChild(overlayElement);
          }
        }
      }

      // Mark this range as applied and continue searching from the end of it
      appliedRanges.push({ start: matchIndex, end: endIndex });
      startIndex = endIndex + 1;
    }
  });
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
