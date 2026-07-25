export const KEY = "gradeTracker.v2";

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function demoClass() {
  return {
    id: uid(),
    name: "Example Class",
    items: [
      { id: uid(), name: "Quiz 1", date: "", weight: 1, score: 5.5 },
      { id: uid(), name: "Midterm", date: "", weight: 2, score: 4.75 },
      { id: uid(), name: "Final Exam", date: "", weight: 3, score: null },
    ],
  };
}

export function demoSemester() {
  return {
    id: uid(),
    name: "Fall 2025",
    absences: 4,
    classes: [
      { id: uid(), name: "Calculus I", grade: "5.5", passed: true },
      { id: uid(), name: "Chemistry", grade: "4.0", passed: true },
      { id: uid(), name: "History", grade: "5.75", passed: true },
    ],
  };
}

export function migrateSem(s) {
  if (!s.classes) {
    s.classes = [];
    if (s.avg !== undefined && s.avg !== "") {
      s.classes.push({ id: uid(), name: "Overall", grade: String(s.avg), passed: Number(s.avg) >= 60 });
    }
    delete s.avg;
  }
  if (s.absences === undefined) s.absences = "";
  return s;
}

export function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.classes) {
      if (!d.semesters) d.semesters = [];
      d.semesters.forEach(migrateSem);
      return d;
    }
  } catch (e) {
    /* ignore */
  }
  try {
    const old = JSON.parse(localStorage.getItem("gradeTracker.v1"));
    if (old && old.classes) {
      old.semesters = (old.semesters || []).map((s) => migrateSem(s));
      return old;
    }
  } catch (e) {
    /* ignore */
  }
  return {
    classes: [demoClass()],
    semesters: [demoSemester()],
  };
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
