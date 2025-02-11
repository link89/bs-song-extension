import $ from "jquery";
import { Terminal } from "xterm";
import { AdbService } from "./adb";

import { DownloadEvent } from "./type";
// Global variables to track device connection and work queue

const BSAVER_API_URL = "https://api.beatsaver.com";
const CUSTOM_LEVEL_PATH = "/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/";

const adbService = new AdbService();
const workQueue: DownloadEvent[] = [];

let isDeviceConnected: boolean = false;
let connectedDevice: USBDevice | null = null;

// Initialize the xterm.js terminal
const term = new Terminal({
  cursorBlink: true,
});
term.open(document.getElementById("terminal") as HTMLElement);
term.write("Welcome to Beast Song Extension\r\n");

// Update the device state label
function updateDeviceStateLabel() {
  const $deviceState = $("#deviceState");
  if (isDeviceConnected && connectedDevice) {
    $deviceState.text(`Connected to ${connectedDevice.productName || "Unknown Device"}`);
  } else {
    $deviceState.text("No Device");
  }
}

// Device list update using WebUSB
async function updateDeviceList() {
  try {
    const devices = await navigator.usb.getDevices();
    const $deviceSelect = $("#deviceSelect");
    $deviceSelect.empty();
    $deviceSelect.append($('<option value="">Select Device</option>'));
    devices.forEach(device => {
      // Represent device by productName if available; otherwise, use device information.
      const deviceName = (device.productName) ? device.productName : `Device ${device.serialNumber}`;
      $deviceSelect.append($(`<option value="${device.serialNumber}">${deviceName}</option>`));
    });
  } catch (err) {
    console.error("Error updating device list:", err);
    term.write("Error updating device list.\r\n");
  }
}

async function connectToDevice() {
  await adbService.connect()
}


// Process the work queue
async function processQueue() {
  if (workQueue.length === 0) return;
  term.write(`Processing ${workQueue.length} tasks...\n`);
  
  // Check if device is connected before processing any tasks
  if (!isDeviceConnected) {
    term.write("No device connected. Please select and connect a device.\r\n");
    return;
  }
  
  // Process one task at a time
  const task = workQueue[0];
  term.write(`Processing DOWNLOAD_BS_MAP task for URL: ${task.bsMapId}\r\n`);
  
  // Simulate command execution via adb over the connected device.
  // Here we simply simulate a delay and then remove the task.
  await new Promise(resolve => setTimeout(resolve, 1500));
  term.write(`Task for ${task.bsMapId} completed.\r\n`);
  
  // Remove the completed task from the queue.
  workQueue.shift();
}

// Consumer loop to check and process tasks;
setInterval(processQueue, 500);

// Listen for messages forwarded from the background service worker
chrome.runtime.onMessage.addListener((message: DownloadEvent, sender, sendResponse) => {
  console.log("Message received in popup:", message, sender);
  
  if (message && message.type === "DOWNLOAD_BS_MAP" && message.bsMapId) {
    term.write(`Received DOWNLOAD_BS_MAP event for URL: ${message.bsMapId}\r\n`);
    workQueue.push(message);
  }
  return true;
});

$(document).ready(() => {
  // Populate device list on load.
  updateDeviceList();

  // Handle Connect button click.
  $("#connectDevice").on("click", function () {
    connectToDevice();
  });

  // Update device state label on load.
  updateDeviceStateLabel();
});

// Prompt the user if there are pending tasks when closing the window.
window.addEventListener("beforeunload", (e) => {
  if (workQueue.length > 0) {
    // Standard message may be overridden by the browser.
    const confirmationMessage = "There are pending tasks that will be cancelled if you close this window. Are you sure you want to quit?";
    (e || window.event).returnValue = confirmationMessage; // For legacy browsers.
    return confirmationMessage;
  }
});