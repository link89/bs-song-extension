console.log('bs-song-extension: Content script loaded');
document.addEventListener('click', function(event) {
  let target = event.target as unknown as HTMLElement | null;
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
  }

  if (target && target.tagName === 'A') {
    const href = target.getAttribute('href');
    if (href && href.startsWith('beatsaver://')) {
      event.preventDefault();
      
      // Send message to background script
      const bsMapId = href.split('/').pop();
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_BS_MAP', bsMapId });
    }
  }
});

