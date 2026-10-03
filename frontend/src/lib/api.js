// The API runs on port 3000 of whatever host serves the app, so the same
// build works on localhost and on a LAN IP during development.
export const API_BASE_URL = `http://${window.location.hostname}:3000`;

const TOKEN_KEY = 'token';

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked (private mode): the session just won't survive a reload.
  }
}

// Success responses are { success, message?, data? }; errors are
// { error: { code, message } }. Callers get `data` back, or an Error carrying
// the server message, error code and HTTP status.
export async function api(path, { method = 'GET', body, form, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw Object.assign(new Error('Could not reach the server. Check your connection.'), { status: 0 });
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON error page; fall through to the generic message.
  }
  if (!res.ok) {
    throw Object.assign(new Error(json?.error?.message || `Request failed (${res.status})`), {
      status: res.status,
      code: json?.error?.code,
    });
  }
  return json.data ?? json;
}

// For endpoints that stream a file (the résumé PDF): saves it via a temporary link.
export async function downloadFile(path, { token, filename }) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw Object.assign(new Error('Could not reach the server. Check your connection.'), { status: 0 });
  }
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw Object.assign(new Error(json?.error?.message || `Request failed (${res.status})`), { status: res.status });
  }
  const url = URL.createObjectURL(await res.blob());
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function mediaUrl(file) {
  if (!file || file === 'default.jpg') return '';
  return `${API_BASE_URL}/${encodeURIComponent(file)}`;
}
