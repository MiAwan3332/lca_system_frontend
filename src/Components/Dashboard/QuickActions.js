import React from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  School,
  Layers,
  Boxes,
  BrainCircuit,
  ClipboardList,
  UserRoundCheck,
  Plus,
} from "lucide-react";
import { isTeacherRole } from "../../utlls/teacherAccess";
import { isStudentViewOnly } from "../../utlls/studentAccess";

const ADMIN_ACTIONS = [
  { label: "Add Student", icon: GraduationCap, path: "/student" },
  { label: "Add Teacher", icon: School, path: "/teacher" },
  { label: "Create Course", icon: Layers, path: "/course" },
  { label: "Create Batch", icon: Boxes, path: "/batch" },
  { label: "Create Quiz", icon: BrainCircuit, path: "/quiz" },
  { label: "Create Assignment", icon: ClipboardList, path: "/assignments" },
  { label: "Mark Attendance", icon: UserRoundCheck, path: "/attendance" },
];

const TEACHER_ACTIONS = [
  { label: "My Students", icon: GraduationCap, path: "/student" },
  { label: "Assignments", icon: ClipboardList, path: "/assignments" },
  { label: "Course Quizzes", icon: BrainCircuit, path: "/course-quizzes" },
  { label: "Mark Attendance", icon: UserRoundCheck, path: "/attendance" },
  { label: "Timetable", icon: Boxes, path: "/timetable" },
  { label: "Add MCQ", icon: Plus, path: "/mcq" },
];

const STUDENT_ACTIONS = [
  { label: "My Profile", icon: GraduationCap, path: "/student" },
  { label: "Assignments", icon: ClipboardList, path: "/assignments" },
  { label: "Quizzes", icon: BrainCircuit, path: "/course-quizzes" },
  { label: "Attendance", icon: UserRoundCheck, path: "/attendance" },
  { label: "Fees", icon: Layers, path: "/fees" },
];

function QuickActions() {
  const navigate = useNavigate();
  const isTeacher = isTeacherRole();
  const viewOnly = isStudentViewOnly();

  const actions = viewOnly
    ? STUDENT_ACTIONS
    : isTeacher
      ? TEACHER_ACTIONS
      : ADMIN_ACTIONS;

  return (
    <div className="dash-surface-card p-5 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold dash-text">Quick Actions</h3>
        <p className="text-sm dash-text-muted">Jump to common tasks</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.path + action.label}
              type="button"
              onClick={() => navigate(action.path)}
              className="dash-action-btn flex flex-col items-center gap-2 p-4 rounded-xl transition-colors duration-300"
            >
              <div className="p-2.5 rounded-xl bg-[#d69e2e]/30 text-[var(--dash-icon)]">
                <Icon size={20} />
              </div>
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActions;
