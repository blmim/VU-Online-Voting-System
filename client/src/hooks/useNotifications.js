import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function readStorageKey(userId) {
  return `notifications_read_${userId}`;
}

function loadReadIds(userId) {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(readStorageKey(userId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(userId, ids) {
  if (!userId) return;
  localStorage.setItem(readStorageKey(userId), JSON.stringify([...ids]));
}

export default function useNotifications({ autoFetch = true } = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState('');
  const [readIds, setReadIds] = useState(() => loadReadIds(user?._id || user?.id));

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch {
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setReadIds(loadReadIds(user?._id || user?.id));
  }, [user?._id, user?.id]);

  useEffect(() => {
    if (autoFetch && user) {
      refresh();
    }
  }, [autoFetch, user, refresh]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markRead = useCallback((id) => {
    const userId = user?._id || user?.id;
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(userId, next);
      return next;
    });
  }, [user?._id, user?.id]);

  const markAllRead = useCallback(() => {
    const userId = user?._id || user?.id;
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    saveReadIds(userId, allIds);
  }, [notifications, user?._id, user?.id]);

  const isRead = useCallback((id) => readIds.has(id), [readIds]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refresh,
    markRead,
    markAllRead,
    isRead,
  };
}
