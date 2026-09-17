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
    headers: { Authorization: "token " + sync.token, Accept: "application/vnd.github+json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.ok) return res.json();

  // GitHub explains every failure in the response body; a bare status code
  // leaves you with nothing to act on, so pull the real reason out.
  let detail = "";
  try {
    const err = await res.json();
    if (err && err.message) detail = err.message.trim();
    // GitHub's messages aren't consistently punctuated; we sentence-join them.
    if (detail && !/[.!?]$/.test(detail)) detail += ".";
  } catch {
    /* non-JSON error body */
  }

  if (res.status === 401) {
    throw new Error(`Bad token (401). ${detail || "It may be expired, revoked, or mistyped."}`);
  }
  if (res.status === 404) {
    throw new Error("Gist not found (404). Check the Gist ID, and that the token's account owns that gist.");
  }
  if (res.status === 403) {
    // Throttling and missing permissions share this status, and the fix for
    // each is the opposite of the other — wait, versus go change your token.
    if (res.headers.get("x-ratelimit-remaining") === "0") {
      const reset = Number(res.headers.get("x-ratelimit-reset"));
      const when = reset ? new Date(reset * 1000).toLocaleTimeString() : "shortly";
      throw new Error(`Rate limited (403). GitHub will let you back in at ${when}.`);
    }
    const retry = res.headers.get("retry-after");
    if (retry || /secondary rate limit/i.test(detail)) {
      throw new Error(
        `Hit GitHub's secondary rate limit (403). Wait ${retry ? `${retry} seconds` : "a minute"} and try again.`
      );
    }
    const needs = res.headers.get("x-accepted-github-permissions");
    throw new Error(
      [
        "Token not allowed to touch this gist (403).",
        detail,
        needs ? `Needs: ${needs}.` : "",
        'A classic token needs the "gist" scope; a fine-grained token needs Account permissions → Gists → Read and write.',
      ]
        .filter(Boolean)
        .join(" ")
    );
  }
  throw new Error(`GitHub error ${res.status}${detail ? ": " + detail : ""}`);
}
