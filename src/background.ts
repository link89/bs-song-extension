// background.ts - Service worker script for handling messages and popup tasks.

// This script listens for DOWNLOAD_BS_MAP events from content scripts,
// ensures that the popup window ("Beat Saber Songs Downloader") is open,
// and forwards the event accordingly.

import { DownloadEvent } from "./type";

// Global variable to track the popup window's id.
let popupWindowId: number | null = null;

// Updated createPopupWindow to bring an existing window to the foreground.
function createPopupWindow(callback: (windowId: number) => void) {
  if (popupWindowId !== null) {
    chrome.windows.get(popupWindowId, (win) => {
      if (!chrome.runtime.lastError && win) {
        // Bring the existing window to the foreground.
        chrome.windows.update(popupWindowId!, { focused: true }, () => {
          callback(popupWindowId!);
        });
      } else {
        // Window not found, reset and create new.
        popupWindowId = null;
        openNewPopup(callback);
      }
    });
  } else {
    openNewPopup(callback);
  }
}

function openNewPopup(callback: (windowId: number) => void) {
  chrome.windows.create({
    url: chrome.runtime.getURL(new URL("popup.html", import.meta.url).pathname),
    type: "normal",
    width: 900,
    height: 1200,
  }, (newWindow) => {
    if (newWindow && newWindow.id !== undefined) {
      popupWindowId = newWindow.id;
      // delay the callback to ensure the window is fully loaded
      setTimeout(() => callback(newWindow.id!), 500);
    }
  });
}

// Add listener for the extension button click
chrome.action.onClicked.addListener(() => {
	createPopupWindow((windowId) => {
		// Optionally, perform any action after popup creation.
	});
});

// Listen for messages from content scripts
// Only forward event if the popup window is not open yet.
// Otherwise, send the message will be sent from page to the popup directly.
chrome.runtime.onMessage.addListener((message: DownloadEvent, sender, sendResponse) => {
  if (message.type === "DOWNLOAD_BS_MAP") {
    // Check if popup window is already open
    if (popupWindowId !== null) {
      // Try to get the window to check if it still exists
      // FIXME: is this necessary? We already have the window id.
      chrome.windows.get(popupWindowId, (win) => {
        if (chrome.runtime.lastError || !win) {
          // Popup does not exist. Open a new one.
          createPopupWindow((windowId) => chrome.runtime.sendMessage(message));
        } 
      });
    } else {
      // No popup recorded; create one.
      createPopupWindow((windowId) => chrome.runtime.sendMessage(message));
    }
  }
  return true;
});

// Clean up the popupWindowId when the popup is closed.
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    popupWindowId = null;
  }
});


// @ts-ignore
chrome._sendTestEvent = () => {
  // @ts-ignore
  chrome.runtime.onMessage.dispatch({ type: "DOWNLOAD_BS_MAP", bsMapId: "44310" });
};