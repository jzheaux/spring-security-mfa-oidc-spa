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

// Finds all occurrences of a searchText and returns their screen coordinates.
// Skips any text found within an existing link (<a> tag).
function findTextAndGetRects(searchText) {
    const rects = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Reject nodes within scripts, styles, and our own UI
                if (node.parentElement.closest('script, style, .web-augmenter-popup, .web-augmenter-overlay-container')) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Reject nodes within links
                if (node.parentElement.closest('a')) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Accept nodes that contain the search text (case-insensitive)
                if (node.nodeValue.toLowerCase().includes(searchText.toLowerCase())) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            },
        }
    );

    let node;
    while ((node = walker.nextNode())) {
        const nodeText = node.nodeValue;
        let startIndex = 0;
        let index;

        // Find all occurrences of searchText in the current node
        while ((index = nodeText.toLowerCase().indexOf(searchText.toLowerCase(), startIndex)) > -1) {
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + searchText.length);

            // Get the bounding rectangles for the range
            const clientRects = range.getBoundingClientRects();
            for (let i = 0; i < clientRects.length; i++) {
                rects.push(clientRects[i]);
            }

            startIndex = index + searchText.length;
        }
    }
    return rects;
}


// Function to apply augmentations to the page
function applyAugmentations(analysis) {
  if (!analysis || !analysis.annotations || analysis.annotations.length === 0) {
    console.log("No augmentations to apply.");
    return;
  }

  let overlayContainer = document.getElementById('web-augmenter-overlay-container');
  if (!overlayContainer) {
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'web-augmenter-overlay-container';
    overlayContainer.className = 'web-augmenter-overlay-container';
    document.body.appendChild(overlayContainer);
  }

  analysis.annotations.forEach(annotation => {
    console.log("Attempting to apply annotation:", annotation);
    const rects = findTextAndGetRects(annotation.textToHighlight);

    rects.forEach(rect => {
      const overlayElement = document.createElement('div');
      overlayElement.className = 'web-augmenter-overlay-element';

      // Position the overlay based on the text's coordinates
      overlayElement.style.top = `${rect.top + window.scrollY}px`;
      overlayElement.style.left = `${rect.left + window.scrollX}px`;
      overlayElement.style.width = `${rect.width}px`;
      overlayElement.style.height = `${rect.height}px`;

      // Apply category-specific styling and attach popups
      if (annotation.category === 'fact-checker') {
        overlayElement.classList.add('fact-check');
        if (annotation.severity) {
          overlayElement.classList.add(`fact-check-sev-${annotation.severity}`);
        }

        // Attach popup listeners
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
      }
      // Note: 'auto-wikipedia' is currently skipped because we don't touch links.
      // If we were to implement it for non-link text, the logic would go here.

      overlayContainer.appendChild(overlayElement);
    });
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
