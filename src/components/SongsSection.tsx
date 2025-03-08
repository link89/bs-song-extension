import React from "react";
import { Box, IconButton, Menu, MenuItem, Paper, TextField, Tooltip, Typography } from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { SongDetail, Playlist } from "../type";

export interface SongsSectionProps {
  songsFilter: string;
  setSongsFilter: React.Dispatch<React.SetStateAction<string>>;
  songs: Array<SongDetail>;
  selectedPlaylist: null | Playlist;
  fetchSongs: (playlist: Playlist) => void;
  openSongMenu: (e: React.MouseEvent<HTMLElement>, songId: string) => void;
  songMenuAnchor: HTMLElement | null;
  closeSongMenu: () => void;
  handleRemoveSong: () => void;
  openSongSaveSubMenu: (e: React.MouseEvent<HTMLElement>) => void;
  songSaveMenuAnchor: HTMLElement | null;
  playlists: Array<Playlist>;
  // Also adding closeSongSaveMenu in the props for the submenu
  closeSongSaveMenu: () => void;
  handleSaveSongToPlaylist: (playlistId: string) => void;
}

export const SongsSection: React.FC<SongsSectionProps> = ({
  songsFilter,
  setSongsFilter,
  songs,
  selectedPlaylist,
  fetchSongs,
  openSongMenu,
  songMenuAnchor,
  closeSongMenu,
  handleRemoveSong,
  openSongSaveSubMenu,
  songSaveMenuAnchor,
  playlists,
  closeSongSaveMenu,
  handleSaveSongToPlaylist,
}) => (
  <Paper elevation={3} style={{ padding: 16 }}>
    <Typography gutterBottom>
      <span className="section-title">Songs</span>
    </Typography>
    <Box mb={1} display="flex" alignItems="center">
      <TextField
        label="Filter Songs"
        size="small"
        value={songsFilter}
        onChange={(e) => setSongsFilter(e.target.value)}
        style={{ flexGrow: 1, marginRight: 8 }}
      />
      { /* Refresh button removed */ }
    </Box>
    <Box style={{ height: "300px", overflowY: "auto" }}>
      {selectedPlaylist ? (
        <DragDropContext onDragEnd={(result: DropResult) => { /* ...existing code... */ }}>
          <Droppable droppableId="songs">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {songs
                  .filter(s => s.title.toLowerCase().includes(songsFilter.toLowerCase()))
                  .map((song, index) => (
                    <Draggable key={song.id} draggableId={song.id} index={index}>
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => {}}
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
                            <MusicNoteIcon style={{ width: 40, height: 40 }} />
                          </Box>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Tooltip title={song.title}>
                              <Typography variant="subtitle1" sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}>
                                {song.title}
                              </Typography>
                            </Tooltip>
                            <Typography variant="body2">{song.subTitle}</Typography>
                          </Box>
                          <Box>
                            <IconButton onClick={(e) => openSongMenu(e, song.id)}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : null}
    </Box>
    <Menu 
      anchorEl={songMenuAnchor} 
      open={Boolean(songMenuAnchor)} 
      onClose={closeSongMenu}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <MenuItem onClick={handleRemoveSong}>Remove</MenuItem>
      <MenuItem onMouseEnter={openSongSaveSubMenu}>Save to Playlist</MenuItem>
    </Menu>
    <Menu
      anchorEl={songSaveMenuAnchor}
      open={Boolean(songSaveMenuAnchor)}
      onClose={closeSongSaveMenu}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      {playlists.map(pl => (
        <MenuItem 
          key={pl.id} 
          onClick={() => {
            handleSaveSongToPlaylist(pl.id);
            closeSongSaveMenu();
          }}
        >
          {pl.title}
        </MenuItem>
      ))}
    </Menu>
  </Paper>
);
