import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Header from "./components/Header";
import Drawer from "./components/Drawer";
import { DataProvider } from "./context/DataContext";
import Landing from "./views/Landing";
import Home from "./views/Home";
import CurrentSemester from "./views/CurrentSemester";
import Upcoming from "./views/Upcoming";
import Calculator from "./views/Calculator";
import PreviousSemesters from "./views/PreviousSemesters";
import CloudSync from "./views/CloudSync";

const VIEWS = {
  home: Home,
  current: CurrentSemester,
  upcoming: Upcoming,
  calc: Calculator,
  previous: PreviousSemesters,
  sync: CloudSync,
};

function AppShell() {
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (name) => {
    setView(name);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const enterApp = () => setShowLanding(false);

  if (showLanding) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="landing" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <Landing onEnter={enterApp} />
        </motion.div>
      </AnimatePresence>
    );
  }

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
