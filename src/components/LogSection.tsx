import React from "react";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface LogSectionProps {
  logs: string[];
}

export const LogSection: React.FC<LogSectionProps> = ({ logs }) => (
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
