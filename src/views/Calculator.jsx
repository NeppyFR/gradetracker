import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { avgColor, fmt, graded, ungraded, weightedAvg } from "../lib/math";

export default function Calculator() {
  const { data } = useData();
  const [classId, setClassId] = useState(data.classes[0]?.id || "");
  const [examId, setExamId] = useState("");
  const [goal1, setGoal1] = useState("");
  const [goal2, setGoal2] = useState("");

  useEffect(() => {
    if (!data.classes.some((c) => c.id === classId)) {
      setClassId(data.classes[0]?.id || "");
    }
  }, [data.classes, classId]);

  const cls = data.classes.find((c) => c.id === classId);
  const g = useMemo(() => (cls ? graded(cls.items) : []), [cls]);
  const u = useMemo(() => (cls ? ungraded(cls.items) : []), [cls]);
  const uNamed = useMemo(() => u.filter((i) => (i.name && i.name.trim()) || i.date), [u]);

  useEffect(() => {
    if (!uNamed.some((i) => i.id === examId)) {
      setExamId(uNamed[0]?.id || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uNamed]);

  const curAvg = cls ? weightedAvg(cls.items) : null;

  let Wg = 0,
    G = 0;
  g.forEach((i) => {
    const w = Number(i.weight) || 0;
    Wg += w;
    G += w * Number(i.score);
  });

  const exam = uNamed.find((i) => i.id === examId);

  let res1Class = "result";
  let res1Content = "Add an upcoming exam (blank score) to use this.";
  if (exam) {
    const goalNum = parseFloat(goal1);
    if (isNaN(goalNum)) {
      res1Content = "Enter your goal average.";
    } else {
      const We = Number(exam.weight) || 0;
      if (We <= 0) {
        res1Class = "result r-warn";
        res1Content = "This exam has weight 0 — it can't change your average.";
      } else {
        const need = (goalNum * (Wg + We) - G) / We;
        res1Class = "result " + (need > 6 ? "r-bad" : need <= 1 ? "r-good" : need > 5.5 ? "r-warn" : "r-good");
        const extra =
          need > 6
            ? " — not reachable with this exam alone (the highest grade is 6)."
            : need <= 1
            ? " — you've already secured your goal! ✦"
            : "";
        res1Content = (
          <>
            You need <b>{fmt(need)}</b> on <b>{exam.name || "this exam"}</b> to reach a {fmt(goalNum)} average.
            {extra}
          </>
        );
      }
    }
  }

  let Wr = 0;
  u.forEach((i) => {
    Wr += Number(i.weight) || 0;
  });
  const goal2Num = parseFloat(goal2);
  let res2Class = "result";
  let res2Content = "Enter your goal average.";
  if (!isNaN(goal2Num)) {
    if (Wr <= 0) {
      res2Class = "result r-warn";
      res2Content = "No remaining exams with weight to calculate.";
    } else {
      const need = (goal2Num * (Wg + Wr) - G) / Wr;
      res2Class = "result " + (need > 6 ? "r-bad" : need <= 1 ? "r-good" : need > 5.5 ? "r-warn" : "r-good");
      const extra =
        need > 6 ? " — not reachable (the highest grade is 6 on every exam)." : need <= 1 ? " — already secured! ✦" : "";
      res2Content = (
        <>
          You need to average <b>{fmt(need)}</b> across your {u.length} remaining exam{u.length !== 1 ? "s" : ""} to
          reach a {fmt(goal2Num)} average.
          {extra}
        </>
      );
    }
  }

  return (
    <section>
      <h1 className="view-title">Grade Calculator</h1>
      <div className="view-sub">Work out what you need to hit your goal average.</div>
      <div className="card">
        <div className="field" style={{ maxWidth: 340 }}>
          <label>Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {cls && (
          <div className="hint">
            Current weighted average: <b style={{ color: avgColor(curAvg) }}>{curAvg === null ? "—" : fmt(curAvg)}</b>{" "}
            &nbsp;·&nbsp; {g.length} graded, {u.length} remaining.
          </div>
        )}
        <div className="calc-grid" style={{ marginTop: 14 }}>
          <div>
            <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Need a score on one exam</h3>
            <div className="field">
              <label>Which upcoming exam?</label>
              <select value={examId} onChange={(e) => setExamId(e.target.value)}>
                {uNamed.length === 0 ? (
                  <option value="">No upcoming exams</option>
                ) : (
                  uNamed.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name || "(unnamed)"} · weight {i.weight}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="field">
              <label>Goal average (1–6)</label>
              <input
                type="number"
                step="0.05"
                min="1"
                max="6"
                value={goal1}
                placeholder="e.g. 5.5"
                onChange={(e) => setGoal1(e.target.value)}
              />
            </div>
            <div className={res1Class}>{res1Content}</div>
          </div>
          <div>
            <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Average needed across all remaining exams</h3>
            <div className="field">
              <label>Goal average (1–6)</label>
              <input
                type="number"
                step="0.05"
                min="1"
                max="6"
                value={goal2}
                placeholder="e.g. 5.5"
                onChange={(e) => setGoal2(e.target.value)}
              />
            </div>
            <div className={res2Class}>{res2Content}</div>
            <div className="hint">Assumes you score the same on every remaining exam, weighted by each exam's weight.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
