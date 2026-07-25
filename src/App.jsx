import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Header from "./components/Header";
import Drawer from "./components/Drawer";
import { DataProvider } from "./context/DataContext";
import CurrentSemester from "./views/CurrentSemester";
import Upcoming from "./views/Upcoming";
import Calculator from "./views/Calculator";
import PreviousSemesters from "./views/PreviousSemesters";
import CloudSync from "./views/CloudSync";

const VIEWS = {
  current: CurrentSemester,
  upcoming: Upcoming,
  calc: Calculator,
  previous: PreviousSemesters,
  sync: CloudSync,
};

function AppShell() {
  const [view, setView] = useState("current");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (name) => {
    setView(name);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const ActiveView = VIEWS[view];

  return (
    <>
      <Header onBurger={() => setMenuOpen((o) => !o)} onSync={() => navigate("sync")} />
      <Drawer open={menuOpen} currentView={view} onNavigate={navigate} onClose={() => setMenuOpen(false)} />
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <ActiveView />
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
