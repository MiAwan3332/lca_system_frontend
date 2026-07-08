import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [255, 203, 130],
  goldDark: [133, 101, 45],
  red: [229, 62, 62],
  redDark: [155, 44, 44],
  green: [39, 103, 73],
  gray: [113, 128, 150],
  grayLight: [247, 250, 252],
  border: [224, 232, 236],
  text: [45, 55, 72],
};

const formatRs = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const drawTableHeader = (doc, y, columns, margin) => {
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(margin, y, columns.totalWidth, 8, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.goldDark);

  let x = margin + 2;
  columns.items.forEach((col) => {
    doc.text(col.label, x, y + 5.5);
    x += col.width;
  });

  return y + 10;
};

const drawTableRow = (doc, y, columns, row, margin, highlight = false) => {
  if (highlight) {
    doc.setFillColor(255, 245, 245);
    doc.rect(margin, y - 1, columns.totalWidth, 7, "F");
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);

  let x = margin + 2;
  row.forEach((cell, index) => {
    const width = columns.items[index].width - 2;
    doc.text(String(cell), x, y + 4, { maxWidth: width });
    x += columns.items[index].width;
  });

  return y + 7;
};

export const generateFeeDueReport = (report, mode = "download") => {
  if (!report) {
    throw new Error("Report data is not available.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  const fileName = `fee-due-report-${report.report_date || moment().format("YYYY-MM-DD")}.pdf`;

  const ensureSpace = (needed = 12) => {
    if (y + needed > pageHeight - margin - 10) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      doc.text("Lahore CSS Academy · Fee Due Report", margin, pageHeight - 8);
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.text);
  doc.text("Lahore CSS Academy", margin, y);
  y += 7;

  doc.setFontSize(13);
  doc.text("Daily Fee Due Report", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Report date: ${report.report_date_label || moment().format("DD MMM YYYY")}`, margin, y);
  y += 4;
  doc.text(`Generated: ${report.generated_at || moment().format("DD MMM YYYY, hh:mm A")}`, margin, y);
  y += 8;

  const summary = report.summary || {};
  const cards = [
    { label: "Due Today", value: summary.due_today_count || 0, amount: summary.due_today_amount || 0, color: COLORS.goldDark },
    { label: "Overdue", value: summary.overdue_count || 0, amount: summary.overdue_amount || 0, color: COLORS.redDark },
    { label: "Total Action Required", value: summary.total_pending_count || 0, amount: summary.total_pending_amount || 0, color: COLORS.text },
  ];

  const cardWidth = (pageWidth - margin * 2 - 8) / 3;
  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 4);
    doc.setDrawColor(...COLORS.border);
    doc.setFillColor(...COLORS.grayLight);
    doc.roundedRect(x, y, cardWidth, 18, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(card.label, x + 3, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...card.color);
    doc.text(`${card.value} student(s)`, x + 3, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Rs. ${formatRs(card.amount)}`, x + 3, y + 16);
  });
  y += 24;

  const renderSection = (title, rows, overdueSection = false) => {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...(overdueSection ? COLORS.redDark : COLORS.goldDark));
    doc.text(title, margin, y);
    y += 6;

    if (!rows.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.gray);
      doc.text("No records.", margin, y);
      y += 8;
      return;
    }

    const columns = {
      totalWidth: pageWidth - margin * 2,
      items: [
        { label: "Student", width: 42 },
        { label: "Batch", width: 28 },
        { label: "Amount (Rs.)", width: 24 },
        { label: "Due Date", width: 28 },
        { label: overdueSection ? "Overdue By" : "Status", width: 24 },
      ],
    };

    y = drawTableHeader(doc, y, columns, margin);
    rows.forEach((entry) => {
      ensureSpace(8);
      y = drawTableRow(
        doc,
        y,
        columns,
        [
          entry.student_name,
          entry.batch_name,
          formatRs(entry.amount),
          entry.due_date_label,
          overdueSection
            ? `${entry.overdue_days} day(s)`
            : entry.status_label || "Due Today",
        ],
        margin,
        overdueSection
      );
    });
    y += 6;
  };

  renderSection(
    report.is_today === false
      ? `Fees Due on ${report.report_date_label || "Selected Date"} (${(report.due_today || report.due_on_date || []).length})`
      : `Fees Due Today (${(report.due_today || []).length})`,
    report.due_today || report.due_on_date || [],
    false
  );
  renderSection(
    report.is_today === false
      ? `Overdue as of ${report.report_date_label || "Selected Date"} (${(report.overdue || []).length})`
      : `Overdue Fees (${(report.overdue || []).length})`,
    report.overdue || [],
    true
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text("Lahore CSS Academy · Fee Due Report", margin, pageHeight - 8);

  if (mode === "print") {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } else {
    doc.save(fileName);
  }

  return fileName;
};

export default generateFeeDueReport;
