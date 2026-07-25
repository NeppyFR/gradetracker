import { AnimatePresence } from "framer-motion";
import { useData } from "../context/DataContext";
import SemesterCard from "../components/SemesterCard";

export default function PreviousSemesters() {
  const { data, addSemester } = useData();

  return (
    <section>
      <h1 className="view-title">Previous Semesters</h1>
      <div className="view-sub">Your own record of past semesters — classes, grades, pass/fail, and absences.</div>
      <div style={{ marginBottom: 14 }}>
        <button className="btn" onClick={addSemester}>
          + Add semester
        </button>
      </div>
      {data.semesters.length === 0 ? (
        <div className="empty">No semesters yet. Click "+ Add semester".</div>
      ) : (
        <AnimatePresence initial={false}>
          {data.semesters.map((s) => (
            <SemesterCard key={s.id} sem={s} />
          ))}
        </AnimatePresence>
      )}
    </section>
  );
}
