(function() {
  // Get all <a> tags in the page
  const anchorTags = document.querySelectorAll("a[href^='beatsaver://']");

  // Extract the IDs from the links
  const beatSaverIds: string[] = [];
  anchorTags.forEach(a => {
    const url = a.getAttribute("href");
    // Format is beatsaver://{id}
    if (!url) return;
    const id = url.replace("beatsaver://", "");
    beatSaverIds.push(id);
  });

  // Send the IDs to the background/panel script
  if (beatSaverIds.length > 0) {
    chrome.runtime.sendMessage({ type: "foundBeatSaverIds", ids: beatSaverIds });
  }
})();