import { AdbDaemonWebUsbDeviceManager, AdbDaemonWebUsbDeviceObserver } from "@yume-chan/adb-daemon-webusb";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";


export class AdbService {
  // Ref: https://docs.tangoapp.dev/tango/daemon/
  private manager: AdbDaemonWebUsbDeviceManager;
  public observer: AdbDaemonWebUsbDeviceObserver;
  private credentialStore: AdbWebCredentialStore;
  private adb?: Adb;
  
  constructor() {
    this.manager = AdbDaemonWebUsbDeviceManager.BROWSER!;
    this.observer = this.manager.trackDevices();
    this.credentialStore = new AdbWebCredentialStore();
    this.observer.onDeviceAdd((devices) => {
      console.log("Device added", devices);
    });
    this.observer.onDeviceRemove((devices) => {
      console.log("Device removed", devices);
    });
    this.observer.onListChange((devices) => {
      console.log("Device list changed", devices);
    });
  }
  
  public async connect(): Promise<Adb> {
    if (this.adb) return this.adb;
    const device = await this.manager.requestDevice();
    if (device) {
      const connection = await device.connect();
      console.log("Device connected", device);
      const transport = await AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore: this.credentialStore,
      })
      transport.disconnected.then(() => {
        console.log("Device disconnected", device);
        this.adb = undefined;
      });
      this.adb = new Adb(transport);
      // test connection
      const ret = await this.adb.subprocess.spawnAndWait("echo connected");
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
