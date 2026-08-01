import jsPDF from "jspdf";
import moment from "moment";
import {
  buildVoucherData,
  getVoucherFileName,
} from "./financeVoucherUtils";

/** Same high-contrast palette as Admission Slip. */
const COLORS = {
  black: [0, 0, 0],
  ink: [15, 15, 15],
  muted: [55, 55, 55],
  white: [255, 255, 255],
  lightGray: [245, 245, 245],
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const svgUrlToPngDataUrl = async (svgUrl, widthPx = 160) => {
  try {
    const res = await fetch(svgUrl);
    if (!res.ok) return null;
    const svgText = await res.text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const svgDataUrl = await readFileAsDataUrl(svgBlob);
    const img = await loadImage(svgDataUrl);
    const iconFraction = 27 / 138;
    const srcWidth = img.width * iconFraction;
    const scale = widthPx / srcWidth;
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = Math.max(1, Math.round((img.height || 1) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      0,
      0,
      srcWidth,
      img.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

/**
 * Finance voucher PDF — identical card layout to Admission Slip.
 * Returns { fileName, blobUrl, blob, doc }.
 */
export const generateFinanceVoucherPdf = async (transaction) => {
  const data = buildVoucherData(transaction);
  if (!data) {
    throw new Error("Transaction is required to generate the voucher.");
  }

  const logoPng = await svgUrlToPngDataUrl("/logo_dark.svg", 160);
  const slipTitle = data.isExpense ? "EXPENSE VOUCHER" : "FEE VOUCHER";
  const issuedAt = `${data.issueDate}, ${data.issueTime}`;
  const amountLabel = data.isExpense ? "AMOUNT" : "AMOUNT RECEIVED";
  const receiptLabel = data.isExpense
    ? "AUTHENTICATED EXPENSE VOUCHER"
    : "AUTHENTICATED FEE VOUCHER RECEIPT";

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const cardW = 100;
  const cardH = data.isExpense ? 186 : 210;
  const cardX = (pageWidth - cardW) / 2;
  const cardY = data.isExpense ? 14 : 10;
  const pad = 5;
  const innerX = cardX + pad;
  const innerW = cardW - pad * 2;

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.9);
  doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, "FD");

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.35);
  doc.roundedRect(cardX + 2, cardY + 2, cardW - 4, cardH - 4, 2, 2, "S");

  // Header
  const headerH = 22;
  doc.setFillColor(...COLORS.black);
  doc.rect(cardX, cardY, cardW, headerH, "F");
  doc.rect(cardX, cardY, cardW, 4, "F");

  const logoBox = 12;
  const logoBoxX = innerX;
  const logoBoxY = cardY + 5;
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(logoBoxX, logoBoxY, logoBox, logoBox, 1.5, 1.5, "F");

  if (logoPng) {
    try {
      const iconPad = 1.2;
      doc.addImage(
        logoPng,
        "PNG",
        logoBoxX + iconPad,
        logoBoxY + iconPad,
        logoBox - iconPad * 2,
        logoBox - iconPad * 2
      );
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.black);
      doc.text("LCA", logoBoxX + logoBox / 2, logoBoxY + 7.2, {
        align: "center",
      });
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.black);
    doc.text("LCA", logoBoxX + logoBox / 2, logoBoxY + 7.2, {
      align: "center",
    });
  }

  const titleX = logoBoxX + logoBox + 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text("Lahore CSS Academy", titleX, cardY + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text(slipTitle, titleX, cardY + 16);

  // Photo placeholder + name (same layout as admission slip)
  let y = cardY + headerH + 5;
  const photoW = 26;
  const photoH = 32;
  const photoX = innerX;
  const photoY = y;

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.55);
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, "FD");
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(
    photoX + 0.6,
    photoY + 0.6,
    photoW - 1.2,
    photoH - 1.2,
    1,
    1,
    "F"
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.ink);
  doc.text("LCA", photoX + photoW / 2, photoY + photoH / 2, {
    align: "center",
  });

  const infoX = photoX + photoW + 4;
  const infoMaxW = cardX + cardW - pad - infoX;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.black);
  doc.text(data.isExpense ? "TITLE" : "STUDENT NAME", infoX, photoY + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  const nameLines = doc.splitTextToSize(String(data.studentName), infoMaxW);
  doc.text(nameLines.slice(0, 3), infoX, photoY + 10);

  const afterNameY =
    photoY + 10 + Math.min(nameLines.length, 3) * 4.2 + 2;

  const statusLabel = String(data.actionType || "N/A").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  const statusTextW = Math.min(doc.getTextWidth(statusLabel) + 6, infoMaxW);
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.45);
  doc.roundedRect(infoX, afterNameY, statusTextW, 6, 1.2, 1.2, "FD");
  doc.setTextColor(...COLORS.black);
  doc.text(statusLabel, infoX + 3, afterNameY + 4.1);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.ink);
  doc.text(`Voucher: ${data.voucherNumber}`, infoX, afterNameY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Issued: ${issuedAt}`, infoX, afterNameY + 15.5);

  y = Math.max(photoY + photoH + 5, afterNameY + 19);

  const drawChip = (x, chipY, w, h, label, value) => {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.black);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, chipY, w, h, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.black);
    doc.text(String(label).toUpperCase(), x + 2.5, chipY + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.ink);
    const lines = doc.splitTextToSize(String(value || "N/A"), w - 5);
    doc.text(lines[0], x + 2.5, chipY + 9);
  };

  const chipH = 13;
  const gap = 2.5;
  const halfW = (innerW - gap) / 2;

  drawChip(innerX, y, halfW, chipH, "Batch", data.batchName);
  drawChip(innerX + halfW + gap, y, halfW, chipH, "Student ID", data.studentId);
  y += chipH + gap;

  drawChip(innerX, y, innerW, chipH, "Description", data.feeDescription);
  y += chipH + gap;

  drawChip(innerX, y, halfW, chipH, "Action", data.actionType);
  drawChip(
    innerX + halfW + gap,
    y,
    halfW,
    chipH,
    "Method",
    data.paymentMethod || "N/A"
  );
  y += chipH + gap;

  if (!data.isExpense) {
    drawChip(
      innerX,
      y,
      halfW,
      chipH,
      "Total Batch Fee",
      data.totalBatchFee
    );
    drawChip(
      innerX + halfW + gap,
      y,
      halfW,
      chipH,
      "Paid Fee",
      data.paidFee
    );
    y += chipH + gap;

    drawChip(
      innerX,
      y,
      halfW,
      chipH,
      "Pending Amount",
      data.pendingAmount
    );
    drawChip(
      innerX + halfW + gap,
      y,
      halfW,
      chipH,
      "Next Installment",
      data.nextInstallmentDate
    );
    y += chipH + gap + 1;
  } else {
    y += 1;
  }

  const bannerH = 15;
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.7);
  doc.roundedRect(innerX, y, innerW, bannerH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.black);
  doc.text(amountLabel, innerX + 3, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.black);
  doc.text(String(data.amount), innerX + 3, y + 12);
  y += bannerH + 5;

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.4);
  doc.line(innerX + 4, y, cardX + cardW - pad - 4, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.black);
  doc.text(receiptLabel, cardX + cardW / 2, y, { align: "center" });
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.muted);
  const note =
    "Official voucher. Retain this copy as proof of the recorded transaction.";
  const noteLines = doc.splitTextToSize(note, innerW - 4);
  doc.text(noteLines, cardX + cardW / 2, y, { align: "center" });
  y += noteLines.length * 2.4 + 5;

  const signerName = String(data.processedBy || "").trim() || "Administration Office";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.black);
  doc.text(signerName, innerX, y);
  y += 2;
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.4);
  doc.line(innerX, y, innerX + 36, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.black);
  doc.text("Authorized Signature", innerX, y + 3.8);

  const footerH = 14;
  const footerY = cardY + cardH - footerH;
  doc.setFillColor(...COLORS.black);
  doc.rect(cardX, footerY, cardW, footerH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.white);
  doc.text("0331-000-111-0  ·  0333-9800938", cardX + cardW / 2, footerY + 5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.white);
  doc.text(
    "13-Sher Shah, New Garden Town, Barkat Market, Lahore",
    cardX + cardW / 2,
    footerY + 10,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.black);
  doc.text(
    `Lahore CSS Academy  ·  ${data.isExpense ? "Expense Voucher" : "Fee Voucher"}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  const fileName = getVoucherFileName(transaction);
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);

  return { fileName, blob, blobUrl, doc };
};

export const downloadFinanceVoucherPdf = async (transaction) => {
  const { fileName, doc, blobUrl } = await generateFinanceVoucherPdf(transaction);
  doc.save(fileName);
  URL.revokeObjectURL(blobUrl);
  return fileName;
};

export const printFinanceVoucherPdf = async (transaction) => {
  const { blobUrl } = await generateFinanceVoucherPdf(transaction);
  const printWindow = window.open(blobUrl);
  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error("Pop-up blocked. Allow pop-ups to print the voucher.");
  }
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };
  return blobUrl;
};
