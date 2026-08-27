import {
  Box, Container, Typography, Link, Divider, Grid,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PROJECT, TEAM } from '../constants/team';
import VuLogo from './VuLogo';

export default function Footer() {
  return (
    <Box
      component="footer"
      role="contentinfo"
      sx={{
        mt: 'auto',
        background: 'linear-gradient(180deg, #002244 0%, #003366 100%)',
        color: 'primary.contrastText',
        borderTop: '3px solid',
        borderColor: 'secondary.main',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={4} sx={{ mb: 3 }}>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <VuLogo height={56} onDark />
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={700}>
                  {PROJECT.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {PROJECT.university}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.7 }}>
              {PROJECT.fullName} ({PROJECT.projectNumber})
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {PROJECT.unit} · {PROJECT.group}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Block 4, Semester 1 {PROJECT.year}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'secondary.main', fontWeight: 700 }}>
              Quick Links
            </Typography>
            {[
              { to: '/', label: 'Home' },
              { to: '/about', label: 'About & Credits' },
              { to: '/team', label: 'Development Team' },
              { to: '/live', label: 'Live Results' },
              { to: '/help', label: 'Help & FAQ' },
              { to: '/login', label: 'Login' },
              { to: '/register', label: 'Register' },
            ].map((item) => (
              <Typography variant="body2" key={item.to} sx={{ mb: 0.5 }}>
                <Link component={RouterLink} to={item.to} color="inherit" underline="hover" sx={{ opacity: 0.9 }}>
                  {item.label}
                </Link>
              </Typography>
            ))}
            {PROJECT.github ? (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <Link href={PROJECT.github} color="inherit" underline="hover" target="_blank" rel="noopener noreferrer" sx={{ opacity: 0.9 }}>
                  GitHub Repository
                </Link>
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.7 }}>
                GitHub Repository (link pending upload)
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'secondary.main', fontWeight: 700 }}>
              Development Team
            </Typography>
            {TEAM.map((member) => (
              <Box key={member.slug} sx={{ mb: 1.5 }}>
                <Link
                  component={RouterLink}
                  to={`/team/${member.slug}`}
                  color="inherit"
                  underline="hover"
                  sx={{ fontWeight: 600, display: 'block', opacity: 0.95 }}
                >
                  {member.name}
                </Link>
                <Typography variant="caption" sx={{ opacity: 0.75, display: 'block' }}>
                  {member.id} · {member.role}
                </Typography>
              </Box>
            ))}
            <Link
              component={RouterLink}
              to="/team"
              underline="hover"
              sx={{ color: 'secondary.main', fontWeight: 600, fontSize: '0.875rem', mt: 1, display: 'inline-block' }}
            >
              View all profiles →
            </Link>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 2 }} />

        <Typography variant="caption" display="block" sx={{ opacity: 0.7, textAlign: 'center' }}>
          © {PROJECT.year} {PROJECT.university} — NIT3003 Capstone Submission · {PROJECT.group}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.65, textAlign: 'center' }}>
          Elections support: elections@vu.edu.au · Block 4, Level 3 Student Services
        </Typography>
      </Container>
    </Box>
  );
}
