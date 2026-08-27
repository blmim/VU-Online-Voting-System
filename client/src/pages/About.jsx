import {
  Box, Typography, Card, CardContent, Chip, Grid, Button, Divider,
} from '@mui/material';
import { Link } from 'react-router-dom';
import CodeIcon from '@mui/icons-material/Code';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import VuLogo from '../components/VuLogo';
import TeamMemberCard from '../components/TeamMemberCard';
import { PROJECT, TEAM } from '../constants/team';

export default function About() {
  return (
    <Box>
      <Box
        sx={{
          textAlign: 'center',
          mb: 5,
          py: 4,
          px: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 2px 16px rgba(0,51,102,0.08)',
          borderTop: 4,
          borderColor: 'secondary.main',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <VuLogo height={72} />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight={700}>
          About This Project
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {PROJECT.university} · {PROJECT.unit}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CodeIcon color="primary" />
                <Typography variant="h6" color="primary" fontWeight={600}>
                  Project Overview
                </Typography>
              </Box>
              <Typography variant="body1" paragraph lineHeight={1.7}>
                {PROJECT.fullName} is a secure, accessible digital platform for campus
                student representative council (SRC) elections at Victoria University Sydney.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph lineHeight={1.7}>
                Built as part of {PROJECT.unit} ({PROJECT.projectNumber}), this MERN stack
                website supports voter registration with VU identity verification, candidate
                applications, real-time public results, and comprehensive audit logging.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label={PROJECT.projectNumber} color="primary" size="small" />
                <Chip label={PROJECT.group} variant="outlined" size="small" />
                <Chip label={`Semester 1 ${PROJECT.year}`} variant="outlined" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderLeft: 4, borderColor: 'secondary.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SchoolIcon color="secondary" />
                <Typography variant="h6" color="primary" fontWeight={600}>
                  Institution
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom fontWeight={600}>
                {PROJECT.university}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Unit: {PROJECT.unit}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Academic Year: Block 4, Semester 1 {PROJECT.year}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Official branding colours: Victoria University navy (#003366) and gold (#D4AF37).
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <GroupsIcon color="primary" />
        <Typography variant="h5" component="h2" color="primary" fontWeight={700}>
          Development Team
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Click a team member to view their profile, contributions, and VU email contact.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {TEAM.map((member) => (
          <Grid item xs={12} sm={6} md={3} key={member.slug}>
            <TeamMemberCard member={member} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center' }}>
        <Button component={Link} to="/team" variant="contained" color="primary">
          View team page
        </Button>
      </Box>
    </Box>
  );
}
