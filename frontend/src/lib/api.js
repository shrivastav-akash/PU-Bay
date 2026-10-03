// The API runs on port 3000 of whatever host serves the app, so the same
// build works on localhost and on a LAN IP during development.
export const API_BASE_URL = `http://${window.location.hostname}:3000`;

// The session lives in an httpOnly cookie that page scripts can't read, so
// every request is sent with credentials and the API decides who we are.

// Called when a signed-in session is rejected (expired or revoked).
let onSessionExpired = null;
export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

function failure(res, json) {
  // INVALID_CREDENTIALS is a wrong password, not a lost session.
  if (res.status === 401 && json?.error?.code === 'UNAUTHENTICATED') onSessionExpired?.();
  return Object.assign(new Error(json?.error?.message || `Request failed (${res.status})`), {
    status: res.status,
    code: json?.error?.code,
  });
}

async function send(path, init) {
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, credentials: 'include' });
  } catch {
    throw Object.assign(new Error('Could not reach the server. Check your connection.'), { status: 0 });
  }
}

// Success responses are { success, message?, data? }; errors are
// { error: { code, message } }. Callers get `data` back, or an Error carrying
// the server message, error code and HTTP status.
export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await send(path, { method, headers, body: payload });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON error page; fall through to the generic message.
  }
  if (!res.ok) throw failure(res, json);
  return json.data ?? json;
}

// For endpoints that stream a file (the résumé PDF): saves it via a temporary link.
export async function downloadFile(path, { filename }) {
  const res = await send(path, {});
  if (!res.ok) throw failure(res, await res.json().catch(() => null));
  const url = URL.createObjectURL(await res.blob());
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function mediaUrl(file) {
  if (!file || file === 'default.jpg') return '';
  return `${API_BASE_URL}/${encodeURIComponent(file)}`;
}
