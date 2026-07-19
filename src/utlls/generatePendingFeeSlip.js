import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [255, 203, 130],
  goldDark: [133, 101, 45],
  goldLight: [255, 251, 245],
  greenDark: [39, 103, 73],
  red: [229, 62, 62],
  gray: [113, 128, 150],
  grayLight: [247, 250, 252],
  border: [224, 232, 236],
  white: [255, 255, 255],
  text: [45, 55, 72],
  textMuted: [113, 128, 150],
};

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const buildFileName = (studentName = "student") => {
  const safeName = String(studentName).replace(/\s+/g, "-").toLowerCase();
  return `pending-fee-slip-${safeName}-${moment().format("YYYYMMDD-HHmm")}.pdf`;
};

/**
 * Build a Pending Fee Slip PDF and return a File suitable for upload.
 */
export const generatePendingFeeSlipPdf = async (data = {}) => {
  const {
    name,
    email,
    phone,
    rollNumber = "",
    batchName = "N/A",
    totalFee = 0,
    paidFee = 0,
    pendingAmount = 0,
  } = data;

  if (!name?.trim()) {
    throw new Error("Student name is required to generate the pending fee slip.");
  }

  if (!(Number(pendingAmount) > 0)) {
    throw new Error("Pending amount must be greater than zero.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cardX = 15;
  const cardY = 12;
  const cardW = pageWidth - 30;
  const cardH = 200;
  const innerX = cardX + 10;
  const innerW = cardW - 20;

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "FD");

  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(cardX, cardY, cardW, 28, 4, 4, "F");
  doc.rect(cardX, cardY + 22, cardW, 6, "F");

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("LCA", innerX, cardY + 12);
  doc.setFontSize(13);
  doc.text("Pending Fee Slip", innerX + 16, cardY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("Learning & Career Academy", innerX, cardY + 18);
  doc.text(`Issued: ${moment().format("DD MMM YYYY, hh:mm A")}`, innerX, cardY + 24);

  let y = cardY + 40;

  const drawSectionHeader = (title) => {
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(innerX, y, 3, 7, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text(title, innerX + 6, y + 5);
    y += 12;
  };

  const drawInfoRow = (label, value, { bold = false } = {}) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(label, innerX, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    const valueLines = doc.splitTextToSize(String(value || "N/A"), innerW - 42);
    doc.text(valueLines, innerX + 38, y);
    y += Math.max(6, valueLines.length * 4.8);
  };

  drawSectionHeader("Student Information");
  drawInfoRow("Name:", name, { bold: true });
  drawInfoRow("Roll No:", rollNumber || "—");
  drawInfoRow("Email:", email || "N/A");
  drawInfoRow("Phone:", phone || "N/A");
  drawInfoRow("Current Batch:", batchName, { bold: true });
  y += 4;

  drawSectionHeader("Fee Summary");

  const statW = (innerW - 8) / 3;
  const statH = 22;
  const stats = [
    { label: "Total Fee", value: formatCurrency(totalFee), accent: COLORS.text },
    { label: "Paid Amount", value: formatCurrency(paidFee), accent: COLORS.greenDark },
    {
      label: "Pending Amount",
      value: formatCurrency(pendingAmount),
      accent: COLORS.red,
    },
  ];

  stats.forEach((stat, index) => {
    const x = innerX + index * (statW + 4);
    doc.setFillColor(...COLORS.grayLight);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x, y, statW, statH, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(stat.label, x + 4, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...stat.accent);
    doc.text(stat.value, x + 4, y + 16);
  });

  y += statH + 12;

  doc.setFillColor(...COLORS.goldLight);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.roundedRect(innerX, y, innerW, 28, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("Outstanding Balance", innerX + 8, y + 10);

  doc.setFontSize(22);
  doc.setTextColor(...COLORS.red);
  doc.text(formatCurrency(pendingAmount), innerX + 8, y + 22);

  y += 38;

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(innerX, y, innerX + innerW, y);
  y += 8;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray);
  const note =
    "This pending fee slip confirms the outstanding dues for the student. Batch transfer is blocked until this balance is fully cleared.";
  const noteLines = doc.splitTextToSize(note, innerW);
  doc.text(noteLines, innerX, y);
  y += noteLines.length * 4 + 14;

  const signY = Math.min(y, cardY + cardH - 18);
  doc.setDrawColor(...COLORS.textMuted);
  doc.line(innerX, signY, innerX + 58, signY);
  doc.line(innerX + innerW - 58, signY, innerX + innerW, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Authorized Signature", innerX, signY + 5);
  doc.text("Student / Guardian Signature", innerX + innerW - 58, signY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    "LCA — Learning & Career Academy · Pending Fee Slip",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  const fileName = buildFileName(name);
  const blob = doc.output("blob");
  return new File([blob], fileName, { type: "application/pdf" });
};

export const openFeeSlipUrl = (slipUrl) => {
  if (!slipUrl) {
    throw new Error("Fee slip URL is missing");
  }
  const printWindow = window.open(slipUrl, "_blank");
  if (!printWindow) {
    throw new Error("Pop-up blocked. Allow pop-ups to open the fee slip.");
  }
  return printWindow;
};
