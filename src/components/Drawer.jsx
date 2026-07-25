import { AnimatePresence, motion } from "framer-motion";
import { useData } from "../context/DataContext";

const NAV_ITEMS = [
  { view: "current", icon: "📚", label: "Current Semester" },
  { view: "upcoming", icon: "🗓️", label: "Upcoming Exams" },
  { view: "calc", icon: "🎯", label: "Grade Calculator" },
  { view: "previous", icon: "🏆", label: "Previous Semesters" },
  { view: "sync", icon: "☁️", label: "Cloud Sync" },
];

export default function Drawer({ open, currentView, onNavigate, onClose }) {
  const { exportData, importData } = useData();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.nav
            className="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <h2>Menu</h2>
            <div className="nav">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.view}
                  className={currentView === item.view ? "active" : ""}
                  onClick={() => onNavigate(item.view)}
                >
                  <span className="ic">{item.icon}</span> {item.label}
                </a>
              ))}
            </div>
            <div className="tools">
              <button className="btn ghost sm" onClick={exportData}>
                Export backup
              </button>
              <button className="btn ghost sm" onClick={() => document.getElementById("importFile").click()}>
                Import backup
              </button>
              <input
                type="file"
                id="importFile"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) importData(f);
                  e.target.value = "";
                }}
              />
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
