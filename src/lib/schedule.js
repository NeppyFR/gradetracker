export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const ALL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Mon-first order used for every display surface.
export const ORDERED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_NAMES = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

function sid() {
  return "p" + Math.random().toString(36).slice(2, 9);
}

export function toMin(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fromMin(mins) {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(mins)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function normTime(v, fallback) {
  if (typeof v !== "string" || !/^\d{1,2}:\d{2}/.test(v)) return fallback;
  return fromMin(toMin(v));
}

// A period now belongs to a single day: it carries its own times AND its subject.
export function normalizePeriod(p, i = 0) {
  const kind = p && p.kind === "break" ? "break" : "class";
  const start = normTime(p && p.start, fromMin(8 * 60 + 30 + i * 55));
  const end = normTime(p && p.end, fromMin(toMin(start) + 50));
  return {
    id: (p && p.id) || sid(),
    label: (p && p.label) || (kind === "break" ? "Break" : `Period ${i + 1}`),
    start,
    end: toMin(end) > toMin(start) ? end : fromMin(toMin(start) + 5),
    kind,
    subject: kind === "break" ? "" : (p && p.subject) || "",
  };
}

export function makePeriod(partial, i = 0) {
  return normalizePeriod({ ...partial, id: sid() }, i);
}

export function emptySchedule() {
  const days = {};
  ORDERED_DAYS.forEach((d) => {
    days[d] = [];
  });
  return { days };
}

export function defaultSchedule() {
  // A starting point only — every day is independently editable.
  const template = [
    { label: "Period 1", start: "08:30", end: "09:20", kind: "class" },
    { label: "Period 2", start: "09:25", end: "10:15", kind: "class" },
    { label: "Break", start: "10:15", end: "10:35", kind: "break" },
    { label: "Period 3", start: "10:35", end: "11:25", kind: "class" },
    { label: "Period 4", start: "11:30", end: "12:20", kind: "class" },
    { label: "Lunch", start: "12:20", end: "13:05", kind: "break" },
    { label: "Period 5", start: "13:05", end: "13:55", kind: "class" },
    { label: "Period 6", start: "14:00", end: "14:50", kind: "class" },
  ];
  const subjects = {
    Mon: ["Mathematics", "English", "", "Biology", "History", "", "Spanish", "PE"],
    Tue: ["Chemistry", "Mathematics", "", "English", "Art", "", "Physics", "Study Hall"],
    Wed: ["History", "Biology", "", "Mathematics", "English", "", "Chemistry", "Music"],
    Thu: ["English", "Physics", "", "Spanish", "Mathematics", "", "Biology", "PE"],
    Fri: ["Mathematics", "History", "", "Chemistry", "English", "", "Art", "Study Hall"],
  };
  const s = emptySchedule();
  WEEKDAYS.forEach((d) => {
    s.days[d] = template.map((p, i) => makePeriod({ ...p, subject: subjects[d][i] || "" }, i));
  });
  return s;
}

export function ensureSchedule(data) {
  const s = data.schedule;
  if (!s || typeof s !== "object") {
    data.schedule = defaultSchedule();
    return data;
  }

  const next = emptySchedule();

  // v2 legacy: one global `periods` array + days holding subject strings.
  // Fan the shared periods out into a private copy per day.
  if (Array.isArray(s.periods)) {
    const legacyDays = s.days && typeof s.days === "object" ? s.days : {};
    ORDERED_DAYS.forEach((d) => {
      const subs = Array.isArray(legacyDays[d]) ? legacyDays[d] : null;
      if (!subs && !WEEKDAYS.includes(d)) return;
      next.days[d] = s.periods.map((p, i) =>
        makePeriod({ ...p, subject: p.kind === "break" ? "" : (subs && subs[i]) || "" }, i)
      );
    });
    data.schedule = next;
    return data;
  }

  const days = s.days && typeof s.days === "object" ? s.days : {};
  ORDERED_DAYS.forEach((d) => {
    const raw = Array.isArray(days[d]) ? days[d] : [];
    next.days[d] = raw.filter((p) => p && typeof p === "object").map((p, i) => normalizePeriod(p, i));
  });
  data.schedule = next;
  return data;
}

export function fmtTime(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${ap}`;
}

export function fmtHour(mins) {
  const h = Math.floor(mins / 60) % 24;
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ap}`;
}

export function fmtDur(mins) {
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function dayKey(date) {
  return ALL_DAYS[date.getDay()];
}

// Periods for a weekday, in time order. Each already carries its own subject.
export function rowsForDay(schedule, key) {
  const day = schedule.days && schedule.days[key];
  if (!Array.isArray(day)) return null;
  return day
    .map((p, i) => ({ ...p, index: i, subject: p.subject || "" }))
    .sort((a, b) => toMin(a.start) - toMin(b.start) || a.index - b.index);
}

export function hasSchool(schedule, key) {
  const rows = rowsForDay(schedule, key);
  return !!rows && rows.some((r) => r.kind === "class" && r.subject.trim());
}

// Days worth rendering: the five weekdays plus any weekend day actually in use.
export function visibleDays(schedule) {
  return ORDERED_DAYS.filter(
    (d) => WEEKDAYS.includes(d) || (schedule.days[d] || []).length > 0
  );
}

export function dayBounds(schedule, key) {
  const rows = rowsForDay(schedule, key);
  if (!rows || !rows.length) return null;
  return {
    start: Math.min(...rows.map((r) => toMin(r.start))),
    end: Math.max(...rows.map((r) => toMin(r.end))),
  };
}

export function nextSchoolDay(schedule, from) {
  for (let off = 1; off <= 7; off++) {
    const d = new Date(from);
    d.setDate(d.getDate() + off);
    const key = dayKey(d);
    if (hasSchool(schedule, key)) return { key, date: d, offset: off };
  }
  return null;
}

// Live snapshot of where "now" falls within today's schedule.
export function daySnapshot(schedule, now) {
  const key = dayKey(now);
  const rows = rowsForDay(schedule, key) || [];
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const school = hasSchool(schedule, key);

  if (!school || rows.length === 0) {
    return { key, school: false, rows, nowMin, phase: "none" };
  }

  const dayStart = Math.min(...rows.map((r) => toMin(r.start)));
  const dayEnd = Math.max(dayStart + 1, ...rows.map((r) => toMin(r.end)));

  let currentIdx = -1;
  let nextIdx = -1;
  rows.forEach((r, i) => {
    if (nowMin >= toMin(r.start) && nowMin < toMin(r.end)) currentIdx = i;
  });
  for (let i = 0; i < rows.length; i++) {
    if (toMin(rows[i].start) > nowMin) {
      nextIdx = i;
      break;
    }
  }

  const current = currentIdx >= 0 ? rows[currentIdx] : null;
  const next = nextIdx >= 0 ? rows[nextIdx] : null;

  let progress = 0;
  let minsLeft = 0;
  if (current) {
    const s = toMin(current.start);
    const e = toMin(current.end);
    progress = Math.min(1, Math.max(0, (nowMin - s) / (e - s)));
    minsLeft = Math.max(0, Math.ceil(e - nowMin));
  }
  const minsToNext = next ? Math.max(0, Math.ceil(toMin(next.start) - nowMin)) : 0;

  let phase = "during";
  if (nowMin < dayStart) phase = "before";
  else if (nowMin >= dayEnd) phase = "after";

  const dayProgress = Math.min(1, Math.max(0, (nowMin - dayStart) / (dayEnd - dayStart)));

  return {
    key,
    school: true,
    rows,
    nowMin,
    dayStart,
    dayEnd,
    currentIdx,
    nextIdx,
    current,
    next,
    progress,
    minsLeft,
    minsToNext,
    dayProgress,
    phase,
  };
}
