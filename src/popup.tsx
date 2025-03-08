import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import MoreVertIcon from '@mui/icons-material/MoreVert';  // Added import for 3 dots icon
import MusicNoteIcon from '@mui/icons-material/MusicNote'; // <-- new import added
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import untar from "js-untar";

import { AdbService } from "./adb";
import { Playlist, SongDetail } from "./type";
import { PlaylistsSection } from "./components/PlaylistsSection";
import { SongsSection } from "./components/SongsSection";
import { SettingsDialog } from "./components/SettingsDialog";

const adbService = new AdbService();

const Popup: React.FC = () => {
  // Device Section state, Playlists state, Songs state, etc.
  const [deviceStatus, setDeviceStatus] = useState("No Device");
  const [isConnected, setIsConnected] = useState(false);
  const [playlists, setPlaylists] = useState<Array<Playlist>>([]);
  const [playlistFilter, setPlaylistFilter] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistMenuAnchor, setPlaylistMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPlaylistId, setMenuPlaylistId] = useState<string>("");
  const [songsMap, setSongsMap] = useState<{ [id: string]: SongDetail }>({});
  const [songs, setSongs] = useState<Array<SongDetail>>([]);
  const [songsFilter, setSongsFilter] = useState("");
  const [songMenuAnchor, setSongMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSongId, setMenuSongId] = useState<string>("");
  const [songSaveMenuAnchor, setSongSaveMenuAnchor] = useState<null | HTMLElement>(null);
  const songSaveMenuRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [defaultPlaylist, setDefaultPlaylist] = useState("");
  const [customSongPath, setCustomSongPath] = useState("/sdcard/ModData/com.beatgames.beatsaber/Mods/SongCore/CustomLevels");
  const [customPlaylistsPath, setCustomPlaylistsPath] = useState("/sdcard/ModData/com.beatgames.beatsaber/Mods/PlaylistManager/Playlists");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempDefaultPlaylist, setTempDefaultPlaylist] = useState(defaultPlaylist);
  const [tempCustomSongPath, setTempCustomSongPath] = useState(customSongPath);
  const [tempCustomPlaylistsPath, setTempCustomPlaylistsPath] = useState(customPlaylistsPath);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistCreator, setNewPlaylistCreator] = useState("");
  const [newPlaylistCover, setNewPlaylistCover] = useState("");

  useEffect(() => {
    adbService.onDisconnect(() => {
      setIsConnected(false);
      setDeviceStatus("No Device");
      setPlaylists([]);
      setSongs([]);
      setLogs((prev) => [...prev, "Device disconnected."]);
    });
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const fetchSongsMap = async () => {
    addLog("Fetching all songs...");
    try {
      await adbService.shell(`cd ${customSongPath} && tar -cf ../songs.tar */Info.dat`);
      const tgzBuffer = await adbService.pull(`${customSongPath}/../songs.tar`);
      const files = await untar(tgzBuffer);
      const songsMap = {};
      for (const file of files) {
        console.log(`Parsing ${file.name} ...`);
        try {
          const jsonStr = new TextDecoder().decode(file.buffer);
          const raw = JSON.parse(jsonStr);
          const dirname = file.name.split("/")[0];
          const id = `custom_level_${dirname}`;
          console.log(`Parsed ${id} from ${file.name}`);
          songsMap[id] = {
            id: id,
            title: raw._songName || '',
            subTitle: raw._songSubName,
            author: raw._songAuthorName,
            mapper: raw._levelAuthorName,
            bpm: raw._beatsPerMinute,
            path: `${customSongPath}/${file.name}`,
          };
        } catch (err) {
          addLog(`Error parse ${file.name}: ${err.message}`);
        }
      }
      setSongsMap(songsMap);
      addLog("All songs are loaded.");
    } catch (err) {
      addLog(`Error fetching all songs: ${err.message}`);
    }
  }

  const fetchPlaylists = async () => {
    await fetchSongsMap();
    addLog("Fetching playlists...");
    try {
      await adbService.shell(`cd ${customPlaylistsPath} && tar -cf ../playlists.tar *`);
      const tgzBuffer = await adbService.pull(`${customPlaylistsPath}/../playlists.tar`);
      const files = await untar(tgzBuffer);
      const extractedPlaylists: Playlist[] = files.map((file) => {
        console.log(`Extracting playist ${file.name}`);
        try {
          const jsonStr = new TextDecoder().decode(file.buffer);
          const raw = JSON.parse(jsonStr);
          const path = `${customPlaylistsPath}/${file.name}`;
          return {
            id: path, path: path, title: raw.playlistTitle,
            img: raw.imageString ? 'data:image/png;base64,' + raw.imageString : undefined,
            songs: raw.songs.map((s: any) => {
              const id: string = s.levelid;
              return {
                title: s.songName,
                id,
              }
            }).filter(Boolean),
          } 
        } catch (err) {
          addLog(`Failed to parse ${file.name}: ${err.message}`);
          return null;
        }
      }).filter(Boolean);
      const sorted = extractedPlaylists.sort((a, b) => a.title.localeCompare(b.title));
      setPlaylists(sorted);
      addLog("Playlists are loaded.");
    } catch (err) {
      addLog(`Error fetching playlists: ${err.message}`);
    }
  };

  const fetchSongs = async (playlist: Playlist) => {
    addLog(`Fetching songs for playlist ${playlist.id} ...`);
    for (const song of playlist.songs) {
      if (!songsMap[song.id]) {
        addLog(`Song ${song.id} not found in all songs.`);
      }
    }
    const songs = playlist.songs.map(s => songsMap[s.id]).filter(Boolean);
    setSongs(songs);
  };

  // Device connect button handler
  const handleConnect = async () => {
    try {
      await adbService.connect();
      setIsConnected(true);
      setDeviceStatus(`Connected: ${adbService.device?.name}`);
      fetchPlaylists();
    } catch (err) {
      addLog(`Error connecting to device: ${err.message}`);
    }
  };

  // Playlist menu handlers
  const openPlaylistMenu = (event: React.MouseEvent<HTMLElement>, playlistId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuPlaylistId(playlistId);
    setPlaylistMenuAnchor(event.currentTarget);
  };

  const closePlaylistMenu = () => {
    setPlaylistMenuAnchor(null);
  };

  const handleDeletePlaylist = () => {
    setPlaylists((prev) => prev.filter(p => p.id !== menuPlaylistId));
    addLog(`Deleted playlist ${menuPlaylistId}.`);
    closePlaylistMenu();
  };

  // Song menu handlers
  const openSongMenu = (event: React.MouseEvent<HTMLElement>, songId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuSongId(songId);
    setSongMenuAnchor(event.currentTarget);
  };

  const closeSongMenu = () => {
    setSongMenuAnchor(null);
  };

  const handleRemoveSong = () => {
    setSongs((prev) => prev.filter(s => s.id !== menuSongId));
    addLog(`Removed song ${menuSongId} from playlist.`);
    closeSongMenu();
  };

  const openSongSaveSubMenu = (event: React.MouseEvent<HTMLElement>) => {
    setSongSaveMenuAnchor(event.currentTarget);
  };

  const closeSongSaveMenu = () => {
    setSongSaveMenuAnchor(null);
  };

  const handleSaveSongToPlaylist = (playlistId: string) => {
    addLog(`Saved song ${menuSongId} to playlist ${playlistId}.`);
    closeSongSaveMenu();
  };

  // Handle playlist selection from left list
  const handleSelectPlaylist = (playlist: Playlist) => {
    console.log("Selected playlist", playlist);
    setSelectedPlaylist(playlist);
    fetchSongs(playlist);
  };

  // Handle drag & drop for songs reordering
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(songs);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSongs(reordered);
    addLog("Songs reordered and saved.");
  };

  // Create Playlist Dialog actions
  const handleCreatePlaylist = () => {
    const newPlaylist = {
      id: (Date.now()).toString(),
      name: newPlaylistName,
      creator: newPlaylistCreator,
      coverUrl: newPlaylistCover,
    };
    // setPlaylists((prev) => [...prev, newPlaylist].sort((a, b) => a.title.localeCompare(b.title)));
    addLog(`Created new playlist: ${newPlaylistName}.`);
    setCreateDialogOpen(false);
    setNewPlaylistName("");
    setNewPlaylistCreator("");
    setNewPlaylistCover("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (songSaveMenuRef.current && !songSaveMenuRef.current.contains(event.target as Node)) {
        closeSongSaveMenu();
      }
    };
    if (songSaveMenuAnchor) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [songSaveMenuAnchor]);

  // Settings modal handlers
  const openSettingsModal = () => {
    setTempDefaultPlaylist(defaultPlaylist);
    setTempCustomSongPath(customSongPath);
    setTempCustomPlaylistsPath(customPlaylistsPath);
    setIsSettingsModalOpen(true);
  };

  const handleSettingsSave = () => {
    setDefaultPlaylist(tempDefaultPlaylist);
    setCustomSongPath(tempCustomSongPath);
    setCustomPlaylistsPath(tempCustomPlaylistsPath);
    setIsSettingsModalOpen(false);
    addLog("Settings saved.");
  };

  const handleSettingsCancel = () => {
    setIsSettingsModalOpen(false);
  };

  const DeviceSection = () => (
    <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
      <Grid container>
        <Grid item xs={6}>
          <Typography variant="subtitle1">{deviceStatus}</Typography>
        </Grid>
        <Grid item xs={6} style={{ textAlign: "right" }}>
          <Button variant="contained" onClick={handleConnect} disabled={isConnected}>
            Connect Device
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  const LogSection = () => (
    <Box mt={3}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><span className="section-title">Log</span></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box style={{ maxHeight: 150, overflowY: "auto" }}>
            {logs.map((log, idx) => (
              <Typography variant="caption" key={idx} display="block">{log}</Typography>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const CreatePlaylistDialog = () => (
    <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
      <DialogTitle>Create New Playlist</DialogTitle>
      <DialogContent>
        <TextField
          label="Playlist Name"
          fullWidth
          margin="dense"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
        />
        <TextField
          label="Creator"
          fullWidth
          margin="dense"
          value={newPlaylistCreator}
          onChange={(e) => setNewPlaylistCreator(e.target.value)}
        />
        <TextField
          label="Cover URL (optional)"
          fullWidth
          margin="dense"
          value={newPlaylistCover}
          onChange={(e) => setNewPlaylistCover(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleCreatePlaylist} variant="contained">Create</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" style={{ marginTop: 20 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" gutterBottom>
          <span className="section-title">Beat Saber Song Manager</span>
        </Typography>
        <IconButton onClick={openSettingsModal}>
          <SettingsIcon />
        </IconButton>
      </Box>
      <DeviceSection />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box style={{ pointerEvents: isConnected ? "auto" : "none", opacity: isConnected ? 1 : 0.5 }}>
            <PlaylistsSection
              playlists={playlists}
              playlistFilter={playlistFilter}
              setPlaylistFilter={setPlaylistFilter}
              onOpenCreateDialog={() => setCreateDialogOpen(true)}
              fetchPlaylists={fetchPlaylists}
              onSelectPlaylist={(playlist) => { setSelectedPlaylist(playlist); fetchSongs(playlist); }}
              openPlaylistMenu={openPlaylistMenu}
              playlistMenuAnchor={playlistMenuAnchor}
              closePlaylistMenu={closePlaylistMenu}
              handleDeletePlaylist={handleDeletePlaylist}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box style={{ pointerEvents: isConnected ? "auto" : "none", opacity: isConnected ? 1 : 0.5 }}>
            <SongsSection
              songsFilter={songsFilter}
              setSongsFilter={setSongsFilter}
              songs={songs}
              selectedPlaylist={selectedPlaylist}
              fetchSongs={fetchSongs}
              openSongMenu={openSongMenu}
              songMenuAnchor={songMenuAnchor}
              closeSongMenu={closeSongMenu}
              handleRemoveSong={handleRemoveSong}
              openSongSaveSubMenu={openSongSaveSubMenu}
              songSaveMenuAnchor={songSaveMenuAnchor}
              playlists={playlists}
              closeSongSaveMenu={closeSongSaveMenu}
              handleSaveSongToPlaylist={handleSaveSongToPlaylist}
            />
          </Box>
        </Grid>
      </Grid>
      <LogSection />
      <CreatePlaylistDialog />
      <SettingsDialog
        isOpen={isSettingsModalOpen}
        onClose={handleSettingsCancel}
        onSave={handleSettingsSave}
        playlists={playlists}
        tempDefaultPlaylist={tempDefaultPlaylist}
        setTempDefaultPlaylist={setTempDefaultPlaylist}
        tempCustomSongPath={tempCustomSongPath}
        setTempCustomSongPath={setTempCustomSongPath}
        tempCustomPlaylistsPath={tempCustomPlaylistsPath}
        setTempCustomPlaylistsPath={setTempCustomPlaylistsPath}
      />
    </Container>
  );
};

ReactDOM.render(<Popup />, document.getElementById("root"));
