import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";


const Manager = AdbDaemonWebUsbDeviceManager.BROWSER!;




async function connectToDevice(): Promise<Adb | null> {
  try {
    // Request a WebUSB device that supports ADB
    const backend = await AdbWebUsbBackend.requestDevice();
    const device = new Adb(backend);
    await device.connect();
    return device;
  } catch (error) {
    console.error("Failed to connect to device:", error);
    return null;
  }
}

async function pushAndUnzipFile(device: Adb, localFilePath: string, remotePath: string) {
  // Push the ZIP file to the Quest
  console.log(`Pushing ${localFilePath} to ${remotePath}`);
  await device.sync.push(localFilePath, remotePath);

  // Run unzip in ADB shell
  console.log(`Unzipping file on device at ${remotePath}`);
  const unzipCommand = `unzip -o "${remotePath}" -d "/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/"`;
  const shellResult = await device.shell(unzipCommand);
  console.log("Unzip command output:", shellResult);
}

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