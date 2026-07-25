import { AnimatePresence, motion } from "framer-motion";
import { useData } from "../context/DataContext";
import { avgColor, fmt, weightedAvg } from "../lib/math";

export default function ClassCard({ cls }) {
  const { setClassName, addItem, removeItem, setField, removeClass } = useData();
  const avg = weightedAvg(cls.items);

  return (
    <motion.div
      className="card"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <div className="classhead">
        <input
          value={cls.name}
          onChange={(e) => setClassName(cls.id, e.target.value)}
          style={{ fontSize: 18, fontWeight: 700, minWidth: 200, background: "transparent", border: "none" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="avgpill" style={{ color: avgColor(avg) }}>
            {avg === null ? "No grades yet" : fmt(avg)}
          </span>
          <button className="btn danger sm" onClick={() => removeClass(cls.id)}>
            Delete
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Weight</th>
            <th>Grade</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {cls.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty">
                  No exams yet.
                </td>
              </tr>
            ) : (
              cls.items.map((item) => (
                <motion.tr
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <td className="col-name">
                    <input
                      value={item.name}
                      placeholder="Exam / assignment"
                      onChange={(e) => setField(cls.id, item.id, "name", e.target.value)}
                    />
                  </td>
                  <td className="col-date">
                    <input
                      type="date"
                      value={item.date || ""}
                      onChange={(e) => setField(cls.id, item.id, "date", e.target.value)}
                    />
                  </td>
                  <td className="col-weight">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.weight}
                      onChange={(e) => setField(cls.id, item.id, "weight", e.target.value)}
                    />
                  </td>
                  <td className="col-score">
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      max="6"
                      value={item.score === null ? "" : item.score}
                      placeholder="—"
                      onChange={(e) => setField(cls.id, item.id, "score", e.target.value)}
                    />
                  </td>
                  <td className="col-x">
                    <button className="btn danger sm" onClick={() => removeItem(cls.id, item.id)}>
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
        <button className="btn ghost sm" onClick={() => addItem(cls.id)}>
          + Add exam / assignment
        </button>
        <span className="hint">
          Grades on the Swiss 1–6 scale (4.0 = pass). Blank = upcoming. Weight 1 = normal, 2 = double, 0.5 = half.
        </span>
      </div>
    </motion.div>
  );
}
