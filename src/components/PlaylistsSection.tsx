import React from "react";
import { Box, IconButton, Menu, MenuItem, Paper, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Playlist } from "../type";

export interface PlaylistsSectionProps {
  playlists: Array<Playlist>;
  playlistFilter: string;
  setPlaylistFilter: React.Dispatch<React.SetStateAction<string>>;
  onOpenCreateDialog: () => void;
  fetchPlaylists: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  openPlaylistMenu: (e: React.MouseEvent<HTMLElement>, playlistId: string) => void;
  playlistMenuAnchor: HTMLElement | null;
  closePlaylistMenu: () => void;
  handleDeletePlaylist: () => void;
}

export const PlaylistsSection: React.FC<PlaylistsSectionProps> = ({
  playlists,
  playlistFilter,
  setPlaylistFilter,
  onOpenCreateDialog,
  fetchPlaylists,
  onSelectPlaylist,
  openPlaylistMenu,
  playlistMenuAnchor,
  closePlaylistMenu,
  handleDeletePlaylist,
}) => (
  <Paper elevation={3} style={{ padding: 16 }}>
    <Typography gutterBottom>
      <span className="section-title">Playlists</span>
    </Typography>
    <Box mb={1} display="flex" alignItems="center">
      <TextField
        label="Filter Playlists"
        size="small"
        value={playlistFilter}
        onChange={(e) => setPlaylistFilter(e.target.value)}
        style={{ flexGrow: 1, marginRight: 8 }}
      />
      <IconButton onClick={onOpenCreateDialog}>
        <AddIcon />
      </IconButton>
      <IconButton onClick={fetchPlaylists}>
        <RefreshIcon />
      </IconButton>
    </Box>
    <Box style={{ height: "300px", overflowY: "auto" }}>
      {playlists
        .filter(p => p.title.toLowerCase().includes(playlistFilter.toLowerCase()))
        .map(playlist => (
          <Box
            key={playlist.id || playlist.title}
            onClick={() => onSelectPlaylist(playlist)}
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              height: "60px",
              p: 1,
              mb: 1,
              boxShadow: 1,
              borderRadius: "4px",
              overflow: "hidden"
            }}
          >
            <Box mr={2}>
              {playlist.img ? (
                <img src={playlist.img} alt="cover" width={40} height={40} />
              ) : (
                <Box width={40} height={40} bgcolor="grey.300" />
              )}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Tooltip title={playlist.title}>
                <Typography variant="subtitle1" sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {playlist.title}
                </Typography>
              </Tooltip>
            </Box>
            <Box>
              <IconButton onClick={(e) => openPlaylistMenu(e, playlist.id || playlist.title)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
    </Box>
    <Menu 
      anchorEl={playlistMenuAnchor} 
      open={Boolean(playlistMenuAnchor)} 
      onClose={closePlaylistMenu}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <MenuItem onClick={handleDeletePlaylist}>Delete</MenuItem>
    </Menu>
  </Paper>
);
