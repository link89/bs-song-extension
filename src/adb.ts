import { AdbDaemonWebUsbDeviceManager, AdbDaemonWebUsbDeviceObserver, AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";


export class AdbService {
  // Ref: https://docs.tangoapp.dev/tango/daemon/
  private manager: AdbDaemonWebUsbDeviceManager;
  public observer: AdbDaemonWebUsbDeviceObserver;
  private credentialStore: AdbWebCredentialStore;
  private adb?: Adb;
  public device?: AdbDaemonWebUsbDevice;
  private disconnectListeners: (() => void)[] = [];
  
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

  public onDisconnect(callback: () => void) {
    this.disconnectListeners.push(callback);
  }

  public async connect(): Promise<Adb> {
    if (this.adb) return this.adb;
    this.device = await this.manager.requestDevice();
    if (this.device) {
      const connection = await this.device.connect();
      console.log("Device connected", this.device);
      const transport = await AdbDaemonTransport.authenticate({
        serial: this.device.serial,
        connection,
        credentialStore: this.credentialStore,
      })
      console.log("Authenticated", transport);
      transport.disconnected.then(() => {
        console.log("Device disconnected", this.device);
        this.adb = undefined;
        this.device = undefined;
        this.disconnectListeners.forEach((cb) => cb());
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

  public async pull(deviceFilePath: string): Promise<Uint8Array> {
    const adb = await this.connect();
    const sync = await adb.sync();
    const rs = sync.read(deviceFilePath);
    const chunks: Uint8Array[] = [];
    for await (const chunk of rs) {
      chunks.push(chunk);
    }
    return new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  }
}
