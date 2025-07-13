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

// Improved helper function to find and replace text in text nodes.
// This version handles text that might be split across multiple nodes or within nested elements.
// It aims to replace only the first occurrence it finds for a given annotation to avoid issues with overlapping annotations.
function findAndReplaceText(parentElement, searchText, replacementNodeCallback) {
  const walker = document.createTreeWalker(parentElement, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      // Skip nodes within scripts, styles, and our own popups
      if (node.parentElement.closest('script, style, .web-augmenter-popup')) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.nodeValue.toLowerCase().includes(searchText.toLowerCase())) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    }
  });

  let node;
  const nodesToProcess = [];
  while (node = walker.nextNode()) {
    nodesToProcess.push(node);
  }

  // Process nodes in reverse order to avoid issues with text node splitting and length changes
  for (let i = nodesToProcess.length - 1; i >= 0; i--) {
    let textNode = nodesToProcess[i];
    let text = textNode.nodeValue;
    let startIndex = text.toLowerCase().indexOf(searchText.toLowerCase());

    if (startIndex !== -1) {
      const matchedText = text.substring(startIndex, startIndex + searchText.length);

      // Create a new span for the replacement
      const replacementNode = replacementNodeCallback(matchedText);

      // Split the text node
      const textBefore = text.substring(0, startIndex);
      const textAfter = text.substring(startIndex + searchText.length);

      // Create new text nodes for before and after parts
      const beforeNode = document.createTextNode(textBefore);
      const afterNode = document.createTextNode(textAfter);

      // Replace the original text node with the new nodes
      const parent = textNode.parentNode;
      if (parent) {
        if (textBefore) {
          parent.insertBefore(beforeNode, textNode);
        }
        parent.insertBefore(replacementNode, textNode);
        if (textAfter) {
          parent.insertBefore(afterNode, textNode);
        }
        parent.removeChild(textNode);
        return true; // Indicate that a replacement was made
      }
    }
  }
  return false; // No replacement made
}


// Function to apply augmentations to the page
function applyAugmentations(analysis) {
  if (!analysis || !analysis.annotations || analysis.annotations.length === 0) {
    console.log("No augmentations to apply.");
    return;
  }

  analysis.annotations.forEach(annotation => {
    console.log("Attempting to apply annotation:", annotation);

    findAndReplaceText(document.body, annotation.textToHighlight, (matchedText) => {
      const span = document.createElement('span');
      span.textContent = matchedText; // Use the actually matched text to preserve case

      if (annotation.type === 'highlight') {
        span.style.backgroundColor = 'yellow';
        span.style.cursor = 'help';
        span.title = annotation.comment;
      } else if (annotation.type === 'popup') {
        span.style.borderBottom = '2px dotted blue';
        span.style.cursor = 'pointer';
        span.classList.add('web-augmenter-annotated'); // Add class for easier targeting

        span.addEventListener('mouseenter', (event) => {
          // Remove any existing popups
          const existingPopups = document.querySelectorAll('.web-augmenter-popup');
          existingPopups.forEach(p => p.remove());

          const popup = document.createElement('div');
          popup.className = 'web-augmenter-popup'; // Class for styling and identification
          popup.textContent = annotation.popupContent || annotation.comment;
          popup.style.position = 'fixed'; // Use fixed for positioning relative to viewport
          popup.style.backgroundColor = 'white';
          popup.style.border = '1px solid black';
          popup.style.borderRadius = '4px';
          popup.style.padding = '8px';
          popup.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
          popup.style.zIndex = '2147483647'; // Max z-index
          popup.style.maxWidth = '300px';
          popup.style.fontSize = '14px'; // Ensure readable font size

          document.body.appendChild(popup);

          // Position popup near the element
          const rect = span.getBoundingClientRect();
          let popupTop = rect.bottom + 5; // Default below
          let popupLeft = rect.left;

          // Adjust if popup goes off screen
          if (popupLeft + popup.offsetWidth > window.innerWidth) {
            popupLeft = window.innerWidth - popup.offsetWidth - 5;
          }
          if (popupTop + popup.offsetHeight > window.innerHeight) {
            popupTop = rect.top - popup.offsetHeight - 5; // Try above
          }
           // Ensure it's not off screen top/left
          if (popupTop < 0) popupTop = 5;
          if (popupLeft < 0) popupLeft = 5;


          popup.style.left = `${popupLeft}px`;
          popup.style.top = `${popupTop}px`;

          span._webAugmenterPopup = popup;
        });

        span.addEventListener('mouseleave', (event) => {
          // Delay removal slightly to allow mouse to move into popup if needed (though not for this simple text popup)
          if (span._webAugmenterPopup) {
             // Check if mouse is over the popup itself
            if (event.relatedTarget !== span._webAugmenterPopup) {
                span._webAugmenterPopup.remove();
                span._webAugmenterPopup = null;
            } else {
                // If mouse moved to popup, add listener to popup to remove when mouse leaves it
                span._webAugmenterPopup.addEventListener('mouseleave', (e) => {
                    if (e.relatedTarget !== span) { // Ensure not moving back to the span
                        span._webAugmenterPopup.remove();
                        span._webAugmenterPopup = null;
                    }
                }, { once: true });
            }
          }
        });

      } else if (annotation.type === 'link') {
        const link = document.createElement('a');
        link.href = annotation.url || '#';
        link.textContent = matchedText;
        link.title = annotation.comment || `Link to ${annotation.url}`;
        link.target = '_blank'; // Open in new tab
        link.style.color = 'blue'; // Example styling
        link.style.textDecoration = 'underline';
        span.innerHTML = ''; // Clear the span
        span.appendChild(link);
      }
      return span;
    });
  });
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
  // This is a bit simplistic. If we wrapped original text nodes, we'd need to unwrap them.
  // For now, if we replace text nodes with spans, we need to restore the original text.
  // This current implementation replaces the text node with a span, so "clearing" means
  // we would need to reload the page or implement a more sophisticated undo mechanism.
  // A simpler approach for now: if spans are just styled text, we can remove the styling or the spans.
  // Let's assume for now that re-running the analysis on the current DOM is acceptable,
  // or that the user will reload if they want a "fresh" analysis.
  // For a better UX, we'd store original nodes and restore them.

  // Remove popups
  const existingPopups = document.querySelectorAll('.web-augmenter-popup');
  existingPopups.forEach(p => p.remove());

  // For highlights and other span-based changes, if we just add classes/styles,
  // we could remove them. Since we are creating new spans and replacing text nodes,
  // a full revert is harder. The current `findAndReplaceText` replaces only the first match,
  // so re-running on an already annotated page might annotate the next occurrence.
  // This will be an area for future improvement (e.g., by marking annotated content
  // or by reverting changes more carefully).
  // For now, let's make `applyAugmentations` idempotent as much as possible by searching the original text.
  // The `findAndReplaceText` function already tries to avoid re-annotating by only processing text nodes
  // and not nodes inside our own popups.
}
