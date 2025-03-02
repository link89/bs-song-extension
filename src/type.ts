export interface DownloadEvent {
  type: "DOWNLOAD_BS_MAP";
  bsMapId: string;
}

export interface Song {
  title: string;
  hash: string;
}

export interface Playlist {
  title: string;
  songs: Song[];
  img: string;  // base64
}
