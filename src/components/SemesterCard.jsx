import { AnimatePresence, motion } from "framer-motion";
import { useData } from "../context/DataContext";
import { avgColor, fmt, semSummary } from "../lib/math";

export default function SemesterCard({ sem }) {
  const { setSem, addSemClass, removeSemClass, setSemClass, togglePass, removeSemester } = useData();
  const { total, passed, avg } = semSummary(sem);
  const allPass = total > 0 && passed === total;

  return (
    <motion.div
      className="card"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sem-top">
        <input
          className="sem-name"
          value={sem.name}
          placeholder="Semester name"
          onChange={(e) => setSem(sem.id, "name", e.target.value)}
        />
        <div className="sem-stats">
          <span className="stat">
            <span className="lab">Passed</span>{" "}
            <b style={{ color: allPass ? "var(--good)" : passed < total ? "var(--warn)" : "var(--muted)" }}>
              {passed}/{total}
            </b>
          </span>
          {avg !== null && (
            <span className="stat">
              <span className="lab">Avg</span> <b style={{ color: avgColor(avg) }}>{fmt(avg)}</b>
            </span>
          )}
          <span className="stat">
            <span className="lab">Absences</span>
            <input
              className="abs-input"
              type="number"
              min="0"
              value={sem.absences === "" ? "" : sem.absences}
              placeholder="0"
              onChange={(e) => setSem(sem.id, "absences", e.target.value)}
            />
          </span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Grade</th>
            <th>Result</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {sem.classes.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">
                  No classes recorded.
                </td>
              </tr>
            ) : (
              sem.classes.map((c) => (
                <motion.tr
                  key={c.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <td className="col-name">
                    <input
                      value={c.name}
                      placeholder="Class name"
                      onChange={(e) => setSemClass(sem.id, c.id, "name", e.target.value)}
                    />
                  </td>
                  <td className="col-grade">
                    <input
                      value={c.grade}
                      placeholder="e.g. 5.5"
                      onChange={(e) => setSemClass(sem.id, c.id, "grade", e.target.value)}
                    />
                  </td>
                  <td className="col-pf">
                    <button className={"pf " + (c.passed ? "pass" : "fail")} onClick={() => togglePass(sem.id, c.id)}>
                      {c.passed ? "PASSED" : "FAILED"}
                    </button>
                  </td>
                  <td className="col-x">
                    <button className="btn danger sm" onClick={() => removeSemClass(sem.id, c.id)}>
                      ✕
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </tbody>
      </table>
      <div className="addrow">
        <button className="btn ghost sm" onClick={() => addSemClass(sem.id)}>
          + Add class
        </button>
        <button className="btn danger sm" onClick={() => removeSemester(sem.id)}>
          Delete semester
        </button>
        <span className="hint">Grade on the 1–6 scale. Tap the result pill to flip pass/fail.</span>
      </div>
    </motion.div>
  );
}
