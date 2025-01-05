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
    // Get the current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab) {
      return;
    }
    const currentUrl = currentTab.url!;
    if (!currentUrl.includes("bsaber.com") || !currentUrl.includes("beatsaver.com")) {
      return;
    }

    const url = downloadItem.finalUrl || downloadItem.url;
    const filename = downloadItem.filename || "";

    // Basic checks for Beat Saber zip
    if (filename.endsWith(".zip")) {
      console.log("Beat Saber map ZIP detected. Attempting ADB push...");

    }
  } catch (error) {
    console.error("Error handling download:", error);
  }
});