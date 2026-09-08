export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const ALL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  return "p" + Math.random().toString(36).slice(2, 8);
}

export function defaultSchedule() {
  const periods = [
    { id: sid(), label: "Period 1", start: "08:30", end: "09:20", kind: "class" },
    { id: sid(), label: "Period 2", start: "09:25", end: "10:15", kind: "class" },
    { id: sid(), label: "Break", start: "10:15", end: "10:35", kind: "break" },
    { id: sid(), label: "Period 3", start: "10:35", end: "11:25", kind: "class" },
    { id: sid(), label: "Period 4", start: "11:30", end: "12:20", kind: "class" },
    { id: sid(), label: "Lunch", start: "12:20", end: "13:05", kind: "break" },
    { id: sid(), label: "Period 5", start: "13:05", end: "13:55", kind: "class" },
    { id: sid(), label: "Period 6", start: "14:00", end: "14:50", kind: "class" },
  ];
  const subjects = {
    Mon: ["Mathematics", "English", "", "Biology", "History", "", "Spanish", "PE"],
    Tue: ["Chemistry", "Mathematics", "", "English", "Art", "", "Physics", "Study Hall"],
    Wed: ["History", "Biology", "", "Mathematics", "English", "", "Chemistry", "Music"],
    Thu: ["English", "Physics", "", "Spanish", "Mathematics", "", "Biology", "PE"],
    Fri: ["Mathematics", "History", "", "Chemistry", "English", "", "Art", "Study Hall"],
  };
  const days = {};
  WEEKDAYS.forEach((d) => {
    days[d] = periods.map((p, i) => (p.kind === "break" ? "" : subjects[d][i] || ""));
  });
  return { periods, days };
}

export function ensureSchedule(data) {
  if (!data.schedule || !Array.isArray(data.schedule.periods) || !data.schedule.days) {
    data.schedule = defaultSchedule();
  } else {
    data.schedule.periods.forEach((p) => {
      if (!p.kind) p.kind = "class";
      if (!p.id) p.id = sid();
    });
    WEEKDAYS.forEach((d) => {
      if (!Array.isArray(data.schedule.days[d])) data.schedule.days[d] = [];
      const n = data.schedule.periods.length;
      while (data.schedule.days[d].length < n) data.schedule.days[d].push("");
      data.schedule.days[d] = data.schedule.days[d].slice(0, n);
    });
  }
  return data;
}

export function toMin(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fmtTime(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${ap}`;
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

// Rows for a given weekday key, each period annotated with its subject.
export function rowsForDay(schedule, key) {
  const subs = schedule.days[key];
  if (!subs) return null;
  return schedule.periods.map((p, i) => ({ ...p, index: i, subject: subs[i] || "" }));
}

export function hasSchool(schedule, key) {
  const rows = rowsForDay(schedule, key);
  return !!rows && rows.some((r) => r.kind === "class" && r.subject.trim());
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

  const dayStart = toMin(rows[0].start);
  const dayEnd = Math.max(dayStart + 1, toMin(rows[rows.length - 1].end));

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
