import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Stack, TextField, Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { VU_GOLD } from '../theme';

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function DiscussionCard({ comment, electionId, onReply, depth = 0 }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/elections/${electionId}/discussion`, {
        body: replyText,
        parentId: comment._id,
      });
      setReplyText('');
      setReplying(false);
      onReply?.();
      showToast('Reply posted', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to post reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = comment.authorName?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Box sx={{ ml: depth * 3 }}>
      <Card variant="outlined" sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', border: `2px solid ${VU_GOLD}` }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>{comment.authorName}</Typography>
              <Typography variant="caption" color="text.secondary">{formatRelative(comment.createdAt)}</Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{comment.body}</Typography>
              {user && depth < 2 && (
                <Button size="small" startIcon={<ReplyIcon />} onClick={() => setReplying(!replying)} sx={{ mt: 0.5 }}>
                  Reply
                </Button>
              )}
            </Box>
          </Stack>
          {replying && (
            <Stack spacing={1} sx={{ mt: 1, pl: 6 }}>
              <TextField size="small" multiline minRows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} fullWidth placeholder="Write a reply…" />
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" onClick={submitReply} disabled={submitting}>Post</Button>
                <Button size="small" onClick={() => setReplying(false)}>Cancel</Button>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
      {comment.replies?.map((r) => (
        <DiscussionCard key={r._id} comment={r} electionId={electionId} onReply={onReply} depth={depth + 1} />
      ))}
    </Box>
  );
}

export default function DiscussionSection({ electionId, comments = [], onRefresh }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    if (!user) {
      showToast('Please sign in to post', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/elections/${electionId}/discussion`, { body });
      setBody('');
      onRefresh?.();
      showToast('Posted to discussion', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <ChatBubbleOutlineIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>Public Discussion</Typography>
        <Typography variant="body2" color="text.secondary">({comments.length} posts)</Typography>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {!user && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Link to="/login/student">Sign in</Link> to join the election discussion.
            </Alert>
          )}
          {user && (
            <>
              <TextField
                multiline
                minRows={3}
                placeholder="Share your thoughts on this election…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                fullWidth
                sx={{ mb: 1.5 }}
              />
              <Button variant="contained" onClick={handleSubmit} disabled={submitting || !body.trim()}>
                Post comment
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {!comments.length ? (
        <Alert severity="info">No discussion yet — start the conversation!</Alert>
      ) : (
        comments.map((c) => (
          <DiscussionCard key={c._id} comment={c} electionId={electionId} onReply={onRefresh} />
        ))
      )}
    </Box>
  );
}
