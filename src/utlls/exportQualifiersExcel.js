import * as XLSX from "xlsx";
import moment from "moment";
import { normalizeEducationBackground } from "./qualifierEducation";
import { isQualifierProfileComplete } from "./qualifierProfile";

const cell = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
};

const formatEducation = (value) => {
  const entries = normalizeEducationBackground(value);
  if (!entries.length) return "";
  return entries
    .map((entry) => {
      const parts = [
        entry.qualification,
        entry.institution,
        entry.board_or_university,
        entry.year,
        entry.grade,
      ].filter(Boolean);
      return parts.join(" | ");
    })
    .join("; ");
};

const formatSubjects = (subjects) => {
  if (!Array.isArray(subjects)) return "";
  return subjects.filter(Boolean).join(", ");
};

export const QUALIFIER_EXPORT_HEADERS = [
  "No",
  "Name",
  "Phone",
  "CSS/PMS Roll No",
  "Online / On Campus",
  "CNIC",
  "Email",
  "City",
  "Province",
  "Father Name",
  "Father Phone",
  "Latest Degree",
  "No. of Attempts",
  "Optional Subjects",
  "Education Background",
  "Remarks",
  "Interview Batch",
  "Profile Status",
  "Active",
  "Total Fee",
  "Paid Fee",
  "Pending Fee",
  "Created At",
];

export const mapQualifierExportRow = (qualifier, index = 0) => {
  const profileUpdated =
    typeof qualifier?.profile_updated === "boolean"
      ? qualifier.profile_updated
      : isQualifierProfileComplete(qualifier);

  return [
    index + 1,
    cell(qualifier?.name),
    cell(qualifier?.phone),
    cell(qualifier?.css_pms_roll_no),
    cell(qualifier?.class_type),
    cell(qualifier?.cnic),
    cell(qualifier?.email),
    cell(qualifier?.city),
    cell(qualifier?.province),
    cell(qualifier?.father_name),
    cell(qualifier?.father_phone),
    cell(qualifier?.latest_degree),
    qualifier?.no_of_attempts != null ? String(qualifier.no_of_attempts) : "0",
    formatSubjects(qualifier?.optional_subjects),
    formatEducation(qualifier?.education_background),
    cell(qualifier?.description),
    cell(qualifier?.batch?.name),
    profileUpdated ? "Updated" : "Not Updated",
    qualifier?.is_active === false ? "Inactive" : "Active",
    Number(qualifier?.total_fee) || 0,
    Number(qualifier?.paid_fee) || 0,
    Number(qualifier?.pending_fee) || 0,
    qualifier?.createdAt
      ? moment(qualifier.createdAt).format("DD MMM YYYY hh:mm A")
      : "",
  ];
};

export const downloadQualifiersExcel = ({
  qualifiers = [],
  batchName = "",
} = {}) => {
  const rows = (qualifiers || []).map((q, i) => mapQualifierExportRow(q, i));
  const worksheet = XLSX.utils.aoa_to_sheet([QUALIFIER_EXPORT_HEADERS, ...rows]);

  worksheet["!cols"] = QUALIFIER_EXPORT_HEADERS.map((header) => ({
    wch: Math.min(36, Math.max(12, header.length + 2)),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Qualifiers");

  const stamp = moment().format("DD-MM-YYYY");
  const batchPart = batchName
    ? `_${String(batchName).replace(/[^\w-]+/g, "_").slice(0, 40)}`
    : "";
  XLSX.writeFile(workbook, `LCA_Qualifiers${batchPart}_${stamp}.xlsx`);
};
