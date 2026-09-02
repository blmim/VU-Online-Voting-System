const STORAGE_KEY = 'vu_recent_searches';
const MAX = 5;

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(item) {
  if (!item?.label || !item?.path) return;
  const prev = getRecentSearches().filter((r) => r.path !== item.path);
  const next = [{ ...item, ts: Date.now() }, ...prev].slice(0, MAX);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
