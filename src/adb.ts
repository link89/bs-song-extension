import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";


export class AdbService {
  // Ref: https://docs.tangoapp.dev/tango/daemon/
  private manager: AdbDaemonWebUsbDeviceManager;
  private adb?: Adb;
  
  constructor() {
    this.manager = AdbDaemonWebUsbDeviceManager.BROWSER!;
  }

  public async connect(): Promise<Adb> {
    if (this.adb) return this.adb;
    const device = await this.manager.requestDevice();
    if (device) {
      const connection = await device.connect();
      const credentialStore = new AdbWebCredentialStore();
      const transport = await AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore,
      })
      transport.disconnected.then(() => {
        this.adb = undefined;
      });
      this.adb = new Adb(transport);
      return this.adb;
    }
    throw new Error("No device found");
  }
  
  public async pushUrl(url: string, deviceFilePath: string): Promise<string> {
    const adb = await this.connect();
    const sync = await adb.sync();

    const res = await fetch(url);
    // get download url from the response
    if (deviceFilePath.endsWith("/")) {
      const filename = res.headers.get("content-disposition")?.split("filename=")?.[1] || url.split("/").pop();
      deviceFilePath += filename;
    }
    await sync.write({
      file: res.body! as any,
      filename: deviceFilePath,
      permission: 0o644,
    })
    return deviceFilePath;
  }

  public async shell(command: string) {
    const adb = await this.connect();
    return await adb.subprocess.spawnAndWait(command);
  }
}

const adbService = new AdbService();
const BSAVER_API_URL = "https://api.beatsaver.com";
const CUSTOM_LEVEL_PATH = "/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/";