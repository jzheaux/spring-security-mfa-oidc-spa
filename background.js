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
            textToHighlight: "example text",
            comment: "This is an example of a simple highlight.",
            type: "highlight"
          },
          {
            textToHighlight: "another phrase",
            comment: "This is an example of a popup.",
            type: "popup",
            popupContent: "This popup provides more detailed information about the selected phrase."
          },
          {
            textToHighlight: "webpage",
            comment: "This text will be converted into a link.",
            type: "link",
            url: "https://www.google.com" // Example URL
          }
        ]
      };
      sendResponse({status: "success", analysis: mockLLMResponse});
    }, 1000);
    return true; // Indicates that the response will be sent asynchronously
  }
});
