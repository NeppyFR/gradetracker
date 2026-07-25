import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { loadData, saveData, uid, migrateSem } from "../lib/storage";
import { gistFetch, GIST_FILE, isConnected, loadSync, saveSync } from "../lib/sync";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(loadData);
  const [sync, setSync] = useState(loadSync);
  const [syncState, setSyncState] = useState("off"); // off | on | busy | err
  const [syncMsg, setSyncMsg] = useState("Your data is currently saved only in this browser.");

  const pushTimer = useRef(null);
  const pushingRef = useRef(false);
  const syncRef = useRef(sync);
  const dataRef = useRef(data);
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const pushNow = useCallback(async (silent) => {
    const s = syncRef.current;
    if (!isConnected(s)) {
      if (!silent) alert("Connect first (enter token + Gist ID).");
      return;
    }
    if (pushingRef.current) return;
    pushingRef.current = true;
    setSyncState("busy");
    setSyncMsg("Saving to the cloud…");
    try {
      await gistFetch(s, "PATCH", { files: { [GIST_FILE]: { content: JSON.stringify(dataRef.current, null, 2) } } });
      const next = { ...s, last: Date.now() };
      setSync(next);
      saveSync(next);
      setSyncState("on");
      setSyncMsg("Saved. Last synced " + new Date().toLocaleTimeString() + ".");
    } catch (err) {
      setSyncState("err");
      setSyncMsg(err.message);
    } finally {
      pushingRef.current = false;
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (!isConnected(syncRef.current)) return;
    setSyncState("busy");
    setSyncMsg("Changes pending…");
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => pushNow(true), 1400);
  }, [pushNow]);

  // persist to localStorage + schedule cloud push whenever data changes
  const isFirstRun = useRef(true);
  useEffect(() => {
    saveData(data);
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    schedulePush();
  }, [data, schedulePush]);

  const pullNow = useCallback(async (silent) => {
    const s = syncRef.current;
    if (!isConnected(s)) {
      if (!silent) alert("Connect first (enter token + Gist ID).");
      return;
    }
    setSyncState("busy");
    setSyncMsg("Pulling your data from the cloud…");
    try {
      const g = await gistFetch(s, "GET");
      const file = (g.files && g.files[GIST_FILE]) || (g.files && Object.values(g.files)[0]);
      if (file && file.content) {
        let payload = file.content;
        if (file.truncated && file.raw_url) {
          payload = await (await fetch(file.raw_url)).text();
        }
        const d = JSON.parse(payload);
        if (d && d.classes) {
          if (!d.semesters) d.semesters = [];
          d.semesters.forEach(migrateSem);
          setData(d);
        }
      }
      const next = { ...s, last: Date.now() };
      setSync(next);
      saveSync(next);
      setSyncState("on");
      setSyncMsg("Up to date. Last synced " + new Date().toLocaleTimeString() + ".");
    } catch (err) {
      setSyncState("err");
      setSyncMsg(err.message);
    }
  }, []);

  const connectSync = useCallback(
    async (token, gist) => {
      if (!token || !gist) {
        alert("Enter both the token and the Gist ID.");
        return;
      }
      const next = { ...syncRef.current, token, gist };
      setSync(next);
      saveSync(next);
      syncRef.current = next;
      await pullNow(true);
      await pushNow(true);
    },
    [pullNow, pushNow]
  );

  const disconnectSync = useCallback(() => {
    if (!confirm("Disconnect cloud sync on this device? Your data stays saved locally.")) return;
    setSync({});
    saveSync({});
    setSyncState("off");
    setSyncMsg("Disconnected. Data is saved only in this browser.");
  }, []);

  // initial connection check on mount
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (isConnected(sync)) {
      setSyncState("on");
      setSyncMsg("Connected.");
      pullNow(true);
    } else {
      setSyncState("off");
      setSyncMsg("Your data is currently saved only in this browser.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Current-semester CRUD ---------- */
  const addClass = useCallback(() => {
    setData((d) => ({ ...d, classes: [...d.classes, { id: uid(), name: "New Class", items: [] }] }));
  }, []);
  const removeClass = useCallback((id) => {
    if (!confirm("Delete this class and all its grades?")) return;
    setData((d) => ({ ...d, classes: d.classes.filter((c) => c.id !== id) }));
  }, []);
  const addItem = useCallback((cid) => {
    setData((d) => ({
      ...d,
      classes: d.classes.map((c) =>
        c.id === cid ? { ...c, items: [...c.items, { id: uid(), name: "", date: "", weight: 1, score: null }] } : c
      ),
    }));
  }, []);
  const removeItem = useCallback((cid, iid) => {
    setData((d) => ({
      ...d,
      classes: d.classes.map((c) => (c.id === cid ? { ...c, items: c.items.filter((i) => i.id !== iid) } : c)),
    }));
  }, []);
  const setClassName = useCallback((cid, v) => {
    setData((d) => ({ ...d, classes: d.classes.map((c) => (c.id === cid ? { ...c, name: v } : c)) }));
  }, []);
  const setField = useCallback((cid, iid, field, v) => {
    setData((d) => ({
      ...d,
      classes: d.classes.map((c) => {
        if (c.id !== cid) return c;
        return {
          ...c,
          items: c.items.map((i) => {
            if (i.id !== iid) return i;
            if (field === "score") return { ...i, score: v === "" ? null : Number(v) };
            if (field === "weight") return { ...i, weight: v === "" ? 1 : Number(v) };
            return { ...i, [field]: v };
          }),
        };
      }),
    }));
  }, []);

  /* ---------- Previous-semester CRUD ---------- */
  const addSemester = useCallback(() => {
    setData((d) => ({ ...d, semesters: [{ id: uid(), name: "New Semester", absences: "", classes: [] }, ...d.semesters] }));
  }, []);
  const removeSemester = useCallback((id) => {
    if (!confirm("Delete this semester?")) return;
    setData((d) => ({ ...d, semesters: d.semesters.filter((s) => s.id !== id) }));
  }, []);
  const setSem = useCallback((id, field, v) => {
    setData((d) => ({
      ...d,
      semesters: d.semesters.map((s) =>
        s.id === id ? { ...s, [field]: field === "absences" ? (v === "" ? "" : Number(v)) : v } : s
      ),
    }));
  }, []);
  const addSemClass = useCallback((sid) => {
    setData((d) => ({
      ...d,
      semesters: d.semesters.map((s) =>
        s.id === sid ? { ...s, classes: [...s.classes, { id: uid(), name: "", grade: "", passed: true }] } : s
      ),
    }));
  }, []);
  const removeSemClass = useCallback((sid, cid) => {
    setData((d) => ({
      ...d,
      semesters: d.semesters.map((s) => (s.id === sid ? { ...s, classes: s.classes.filter((c) => c.id !== cid) } : s)),
    }));
  }, []);
  const setSemClass = useCallback((sid, cid, field, v) => {
    setData((d) => ({
      ...d,
      semesters: d.semesters.map((s) =>
        s.id === sid ? { ...s, classes: s.classes.map((c) => (c.id === cid ? { ...c, [field]: v } : c)) } : s
      ),
    }));
  }, []);
  const togglePass = useCallback((sid, cid) => {
    setData((d) => ({
      ...d,
      semesters: d.semesters.map((s) =>
        s.id === sid ? { ...s, classes: s.classes.map((c) => (c.id === cid ? { ...c, passed: !c.passed } : c)) } : s
      ),
    }));
  }, []);

  /* ---------- Import / Export ---------- */
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(dataRef.current, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "grade-tracker-backup.json";
    a.click();
  }, []);
  const importData = useCallback((file) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (d.classes) {
          if (!d.semesters) d.semesters = [];
          d.semesters.forEach(migrateSem);
          setData(d);
        } else alert("Invalid file.");
      } catch (err) {
        alert("Could not read file.");
      }
    };
    r.readAsText(file);
  }, []);

  const value = {
    data,
    setData,
    addClass,
    removeClass,
    addItem,
    removeItem,
    setClassName,
    setField,
    addSemester,
    removeSemester,
    setSem,
    addSemClass,
    removeSemClass,
    setSemClass,
    togglePass,
    exportData,
    importData,
    sync,
    syncState,
    syncMsg,
    connectSync,
    disconnectSync,
    pullNow,
    pushNow,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
