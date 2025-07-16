chrome.runtime.onInstalled.addListener(() => {
  console.log("Web Article Augmenter extension installed.");
  // --- Context Menu Setup ---
  chrome.contextMenus.create({
    id: "analyzeSelection",
    title: "Analyze Selected Text",
    contexts: ["selection"]
  });
});

// --- System Prompt for the LLM ---
const systemPrompt = `You are an expert text analyst. Your task is to read the user-provided text and identify interesting segments for annotation. For each segment you identify, you must generate an annotation object. You must respond with nothing other than a single, valid JSON object containing a single key, "annotations", which is an array of these annotation objects. Do not limit yourself to one annotation per category; it is expected that you will find multiple instances of each category if they exist in the text.

Each annotation object must have the following properties:
- "category": A string representing the type of annotation. Valid categories are: "auto-wikipedia", "fact-checker", "people-watcher", "tone-detector", "jargon-buster", "literary-device", "bias-tracker", "question-poser", "counter-arguer".
- "textToHighlight": The exact, verbatim text segment from the article that you are annotating.
- "comment": Your analysis, explanation, question, or counter-argument.

Special instructions for specific categories:
- CRITICAL: The value for 'textToHighlight' must be an exact, verbatim substring of the user-provided text. Do not invent, correct, or change any characters, spacing, or punctuation in the text you select for highlighting.
- For "people-watcher": The 'textToHighlight' must ONLY be the person's name, excluding any surrounding titles, descriptions, or punctuation.
- For "question-poser": You are not identifying a question in the text. Instead, you must pose a thoughtful question about the topic in the 'comment' field, using the 'textToHighlight' as an anchor for where the question should appear.
- For "counter-arguer": You are not identifying a counter-argument in the text. Instead, you must present a concise counter-argument in the 'comment' field to the claim made in the 'textToHighlight'.

Additional properties based on category:
- For "auto-wikipedia": an "url" property with the full URL to the relevant Wikipedia page.
- For "fact-checker" and "bias-tracker": a "severity" property, an integer from 1 (mild) to 3 (major).
- For "tone-detector": a "tone" property (e.g., "sarcastic", "formal", "optimistic").

Example of a perfect, complete response. You must follow this structure precisely:
{
  "annotations": [
    {
      "category": "fact-checker",
      "textToHighlight": "the sky is green",
      "comment": "The sky is blue due to Rayleigh scattering.",
      "severity": 3
    },
    {
      "category": "auto-wikipedia",
      "textToHighlight": "Paris",
      "comment": "The capital city of France.",
      "url": "https://en.wikipedia.org/wiki/Paris"
    },
    {
      "category": "people-watcher",
      "textToHighlight": "Jane Smith",
      "comment": "Jane Smith is the newly appointed CEO of ExampleCorp."
    },
    {
      "category": "tone-detector",
      "textToHighlight": "It's just my favorite thing.",
      "comment": "The tone of this sentence is highly sarcastic.",
      "tone": "sarcastic"
    },
    {
      "category": "jargon-buster",
      "textToHighlight": "right-sizing the workforce",
      "comment": "This is corporate jargon for 'laying off employees'."
    },
    {
      "category": "literary-device",
      "textToHighlight": "a velvet whisper",
      "comment": "This is a metaphor, comparing the voice to velvet."
    },
    {
      "category": "bias-tracker",
      "textToHighlight": "Everyone agrees that",
      "comment": "This is an example of the 'bandwagon effect' bias.",
      "severity": 1
    },
    {
      "category": "question-poser",
      "textToHighlight": "the fundamental right to privacy?",
      "comment": "Given the focus on connectivity, has the author considered the impact of the digital divide on equitable access?"
    },
    {
      "category": "counter-arguer",
      "textToHighlight": "complete deregulation.",
      "comment": "A common counter-argument is that some regulations are necessary to protect consumers and prevent market failures."
    }
  ]
}`;


// --- Mock Response (Fallback) ---
const mockLLMResponse = {
  annotations: [
    { category: "auto-wikipedia", textToHighlight: "Paris", comment: "Provides background information on the capital city of France.", url: "https://en.wikipedia.org/wiki/Paris" },
    { category: "fact-checker", textToHighlight: "water boils at 90°C in Paris", comment: "This is only true at high altitudes. At sea level, water boils at 100°C.", severity: 2 },
    { category: "people-watcher", textToHighlight: "Jane Smith", comment: "Jane Smith is the newly appointed CEO of ExampleCorp, known for her work in AI ethics." },
    { category: "tone-detector", textToHighlight: "I just love it when my code, which worked perfectly yesterday, suddenly stops working for no reason at all.", comment: "The tone of this sentence is highly sarcastic.", tone: "sarcastic" },
    { category: "question-poser", textToHighlight: "How do we balance the benefits of a connected world with the fundamental right to privacy?", comment: "Given the focus on connectivity, has the author considered the impact of the digital divide on equitable access?" },
    { category: "tone-detector", textToHighlight: "It's simply wonderful.", comment: "The tone of this sentence is sarcastic.", tone: "sarcastic" },
    { category: "people-watcher", textToHighlight: "John Doe", comment: "John Doe is a placeholder name often used in examples." },
    { category: "jargon-buster", textToHighlight: "right-sizing", comment: "This is corporate jargon for 'laying off employees'." },
    { category: "literary-device", textToHighlight: "velvet whisper", comment: "This is a metaphor, comparing the quality of her voice to the texture of velvet to imply softness and richness." },
    { category: "bias-tracker", textToHighlight: "Everyone agrees that", comment: "This is an example of the 'bandwagon effect' bias.", severity: 1 },
    { category: "bias-tracker", textToHighlight: "Only a fool would ignore", comment: "This is an example of 'loaded language' bias.", severity: 3 },
    { category: "counter-arguer", textToHighlight: "The only viable path to economic success is through complete deregulation.", comment: "A common counter-argument is that some regulations are necessary to protect consumers." }
  ]
};

// --- Reusable Analysis Function ---
async function getAnalysisForText(text) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['openai_api_key'], async function(result) {
      if (result.openai_api_key) {
        console.log("API Key found, calling OpenAI.");
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${result.openai_api_key}`
            },
            body: JSON.stringify({
              model: 'gpt-4-turbo-preview',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Please analyze the following text:\n\n${text}` }
              ],
              response_format: { type: "json_object" }
            })
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          const analysis = JSON.parse(data.choices[0].message.content);
          console.log("Received analysis from OpenAI:", analysis);
          resolve({ status: "success", analysis: analysis });

        } catch (error) {
          console.error("Error calling OpenAI API:", error);
          console.log("Falling back to mock data.");
          resolve({ status: "success", analysis: mockLLMResponse }); // Resolve with mock on error
        }
      } else {
        console.log("No API Key found, using mock data.");
        setTimeout(() => {
          resolve({ status: "success", analysis: mockLLMResponse });
        }, 1000);
      }
    });
  });
}

// --- Event Listeners ---

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "analyzeSelection" && info.selectionText) {
      console.log("Context menu clicked. Analyzing selected text.");
      const analysisResult = await getAnalysisForText(info.selectionText);
      chrome.tabs.sendMessage(tab.id, {
        action: "applyAnalysis",
        analysis: analysisResult.analysis
      });
    }
});

// Listener for messages from the popup (for full page analysis)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processPage") {
    console.log("Received processPage request. Analyzing full page.");
    (async () => {
      const analysisResult = await getAnalysisForText(request.content);
      sendResponse(analysisResult);
    })();
    return true; // Indicates that the response will be sent asynchronously
  }
});
