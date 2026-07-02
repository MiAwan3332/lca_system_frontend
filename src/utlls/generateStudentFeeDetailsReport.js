import jsPDF from "jspdf";
import moment from "moment";

const getActionLabel = (actionType) => {
  switch (actionType) {
    case "Created":
      return "Fee Created";
    case "Paid":
      return "Fee Paid";
    case "Discounted":
      return "Fee Discounted";
    case "Deleted":
      return "Fee Deleted";
    default:
      return actionType || "N/A";
  }
};

const getAmountDetail = (log) => {
  if (log.action_type === "Created" || log.action_type === "Deleted") {
    return `${log.amount ?? 0} Rs.`;
  }
  const remaining = (log.amount ?? 0) - (log.action_amount ?? 0);
  return `${log.amount ?? 0} - ${log.action_amount ?? 0} = ${remaining} Rs.`;
};

const buildFileName = (studentName = "student") => {
  const safeName = String(studentName).replace(/\s+/g, "-").toLowerCase();
  return `student-fees-${safeName}-${moment().format("YYYYMMDD")}.pdf`;
};

export const generateStudentFeeDetailsReport = (fee, feeLogs = [], mode = "download") => {
  if (!fee) {
    throw new Error("Fee details are not available.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed = 10) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addLines = (text, { size = 10, style = "normal", gap = 4 } = {}) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(text), contentWidth);
    const lineHeight = size * 0.45;
    ensureSpace(lines.length * lineHeight + gap);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + gap;
  };

  doc.setFillColor(255, 203, 130);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(45, 45, 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LCA — Student Fees Details Report", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${moment().format("DD MMM YYYY, hh:mm A")}`, margin, 20);

  y = 36;
  doc.setTextColor(0, 0, 0);

  const studentName = fee?.student?.name || "N/A";
  const batchName = fee?.batch?.name || "N/A";
  const phone = fee?.student?.phone || "N/A";
  const feeAmount = fee?.amount ?? "N/A";
  const dueDate = fee?.due_date
    ? moment(fee.due_date).format("DD-MM-YYYY")
    : "N/A";
  const status = fee?.status || "N/A";

  addLines("Student Information", { size: 12, style: "bold", gap: 3 });
  addLines(`Student Name: ${studentName}`, { gap: 2 });
  addLines(`Batch: ${batchName}`, { gap: 2 });
  addLines(`Phone: ${phone}`, { gap: 2 });
  addLines(`Fee Amount: ${feeAmount} Rs.`, { gap: 2 });
  addLines(`Due Date: ${dueDate}`, { gap: 2 });
  addLines(`Status: ${status}`, { gap: 6 });

  addLines("Fee History", { size: 12, style: "bold", gap: 4 });

  if (!feeLogs.length) {
    addLines("No fee history found.");
  } else {
    feeLogs.forEach((log, index) => {
      addLines(
        `${index + 1}. ${getActionLabel(log.action_type)} by ${log.action_by?.name || "N/A"}`,
        { style: "bold", gap: 2 }
      );
      addLines(`Action Date: ${moment(log.action_date).format("DD-MM-YYYY")}`, {
        size: 9,
        gap: 1,
      });
      addLines(`Amount: ${getAmountDetail(log)}`, { size: 9, gap: 1 });
      if (log.action_type === "Paid" && log.payment_method) {
        addLines(`Payment Method: ${log.payment_method}`, { size: 9, gap: 1 });
      }
      addLines(`Description: ${log.description || "No description"}`, {
        size: 9,
        gap: 5,
      });
    });
  }

  const fileName = buildFileName(studentName);

  if (mode === "print") {
    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl);
    if (!printWindow) {
      throw new Error("Pop-up blocked. Allow pop-ups to print the report.");
    }
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  } else {
    doc.save(fileName);
  }

  return fileName;
};
