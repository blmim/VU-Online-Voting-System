import { useState } from 'react';
import {
  Avatar, Badge, Box, Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { getTeamMemberByStudentId } from '../constants/team';
import useNotifications from '../hooks/useNotifications';

export function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarSrc(user) {
  if (user?.profilePhoto || user?.avatarUrl || user?.profileImageUrl) {
    return user.profilePhoto || user.avatarUrl || user.profileImageUrl;
  }
  const teamMember = getTeamMemberByStudentId(user?.studentId);
  return teamMember?.photo || null;
}

export default function UserMenu({ user, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const open = Boolean(anchorEl);
  const photoUrl = getAvatarSrc(user);

  const handleClose = () => setAnchorEl(null);

  const go = (path) => {
    handleClose();
    navigate(path);
  };

  return (
    <>
      <Button
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label={`Account menu for ${user.fullName}`}
        sx={{
          textTransform: 'none',
          ml: 0.5,
          px: { xs: 0.5, sm: 1 },
          py: 0.5,
          gap: 1,
          minWidth: 0,
          borderRadius: 2,
          flexShrink: 0,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
        }}
      >
        <Avatar
          src={photoUrl || undefined}
          alt=""
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'secondary.main',
            color: 'primary.main',
            fontWeight: 700,
            fontSize: '0.8rem',
            border: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          }}
        >
          {!photoUrl && getInitials(user.fullName)}
        </Avatar>
        <Box
          component="span"
          sx={{
            display: { xs: 'none', sm: 'inline' },
            color: 'secondary.main',
            fontWeight: 500,
            maxWidth: { sm: 140, md: 220 },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}
        >
          {user.fullName}
        </Box>
        <ArrowDropDownIcon sx={{ fontSize: 20, color: 'secondary.main', flexShrink: 0 }} />
      </Button>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
      >
        <MenuItem onClick={() => go('/profile')}>
          <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go('/notifications')}>
          <ListItemIcon>
            <Badge color="error" variant="dot" invisible={unreadCount === 0}>
              <NotificationsNoneIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText>
            Notifications
            {unreadCount > 0 ? ` (${unreadCount})` : ''}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go('/profile')}>
          <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Account Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleClose();
            onLogout();
          }}
        >
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
