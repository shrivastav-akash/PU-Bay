export function timeAgo(date, now = Date.now()) {
  if (!date) return 'now';
  const m = Math.floor((now - new Date(date).getTime()) / 60000);
  if (!(m >= 1)) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return fmtDate(date, { month: 'short', day: 'numeric' });
}

export function fmtDate(date, opts = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, opts);
}

export function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

// New posts store the full MIME type ("video/mp4"); older ones only the subtype.
export function isVideo(post) {
  const type = post?.fileType || '';
  return type.startsWith('video/') || ['mp4', 'mov', 'quicktime', 'webm', 'avi', 'ogg'].includes(type);
}
