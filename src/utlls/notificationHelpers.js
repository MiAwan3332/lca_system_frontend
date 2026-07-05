import { isDueDateOverdue } from "./feeDueDate.js";

export const NOTIFICATION_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "fee_daily_due_report", label: "Daily fee report" },
  { value: "fee_due_today_admin_alert", label: "Due today" },
  { value: "fee_overdue_admin_alert", label: "Overdue fees" },
  { value: "fee_installment_admin_alert", label: "Installment alerts" },
  { value: "complaint_received", label: "Complaints" },
  { value: "announcement", label: "Announcements" },
  { value: "fee_installment_reminder", label: "Fee reminders" },
];

export const getNotificationLabel = (type) => {
  if (type === "announcement") return "Announcement";
  if (type === "complaint_received") return "Complaint";
  if (type === "fee_installment_reminder") return "Fee Reminder";
  if (type === "fee_installment_admin_alert") return "Installment Alert";
  if (type === "fee_daily_due_report") return "Daily Fee Report";
  if (type === "fee_due_today_admin_alert") return "Due Today";
  if (type === "fee_overdue_admin_alert") return "Overdue Fee";
  if (type === "assignment_published") return "Assignment";
  if (type === "assignment_deadline_reminder") return "Deadline";
  if (type === "assignment_graded") return "Graded";
  if (type === "quiz_available") return "Quiz";
  if (type === "quiz_result_published") return "Quiz Result";
  return "Update";
};

export const getNotificationColorScheme = (type) => {
  if (type === "announcement") return "yellow";
  if (type === "fee_overdue_admin_alert") return "red";
  if (type === "fee_due_today_admin_alert") return "orange";
  if (type === "fee_daily_due_report") return "purple";
  if (
    type === "fee_installment_reminder" ||
    type === "fee_installment_admin_alert"
  ) {
    return "orange";
  }
  if (type === "complaint_received") return "red";
  return "blue";
};

export const getNotificationActionHint = (type) => {
  if (type === "announcement") return "View in Announcements";
  if (
    type === "fee_installment_reminder" ||
    type === "fee_installment_admin_alert" ||
    type === "fee_due_today_admin_alert" ||
    type === "fee_overdue_admin_alert" ||
    type === "fee_daily_due_report"
  ) {
    return "View in Fees";
  }
  if (type === "complaint_received") return "View in Complaints";
  return null;
};

export const isNotificationOverdue = (notification) => {
  if (notification?.type === "fee_overdue_admin_alert") return true;

  const dueDate = notification?.metadata?.due_date;
  if (!dueDate) return false;

  const feeTypes = [
    "fee_installment_reminder",
    "fee_installment_admin_alert",
    "fee_due_today_admin_alert",
    "fee_overdue_admin_alert",
  ];

  if (!feeTypes.includes(notification.type)) return false;

  if (notification.metadata?.days_until != null) {
    return notification.metadata.days_until < 0;
  }

  return isDueDateOverdue(dueDate);
};

export const navigateForNotification = (notification, navigate) => {
  if (notification.type === "announcement" && notification.entity_id) {
    navigate("/announcements", {
      state: { openAnnouncementId: notification.entity_id },
    });
    return;
  }

  if (notification.type === "fee_daily_due_report") {
    navigate("/notifications");
    return;
  }

  if (
    notification.type === "fee_installment_reminder" ||
    notification.type === "fee_installment_admin_alert" ||
    notification.type === "fee_due_today_admin_alert" ||
    notification.type === "fee_overdue_admin_alert"
  ) {
    navigate("/fees");
    return;
  }

  if (notification.type === "complaint_received") {
    navigate("/complaints");
  }
};
