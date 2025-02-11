// background.ts - Service worker script for handling messages and popup tasks.

// This script listens for DOWNLOAD_BS_MAP events from content scripts,
// ensures that the popup window ("Beat Saber Songs Downloader") is open,
// and forwards the event accordingly.

import { DownloadEvent } from "./type";

// Global variable to track the popup window's id.
let popupWindowId: number | null = null;

// Function to create the popup window
function createPopupWindow(callback: (windowId: number) => void) {
  chrome.windows.create({
    url: chrome.runtime.getURL(new URL("popup.html", import.meta.url).pathname),
    type: "normal",
    width: 600,
    height: 500,
  }, (newWindow) => {
    if (newWindow && newWindow.id !== undefined) {
      popupWindowId = newWindow.id;
      // delay the callback to ensure the window is fully loaded
      setTimeout(() => callback(newWindow.id!), 500);
    }
  });
}

// Function to send the event message to the popup tab
function sendMessage(message: DownloadEvent) {
  chrome.tabs.query({ windowId: popupWindowId! }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id!, message);
    }
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message: DownloadEvent, sender, sendResponse) => {
  if (message.type === "DOWNLOAD_BS_MAP") {
    // Check if popup window is already open
    if (popupWindowId !== null) {
      // Try to get the window to check if it still exists
      chrome.windows.get(popupWindowId, (win) => {
        if (chrome.runtime.lastError || !win) {
          // Popup does not exist. Open a new one.
          createPopupWindow((windowId) => sendMessage(message));
        } else {
          // Popup is open; send the event to the popup.
          sendMessage(message);
        }
      });
    } else {
      // No popup recorded; create one.
      createPopupWindow((windowId) => sendMessage(message));
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