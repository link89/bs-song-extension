import $ from "jquery";

let settings = {
  device: {
    // the possbile path for beat saber custom levels
    customLevelPaths: [
      "/storage/emulated/0/ModData/com.beatgames.beatsaber/Mods/CustomSongs",
    ],
    targetPlayList: null,
  },
};

chrome.storage.sync.get(["userSettings"], (data) => {
  if (data.userSettings) {
    settings = data.userSettings;   // overwrite the default settings
  }
});

