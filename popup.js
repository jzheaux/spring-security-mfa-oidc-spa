document.addEventListener('DOMContentLoaded', function() {
  const analyzeButton = document.getElementById('analyzeButton');
  const saveKeyButton = document.getElementById('saveKeyButton');
  const apiKeyInput = document.getElementById('apiKey');
  const statusMessage = document.getElementById('statusMessage');

  // Load the saved API key and display a placeholder if it exists
  chrome.storage.sync.get(['openai_api_key'], function(result) {
    if (result.openai_api_key) {
      apiKeyInput.placeholder = "Key saved (e.g., sk-...)";
    }
  });

  // Save the API key
  saveKeyButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value;
    if (apiKey) {
      chrome.storage.sync.set({ 'openai_api_key': apiKey }, function() {
        console.log('API key saved.');
        statusMessage.textContent = 'API Key saved successfully!';
        apiKeyInput.value = ''; // Clear the input
        apiKeyInput.placeholder = "Key saved (e.g., sk-...)";
        setTimeout(() => { statusMessage.textContent = ''; }, 3000);
      });
    } else {
      statusMessage.textContent = 'Please enter an API key.';
      statusMessage.style.color = 'red';
      setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.style.color = 'green';
      }, 3000);
    }
  });

  // Analyze Page button
  analyzeButton.addEventListener('click', function() {
    analyzeButton.textContent = "Analyzing...";
    analyzeButton.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }
      const activeTab = tabs[0];

      chrome.tabs.sendMessage(activeTab.id, { action: "analyzePage" }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message to content script:", chrome.runtime.lastError.message);
          alert("Could not connect to the page. Please reload the page and try again.");
        } else {
          console.log("Page analysis initiated.");
        }
        window.close(); // Close popup after initiating
      });
    });
  });
});
