import { AnimatePresence } from "framer-motion";
import { useData } from "../context/DataContext";
import ClassCard from "../components/ClassCard";

export default function CurrentSemester() {
  const { data, addClass } = useData();

  return (
    <section>
      <h1 className="view-title">Current Semester</h1>
      <div className="view-sub">Live weighted averages. Leave a score blank to mark an exam as upcoming.</div>
      <div style={{ marginBottom: 14 }}>
        <button className="btn" onClick={addClass}>
          + Add class
        </button>
      </div>
      {data.classes.length === 0 ? (
        <div className="empty">No classes yet. Click "+ Add class".</div>
      ) : (
        <AnimatePresence initial={false}>
          {data.classes.map((c) => (
            <ClassCard key={c.id} cls={c} />
          ))}
        </AnimatePresence>
      )}
    </section>
  );
}
