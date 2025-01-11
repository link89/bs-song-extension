chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SCAN_BS_MAPS") {
    const bsMapIds = Array.from(document.querySelectorAll("a"))
      .map(a => a.href)
      .filter(href => href.startsWith("beatsaver://"))
      .map(href => new URL(href).pathname.split("/").pop());
    sendResponse({ bsMapIds });
  }
});
