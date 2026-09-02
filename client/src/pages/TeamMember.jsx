import {
  Box, Typography, Card, CardContent, Chip, List, ListItem,
  ListItemIcon, ListItemText, Button, Grid, Divider, Link,
} from '@mui/material';
import { Link as RouterLink, useParams, Navigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getTeamMember, getMemberEmail, PROJECT } from '../constants/team';
import TeamAvatar from '../components/TeamAvatar';

export default function TeamMember() {
  const { slug } = useParams();
  const member = getTeamMember(slug);

  if (!member) {
    return <Navigate to="/team" replace />;
  }

  const email = getMemberEmail(member.id);

  return (
    <Box>
      <Button
        component={RouterLink}
        to="/team"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back to team
      </Button>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              textAlign: 'center',
              borderTop: 4,
              borderColor: 'secondary.main',
              position: 'sticky',
              top: 16,
            }}
          >
            <CardContent sx={{ py: 4 }}>
              <TeamAvatar member={member} size={120} sx={{ mb: 2 }} />
              <Typography variant="h5" component="h1" gutterBottom fontWeight={700}>
                {member.name}
              </Typography>
              <Chip
                label={member.role}
                sx={{ mb: 2, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 600 }}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <BadgeIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Student ID:</strong> {member.id}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <WorkIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Focus:</strong> {member.focus}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="primary" fontSize="small" />
                  <Link href={`mailto:${email}`} underline="hover" color="primary.main">
                    {email}
                  </Link>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
                Project Contributions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {member.name} contributed to the {PROJECT.title} capstone website
                as part of {PROJECT.group}, {PROJECT.unit}.
              </Typography>
              <List dense disablePadding>
                {member.contributions.map((item) => (
                  <ListItem key={item} disableGutters sx={{ alignItems: 'flex-start', py: 0.75 }}>
                    <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                      <CheckCircleOutlineIcon color="secondary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ variant: 'body1' }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button component={RouterLink} to="/team" variant="outlined" color="primary">
              View all team members
            </Button>
            <Button component={RouterLink} to="/about" variant="text" color="primary">
              About the project
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
