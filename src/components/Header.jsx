import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { fmt, overallAvg } from "../lib/math";

export default function Header({ onBurger, onSync }) {
  const { data } = useData();
  const overall = useMemo(() => overallAvg(data.classes), [data.classes]);

  return (
    <header>
      <button className="burger" onClick={onBurger} aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <h1>Grade Tracker</h1>
      <div className="headerspacer"></div>
      <div className="overall">
        {overall !== null && (
          <>
            Current avg: <b>{fmt(overall)}</b>
          </>
        )}
      </div>
      <SyncDot onClick={onSync} />
    </header>
  );
}

function SyncDot({ onClick }) {
  const { syncState } = useData();
  const label = { off: "Local", on: "Synced", busy: "Syncing…", err: "Sync error" }[syncState];
  return (
    <div className="sync-dot" onClick={onClick} title="Cloud sync">
      <span className={"dot " + syncState}></span>
      <span>{label}</span>
    </div>
  );
}
