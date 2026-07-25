import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { fmtDate, ungraded } from "../lib/math";

export default function Upcoming() {
  const { data } = useData();

  const list = useMemo(() => {
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

  return (
    <section>
      <h1 className="view-title">Upcoming Exams</h1>
      <div className="view-sub">Every ungraded exam across your classes, soonest first.</div>
      {list.length === 0 ? (
        <div className="empty">Nothing upcoming. Add an exam with a blank score to track it here.</div>
      ) : (
        <AnimatePresence initial={false}>
          {list.map((i) => {
            let daysCls = "days done";
            let daysTxt = "no date";
            if (i.date) {
              const d = new Date(i.date + "T00:00:00");
              const diff = Math.round((d - today) / 86400000);
              if (diff < 0) {
                daysTxt = `${-diff}d ago`;
                daysCls = "days done";
              } else if (diff === 0) {
                daysTxt = "today";
                daysCls = "days soon";
              } else if (diff <= 7) {
                daysTxt = `in ${diff}d`;
                daysCls = "days soon";
              } else {
                daysTxt = `in ${diff}d`;
                daysCls = "days";
              }
            }
            return (
              <motion.div
                key={i.id}
                className="up-item"
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className="up-left">
                  <span className="up-cls">{i.cls}</span>
                  <span className="up-when">
                    {i.name || "(unnamed)"} <span className="badge b-up">weight {i.weight}</span>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>{i.date ? fmtDate(i.date) : ""}</div>
                  <span className={daysCls}>{daysTxt}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </section>
  );
}
