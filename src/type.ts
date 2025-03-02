export interface DownloadEvent {
  type: "DOWNLOAD_BS_MAP";
  bsMapId: string;
}

export interface Song {
  title: string;
  levelId: string;
}

export interface Playlist {
  title: string;
  songs: Song[];
  img?: string;  // base64
  path: string;
}

export interface SongDetail extends Song {
  subTitle: string;
  author: string;
  mapper: string;
  bpm: number;
  path: string;
}