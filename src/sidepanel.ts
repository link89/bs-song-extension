// sidepanel.js

document.addEventListener("DOMContentLoaded", async () => {
  const mapsContainer = document.getElementById("maps-container")!;

  // Retrieve stored beatsaver IDs
  const { beatSaverIds = [] } = await chrome.storage.local.get(["beatSaverIds"]);

  if (beatSaverIds.length === 0) {
    mapsContainer.textContent = "No BeatSaver links found on this page.";
    return;
  }

  // Fetch map info from the BeatSaver API for each ID
  for (const id of beatSaverIds) {
    try {
      const response = await fetch(`https://api.beatsaver.com/maps/id/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch map info.");
      }
      const mapInfo = await response.json();

      // Create a card element
      const card = document.createElement("div");
      card.className = "map-card";

      // Populate with map info
      card.innerHTML = `
        <div><strong>ID:</strong> ${id}</div>
        <div><strong>Song Name:</strong> ${mapInfo.name || "Unknown"}</div>
        <button class="save-button">Save to S3</button>
      `;

      // Attach click event for saving
      const saveButton = card.querySelector(".save-button")!;
      saveButton.addEventListener("click", async () => {
        try {
          // Assume the mapInfo object has a versions array with a downloadURL
          const downloadURL = mapInfo.versions?.[0]?.downloadURL || "";
          if (!downloadURL) {
            alert("Download URL not found.");
            return;
          }

          // Download the file
          const songResponse = await fetch(downloadURL);
          if (!songResponse.ok) {
            throw new Error("Failed to download the song file.");
          }
          const songBlob = await songResponse.blob();

          // Upload to S3 (mock example)
          const formData = new FormData();
          formData.append("file", songBlob, `${id}.zip`);

          await fetch("https://your-s3-upload-endpoint.com/upload", {
            method: "POST",
            body: formData
          });

          alert("Song saved successfully to S3!");
        } catch (error) {
          console.error(error);
          alert("Failed to save song to S3.");
        }
      });

      mapsContainer.appendChild(card);
    } catch (err) {
      console.error("Error fetching map info for ID:", id, err);
    }
  }
});