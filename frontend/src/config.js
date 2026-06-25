export const API_BASE_URL = `http://${window.location.hostname}:3000`;

// Build request headers for authenticated calls. The JWT travels in the
// Authorization header — never in the query string or body. Pass json=true for
// JSON request bodies (omit it for multipart/FormData uploads).
export const authHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});
