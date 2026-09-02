import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import EventIcon from '@mui/icons-material/Event';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import useNotifications from '../hooks/useNotifications';

const TYPE_ICONS = {
  verification: VerifiedUserIcon,
  application: AssignmentIcon,
  vote: HowToVoteIcon,
  election: EventIcon,
  results: BarChartIcon,
  admin: AdminPanelSettingsIcon,
};

const PRIORITY_COLORS = {
  high: 'error',
  normal: 'default',
  low: 'info',
};

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Notifications() {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markRead,
    markAllRead,
    isRead,
  } = useNotifications();

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Notifications
          </Typography>
          <Typography color="text.secondary">
            Election updates and account alerts from the website.
          </Typography>
        </Box>
        {notifications.length > 0 && unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadIcon />}
            onClick={markAllRead}
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
          >
            Mark all read
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading notifications" />
        </Box>
      ) : notifications.length === 0 ? (
        <Card elevation={3}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No new notifications
            </Typography>
            <Typography color="text.secondary">
              Election updates and account alerts will appear here when available.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card elevation={2}>
          <List disablePadding>
            {notifications.map((item, index) => {
              const Icon = TYPE_ICONS[item.type] || NotificationsNoneIcon;
              const read = isRead(item.id);
              return (
                <ListItem
                  key={item.id}
                  disablePadding
                  divider={index < notifications.length - 1}
                  sx={{
                    bgcolor: read ? 'transparent' : 'action.hover',
                  }}
                >
                  <ListItemButton
                    component={RouterLink}
                    to={item.link}
                    onClick={() => markRead(item.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 44 }}>
                      <Icon color={read ? 'disabled' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={(
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography
                            component="span"
                            fontWeight={read ? 500 : 700}
                          >
                            {item.title}
                          </Typography>
                          {!read && (
                            <Chip label="New" size="small" color="secondary" sx={{ height: 20 }} />
                          )}
                          {item.priority === 'high' && (
                            <Chip
                              label="Important"
                              size="small"
                              color={PRIORITY_COLORS.high}
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Stack>
                      )}
                      secondary={(
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {item.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.disabled"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {formatTimestamp(item.createdAt)}
                          </Typography>
                        </>
                      )}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Card>
      )}
    </Box>
  );
}
