import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, FormControl, InputLabel, Select, MenuItem, TextField, Button } from "@mui/material";
import { Playlist } from "../type";

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  playlists: Array<Playlist>;
  tempDefaultPlaylist: string;
  setTempDefaultPlaylist: React.Dispatch<React.SetStateAction<string>>;
  tempCustomSongPath: string;
  setTempCustomSongPath: React.Dispatch<React.SetStateAction<string>>;
  tempCustomPlaylistsPath: string;
  setTempCustomPlaylistsPath: React.Dispatch<React.SetStateAction<string>>;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  playlists,
  tempDefaultPlaylist,
  setTempDefaultPlaylist,
  tempCustomSongPath,
  setTempCustomSongPath,
  tempCustomPlaylistsPath,
  setTempCustomPlaylistsPath,
}) => (
  <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>Settings</DialogTitle>
    <DialogContent>
      <Box mt={1}>
        <FormControl fullWidth size="small" variant="outlined" margin="dense">
          <InputLabel id="default-playlist-label">Default Playlist</InputLabel>
          <Select
            labelId="default-playlist-label"
            value={tempDefaultPlaylist}
            label="Default Playlist"
            onChange={(e) => setTempDefaultPlaylist(e.target.value as string)}
          >
            {playlists.map(pl => (
              <MenuItem key={pl.id || pl.title} value={pl.id || pl.title}>
                {pl.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box mt={2}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          label="Custom Song Path"
          value={tempCustomSongPath}
          onChange={(e) => setTempCustomSongPath(e.target.value)}
          margin="dense"
        />
      </Box>
      <Box mt={2}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          label="Custom Playlists Path"
          value={tempCustomPlaylistsPath}
          onChange={(e) => setTempCustomPlaylistsPath(e.target.value)}
          margin="dense"
        />
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSave} variant="contained">Save</Button>
    </DialogActions>
  </Dialog>
);
