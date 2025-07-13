// Background script for the extension
// This script will handle communication between different parts of the extension
// and manage long-lived tasks.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Web Article Augmenter extension installed.");
});

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processPage") {
    // In the future, this is where we would trigger the LLM analysis
    // For now, we'll just log the request and send a mock response
    console.log("Background script received processPage request for tab:", sender.tab.id);
    console.log("Page content (first 100 chars):", request.content.substring(0, 100));

    // Simulate LLM processing delay
    setTimeout(() => {
      const mockLLMResponse = {
        annotations: [
          {
            textToHighlight: "example text", // Text to find and highlight
            comment: "This is an example comment from the LLM.",
            type: "highlight" // 'highlight', 'popup', 'link'
          },
          {
            textToHighlight: "another phrase",
            comment: "This phrase could have a popup with more details.",
            type: "popup",
            popupContent: "Detailed information about 'another phrase'."
          }
        ]
      };
      sendResponse({status: "success", analysis: mockLLMResponse});
    }, 1000);
    return true; // Indicates that the response will be sent asynchronously
  }
});
