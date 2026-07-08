import moment from "moment";

export const isFeeOverdue = (status, dueDate) => {
  if (status === "Paid" || !dueDate) return false;
  return moment(dueDate).startOf("day").isBefore(moment().startOf("day"));
};

export const getOverdueDays = (dueDate) => {
  if (!dueDate) return 0;
  const days = moment().startOf("day").diff(moment(dueDate).startOf("day"), "days");
  return days > 0 ? days : 0;
};

export const getOverdueMessage = (dueDate) => {
  const days = getOverdueDays(dueDate);
  if (days === 0) return null;
  if (days === 1) return "Overdue by 1 day";
  return `Overdue by ${days} days`;
};

export const isDueDateOverdue = (dueDate) => getOverdueDays(dueDate) > 0;

export const formatDueDate = (dueDate) =>
  dueDate ? moment(dueDate).format("DD MMM YYYY") : "—";
