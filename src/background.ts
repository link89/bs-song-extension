import { AdbDaemonWebUsbDeviceManager, AdbDaemonWebUsbDevice  } from "@yume-chan/adb-daemon-webusb";


export class AdbService {
  // Ref: https://docs.tangoapp.dev/tango/daemon/
  private manager: AdbDaemonWebUsbDeviceManager;
  private device?: AdbDaemonWebUsbDevice;

  constructor() {
    this.manager = AdbDaemonWebUsbDeviceManager.BROWSER!;
  }

  // Example: connect via WebUSB or a direct transport method
  public async connect(): Promise<void> {
    // Implementation using WebUSB or direct AdbDaemonTransport APIs
    this.device = await this.manager.requestDevice();
    if (this.device) {
      await this.device.connect();
    }
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
    return true;
  }
}

const adbService = new AdbService();

// Listen for downloads
chrome.downloads.onCreated.addListener(async downloadItem => {
  try {
    const url = downloadItem.finalUrl || downloadItem.url;
    const filename = downloadItem.filename || "";

    // Basic checks for Beat Saber zip
    if (url.includes("beatsaber") && filename.endsWith(".zip")) {
      console.log("Beat Saber map ZIP detected. Attempting ADB push...");

      // Connect to Quest

      // Wait until the download is complete before pushing
      // You can also listen to onChanged event.
      chrome.downloads.search({ id: downloadItem.id }, async results => {
        if (results && results.length > 0 && results[0].state === "complete") {
          const downloadedPath = results[0].filename;
          const remoteZipPath = "/sdcard/Download/beatmap.zip";

        }
      });
    }
  } catch (error) {
    console.error("Error handling download:", error);
  }
});