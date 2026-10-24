import * as XLSX from "xlsx";
import moment from "moment";

const formatRs = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const mapRow = (entry, index, section) => ({
  No: index + 1,
  Section: section,
  Student: entry.student_name || "",
  "Roll No": entry.roll_number || "",
  Phone: entry.student_phone || "",
  Email: entry.student_email || "",
  Batch: entry.batch_name || "",
  Amount: Number(entry.amount) || 0,
  "Amount (Rs.)": `Rs. ${formatRs(entry.amount)}`,
  "Due Date": entry.due_date_label || "",
  Status: entry.status_label || section,
  "Overdue Days":
    section === "Overdue" ? Number(entry.overdue_days) || 0 : "",
});

/**
 * Download fee due report (filtered) as Excel.
 */
export const downloadFeeDueReportExcel = (report) => {
  if (!report) {
    throw new Error("Report data is not available.");
  }

  const dueRows = report.due_today || report.due_on_date || [];
  const overdueRows = report.overdue || [];
  const dueLabel =
    report.is_today === false
      ? `Due on ${report.report_date_label || "date"}`
      : "Due Today";

  const sheetRows = [
    ...dueRows.map((row, i) => mapRow(row, i, dueLabel)),
    ...overdueRows.map((row, i) =>
      mapRow(row, dueRows.length + i, "Overdue")
    ),
  ];

  if (!sheetRows.length) {
    throw new Error("No filtered records to export.");
  }

  const summary = report.summary || {};
  const metaSheet = [
    { Field: "Report date", Value: report.report_date_label || "" },
    { Field: "Generated", Value: report.generated_at || "" },
    {
      Field: "Filters",
      Value: report.filter_summary || "None",
    },
    { Field: "Due count", Value: summary.due_today_count || 0 },
    { Field: "Due amount", Value: summary.due_today_amount || 0 },
    { Field: "Overdue count", Value: summary.overdue_count || 0 },
    { Field: "Overdue amount", Value: summary.overdue_amount || 0 },
    {
      Field: "Total action required",
      Value: summary.total_pending_count || 0,
    },
    {
      Field: "Total amount",
      Value: summary.total_pending_amount || 0,
    },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(metaSheet),
    "Summary"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(sheetRows),
    "Fee Due"
  );

  const fileName = `fee-due-report-${
    report.report_date || moment().format("YYYY-MM-DD")
  }.xlsx`;
  XLSX.writeFile(workbook, fileName);
  return fileName;
};

export default downloadFeeDueReportExcel;
