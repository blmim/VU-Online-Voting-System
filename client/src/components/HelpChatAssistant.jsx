import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Chip, Drawer, Fab, IconButton, Link, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../context/TutorialContext';
import {
  getBotResponse, QUICK_SUGGESTIONS, WELCOME_MESSAGE,
} from '../utils/helpChatBot';
import { VU_GOLD, VU_NAVY } from '../theme';
import { useLiveRegion } from './LiveRegionAnnouncer';

const AUTH_PATHS = ['/login', '/login/student', '/login/admin', '/register', '/forgot-password', '/reset-password'];
const DRAWER_WIDTH = 380;

function ChatMessage({ msg, onSuggestionClick }) {
  const isBot = msg.role === 'bot';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isBot ? 'row' : 'row-reverse',
        alignItems: 'flex-start',
        gap: 1,
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isBot ? VU_NAVY : 'secondary.main',
          color: isBot ? 'white' : VU_NAVY,
        }}
      >
        {isBot ? <SmartToyOutlinedIcon sx={{ fontSize: 18 }} /> : <PersonOutlineIcon sx={{ fontSize: 18 }} />}
      </Avatar>
      <Box sx={{ maxWidth: '82%' }}>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: isBot ? 'grey.100' : 'primary.main',
            color: isBot ? 'text.primary' : 'white',
            borderTopLeftRadius: isBot ? 4 : 16,
            borderTopRightRadius: isBot ? 16 : 4,
          }}
        >
          <Typography variant="body2" lineHeight={1.6}>
            {msg.text}
          </Typography>
          {msg.links?.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
              {msg.links.map((l) => (
                <Link
                  key={l.path}
                  component={RouterLink}
                  to={l.path}
                  underline="hover"
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isBot ? 'primary.main' : 'secondary.light',
                  }}
                >
                  {l.label} →
                </Link>
              ))}
            </Stack>
          )}
        </Box>
        {msg.suggestions?.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
            {msg.suggestions.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                clickable
                onClick={() => onSuggestionClick(s)}
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default function HelpChatAssistant() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startTour } = useTutorial();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [welcomed, setWelcomed] = useState(false);
  const listRef = useRef(null);
  const { announce } = useLiveRegion();
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hidden = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (open && !welcomed) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: WELCOME_MESSAGE,
        suggestions: QUICK_SUGGESTIONS,
      }]);
      setWelcomed(true);
    }
  }, [open, welcomed]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const reply = getBotResponse(trimmed, {
      isAdmin: user?.role === 'admin',
      isLoggedIn: !!user,
    });

    if (reply.action === 'startTutorial') {
      if (pathname !== '/') {
        navigate('/');
        window.setTimeout(() => startTour(), 200);
      } else {
        startTour();
      }
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: reply.text,
        links: reply.links,
        suggestions: reply.suggestions,
      }]);
      announce(`Help assistant: ${reply.text}`);
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (hidden) return null;

  return (
    <>
      <Fab
        color="primary"
        aria-label="Open help chat assistant"
        onClick={() => setOpen(true)}
        data-tour="help-chat"
        sx={{
          position: 'fixed',
          bottom: { xs: 80, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1200,
          bgcolor: VU_NAVY,
          '&:hover': { bgcolor: '#004080' },
          boxShadow: `0 4px 20px rgba(0,51,102,0.4)`,
        }}
      >
        <ChatIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        transitionDuration={reducedMotion ? 0 : 300}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: DRAWER_WIDTH },
            maxWidth: '100vw',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.5,
            bgcolor: VU_NAVY,
            color: 'white',
            borderBottom: `3px solid ${VU_GOLD}`,
          }}
        >
          <SmartToyOutlinedIcon sx={{ color: VU_GOLD }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              VU Voting Assistant
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Ask how to navigate the app
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} aria-label="Close help assistant" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          ref={listRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            py: 2,
            bgcolor: 'background.default',
          }}
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} onSuggestionClick={sendMessage} />
          ))}
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask about voting, polls, results…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Chat message"
              autoComplete="off"
            />
            <IconButton
              type="submit"
              aria-label="Send message"
              disabled={!input.trim()}
              sx={{
                bgcolor: VU_GOLD,
                color: VU_NAVY,
                '&:hover': { bgcolor: '#c5a030' },
                '&.Mui-disabled': { bgcolor: 'grey.300' },
              }}
            >
              <SendIcon />
            </IconButton>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
