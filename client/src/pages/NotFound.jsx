import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" color="primary" fontWeight={700} gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Page not found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        The page you requested does not exist or may have been moved.
      </Typography>
      <Button component={Link} to="/" variant="contained" size="large">
        Return Home
      </Button>
    </Box>
  );
}
