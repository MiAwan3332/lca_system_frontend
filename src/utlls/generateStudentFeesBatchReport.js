import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [255, 203, 130],
  goldDark: [133, 101, 45],
  blue: [130, 180, 255],
  blueDark: [45, 65, 133],
  green: [72, 187, 120],
  red: [229, 62, 62],
  gray: [113, 128, 150],
  grayLight: [247, 250, 252],
  border: [224, 232, 236],
  white: [255, 255, 255],
  text: [45, 55, 72],
};

const formatRs = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const buildFileName = (report) => {
  const batchPart = report?.batch?.name
    ? report.batch.name.replace(/\s+/g, "-").toLowerCase()
    : "all-batches";
  const datePart = report?.start_date || moment().format("YYYYMMDD");
  return `student-fees-report-${batchPart}-${datePart}.pdf`;
};

export const generateStudentFeesBatchReport = (report, mode = "download") => {
  if (!report) {
    throw new Error("Report data is not available.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const fees = report.fees || [];
  const summary = report.summary || {};
  const batchWise = report.batch_wise || [];
  const activeTotal = report.active_batches_total;
  const batchLabel = report.batch?.name || "All Active Batches";
  const periodLabel = String(report.period || "daily");
  const periodDisplay =
    periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);

  const ensureSpace = (needed = 10) => {
    if (y + needed > pageHeight - margin - 8) {
      drawPageFooter(doc, pageWidth, pageHeight, margin);
      doc.addPage();
      y = margin;
    }
  };

  const drawPageFooter = (pdf, width, height, m) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(
      "LCA — Learning & Career Academy · Student Fees Report",
      m,
      height - 5
    );
    pdf.text(
      `Page ${pdf.internal.getNumberOfPages()}`,
      width - m,
      height - 5,
      { align: "right" }
    );
  };

  const drawSectionTitle = (title, subtitle = "") => {
    ensureSpace(14);
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(margin, y, 3, subtitle ? 12 : 8, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text(title, margin + 6, y + 5);
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      doc.text(subtitle, margin + 6, y + 10);
      y += 14;
    } else {
      y += 10;
    }
  };

  const drawSummaryCard = (x, cardY, width, label, value, sub, accent) => {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x, cardY, width, 18, 2, 2, "FD");
    doc.setFillColor(...accent);
    doc.roundedRect(x, cardY, width, 3, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(label, x + 3, cardY + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text(String(value), x + 3, cardY + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(sub, x + 3, cardY + 17.5);
  };

  // Header banner
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFillColor(...COLORS.goldDark);
  doc.roundedRect(margin, 6, 14, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text("LCA", margin + 7, 10.5, { align: "center" });

  doc.setTextColor(...COLORS.goldDark);
  doc.setFontSize(16);
  doc.text("Student Fees Report", margin + 18, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Learning & Career Academy · Finance Summary", margin + 18, 16);
  doc.text(
    `Generated ${moment().format("DD MMM YYYY, hh:mm A")}`,
    pageWidth - margin,
    11,
    { align: "right" }
  );
  doc.text(
    `${periodDisplay}  ·  ${moment(report.start_date).format("DD MMM YYYY")} – ${moment(report.end_date).format("DD MMM YYYY")}  ·  ${batchLabel}`,
    pageWidth - margin,
    16,
    { align: "right" }
  );

  y = 34;

  // Summary cards row
  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 4) / 5;
  const cards = [
    ["Total Records", summary.total_records || 0, `Rs. ${formatRs(summary.total_amount)}`, COLORS.blue],
    ["Paid Fees", summary.paid_count || 0, `Rs. ${formatRs(summary.paid_amount)}`, COLORS.green],
    ["Pending", summary.pending_count || 0, `Rs. ${formatRs(summary.pending_amount)}`, COLORS.red],
    ["Fee Payers", summary.fee_payers || 0, "Unique students", COLORS.goldDark],
    ["Batches", activeTotal?.active_batch_count || batchWise.length, batchLabel, COLORS.gray],
  ];

  cards.forEach(([label, value, sub, accent], index) => {
    drawSummaryCard(
      margin + index * (cardWidth + cardGap),
      y,
      cardWidth,
      label,
      value,
      sub,
      accent
    );
  });
  y += 24;

  // Batch-wise table
  if (batchWise.length) {
    drawSectionTitle(
      "Batch-wise Breakdown",
      "Collections and fee payers per active batch"
    );

    const batchCols = [
      { label: "Batch", width: 52 },
      { label: "Records", width: 22 },
      { label: "Total (Rs.)", width: 28 },
      { label: "Paid", width: 22 },
      { label: "Paid (Rs.)", width: 28 },
      { label: "Pending", width: 22 },
      { label: "Pending (Rs.)", width: 28 },
      { label: "Payers", width: 20 },
    ];

    const drawBatchHeader = () => {
      ensureSpace(10);
      let x = margin;
      doc.setFillColor(...COLORS.blueDark);
      doc.roundedRect(margin, y - 1, contentWidth, 8, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.white);
      batchCols.forEach((col) => {
        doc.text(col.label, x + 2, y + 4);
        x += col.width;
      });
      y += 9;
    };

    const drawBatchRow = (row, isTotal = false) => {
      ensureSpace(9);
      if (isTotal) {
        doc.setFillColor(...COLORS.gold);
      } else {
        doc.setFillColor(...COLORS.white);
      }
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(margin, y - 1, contentWidth, 7.5, 1, 1, "FD");

      const cells = isTotal
        ? [
            `Total (${activeTotal.active_batch_count} batches)`,
            String(activeTotal.total_records || 0),
            formatRs(activeTotal.total_amount),
            String(activeTotal.paid_count || 0),
            formatRs(activeTotal.paid_amount),
            String(activeTotal.pending_count || 0),
            formatRs(activeTotal.pending_amount),
            String(activeTotal.fee_payers || 0),
          ]
        : [
            row.batch?.name || "N/A",
            String(row.total_records || 0),
            formatRs(row.total_amount),
            String(row.paid_count || 0),
            formatRs(row.paid_amount),
            String(row.pending_count || 0),
            formatRs(row.pending_amount),
            String(row.fee_payers || 0),
          ];

      let x = margin;
      doc.setFont("helvetica", isTotal ? "bold" : "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...(isTotal ? COLORS.goldDark : COLORS.text));
      cells.forEach((cell, i) => {
        const text = doc.splitTextToSize(cell, batchCols[i].width - 3);
        doc.text(text, x + 2, y + 4);
        x += batchCols[i].width;
      });
      y += 8.5;
    };

    drawBatchHeader();
    batchWise.forEach((row) => drawBatchRow(row));
    if (activeTotal) drawBatchRow(null, true);
    y += 4;
  }

  // Fee details table
  drawSectionTitle("Fee Details", "Individual student fee records for selected filters");

  const detailCols = [
    { label: "#", width: 8 },
    { label: "Student", width: 40 },
    { label: "Phone", width: 26 },
    { label: "Batch", width: 32 },
    { label: "Total", width: 22 },
    { label: "Paid", width: 22 },
    { label: "Pending", width: 22 },
    { label: "Due", width: 22 },
    { label: "Status", width: 18 },
  ];

  const drawDetailHeader = () => {
    ensureSpace(10);
    let x = margin;
    doc.setFillColor(...COLORS.grayLight);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, y - 1, contentWidth, 8, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.text);
    detailCols.forEach((col) => {
      doc.text(col.label, x + 2, y + 4);
      x += col.width;
    });
    y += 9;
  };

  drawDetailHeader();

  if (!fees.length) {
    ensureSpace(10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text("No fee records found for the selected filters.", margin, y + 4);
    y += 10;
  } else {
    fees.forEach((fee, index) => {
      ensureSpace(9);
      if (index % 2 === 1) {
        doc.setFillColor(250, 251, 252);
        doc.rect(margin, y - 1, contentWidth, 7.5, "F");
      }

      const row = [
        String(index + 1),
        fee.student?.name || "N/A",
        fee.student?.phone || "N/A",
        fee.batch?.name || "N/A",
        `Rs. ${formatRs(fee.total_amount ?? fee.amount)}`,
        `Rs. ${formatRs(fee.paid_amount ?? 0)}`,
        `Rs. ${formatRs(fee.pending_amount ?? fee.amount)}`,
        fee.due_date ? moment(fee.due_date).format("DD MMM YYYY") : "N/A",
        fee.status || "N/A",
      ];

      let x = margin;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.text);
      row.forEach((cell, cellIndex) => {
        if (cellIndex === 8) {
          const isPaid = cell === "Paid";
          doc.setFillColor(...(isPaid ? COLORS.green : COLORS.red));
          doc.roundedRect(x + 1, y, 16, 5, 1.5, 1.5, "F");
          doc.setTextColor(...COLORS.white);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.text(cell, x + 9, y + 3.5, { align: "center" });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(...COLORS.text);
        } else {
          const cellText = doc.splitTextToSize(cell, detailCols[cellIndex].width - 3);
          doc.text(cellText, x + 2, y + 4);
        }
        x += detailCols[cellIndex].width;
      });

      y += 8;
      if (y > pageHeight - margin - 12) {
        drawPageFooter(doc, pageWidth, pageHeight, margin);
        doc.addPage();
        y = margin;
        drawDetailHeader();
      }
    });
  }

  drawPageFooter(doc, pageWidth, pageHeight, margin);

  const fileName = buildFileName(report);

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
