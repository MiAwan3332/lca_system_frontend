export const COMPLAINT_CATEGORIES = [
  "General",
  "Academic",
  "Discipline",
  "Facilities",
  "Finance",
  "Other",
];

export const COMPLAINT_STATUSES = ["Open", "In Review", "Resolved", "Rejected"];

export const COMPLAINT_TARGET_LABELS = {
  teacher: "Teacher",
  principal: "Principal",
  vice_principal: "Vice Principal",
  ceo: "CEO",
};

export const getComplaintTargetLabel = (value) =>
  COMPLAINT_TARGET_LABELS[value] || value;

export const getStatusColor = (status) => {
  if (status === "Resolved") return "green";
  if (status === "Rejected") return "red";
  if (status === "In Review") return "yellow";
  return "orange";
};
