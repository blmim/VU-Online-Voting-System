import { useState } from 'react';
import {
  Avatar, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, Stack, Typography,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { VU_GOLD } from '../theme';

export default function ManifestoCompare({ candidates }) {
  const [open, setOpen] = useState(false);
  const list = candidates?.filter((c) => c.manifesto) || [];

  if (list.length < 2) return null;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CompareArrowsIcon />}
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        Compare manifestos
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Candidate manifesto comparison</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {list.slice(0, 4).map((c) => (
              <Grid item xs={12} sm={6} key={c._id}>
                <Card variant="outlined" sx={{ height: '100%', borderTop: `3px solid ${VU_GOLD}` }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                      <Avatar src={c.photoUrl || undefined} alt="" sx={{ width: 48, height: 48 }} />
                      <Typography variant="subtitle1" fontWeight={700}>{c.displayName}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {c.manifesto}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
