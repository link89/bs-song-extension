import React from "react";
import { Paper, Grid, Typography, Button } from "@mui/material";

interface DeviceSessionProps {
  deviceStatus: string;
  isConnected: boolean;
  handleConnect: () => void;
}

export const DeviceSession: React.FC<DeviceSessionProps> = ({
  deviceStatus,
  isConnected,
  handleConnect,
}) => (
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
