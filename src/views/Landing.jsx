import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "📊",
    title: "Track every class",
    desc: "Log assignments, tests, and weights as you go — see your average update instantly.",
  },
  {
    icon: "🧮",
    title: "What-if calculator",
    desc: "Find out exactly what you need on the final to hit the grade you want.",
  },
  {
    icon: "☁️",
    title: "Cloud sync",
    desc: "Connect a Gist and pick up right where you left off on any device.",
  },
];

export default function Landing({ onEnter }) {
  return (
    <div className="landing">
      <div className="landing-blob landing-blob-a" />
      <div className="landing-blob landing-blob-b" />

      <motion.div
        className="landing-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="landing-kicker">Grade Tracker</div>
        <h1 className="landing-title">
          Know your grade.
          <br />
          Before the grade knows you.
        </h1>
        <p className="landing-sub">
          A fast, no-nonsense way to track assignments, calculate what you need, and stay ahead of every
          class this semester.
        </p>
        <motion.button
          className="btn landing-cta"
          onClick={onEnter}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Get Started →
        </motion.button>
      </motion.div>

      <motion.div
        className="landing-features"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
        }}
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            className="feature-card"
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
            }}
          >
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
