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
          // Existing annotations for the first paragraph
          {
            category: "auto-wikipedia",
            textToHighlight: "Paris",
            comment: "Provides background information on the capital city of France.",
            url: "https://en.wikipedia.org/wiki/Paris"
          },
          {
            category: "fact-checker",
            textToHighlight: "water boils at 90°C in Paris",
            comment: "This is only true at high altitudes. At sea level, water boils at 100°C.",
            severity: 2
          },
          // New Annotations
          {
            category: "people-watcher",
            textToHighlight: "Jane Smith",
            comment: "Jane Smith is the newly appointed CEO of ExampleCorp, known for her work in AI ethics."
          },
          {
            category: "tone-detector",
            textToHighlight: "I just love it when my code, which worked perfectly yesterday, suddenly stops working for no reason at all.",
            comment: "The tone of this sentence is highly sarcastic.",
            tone: "sarcastic"
          },
          {
            category: "good-question",
            textToHighlight: "How do we balance the benefits of a connected world with the fundamental right to privacy?",
            comment: "Given the focus on connectivity, has the author considered the impact of digital divide on equitable access?"
          },
          // Annotations for the dark-themed section
          {
            category: "tone-detector",
            textToHighlight: "It's simply wonderful.",
            comment: "The tone of this sentence is sarcastic.",
            tone: "sarcastic"
          },
          {
            category: "people-watcher",
            textToHighlight: "John Doe",
            comment: "John Doe is a placeholder name often used in examples."
          },
          // Jargon Buster
          {
            category: "jargon-buster",
            textToHighlight: "right-sizing",
            comment: "This is corporate jargon for 'laying off employees'."
          },
          // Literary Device
          {
            category: "literary-device",
            textToHighlight: "velvet whisper",
            comment: "This is a metaphor, comparing the quality of her voice to the texture of velvet to imply softness and richness."
          },
          // Bias Tracker
          {
            category: "bias-tracker",
            textToHighlight: "Everyone agrees that",
            comment: "This is an example of the 'bandwagon effect' bias. It implies that since everyone supposedly agrees, the reader should too, without providing evidence.\nTo counteract, look for specific evidence or expert opinions rather than appeals to popular belief.",
            severity: 1
          },
          {
              category: "bias-tracker",
              textToHighlight: "Only a fool would ignore",
              comment: "This is an example of 'loaded language' bias. It uses emotionally charged words to influence the reader's opinion.\nTo counteract, focus on the factual claims being made, separating them from the emotional manipulation.",
              severity: 3
          }
        ]
      };
      sendResponse({status: "success", analysis: mockLLMResponse});
    }, 1000);
    return true; // Indicates that the response will be sent asynchronously
  }
});
