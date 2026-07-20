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
import { Boxes, BrainCircuit, CalendarRange, CircleDollarSign, CircleHelp, GraduationCap, Layers, LayoutDashboard, ListChecks, Presentation, School, UserRoundCheck, UserRoundCog, Users, UsersRound, BarChart3, Receipt, ClipboardList, BookOpenCheck, MessageSquareWarning, Megaphone, ScrollText, Shield, ClipboardPenLine, Bell, UserCircle } from "lucide-react";
import Timetable from "./Pages/Timetable/Timetable.js";
import Attendance from "./Pages/Attendance/Attendance.js";
import Fees from "./Pages/Fees/Fees.js";
import FinanceReport from "./Pages/FinanceReport/FinanceReport.js";
import Expense from "./Pages/Expense/Expense.js";
import Quiz from "./Pages/Quiz/Quiz.js";
import Assignments from "./Pages/Assignments/Assignments.js";
import CourseQuizzes from "./Pages/CourseQuizzes/CourseQuizzes.js";
import Complaints from "./Pages/Complaints/Complaints.js";
import Announcements from "./Pages/Announcements/Announcements.js";
import NotificationsPage from "./Pages/Notifications/NotificationsPage.js";
import GoogleWorkspaceRedirect from "./Pages/GoogleWorkspace/GoogleWorkspaceRedirect.js";
import Profile from "./Pages/Profile/Profile.js";
import {
  StudentActivityLogs,
  TeacherActivityLogs,
  AdminActivityLogs,
} from "./Pages/ActivityLogs/ActivityLogsPage.js";

export const routes = [
  { name: "Dashboard", icon: LayoutDashboard, component: <Home />, path: "/dashboard" },
  {
    name: "Profile",
    icon: UserCircle,
    component: <Profile />,
    path: "/profile",
    hidden: true,
  },
  { name: "Users", icon: UsersRound, component: <User />, path: "/user" },
  {
    name: "Students",
    icon: GraduationCap,
    component: <Students />,
    path: "/student",
  },
  {
    name: "Fees",
    studentName: "My Finance",
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
    name: "Assignments",
    icon: ClipboardList,
    component: <Assignments />,
    path: "/assignments",
  },
  {
    name: "Course Quizzes",
    icon: BookOpenCheck,
    component: <CourseQuizzes />,
    path: "/course-quizzes",
  },
  {
    name: "Complaints",
    icon: MessageSquareWarning,
    component: <Complaints />,
    path: "/complaints",
  },
  {
    name: "Announcements",
    icon: Megaphone,
    component: <Announcements />,
    path: "/announcements",
  },
  {
    name: "Notifications",
    icon: Bell,
    component: <NotificationsPage />,
    path: "/notifications",
    adminOnly: true,
  },
  {
    name: "Google Workspace",
    icon: UserCircle,
    component: <GoogleWorkspaceRedirect />,
    path: "/google-workspace",
    adminOnly: true,
    hidden: true,
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
  {
    name: "Student Logs",
    icon: ScrollText,
    component: <StudentActivityLogs />,
    path: "/activity-logs/students",
  },
  {
    name: "Teacher Logs",
    icon: ClipboardPenLine,
    component: <TeacherActivityLogs />,
    path: "/activity-logs/teachers",
  },
  {
    name: "Admin Logs",
    icon: Shield,
    component: <AdminActivityLogs />,
    path: "/activity-logs/admins",
  },
];
