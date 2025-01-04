const statusDiv = document.getElementById("status") as HTMLDivElement;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "STATUS_UPDATE") {
    statusDiv.textContent = msg.payload;
  }
  sendResponse({});
});
