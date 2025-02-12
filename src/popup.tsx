import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { AdbService } from "./adb";

const adbService = new AdbService();

// Fake data for demonstration
const fakePlaylists = [
  { id: "1", name: "Chill Vibes", creator: "Alice", coverUrl: "" },
  { id: "2", name: "Workout Mix", creator: "Bob", coverUrl: "" },
  { id: "3", name: "Top Hits", creator: "Charlie", coverUrl: "" },
];
const fakeSongs = {
  "1": [
    { id: "s1", name: "Song A", artist: "Artist A", coverUrl: "" },
    { id: "s2", name: "Song B", artist: "Artist B", coverUrl: "" },
  ],
  "2": [
    { id: "s3", name: "Song C", artist: "Artist C", coverUrl: "" },
    { id: "s4", name: "Song D", artist: "Artist D", coverUrl: "" },
  ],
  "3": [
    { id: "s5", name: "Song E", artist: "Artist E", coverUrl: "" },
    { id: "s6", name: "Song F", artist: "Artist F", coverUrl: "" },
  ]
};

const Popup: React.FC = () => {
  // Device Section state
  const [deviceStatus, setDeviceStatus] = useState("No Device");
  const [isConnected, setIsConnected] = useState(false);

  // Playlists state
  const [playlists, setPlaylists] = useState<Array<any>>([]);
  const [playlistFilter, setPlaylistFilter] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistMenuAnchor, setPlaylistMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPlaylistId, setMenuPlaylistId] = useState<string>("");

  // Songs list state
  const [songs, setSongs] = useState<Array<any>>([]);
  const [songsFilter, setSongsFilter] = useState("");
  const [songMenuAnchor, setSongMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSongId, setMenuSongId] = useState<string>("");
  const [songSaveMenuAnchor, setSongSaveMenuAnchor] = useState<null | HTMLElement>(null);

  // Log state
  const [logs, setLogs] = useState<string[]>(["App started."]);

  // Settings state
  const [defaultPlaylist, setDefaultPlaylist] = useState("");
  const [customSongPath, setCustomSongPath] = useState("/sdcard/Music/");
  const [customPlaylistsPath, setCustomPlaylistsPath] = useState("/sdcard/Playlists/");
  const [editingSongPath, setEditingSongPath] = useState(false);
  const [editingPlaylistPath, setEditingPlaylistPath] = useState(false);

  // Create Playlist Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistCreator, setNewPlaylistCreator] = useState("");
  const [newPlaylistCover, setNewPlaylistCover] = useState("");

  // Effect: Subscribe to device list change
  useEffect(() => {
    adbService.observer.onListChange((devices: any[]) => {
      if (devices.length > 0) {
        setDeviceStatus(`Connected: ${devices.map(d => d.productName).join(", ")}`);
        setIsConnected(true);
        addLog(`Device connected: ${devices.map(d => d.productName).join(", ")}`);
      } else {
        setDeviceStatus("No Device");
        setIsConnected(false);
        addLog("No device connected.");
      }
    });
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  // Simulate fetch playlists
  const fetchPlaylists = () => {
    addLog("Fetching playlists...");
    setTimeout(() => {
      const sorted = fakePlaylists.sort((a, b) => a.name.localeCompare(b.name));
      setPlaylists(sorted);
      addLog("Playlists loaded.");
    }, 1000);
  };

  // Simulate fetch songs for a playlist
  const fetchSongs = (playlistId: string) => {
    addLog(`Fetching songs for playlist ${playlistId}...`);
    setTimeout(() => {
      setSongs(fakeSongs[playlistId] || []);
      addLog(`Songs for playlist ${playlistId} loaded.`);
    }, 1000);
  };

  // Device connect button handler
  const handleConnect = async () => {
    try {
      await adbService.connect();
      setIsConnected(true);
      setDeviceStatus("Connected (Simulated)");
      addLog("Device connected via adbService.");
      // After connection, fetch playlists automatically.
      fetchPlaylists();
    } catch (err) {
      addLog("Failed to connect device.");
    }
  };

  // Playlist menu handlers
  const openPlaylistMenu = (event: React.MouseEvent<HTMLElement>, playlistId: string) => {
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

  const openSongSaveMenu = (event: React.MouseEvent<HTMLElement>) => {
    setSongSaveMenuAnchor(event.currentTarget);
    closeSongMenu();
  };

  const closeSongSaveMenu = () => {
    setSongSaveMenuAnchor(null);
  };

  const handleSaveSongToPlaylist = (playlistId: string) => {
    addLog(`Saved song ${menuSongId} to playlist ${playlistId}.`);
    closeSongSaveMenu();
  };

  // Handle playlist selection from left list
  const handleSelectPlaylist = (playlist: any) => {
    setSelectedPlaylist(playlist);
    fetchSongs(playlist.id);
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
    setPlaylists((prev) => [...prev, newPlaylist].sort((a, b) => a.name.localeCompare(b.name)));
    addLog(`Created new playlist: ${newPlaylistName}.`);
    setCreateDialogOpen(false);
    setNewPlaylistName("");
    setNewPlaylistCreator("");
    setNewPlaylistCover("");
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: 20 }}>
      <Typography variant="h4" gutterBottom>
        Beat Saber Song Manager
      </Typography>

      {/* Device Section */}
      <Box mb={3} p={2} border={1} borderRadius={4}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="subtitle1">{deviceStatus}</Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={handleConnect}>
              Connect Device
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Songs and Playlists Section */}
      <Grid container spacing={2}>
        {/* Playlists List */}
        <Grid item xs={4}>
          <Box mb={1} display="flex" alignItems="center">
            <TextField
              label="Filter Playlists"
              size="small"
              value={playlistFilter}
              onChange={(e) => setPlaylistFilter(e.target.value)}
              style={{ flexGrow: 1, marginRight: 8 }}
            />
            <IconButton onClick={() => setCreateDialogOpen(true)}>
              <AddIcon />
            </IconButton>
            <IconButton onClick={fetchPlaylists}>
              <RefreshIcon />
            </IconButton>
          </Box>
          <Box border={1} borderRadius={4} p={1} style={{ maxHeight: 300, overflowY: "auto" }}>
            {playlists
              .filter(p => p.name.toLowerCase().includes(playlistFilter.toLowerCase()))
              .map(playlist => (
                <Box
                  key={playlist.id}
                  p={1}
                  mb={1}
                  border={1}
                  borderRadius={4}
                  onClick={() => handleSelectPlaylist(playlist)}
                  sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <Box mr={2}>
                    {playlist.coverUrl ? (
                      <img src={playlist.coverUrl} alt="cover" width={40} height={40} />
                    ) : (
                      <Box width={40} height={40} bgcolor="grey.300" />
                    )}
                  </Box>
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1">{playlist.name}</Typography>
                    <Typography variant="caption">{playlist.creator}</Typography>
                  </Box>
                  <IconButton onClick={(e) => { e.stopPropagation(); openPlaylistMenu(e, playlist.id); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
          </Box>
          <Menu anchorEl={playlistMenuAnchor} open={Boolean(playlistMenuAnchor)} onClose={closePlaylistMenu}>
            <MenuItem onClick={handleDeletePlaylist}>Delete</MenuItem>
          </Menu>
        </Grid>

        {/* Songs List */}
        <Grid item xs={8}>
          <Box mb={1} display="flex" alignItems="center">
            <TextField
              label="Filter Songs"
              size="small"
              value={songsFilter}
              onChange={(e) => setSongsFilter(e.target.value)}
              style={{ flexGrow: 1, marginRight: 8 }}
            />
            <IconButton onClick={() => selectedPlaylist && fetchSongs(selectedPlaylist.id)}>
              <RefreshIcon />
            </IconButton>
          </Box>
          <Box border={1} borderRadius={4} p={1} style={{ maxHeight: 300, overflowY: "auto" }}>
            {selectedPlaylist ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="songs">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {songs
                        .filter(s => s.name.toLowerCase().includes(songsFilter.toLowerCase()))
                        .map((song, index) => (
                          <Draggable key={song.id} draggableId={song.id} index={index}>
                            {(provided) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                p={1}
                                mb={1}
                                border={1}
                                borderRadius={4}
                                display="flex"
                                alignItems="center"
                              >
                                <Box mr={2}>
                                  {song.coverUrl ? (
                                    <img src={song.coverUrl} alt="cover" width={40} height={40} />
                                  ) : (
                                    <Box width={40} height={40} bgcolor="grey.300" />
                                  )}
                                </Box>
                                <Box flexGrow={1}>
                                  <Typography variant="subtitle1">{song.name}</Typography>
                                  <Typography variant="caption">{song.artist}</Typography>
                                </Box>
                                <IconButton onClick={(e) => { e.stopPropagation(); openSongMenu(e, song.id); }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <Typography variant="body2">No playlist selected</Typography>
            )}
          </Box>
          <Menu anchorEl={songMenuAnchor} open={Boolean(songMenuAnchor)} onClose={closeSongMenu}>
            <MenuItem onClick={handleRemoveSong}>Remove</MenuItem>
            <MenuItem onClick={openSongSaveMenu}>Save to Playlist</MenuItem>
          </Menu>
          <Menu anchorEl={songSaveMenuAnchor} open={Boolean(songSaveMenuAnchor)} onClose={closeSongSaveMenu}>
            {playlists.map(pl => (
              <MenuItem key={pl.id} onClick={() => handleSaveSongToPlaylist(pl.id)}>
                {pl.name}
              </MenuItem>
            ))}
          </Menu>
        </Grid>
      </Grid>

      {/* Log Section */}
      <Box mt={3}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Log</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box style={{ maxHeight: 150, overflowY: "auto" }}>
              {logs.map((log, idx) => (
                <Typography variant="caption" key={idx} display="block">
                  {log}
                </Typography>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Settings Section */}
      <Box mt={3}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Default Playlist</InputLabel>
                  <Select
                    label="Default Playlist"
                    value={defaultPlaylist}
                    onChange={(e) => setDefaultPlaylist(e.target.value)}
                  >
                    {playlists.map(pl => (
                      <MenuItem key={pl.id} value={pl.id}>{pl.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                {editingSongPath ? (
                  <TextField
                    label="Custom Song Path"
                    size="small"
                    value={customSongPath}
                    onChange={(e) => setCustomSongPath(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setEditingSongPath(false)}><CheckIcon /></IconButton>
                          <IconButton onClick={() => setEditingSongPath(false)}><CloseIcon /></IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                ) : (
                  <Box display="flex" alignItems="center">
                    <Typography>Song Path: {customSongPath}</Typography>
                    <IconButton onClick={() => setEditingSongPath(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Grid>
              <Grid item xs={4}>
                {editingPlaylistPath ? (
                  <TextField
                    label="Custom Playlists Path"
                    size="small"
                    value={customPlaylistsPath}
                    onChange={(e) => setCustomPlaylistsPath(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setEditingPlaylistPath(false)}><CheckIcon /></IconButton>
                          <IconButton onClick={() => setEditingPlaylistPath(false)}><CloseIcon /></IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                ) : (
                  <Box display="flex" alignItems="center">
                    <Typography>Playlists Path: {customPlaylistsPath}</Typography>
                    <IconButton onClick={() => setEditingPlaylistPath(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Create Playlist Dialog */}
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
    </Container>
  );
};

ReactDOM.render(<Popup />, document.getElementById("root"));
