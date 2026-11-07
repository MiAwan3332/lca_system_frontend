import moment from "moment";
import { requireOutput } from './accessCapabilities';
import { formatStudentEmail } from "./studentEmail";
import { compareStudentsByRollAscending } from "./rollNumber";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatDate = (value) => {
  if (!value) return "";
  const m = moment(value);
  return m.isValid() ? m.format("DD/MM/YYYY") : "";
};

export const hasPendingDues = (student) => Number(student?.pending_fee) > 0;

export const STUDENT_EXPORT_HEADERS = [
  "No",
  "Name",
  "Roll No",
  "Email",
  "Phone",
  "CNIC",
  "Batch",
  "Status",
  "Pending Dues?",
  "Due Date",
  "Admission Date",
  "Date of Birth",
  "Father Name",
  "Father Phone",
  "Latest Degree",
  "University",
  "City",
  "Completion Year",
  "Marks CGPA",
  "Total Fee",
  "Received Fee",
  "Pending Fee",
  "Cash",
  "Online",
  "Remarks",
  "Discount Remarks",
  "Finance History",
  "CNIC Image",
  "CNIC Back Image",
  "Image",
  "Latest Degree Image",
  "QR Code",
];

export const getStudentDueDate = (student) =>
  student?.pending_due_date || student?.due_date || "";

export const mapStudentExportCells = (student, index) => {
  const pending = hasPendingDues(student);
  return [
    index + 1,
    student.name || "",
    student.roll_number || "",
    formatStudentEmail(student.email),
    student.phone || "",
    student.cnic || "",
    student.batch?.name || "",
    student.is_active === false ? "Inactive" : "Active",
    pending ? "PENDING DUES" : "Clear",
    formatDate(getStudentDueDate(student)) || getStudentDueDate(student) || "",
    formatDate(student.admission_date),
    formatDate(student.dob || student.date_of_birth),
    student.father_name || "",
    student.father_phone || "",
    student.latest_degree || "",
    student.university || "",
    student.city || "",
    student.completion_year || "",
    student.marks_cgpa || "",
    student.total_fee || 0,
    student.paid_fee || 0,
    student.pending_fee || 0,
    student.cash_amount || 0,
    student.online_amount || 0,
    student.remarks || "",
    student.discount_remarks || "",
    student.finance_history || "No history",
    student.cnic_image || "",
    student.cnic_back_image || "",
    student.image || "",
    student.latest_degree_image || "",
    student.qr_code || student.qrcode || "",
  ];
};

/**
 * Excel download with amber highlight for pending-dues rows
 * when exporting an unfiltered (all payment statuses) list.
 */
export const downloadStudentsExcel = ({
  students = [],
  highlightPending = true,
  fileName,
} = {}) => {
  requireOutput('students', 'export');
  const sorted = [...students].sort(compareStudentsByRollAscending);
  if (!sorted.length) {
    throw new Error("No students match the current filters.");
  }

  const stamp = moment().format("DD-MM-YYYY");
  const name =
    fileName || `StudentsSheet[${stamp}]${highlightPending ? "" : ""}`;

  const headerHtml = STUDENT_EXPORT_HEADERS.map(
    (h) =>
      `<th style="background:#85652D;color:#fff;padding:6px;border:1px solid #ccc;">${escapeHtml(
        h
      )}</th>`
  ).join("");

  const bodyHtml = sorted
    .map((student, index) => {
      const pending = hasPendingDues(student);
      const highlight = highlightPending && pending;
      const bg = highlight ? "background-color:#FFECB3;" : "";
      const cells = mapStudentExportCells(student, index)
        .map(
          (cell) =>
            `<td style="padding:5px;border:1px solid #ddd;${bg}${
              pending && String(cell) === "PENDING DUES"
                ? "font-weight:bold;color:#9C4221;"
                : ""
            }">${escapeHtml(cell)}</td>`
        )
        .join("");
      return `<tr style="${bg}">${cells}</tr>`;
    })
    .join("");

  const legend = highlightPending
    ? `<p style="font-family:Arial;font-size:12px;color:#85652D;">
         Highlighted rows = students with pending dues.
       </p>`
    : "";

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]><xml>
          <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>Students</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
        </xml><![endif]-->
      </head>
      <body>
        ${legend}
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return `${name}.xls`;
};

export default downloadStudentsExcel;
