import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";


const Manager = AdbDaemonWebUsbDeviceManager.BROWSER!;

// src/adbTransport.ts
// Placeholder for interacting with AdbDaemonTransport as described in your reference:
// https://docs.tangoapp.dev/tango/daemon/

export class AdbTransport {
  private device: any; // Replace 'any' with the proper type if available

  constructor() {
  }

  // Example: connect via WebUSB or a direct transport method
  public async connect(): Promise<void> {
    // Implementation using WebUSB or direct AdbDaemonTransport APIs
    // e.g., requestDevice, open, etc.
    // ...
  }

  // Example: push a file
  public async pushFile(localFilePath: string, deviceFilePath: string): Promise<void> {
    // Use ADB push to transfer the file
    // ...
  }

  // Example: run a shell command
  public async shell(cmd: string): Promise<void> {
    // Use ADB shell to execute a command
    // ...
  }

  // Example: check if connected
  public isConnected(): boolean {
    // Return whether device is connected
    return !!this.device;
  }
}

const adbTransport = new AdbTransport();



// Listen for downloads
chrome.downloads.onCreated.addListener(async downloadItem => {
  try {
    const url = downloadItem.finalUrl || downloadItem.url;
    const filename = downloadItem.filename || "";

    // Basic checks for Beat Saber zip
    if (url.includes("beatsaber") && filename.endsWith(".zip")) {
      console.log("Beat Saber map ZIP detected. Attempting ADB push...");

      // Connect to Quest
      const adbDevice = await connectToDevice();
      if (!adbDevice) {
        console.error("No device connected.");
        return;
      }

      // Wait until the download is complete before pushing
      // You can also listen to onChanged event.
      chrome.downloads.search({ id: downloadItem.id }, async results => {
        if (results && results.length > 0 && results[0].state === "complete") {
          const downloadedPath = results[0].filename;
          const remoteZipPath = "/sdcard/Download/beatmap.zip";

          await pushAndUnzipFile(adbDevice, downloadedPath, remoteZipPath);
        }
      });
    }
  } catch (error) {
    console.error("Error handling download:", error);
  }
});