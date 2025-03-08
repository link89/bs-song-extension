import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  newPlaylistName: string;
  setNewPlaylistName: React.Dispatch<React.SetStateAction<string>>;
  newPlaylistCreator: string;
  setNewPlaylistCreator: React.Dispatch<React.SetStateAction<string>>;
  newPlaylistCover: string;
  setNewPlaylistCover: React.Dispatch<React.SetStateAction<string>>;
  handleCreatePlaylist: () => void;
}

export const CreatePlaylistDialog: React.FC<CreatePlaylistDialogProps> = ({
  open,
  onClose,
  newPlaylistName,
  setNewPlaylistName,
  newPlaylistCreator,
  setNewPlaylistCreator,
  newPlaylistCover,
  setNewPlaylistCover,
  handleCreatePlaylist,
}) => (
  <Dialog open={open} onClose={onClose}>
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
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={handleCreatePlaylist} variant="contained">Create</Button>
    </DialogActions>
  </Dialog>
);
