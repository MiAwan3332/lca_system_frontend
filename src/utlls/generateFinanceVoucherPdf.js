import {
  buildVoucherData,
  getVoucherFileName,
} from "./financeVoucherUtils";
import { createFeeSlipPdf, drawFeeNonRefundableNote, drawFeeSlipBrandingFooter, drawFeeSlipBrandingHeader, getFeeSlipContentStartY, getFeeSlipFrame } from "./feeSlipLayout";

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
export const generateFinanceVoucherPdf = async (transaction, options = {}) => {
  const includeBranding = options.includeBranding !== false;
  const data = buildVoucherData(transaction);
  if (!data) {
    throw new Error("Transaction is required to generate the voucher.");
  }

  const logoPng = includeBranding
    ? await svgUrlToPngDataUrl("/logo_dark.svg", 160)
    : null;
  const slipTitle = data.isExpense ? "EXPENSE VOUCHER" : "FEE VOUCHER";
  const issuedAt = `${data.issueDate}, ${data.issueTime}`;
  const amountLabel = data.isExpense ? "AMOUNT" : "AMOUNT RECEIVED";
  const receiptLabel = data.isExpense
    ? "AUTHENTICATED EXPENSE VOUCHER"
    : "AUTHENTICATED FEE VOUCHER RECEIPT";

  const doc = createFeeSlipPdf();
  const frame = getFeeSlipFrame(doc, { includeBranding });
  const {
    cardW,
    cardH,
    cardX,
    cardY,
    pad,
    innerX,
    innerW,
    bannerH,
    chipH,
    gap,
    photoW,
    photoH,
  } = frame;

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.9);
  doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, "FD");

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX + 1.5, cardY + 1.5, cardW - 3, cardH - 3, 1.5, 1.5, "S");

  drawFeeSlipBrandingHeader(doc, frame, { title: slipTitle, logoPng });

  let y = getFeeSlipContentStartY(frame, 2.5);
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
  doc.setFontSize(5);
  doc.text(data.isExpense ? "TITLE" : "STUDENT NAME", infoX, photoY + 3.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const nameLines = doc.splitTextToSize(String(data.studentName), infoMaxW);
  doc.text(nameLines.slice(0, 2), infoX, photoY + 8);

  const afterNameY = photoY + 8 + Math.min(nameLines.length, 2) * 3.2 + 1;

  const statusLabel = String(data.actionType || "N/A").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  const statusTextW = Math.min(doc.getTextWidth(statusLabel) + 5, infoMaxW);
  doc.roundedRect(infoX, afterNameY, statusTextW, 4.5, 1, 1, "FD");
  doc.text(statusLabel, infoX + 2.5, afterNameY + 3.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.text(`Voucher: ${data.voucherNumber}`, infoX, afterNameY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Issued: ${issuedAt}`, infoX, afterNameY + 11);

  y = Math.max(photoY + photoH + 2.5, afterNameY + 14);

  const drawChip = (x, chipY, w, h, label, value) => {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.black);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, chipY, w, h, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.5);
    doc.text(String(label).toUpperCase(), x + 1.8, chipY + 2.8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    const lines = doc.splitTextToSize(String(value || "N/A"), w - 3.5);
    doc.text(lines[0], x + 1.8, chipY + 6.5);
  };

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
    drawChip(innerX, y, halfW, chipH, "Total Fee", data.totalBatchFee);
    drawChip(innerX + halfW + gap, y, halfW, chipH, "Paid", data.paidFee);
    y += chipH + gap;

    drawChip(innerX, y, halfW, chipH, "Pending", data.pendingAmount);
    drawChip(
      innerX + halfW + gap,
      y,
      halfW,
      chipH,
      "Next Due",
      data.nextInstallmentDate
    );
    y += chipH + gap;
  }

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.6);
  doc.roundedRect(innerX, y, innerW, bannerH, 1.2, 1.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.text(amountLabel, innerX + 2.5, y + 4);

  doc.setFontSize(10.5);
  doc.text(String(data.amount), innerX + 2.5, y + 9.5);
  y += bannerH + 2;

  doc.setLineWidth(0.35);
  doc.line(innerX + 3, y, cardX + cardW - pad - 3, y);
  y += 2;

  doc.setFontSize(5);
  doc.text(receiptLabel, cardX + cardW / 2, y, { align: "center" });
  y += 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    "Official voucher. Retain as proof of transaction.",
    cardX + cardW / 2,
    y,
    { align: "center", maxWidth: innerW - 4 }
  );
  y += 3.5;

  if (!data.isExpense) {
    drawFeeNonRefundableNote(doc, {
      x: cardX + cardW / 2,
      y,
      align: "center",
      fontSize: 8,
      color: COLORS.black,
    });
    y += 3.5;
  }

  const signerName = String(data.processedBy || "").trim() || "Administration Office";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.black);
  doc.text(signerName, innerX, y);
  y += 1.2;
  doc.line(innerX, y, innerX + 28, y);
  doc.setFontSize(4.5);
  doc.text("Authorized Signature", innerX, y + 2.8);

  drawFeeSlipBrandingFooter(doc, frame);

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
  const { doc, blobUrl } = await generateFinanceVoucherPdf(transaction, {
    includeBranding: false,
  });
  const { printFeeSlipPdf } = await import("./feeSlipPrint");
  await printFeeSlipPdf(doc);
  URL.revokeObjectURL(blobUrl);
};
