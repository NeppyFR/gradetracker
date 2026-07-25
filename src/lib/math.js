export function graded(items) {
  return items.filter((i) => i.score !== null && i.score !== "" && !isNaN(i.score));
}

export function ungraded(items) {
  return items.filter((i) => i.score === null || i.score === "");
}

export function weightedAvg(items) {
  const g = graded(items);
  let sw = 0,
    sws = 0;
  g.forEach((i) => {
    const w = Number(i.weight) || 0;
    sw += w;
    sws += w * Number(i.score);
  });
  return sw > 0 ? sws / sw : null;
}

export function overallAvg(classes) {
  const avgs = classes.map((c) => weightedAvg(c.items)).filter((a) => a !== null);
  if (!avgs.length) return null;
  return avgs.reduce((a, b) => a + b, 0) / avgs.length;
}

export function fmt(n) {
  return n === null || n === undefined ? "—" : (Math.round(n * 100) / 100).toFixed(2);
}

export function avgColor(a) {
  if (a === null) return "var(--muted)";
  if (a >= 5) return "var(--good)";
  if (a >= 4) return "var(--warn)";
  return "var(--bad)";
}

export function fmtDate(s) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function semSummary(s) {
  const total = s.classes.length;
  const passed = s.classes.filter((c) => c.passed).length;
  const nums = s.classes.map((c) => parseFloat(c.grade)).filter((n) => !isNaN(n));
  const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  return { total, passed, avg };
}
