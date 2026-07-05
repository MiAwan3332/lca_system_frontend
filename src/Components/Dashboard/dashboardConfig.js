import {
  Box,
  Boxes,
  GraduationCap,
  DollarSign,
  HandCoins,
  ArrowDown01,
  AlertTriangle,
  Receipt,
  Wallet,
  Clock,
  FileBox,
  BookOpen,
  Users,
} from "lucide-react";

export const ADMIN_KPI_CONFIG = [
  {
    key: "total_enrolled_students_count",
    title: "Total Students",
    helpText: "Enrolled / total students",
    icon: GraduationCap,
    gradient: "indigo",
    permissions: ["view_total_enrolled_students"],
    trend: 8,
  },
  {
    key: "total_batches_count",
    title: "Total Batches",
    helpText: "All active and past batches",
    icon: Boxes,
    gradient: "purple",
    permissions: ["view_total_batches"],
    trend: 4,
  },
  {
    key: "current_batches_count",
    title: "Current Batches",
    helpText: "Currently running batches",
    icon: Box,
    gradient: "sky",
    permissions: ["view_current_batches"],
    trend: 6,
  },
  {
    key: "total_fee_recovered",
    title: "Revenue Collected",
    helpText: "Total fee recovered",
    icon: HandCoins,
    gradient: "emerald",
    permissions: ["view_total_fee_recovered"],
    trend: 12,
  },
  {
    key: "total_fee_pending",
    title: "Pending Fees",
    helpText: "Outstanding fee balance",
    icon: ArrowDown01,
    gradient: "amber",
    permissions: ["view_total_fee_pending"],
    trend: -3,
  },
  {
    key: "total_fee_defaulters",
    title: "Fee Defaulters",
    helpText: "Students with pending fees",
    icon: AlertTriangle,
    gradient: "rose",
    permissions: ["view_total_fee_defaulters"],
    trend: -2,
  },
  {
    key: "net_balance",
    title: "Net Balance",
    helpText: "Recovered minus approved expenses",
    icon: Wallet,
    gradient: "slate",
    permissions: ["view_total_fee_recovered"],
    trend: 5,
  },
  {
    key: "total_approved_expenses",
    title: "Approved Expenses",
    helpText: "Deducted from finance",
    icon: Receipt,
    gradient: "purple",
    permissions: ["view_total_fee_recovered"],
    trend: 2,
  },
];

export const TEACHER_KPI_CONFIG = [
  {
    key: "assigned_students_count",
    title: "My Students",
    helpText: "Students in assigned batches",
    icon: GraduationCap,
    gradient: "indigo",
    trend: 5,
  },
  {
    key: "assigned_batches_count",
    title: "Assigned Batches",
    helpText: "Batches you teach",
    icon: Boxes,
    gradient: "purple",
    trend: 0,
  },
  {
    key: "assigned_courses_count",
    title: "Assigned Courses",
    helpText: "Courses linked to you",
    icon: BookOpen,
    gradient: "sky",
    trend: 3,
  },
  {
    key: "pending_assignment_reviews",
    title: "Pending Reviews",
    helpText: "Submissions awaiting grading",
    icon: FileBox,
    gradient: "rose",
    trend: -4,
  },
  {
    key: "active_quizzes_count",
    title: "Active Quizzes",
    helpText: "Quizzes currently running",
    icon: Receipt,
    gradient: "amber",
    trend: 7,
  },
  {
    key: "upcoming_classes_count",
    title: "Upcoming Classes",
    helpText: "Scheduled timetable entries",
    icon: Clock,
    gradient: "emerald",
    trend: 2,
  },
  {
    key: "attendance_records_count",
    title: "Attendance Records",
    helpText: "Entries for your classes",
    icon: Users,
    gradient: "slate",
    trend: 6,
  },
  {
    key: "upcoming_assignment_deadlines",
    title: "Upcoming Deadlines",
    helpText: "Published assignment due dates",
    icon: AlertTriangle,
    gradient: "amber",
    trend: 1,
  },
];

export const STUDENT_KPI_CONFIG = [
  {
    key: "batch_name",
    title: "My Batch",
    helpText: "Assigned batch",
    icon: Box,
    gradient: "indigo",
    trend: 0,
  },
  {
    key: "total_fee_record",
    title: "Total Fee",
    helpText: "Your assigned batch fee",
    icon: DollarSign,
    gradient: "purple",
    trend: 0,
  },
  {
    key: "total_fee_recovered",
    title: "Fee Paid",
    helpText: "Amount you have paid",
    icon: HandCoins,
    gradient: "emerald",
    trend: 10,
  },
  {
    key: "total_fee_pending",
    title: "Fee Pending",
    helpText: "Outstanding balance",
    icon: ArrowDown01,
    gradient: "amber",
    trend: -5,
  },
  {
    key: "attendance_records_count",
    title: "Attendance Records",
    helpText: "Your attendance entries",
    icon: GraduationCap,
    gradient: "sky",
    trend: 4,
  },
];

export const buildActivityItems = (statistics = {}, notifications = []) => {
  const items = [];

  (statistics.recent_activity || []).forEach((item, index) => {
    items.push({
      id: `activity-${index}`,
      type: item.type || "default",
      title: item.title,
      subtitle: item.subtitle,
      time: item.time,
    });
  });

  (statistics.recent_student_activity || []).forEach((item, index) => {
    items.push({
      id: `submission-${index}`,
      type: "assignment",
      title: `${item.student_name} submitted ${item.assignment_title}`,
      subtitle: item.status,
      time: item.submitted_at,
    });
  });

  notifications.slice(0, 5).forEach((item, index) => {
    items.push({
      id: `notif-${item._id || index}`,
      type: "notification",
      title: item.title || item.message,
      subtitle: item.type,
      time: item.createdAt,
    });
  });

  return items
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 8);
};

export const buildUpcomingEvents = (statistics = {}) =>
  (statistics.upcoming_events || []).slice(0, 6);
