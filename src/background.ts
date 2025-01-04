import { AdbDaemonWebUsbDeviceManager, AdbDaemonWebUsbConnection} from "@yume-chan/adb-daemon-webusb";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";



export class AdbService {
  // Ref: https://docs.tangoapp.dev/tango/daemon/
  private manager: AdbDaemonWebUsbDeviceManager;
  private adb?: Adb;
  
  constructor() {
    this.manager = AdbDaemonWebUsbDeviceManager.BROWSER!;
  }

  public async connect(): Promise<void> {
    const device = await this.manager.requestDevice();
    if (device) {
      const connection = await device.connect();
      const credentialStore = new AdbWebCredentialStore();
      const transport = await AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore,
      })
      this.adb = new Adb(transport);
    }
  }
  

  public async pushFile(localFilePath: string, deviceFilePath: string): Promise<void> {
    if (this.adb) {
    }
  }

  public async shell(cmd: string): Promise<void> {
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