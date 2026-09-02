import { useEffect } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useNotifications from '../hooks/useNotifications';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, refresh } = useNotifications();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return undefined;
    const token = localStorage.getItem('token');
    const socket = io('/', {
      path: '/socket.io',
      withCredentials: true,
      auth: token ? { token } : undefined,
    });

    socket.on('notification:new', (payload) => {
      refresh();
      if (payload?.title) {
        showToast(payload.message || payload.title, 'info');
      }
    });

    return () => { socket.disconnect(); };
  }, [user, refresh, showToast]);

  if (!user) return null;

  return (
    <Tooltip title="Notifications">
      <IconButton
        color="inherit"
        onClick={() => navigate('/notifications')}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        sx={{ ml: 0.5 }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsNoneIcon sx={{ color: 'secondary.main' }} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
