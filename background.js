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
            category: "auto-wikipedia",
            textToHighlight: "Paris",
            comment: "Provides background information on the capital city of France.",
            url: "https://en.wikipedia.org/wiki/Paris"
          },
          {
            category: "fact-checker",
            textToHighlight: "the moon is made of cheese",
            comment: "This is a common misconception. The moon is composed of rock and minerals.",
            severity: 3 // Major misinformation
          },
          {
            category: "fact-checker",
            textToHighlight: "water boils at 90°C",
            comment: "This is only true at high altitudes. At sea level, water boils at 100°C.",
            severity: 1 // Mild misinformation
          }
        ]
      };
      sendResponse({status: "success", analysis: mockLLMResponse});
    }, 1000);
    return true; // Indicates that the response will be sent asynchronously
  }
});
