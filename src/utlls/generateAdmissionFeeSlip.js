import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [255, 203, 130],
  goldDark: [133, 101, 45],
  goldLight: [255, 251, 245],
  green: [72, 187, 120],
  greenDark: [39, 103, 73],
  orange: [237, 137, 54],
  gray: [113, 128, 150],
  grayLight: [247, 250, 252],
  border: [224, 232, 236],
  white: [255, 255, 255],
  text: [45, 55, 72],
  textMuted: [113, 128, 150],
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })} Rs.`;

const buildFileName = (studentName = "student") => {
  const safeName = String(studentName).replace(/\s+/g, "-").toLowerCase();
  return `admission-fee-slip-${safeName}-${moment().format("YYYYMMDD-HHmm")}.pdf`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getImageFormat = (dataUrl) =>
  String(dataUrl).startsWith("data:image/png") ? "PNG" : "JPEG";

const getPaymentLabel = (paymentOption) => {
  if (paymentOption === "full") return "Full Payment";
  if (paymentOption === "partial") return "Partial Payment";
  return "Pay Later";
};

const getStatusColors = (paymentStatus) => {
  if (paymentStatus === "Fully paid") {
    return { bg: COLORS.green, text: COLORS.white };
  }
  if (paymentStatus === "Partially paid") {
    return { bg: COLORS.orange, text: COLORS.white };
  }
  return { bg: COLORS.grayLight, text: COLORS.textMuted };
};

export const generateAdmissionFeeSlip = async (data, mode = "print") => {
  const {
    name,
    cnic,
    email,
    phone,
    batchName,
    batchFee = 0,
    payingNow = 0,
    remainingFee = 0,
    paymentStatus = "Unpaid",
    paymentOption = "later",
    paymentMethod = "N/A",
    photoFile = null,
  } = data || {};

  if (!name?.trim()) {
    throw new Error("Student name is required to print the fee slip.");
  }

  if (!batchName) {
    throw new Error("Please select a batch to print the fee slip.");
  }

  let photoDataUrl = null;
  if (photoFile) {
    photoDataUrl = await readFileAsDataUrl(photoFile);
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cardX = 15;
  const cardY = 12;
  const cardW = pageWidth - 30;
  const cardH = 255;
  const innerX = cardX + 10;
  const innerW = cardW - 20;

  const paymentLabel = getPaymentLabel(paymentOption);
  const statusColors = getStatusColors(paymentStatus);
  const cnicValue = String(cnic || "").trim() || "N/A";

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "FD");

  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(cardX, cardY, cardW, 34, 4, 4, "F");
  doc.rect(cardX, cardY + 28, cardW, 6, "F");

  const photoW = 28;
  const photoH = 34;
  const photoX = cardX + cardW - photoW - 10;
  const photoY = cardY + 8;

  doc.setFillColor(...COLORS.white);
  doc.roundedRect(photoX - 1.5, photoY - 1.5, photoW + 3, photoH + 3, 2, 2, "F");
  doc.setDrawColor(...COLORS.goldDark);
  doc.setLineWidth(0.6);
  doc.roundedRect(photoX - 1.5, photoY - 1.5, photoW + 3, photoH + 3, 2, 2, "S");

  if (photoDataUrl) {
    try {
      doc.addImage(
        photoDataUrl,
        getImageFormat(photoDataUrl),
        photoX,
        photoY,
        photoW,
        photoH,
        undefined,
        "FAST"
      );
    } catch {
      doc.setFillColor(...COLORS.grayLight);
      doc.rect(photoX, photoY, photoW, photoH, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      doc.text("Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
    }
  } else {
    doc.setFillColor(...COLORS.grayLight);
    doc.rect(photoX, photoY, photoW, photoH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text("No Photo", photoX + photoW / 2, photoY + photoH / 2 - 2, { align: "center" });
    doc.text("Captured", photoX + photoW / 2, photoY + photoH / 2 + 3, { align: "center" });
  }

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("LCA", innerX, cardY + 14);
  doc.setFontSize(13);
  doc.text("Admission Fee Slip", innerX + 16, cardY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("Learning & Career Academy", innerX, cardY + 20);
  doc.text(`Issued: ${moment().format("DD MMM YYYY, hh:mm A")}`, innerX, cardY + 26);
  doc.text("Provisional slip before admission", innerX, cardY + 31);

  let y = cardY + 44;

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
  drawInfoRow("CNIC:", cnicValue);
  drawInfoRow("Phone:", phone || "N/A");
  drawInfoRow("Batch:", batchName, { bold: true });
  y += 4;

  drawSectionHeader("Fee Summary");

  const statW = (innerW - 8) / 3;
  const statH = 22;
  const stats = [
    { label: "Total Fee", value: formatCurrency(batchFee), accent: COLORS.text },
    { label: "Paying Now", value: formatCurrency(payingNow), accent: COLORS.goldDark },
    { label: "Remaining", value: formatCurrency(remainingFee), accent: remainingFee > 0 ? [229, 62, 62] : COLORS.greenDark },
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

  y += statH + 10;

  doc.setFillColor(...COLORS.goldLight);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.roundedRect(innerX, y, innerW, 28, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("Amount Received", innerX + 8, y + 10);

  doc.setFontSize(22);
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(payingNow), innerX + 8, y + 22);

  const badgeW = 42;
  const badgeH = 8;
  const badgeX = innerX + innerW - badgeW - 8;
  const badgeY = y + 8;
  doc.setFillColor(...statusColors.bg);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...statusColors.text);
  doc.text(paymentStatus, badgeX + badgeW / 2, badgeY + 5.5, { align: "center" });

  y += 36;

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(innerX, y, innerW, 20, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Payment Type:", innerX + 5, y + 9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(paymentLabel, innerX + 30, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Payment Method:", innerX + 5, y + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(payingNow > 0 ? paymentMethod : "N/A", innerX + 34, y + 18);

  y += 26;

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(innerX, y, innerX + innerW, y);
  y += 8;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray);
  const note =
    "This is a provisional admission fee slip. Final student and payment records will be created after clicking Add Student in the system.";
  const noteLines = doc.splitTextToSize(note, innerW);
  doc.text(noteLines, innerX, y);
  y += noteLines.length * 4 + 10;

  const signY = Math.min(y, cardY + cardH - 18);
  doc.setDrawColor(...COLORS.textMuted);
  doc.line(innerX, signY, innerX + 58, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Authorized Signature", innerX, signY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    "LCA — Learning & Career Academy · Admission Fee Slip",
    pageWidth / 2,
    pageHeight - 8,
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
