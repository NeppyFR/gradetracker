import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { fmt, fmtDate, overallAvg, ungraded } from "../lib/math";
import {
  DAY_NAMES,
  ORDERED_DAYS,
  daySnapshot,
  dayKey,
  fmtDur,
  fmtHour,
  fmtTime,
  nextSchoolDay,
  rowsForDay,
  toMin,
  visibleDays,
} from "../lib/schedule";

function greeting(h) {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { data } = useData();
  const [now, setNow] = useState(() => new Date());
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const overall = useMemo(() => overallAvg(data.classes), [data.classes]);

  const exams = useMemo(() => {
    const items = [];
    data.classes.forEach((c) => {
      ungraded(c.items).forEach((i) => {
        if ((i.name && i.name.trim()) || i.date) items.push({ cls: c.name, ...i });
      });
    });
    items.sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });
    return items;
  }, [data.classes]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snap = useMemo(() => daySnapshot(data.schedule, now), [data.schedule, now]);
  const upNext = nextSchoolDay(data.schedule, now);

  return (
    <section>
      <div className="home-hero">
        <h1 className="view-title">{greeting(now.getHours())}</h1>
        <div className="view-sub">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          {" · "}
          {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>

      <div className="home-stats">
        <StatChip label="Current average" value={overall === null ? "—" : fmt(overall)} />
        <StatChip
          label="Next exam"
          value={
            exams[0]
              ? exams[0].date
                ? fmtDate(exams[0].date).replace(/,.*/, "")
                : "no date set"
              : "none"
          }
          sub={exams[0]?.name || exams[0]?.cls}
        />
        <StatChip label={liveLabel(snap)} value={liveValue(snap)} sub={liveSub(snap)} accent />
      </div>

      <div className="home-grid">
        <div className="home-col">
          <div className="section-head">
            <h2 className="section-title">Today &middot; {DAY_NAMES[snap.key]}</h2>
            {snap.school && (
              <button className="btn ghost sm" onClick={() => setEditing((e) => !e)}>
                {editing ? "Done" : "Edit schedule"}
              </button>
            )}
          </div>
          {snap.school ? (
            <Timeline snap={snap} />
          ) : (
            <div className="card no-school">
              <div className="no-school-emoji">🏖️</div>
              <div>
                <b>No classes today.</b>
                <div className="muted" style={{ marginTop: 4 }}>
                  {upNext
                    ? `Next school day is ${DAY_NAMES[upNext.key]}${
                        upNext.offset === 1 ? " (tomorrow)" : ""
                      }.`
                    : "No school days are set up yet."}
                </div>
                <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => setEditing((e) => !e)}>
                  {editing ? "Done" : "Edit schedule"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="home-col">
          <div className="section-head">
            <h2 className="section-title">Upcoming exams</h2>
          </div>
          {exams.length === 0 ? (
            <div className="card empty" style={{ padding: 16 }}>
              Nothing upcoming. Add an exam with a blank score in Current Semester to see it here.
            </div>
          ) : (
            <div className="card" style={{ padding: 8 }}>
              <AnimatePresence initial={false}>
                {exams.slice(0, 6).map((i) => {
                  const meta = examDays(i, today);
                  return (
                    <motion.div
                      key={i.id}
                      className="exam-row"
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="exam-main">
                        <span className="exam-name">{i.name || "(unnamed)"}</span>
                        <span className="exam-cls">{i.cls}</span>
                      </div>
                      <div className="exam-when">
                        <span>{i.date ? fmtDate(i.date).replace(/,.*/, "") : "no date"}</span>
                        <span className={"days " + meta.cls}>{meta.txt}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 26 }}>
        <h2 className="section-title">This week</h2>
        <button className="btn ghost sm" onClick={() => setEditing((e) => !e)}>
          {editing ? "Done" : "Edit schedule"}
        </button>
      </div>
      <WeekGrid schedule={data.schedule} todayKey={dayKey(now)} />

      {editing && <ScheduleEditor initialDay={snap.key} />}
    </section>
  );
}

function StatChip({ label, value, sub, accent }) {
  return (
    <div className={"stat-chip" + (accent ? " accent" : "")}>
      <div className="stat-chip-label">{label}</div>
      <div className="stat-chip-value">{value}</div>
      {sub ? <div className="stat-chip-sub">{sub}</div> : null}
    </div>
  );
}

function liveLabel(snap) {
  if (!snap.school) return "School";
  if (snap.phase === "before") return "First class";
  if (snap.phase === "after") return "School's out";
  return snap.current ? (snap.current.kind === "break" ? "On break" : "Now") : "Passing period";
}
function liveValue(snap) {
  if (!snap.school) return "Off today";
  if (snap.phase === "before") return fmtTime(snap.rows[0].start);
  if (snap.phase === "after") return "Done for today";
  if (snap.current) return snap.current.kind === "break" ? snap.current.label : snap.current.subject || snap.current.label;
  return snap.next ? `${fmtDur(snap.minsToNext)} to go` : "—";
}
function liveSub(snap) {
  if (!snap.school || snap.phase === "after") return null;
  if (snap.phase === "before") return `starts in ${fmtDur(Math.ceil(snap.dayStart - snap.nowMin))}`;
  if (snap.current) {
    if (snap.current.kind === "break") return `${fmtDur(snap.minsLeft)} left`;
    return `${fmtDur(snap.minsLeft)} left${snap.next ? ` · then ${snap.next.subject || snap.next.label}` : ""}`;
  }
  return snap.next ? `next: ${snap.next.subject || snap.next.label}` : null;
}

function examDays(i, today) {
  if (!i.date) return { cls: "done", txt: "no date" };
  const d = new Date(i.date + "T00:00:00");
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { cls: "done", txt: `${-diff}d ago` };
  if (diff === 0) return { cls: "soon", txt: "today" };
  if (diff === 1) return { cls: "soon", txt: "tomorrow" };
  if (diff <= 7) return { cls: "soon", txt: `in ${diff}d` };
  return { cls: "", txt: `in ${diff}d` };
}

const PX_PER_MIN = 2.7;

function Timeline({ snap }) {
  const { rows, dayStart, dayEnd, nowMin, phase, currentIdx } = snap;
  const span = Math.max(1, dayEnd - dayStart);
  const height = span * PX_PER_MIN;
  const nowTop = (Math.min(dayEnd, Math.max(dayStart, nowMin)) - dayStart) * PX_PER_MIN;

  return (
    <div className="card timeline-card">
      <div className="timeline" style={{ height }}>
        {rows.map((r, i) => {
          const top = (toMin(r.start) - dayStart) * PX_PER_MIN;
          const h = (toMin(r.end) - toMin(r.start)) * PX_PER_MIN;
          const state = i === currentIdx ? "current" : toMin(r.end) <= nowMin ? "past" : "future";
          return (
            <div
              key={r.id}
              className={`tl-block ${r.kind} ${state}`}
              style={{ top, height: Math.max(h, 22) }}
            >
              <div className="tl-time">
                {fmtTime(r.start)} <span className="tl-dash">–</span> {fmtTime(r.end)}
              </div>
              <div className="tl-body">
                <span className="tl-subject">
                  {r.kind === "break" ? r.label : r.subject || <span className="muted">Free period</span>}
                </span>
                {r.kind === "class" && r.subject ? <span className="tl-period">{r.label}</span> : null}
              </div>
              {i === currentIdx && (
                <motion.div
                  className="tl-progress"
                  initial={false}
                  animate={{ width: `${snap.progress * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}
              {i === currentIdx && (
                <span className="tl-left">{fmtDur(snap.minsLeft)} left</span>
              )}
            </div>
          );
        })}

        {phase === "during" && (
          <motion.div
            className="tl-now"
            initial={false}
            animate={{ top: nowTop }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <span className="tl-now-dot" />
            <span className="tl-now-label">
              {new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </span>
          </motion.div>
        )}
      </div>

      <div className="day-bar">
        <div className="day-bar-track">
          <motion.div
            className="day-bar-fill"
            initial={false}
            animate={{ width: `${(phase === "after" ? 1 : phase === "before" ? 0 : snap.dayProgress) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="muted">
          {phase === "before"
            ? `School starts at ${fmtTime(rows[0].start)}`
            : phase === "after"
            ? "School day complete"
            : `${Math.round(snap.dayProgress * 100)}% through the day`}
        </span>
      </div>
    </div>
  );
}

const WEEK_PX_PER_MIN = 1.05;

// Each day is drawn on a shared time axis, so days that start later, end
// earlier, or use different period lengths line up honestly against each other.
function WeekGrid({ schedule, todayKey }) {
  const days = visibleDays(schedule);
  const columns = days.map((d) => rowsForDay(schedule, d) || []);
  const all = columns.flat();

  if (all.length === 0) {
    return (
      <div className="card empty" style={{ padding: 16 }}>
        No periods yet. Hit “Edit schedule” to build your week.
      </div>
    );
  }

  const start = Math.floor(Math.min(...all.map((r) => toMin(r.start))) / 60) * 60;
  const end = Math.ceil(Math.max(...all.map((r) => toMin(r.end))) / 60) * 60;
  const height = Math.max(120, (end - start) * WEEK_PX_PER_MIN);
  const hours = [];
  for (let m = start; m <= end; m += 60) hours.push(m);

  return (
    <div className="week-scroll">
      <div
        className="week-cal"
        style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(104px, 1fr))` }}
      >
        <div className="wc-corner" />
        {days.map((d) => (
          <div key={d} className={"wc-head" + (d === todayKey ? " today" : "")}>
            {d}
          </div>
        ))}

        <div className="wc-gutter" style={{ height }}>
          {hours.map((m) => (
            <span key={m} className="wc-hour" style={{ top: (m - start) * WEEK_PX_PER_MIN }}>
              {fmtHour(m)}
            </span>
          ))}
        </div>

        {days.map((d, di) => (
          <div key={d} className={"wc-col" + (d === todayKey ? " today" : "")} style={{ height }}>
            {hours.map((m) => (
              <div key={m} className="wc-line" style={{ top: (m - start) * WEEK_PX_PER_MIN }} />
            ))}
            {columns[di].length === 0 && <span className="wc-off">Day off</span>}
            {columns[di].map((r) => {
              const top = (toMin(r.start) - start) * WEEK_PX_PER_MIN;
              const h = Math.max(16, (toMin(r.end) - toMin(r.start)) * WEEK_PX_PER_MIN);
              const name = r.kind === "break" ? r.label : r.subject;
              return (
                <div
                  key={r.id}
                  className={"wc-block " + r.kind + (!name ? " free" : "")}
                  style={{ top, height: h }}
                  title={`${name || "Free period"} · ${fmtTime(r.start)}–${fmtTime(r.end)}`}
                >
                  <span className="wc-subj">{name || "Free"}</span>
                  {h > 34 && <span className="wc-when">{fmtTime(r.start)}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleEditor({ initialDay }) {
  const { data, setDayPeriod, addDayPeriod, removeDayPeriod, clearDay, copyDay, resetSchedule } = useData();
  const [day, setDay] = useState(() => (ORDERED_DAYS.includes(initialDay) ? initialDay : "Mon"));
  const periods = data.schedule.days[day] || [];

  return (
    <div className="card sched-editor">
      <div className="section-head">
        <h2 className="section-title">Edit schedule</h2>
        <button className="btn ghost sm" onClick={resetSchedule}>
          Reset to default
        </button>
      </div>

      <div className="se-tabs">
        {ORDERED_DAYS.map((d) => {
          const count = (data.schedule.days[d] || []).length;
          return (
            <button
              key={d}
              className={"se-tab" + (d === day ? " on" : "") + (count ? "" : " empty")}
              onClick={() => setDay(d)}
            >
              {d}
              <span className="se-tab-count">{count || "—"}</span>
            </button>
          );
        })}
      </div>

      <div className="se-day-head">
        <div className="se-day-name">{DAY_NAMES[day]}</div>
        <div className="se-day-tools">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) copyDay(e.target.value, day);
            }}
          >
            <option value="">Copy from…</option>
            {ORDERED_DAYS.filter((d) => d !== day && (data.schedule.days[d] || []).length > 0).map((d) => (
              <option key={d} value={d}>
                {DAY_NAMES[d]}
              </option>
            ))}
          </select>
          {periods.length > 0 && (
            <button className="btn ghost sm" onClick={() => clearDay(day)}>
              Clear day
            </button>
          )}
        </div>
      </div>

      <div className="se-periods">
        {periods.length === 0 && (
          <div className="hint">Nothing scheduled on {DAY_NAMES[day]} — it counts as a day off.</div>
        )}
        {periods.map((p) => (
          <div key={p.id} className="se-period">
            <select value={p.kind} onChange={(e) => setDayPeriod(day, p.id, "kind", e.target.value)}>
              <option value="class">Class</option>
              <option value="break">Break</option>
            </select>
            <input
              value={p.label}
              onChange={(e) => setDayPeriod(day, p.id, "label", e.target.value)}
              placeholder="Label"
              className="se-label"
            />
            {p.kind === "class" ? (
              <input
                value={p.subject}
                onChange={(e) => setDayPeriod(day, p.id, "subject", e.target.value)}
                placeholder="Subject"
                className="se-subject"
              />
            ) : (
              <div className="se-break">no subject</div>
            )}
            <input
              type="time"
              value={p.start}
              onChange={(e) => setDayPeriod(day, p.id, "start", e.target.value)}
            />
            <span className="muted">to</span>
            <input type="time" value={p.end} onChange={(e) => setDayPeriod(day, p.id, "end", e.target.value)} />
            <button className="btn danger sm" onClick={() => removeDayPeriod(day, p.id)}>
              ✕
            </button>
          </div>
        ))}
        <div className="se-add">
          <button className="btn ghost sm" onClick={() => addDayPeriod(day, "class")}>
            + Class period
          </button>
          <button className="btn ghost sm" onClick={() => addDayPeriod(day, "break")}>
            + Break
          </button>
        </div>
      </div>

      <div className="hint">
        Times are per day — {DAY_NAMES[day]} can start, end and run on its own hours. Changes save instantly and
        sync with the rest of your data.
      </div>
    </div>
  );
}
