import {
  Box, Typography, Grid, Card, CardContent, Button,
} from '@mui/material';
import { Link } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import TeamMemberCard from '../components/TeamMemberCard';
import { PROJECT, TEAM } from '../constants/team';

export default function Team() {
  return (
    <Box>
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          px: 3,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #003366 0%, #004080 55%, #002244 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #C5A572, #D4AF37, #C5A572)',
          },
        }}
      >
        <GroupsIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          Development Team
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 560, mx: 'auto', opacity: 0.9 }}>
          Meet the {PROJECT.group} capstone team behind the {PROJECT.title} website.
          Select a member to view their role, contributions, and contact details.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {TEAM.map((member) => (
          <Grid item xs={12} sm={6} md={3} key={member.slug}>
            <TeamMemberCard member={member} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ bgcolor: 'background.default' }}>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            This website was developed as part of {PROJECT.unit} ({PROJECT.projectNumber})
            at {PROJECT.university}.
          </Typography>
          <Button component={Link} to="/about" variant="outlined" color="primary">
            Learn more about the project
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
