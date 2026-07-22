import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [255, 203, 130],
  goldDark: [133, 101, 45],
  navy: [45, 65, 133],
  green: [56, 161, 105],
  orange: [221, 107, 32],
  gray: [113, 128, 150],
  grayLight: [247, 250, 252],
  rowAlt: [255, 251, 245],
  border: [203, 213, 224],
  borderDark: [160, 174, 192],
  white: [255, 255, 255],
  text: [26, 32, 44],
  textMuted: [74, 85, 104],
};

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const buildFileName = (studentName = "student") => {
  const safeName = String(studentName).replace(/\s+/g, "-").toLowerCase();
  return `fee-invoice-${safeName}-${moment().format("YYYYMMDD-HHmm")}.pdf`;
};

const buildInvoiceNo = () => `INV-${moment().format("YYYYMMDD-HHmmss")}`;

/**
 * Professional pending-fee payment invoice for print/preview.
 * Excludes remarks, student signature, total fee, and already-paid amount.
 */
export const generatePendingPaymentSlip = async (data = {}, mode = "print") => {
  const {
    name,
    phone = "",
    rollNumber = "",
    batchName = "N/A",
    outstandingBalance = 0,
    payingNow = 0,
    remainingAfter = 0,
    paymentOption = "full",
    paymentMethod = "Cash",
    nextInstallmentDate = "",
  } = data;

  if (!name?.trim()) {
    throw new Error("Student name is required to print the fee slip.");
  }

  if (!(Number(payingNow) > 0)) {
    throw new Error("Enter a payment amount before printing the fee slip.");
  }

  const paymentType =
    paymentOption === "partial" ? "Partial Payment" : "Full Remaining Balance";
  const invoiceNo = buildInvoiceNo();
  const issuedAt = moment().format("DD MMM YYYY, hh:mm A");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentW = pageWidth - marginX * 2;

  // Top brand bar
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFillColor(...COLORS.goldDark);
  doc.rect(0, 28, pageWidth, 1.2, "F");

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("LCA", marginX, 14);

  doc.setFontSize(11);
  doc.text("FEE PAYMENT INVOICE", marginX + 22, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("Learning & Career Academy", marginX + 22, 17);
  doc.text("Official Fee Receipt", marginX + 22, 22);

  // Invoice meta (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text("Invoice No.", pageWidth - marginX, 11, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(invoiceNo, pageWidth - marginX, 16, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(issuedAt, pageWidth - marginX, 21, { align: "right" });

  let y = 38;

  // Bill To / Payment Details panels
  const panelGap = 6;
  const panelW = (contentW - panelGap) / 2;
  const panelH = 50;

  const drawPanel = (x, title, rows) => {
    doc.setFillColor(...COLORS.grayLight);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, panelW, panelH, 2, 2, "FD");

    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(x, y, panelW, 8, 2, 2, "F");
    doc.rect(x, y + 6, panelW, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.goldDark);
    doc.text(title, x + 4, y + 5.5);

    let rowY = y + 15;
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(label, x + 4, rowY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
      const valueLines = doc.splitTextToSize(String(value || "—"), panelW - 8);
      doc.text(valueLines[0], x + 4, rowY + 5);
      rowY += 11;
    });
  };

  drawPanel(marginX, "BILL TO", [
    ["Student Name", name],
    ["Roll Number", rollNumber || "—"],
    ["Phone", phone || "—"],
  ]);

  const paymentRows = [
    ["Batch", batchName || "N/A"],
    ["Payment Method", paymentMethod || "—"],
  ];
  if (paymentOption === "partial" && nextInstallmentDate) {
    paymentRows.push([
      "Next Installment Due",
      moment(nextInstallmentDate).format("DD MMM YYYY"),
    ]);
  } else {
    paymentRows.push(["Payment Type", paymentType]);
  }
  drawPanel(marginX + panelW + panelGap, "PAYMENT DETAILS", paymentRows);

  y += panelH + 12;

  // Line-items table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("FEE BREAKDOWN", marginX, y);
  y += 4;

  const colDesc = marginX;
  const colAmt = marginX + contentW;
  const rowH = 9;
  const headerH = 9;

  const tableRows = [
    ["Outstanding Balance (Before Payment)", formatCurrency(outstandingBalance)],
    ["Amount Paid (This Receipt)", formatCurrency(payingNow)],
    ["Remaining Balance (After Payment)", formatCurrency(remainingAfter)],
  ];

  const tableH = headerH + tableRows.length * rowH;
  doc.setDrawColor(...COLORS.borderDark);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, y, contentW, tableH, 1.5, 1.5, "S");

  // Header
  doc.setFillColor(...COLORS.navy);
  doc.rect(marginX, y, contentW, headerH, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Description", colDesc + 4, y + 6);
  doc.text("Amount", colAmt - 4, y + 6, { align: "right" });

  let rowY = y + headerH;
  tableRows.forEach(([desc, amount], index) => {
    const isLast = index === tableRows.length - 1;
    const isHighlight = index === 1;

    if (isHighlight) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(marginX, rowY, contentW, rowH, "F");
    } else if (index % 2 === 1) {
      doc.setFillColor(...COLORS.grayLight);
      doc.rect(marginX, rowY, contentW, rowH, "F");
    }

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);
    if (!isLast) {
      doc.line(marginX, rowY + rowH, marginX + contentW, rowY + rowH);
    }

    doc.setFont("helvetica", isHighlight || isLast ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(desc, colDesc + 4, rowY + 6);
    doc.setTextColor(...(isHighlight ? COLORS.navy : COLORS.text));
    doc.text(amount, colAmt - 4, rowY + 6, { align: "right" });

    rowY += rowH;
  });

  // Redraw outer border over fills
  doc.setDrawColor(...COLORS.borderDark);
  doc.setLineWidth(0.45);
  doc.roundedRect(marginX, y, contentW, tableH, 1.5, 1.5, "S");

  y += tableH + 10;

  // Totals summary strip
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(marginX, y, contentW, 18, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("Amount Received", marginX + 5, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(payingNow), marginX + 5, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("Balance Due", marginX + contentW - 5, y + 7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(remainingAfter), marginX + contentW - 5, y + 14, {
    align: "right",
  });

  y += 28;

  // Notes
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray);
  const notes = [
    "This invoice is a provisional receipt of the payment details entered in the system.",
    "Student fee balances are updated after successful submission of this payment.",
  ];
  notes.forEach((line) => {
    doc.text(line, marginX, y);
    y += 4.5;
  });

  // Authorized signature only
  const signY = Math.min(y + 24, pageHeight - 36);
  doc.setDrawColor(...COLORS.borderDark);
  doc.setLineWidth(0.4);
  doc.line(marginX, signY, marginX + 55, signY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text("Authorized Signature", marginX, signY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Accounts / Administration", marginX, signY + 9);

  // Footer
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    "LCA — Learning & Career Academy  ·  Fee Payment Invoice",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  const fileName = buildFileName(name);

  if (mode === "print") {
    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl);
    if (!printWindow) {
      throw new Error("Pop-up blocked. Allow pop-ups to print the fee slip.");
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
