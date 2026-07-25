import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";

export default function CloudSync() {
  const { sync, syncState, syncMsg, connectSync, disconnectSync, pullNow, pushNow } = useData();
  const [token, setToken] = useState(sync.token || "");
  const [gist, setGist] = useState(sync.gist || "");

  useEffect(() => {
    setToken(sync.token || "");
    setGist(sync.gist || "");
  }, [sync.token, sync.gist]);

  const statusLabel =
    syncState === "on" ? "Connected" : syncState === "busy" ? "Working…" : syncState === "err" ? "Error" : "Not connected";

  return (
    <section>
      <h1 className="view-title">Cloud Sync</h1>
      <div className="view-sub">Store your grades in a private GitHub Gist so they follow you to any device.</div>

      <div className="card">
        <div className="classhead" style={{ marginBottom: 6 }}>
          <b style={{ fontSize: 16 }}>Status</b>
          <span className="sync-dot">
            <span className={"dot " + syncState}></span>
            <span>{statusLabel}</span>
          </span>
        </div>
        <div className="statusline muted">{syncMsg}</div>
      </div>

      <div className="card">
        <b style={{ fontSize: 16 }}>Connect</b>
        <div className="field" style={{ marginTop: 12 }}>
          <label>GitHub personal access token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_… or ghp_…"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>Gist ID</label>
          <input
            type="text"
            value={gist}
            onChange={(e) => setGist(e.target.value)}
            placeholder="the id from your gist URL"
            autoComplete="off"
          />
        </div>
        <div className="addrow">
          <button className="btn" onClick={() => connectSync(token.trim(), gist.trim())}>
            Connect &amp; sync
          </button>
          <button className="btn ghost" onClick={() => pullNow()}>
            Pull from cloud
          </button>
          <button className="btn ghost" onClick={() => pushNow()}>
            Push to cloud
          </button>
          <button className="btn danger" onClick={disconnectSync}>
            Disconnect
          </button>
        </div>
        <div className="hint">Token and Gist ID are stored only in this browser. Nothing is sent anywhere except GitHub.</div>
      </div>

      <div className="card">
        <b style={{ fontSize: 16 }}>First-time setup</b>
        <ol className="steps" style={{ marginTop: 10 }}>
          <li>
            Go to <code>gist.github.com</code>, put anything in a file named <code>grade-tracker.json</code> (e.g.{" "}
            <code>{"{}"}</code>), and click <b>Create secret gist</b>.
          </li>
          <li>
            Copy the <b>Gist ID</b> — it's the long code at the end of the gist's URL — and paste it above.
          </li>
          <li>
            Go to <code>github.com/settings/tokens</code> → <b>Fine-grained tokens</b> → <b>Generate new token</b>. Under{" "}
            <b>Account permissions</b> set <b>Gists → Read and write</b>. Generate it and copy the token.
          </li>
          <li>
            Paste the token above and hit <b>Connect &amp; sync</b>. On any new device, just paste the same two values
            once.
          </li>
        </ol>
      </div>
    </section>
  );
}
