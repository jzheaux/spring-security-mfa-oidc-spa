document.addEventListener('DOMContentLoaded', function() {
  const analyzeButton = document.getElementById('analyzeButton');

  analyzeButton.addEventListener('click', function() {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }
      const activeTab = tabs[0];
      console.log("Sending analyzePage message to tab:", activeTab.id);

      // Send a message to the content script in the active tab
      chrome.tabs.sendMessage(activeTab.id, { action: "analyzePage" }, function(response) {
        if (chrome.runtime.lastError) {
          // This error often means the content script hasn't been injected yet or the page is restricted.
          console.error("Error sending message to content script:", chrome.runtime.lastError.message);
          // Optionally, inform the user in the popup
          // document.body.innerHTML += "<p>Error: Could not connect to the page. Try reloading the page or the extension.</p>";
          if (chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
            alert("The content script is not running on this page. Please reload the page or try a different page. Some pages (e.g., browser's own pages like chrome://extensions) do not allow content scripts.");
          }
        } else if (response && response.status === "processing") {
          console.log("Page analysis initiated by content script.");
          // Optionally, provide feedback in the popup
          // analyzeButton.textContent = "Processing...";
          // analyzeButton.disabled = true;
          window.close(); // Close popup after initiating
        } else {
          console.warn("Unexpected response from content script or no response:", response);
        }
      });
    });
  });
});
