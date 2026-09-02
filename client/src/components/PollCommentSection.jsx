import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Stack, TextField, Typography,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import ReplyIcon from '@mui/icons-material/Reply';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function CommentCard({ comment, pollId, onReply, depth = 0 }) {
  const { showToast } = useToast();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async () => {
    try {
      await api.post(`/polls/comments/${comment._id}/report`);
      showToast('Comment reported for moderation', 'info');
    } catch {
      showToast('Could not report comment', 'error');
    }
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/polls/${pollId}/comments`, {
        content: replyText,
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

  return (
    <Box sx={{ ml: depth * 3 }}>
      <Card variant="outlined" sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>{comment.authorName}</Typography>
              <Typography variant="caption" color="text.secondary">{formatTime(comment.createdAt)}</Typography>
            </Box>
            <Button size="small" color="inherit" onClick={handleReport} aria-label="Report comment" sx={{ minWidth: 0, p: 0.5 }}>
              <FlagIcon fontSize="small" />
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{comment.content}</Typography>
          {depth < 2 && (
            <Button size="small" startIcon={<ReplyIcon />} onClick={() => setReplying(!replying)} sx={{ mt: 1 }}>
              Reply
            </Button>
          )}
          {replying && (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <TextField
                size="small"
                multiline
                minRows={2}
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                fullWidth
              />
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" onClick={submitReply} disabled={submitting}>Post</Button>
                <Button size="small" onClick={() => setReplying(false)}>Cancel</Button>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
      {comment.replies?.map((r) => (
        <CommentCard key={r._id} comment={r} pollId={pollId} onReply={onReply} depth={depth + 1} />
      ))}
    </Box>
  );
}

export default function PollCommentSection({ pollId, comments, onRefresh }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!user) {
      showToast('Please sign in to comment', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/polls/${pollId}/comments`, { content });
      setContent('');
      onRefresh?.();
      showToast('Comment posted', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <ChatBubbleOutlineIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>Discussion</Typography>
        <Typography variant="body2" color="text.secondary">({comments?.length || 0} comments)</Typography>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {!user && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Link to="/login/student">Sign in</Link> to post a comment.
            </Alert>
          )}

          {user && (
            <>
              <TextField
                multiline
                minRows={3}
                placeholder="Share your thoughts on this prediction poll…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                fullWidth
                sx={{ mb: 1.5 }}
              />
              <Button variant="contained" onClick={handleSubmit} disabled={submitting || !content.trim()}>
                Post comment
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {!comments?.length ? (
        <Alert severity="info" icon={<ChatBubbleOutlineIcon />}>
          No comments yet. Start the conversation!
        </Alert>
      ) : (
        comments.map((c) => (
          <CommentCard key={c._id} comment={c} pollId={pollId} onReply={onRefresh} />
        ))
      )}
    </Box>
  );
}
