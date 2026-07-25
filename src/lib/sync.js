export const SYNC_KEY = "gradeTracker.sync";
export const GIST_FILE = "grade-tracker.json";

export function loadSync() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_KEY)) || {};
  } catch (e) {
    return {};
  }
}

export function saveSync(sync) {
  localStorage.setItem(SYNC_KEY, JSON.stringify(sync));
}

export function isConnected(sync) {
  return !!(sync.token && sync.gist);
}

export async function gistFetch(sync, method, body) {
  const res = await fetch("https://api.github.com/gists/" + encodeURIComponent(sync.gist), {
    method,
    headers: { Authorization: "Bearer " + sync.token, Accept: "application/vnd.github+json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new Error("Bad token (401). Check the token has Gists read/write.");
  if (res.status === 404) throw new Error("Gist not found (404). Check the Gist ID.");
  if (!res.ok) throw new Error("GitHub error " + res.status);
  return res.json();
}
