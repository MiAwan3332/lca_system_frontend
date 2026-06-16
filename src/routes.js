import { FiHome } from "react-icons/fi";
import { FaUsers } from "react-icons/fa";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { SiBookstack } from "react-icons/si";
import { SiGoogleclassroom } from "react-icons/si";
import { FaList } from "react-icons/fa";
import { FaListCheck } from "react-icons/fa6";
import Home from "./Pages/Home.js";
import User from "./Pages/User/User.js";
import Teacher from "./Pages/Teacher/Teacher.js";
import Courses from "./Pages/Courses/Courses.js";
import Mcq from "./Pages/Mcqs/Mcqs.js";
import Batches from "./Pages/Batch/Batch.js";
import Students from "./Pages/Students/Student.js";
import Roles from "./Pages/Roles/Roles.js";
import Permissions from "./Pages/Permissions/Permissions.js";
import Seminars from "./Pages/Seminar/seminar.js";
import { FaQuestionCircle } from "react-icons/fa";
import { Boxes, BrainCircuit, CalendarRange, CircleDollarSign, CircleHelp, GraduationCap, Layers, LayoutDashboard, ListChecks, Presentation, School, UserRoundCheck, UserRoundCog, Users, UsersRound, BarChart3, Receipt } from "lucide-react";
import Timetable from "./Pages/Timetable/Timetable.js";
import Attendance from "./Pages/Attendance/Attendance.js";
import Fees from "./Pages/Fees/Fees.js";
import FinanceReport from "./Pages/FinanceReport/FinanceReport.js";
import Expense from "./Pages/Expense/Expense.js";
import Quiz from "./Pages/Quiz/Quiz.js";

export const routes = [
  { name: "Dashboard", icon: LayoutDashboard, component: <Home />, path: "/dashboard" },
  { name: "Users", icon: UsersRound, component: <User />, path: "/user" },
  {
    name: "Students",
    icon: GraduationCap,
    component: <Students />,
    path: "/student",
  },
  {
    name: "Fees",
    icon: CircleDollarSign,
    component: <Fees />,
    path: "/fees",
  },
  {
    name: "Finance Report",
    icon: BarChart3,
    component: <FinanceReport />,
    path: "/finance-report",
  },
  {
    name: "Expenses",
    icon: Receipt,
    component: <Expense />,
    path: "/expenses",
  },
  {
    name: "Teachers",
    icon: School,
    component: <Teacher />,
    path: "/teacher",
  },
  {
    name: "Batches",
    icon: Boxes,
    component: <Batches />,
    path: "/batch",
  },
  {
    name: "Courses",
    icon: Layers,
    component: <Courses />,
    path: "/course",
  },
  {
    name: "Timetable",
    icon: CalendarRange,
    component: <Timetable />,
    path: "/timetable",
  },
  {
    name: "Attendance",
    icon: UserRoundCheck,
    component: <Attendance />,
    path: "/attendance",
  },
  {
    name: "Seminars",
    icon: Presentation,
    component: <Seminars />,
    path: "/seminar",
  },
  {
    name: "Mcqs",
    icon: CircleHelp,
    component: <Mcq />,
    path: "/mcq",
  },
  {
    name: "Quiz",
    icon: BrainCircuit,
    component: <Quiz />,
    path: "/quiz",
  },
  {
    name: "Roles",
    icon: UserRoundCog,
    component: <Roles />,
    path: "/role",
  },
  {
    name: "Permissions",
    icon: ListChecks,
    component: <Permissions />,
    path: "/permission",
  },
];
