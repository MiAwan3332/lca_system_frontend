import moment from "moment";
import { getMediaUrl } from "./useful.js";
import {
  createFeeSlipPdf,
  drawFeeSlipBrandingFooter,
  drawFeeSlipBrandingHeader,
  getFeeSlipContentStartY,
  getFeeSlipFrame,
} from "./feeSlipLayout";

/** High-contrast palette — matches Admission Slip for clear B&W printing. */
const COLORS = {
  black: [0, 0, 0],
  ink: [15, 15, 15],
  muted: [55, 55, 55],
  white: [255, 255, 255],
  lightGray: [245, 245, 245],
};

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const buildFileName = (studentName = "student") => {
  const safeName = String(studentName).replace(/\s+/g, "-").toLowerCase();
  return `fee-payment-slip-${safeName}-${moment().format("YYYYMMDD-HHmm")}.pdf`;
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
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const toJpegDataUrl = async (source, maxSide = 900) => {
  if (!source) return null;

  let dataUrl = null;
  if (typeof source === "string") {
    try {
      const resolved = source.startsWith("data:")
        ? source
        : getMediaUrl(source) || source;
      const img = await loadImage(resolved);
      const scale = Math.min(
        1,
        maxSide / Math.max(img.width || 1, img.height || 1)
      );
      const w = Math.max(1, Math.round((img.width || 1) * scale));
      const h = Math.max(1, Math.round((img.height || 1) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      return null;
    }
  }

  if (
    (typeof Blob !== "undefined" && source instanceof Blob) ||
    (source && typeof source === "object" && typeof source.size === "number")
  ) {
    dataUrl = await readFileAsDataUrl(source);
  } else {
    return null;
  }

  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
    const w = Math.max(1, Math.round((img.width || 1) * scale));
    const h = Math.max(1, Math.round((img.height || 1) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return typeof dataUrl === "string" && dataUrl.startsWith("data:image/")
      ? dataUrl
      : null;
  }
};

const svgUrlToPngDataUrl = async (svgUrl, widthPx = 360, options = {}) => {
  try {
    const res = await fetch(svgUrl);
    if (!res.ok) return null;

    const svgText = await res.text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const svgDataUrl = await readFileAsDataUrl(svgBlob);
    const img = await loadImage(svgDataUrl);

    const iconOnly = Boolean(options.iconOnly);
    const iconFraction = 27 / 138;
    const srcWidth = iconOnly ? img.width * iconFraction : img.width || 1;
    const scale = widthPx / srcWidth;

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = Math.max(1, Math.round((img.height || 1) * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (iconOnly) {
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
    } else {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

/**
 * Pending fee payment slip — same card layout as Admission Slip.
 * Includes batch total fee for clear B&W printing.
 */
export const generatePendingPaymentSlip = async (data = {}, mode = "print") => {
  const {
    name,
    phone = "",
    cnic = "",
    rollNumber = "",
    batchName = "N/A",
    batchFee = 0,
    totalFee = 0,
    paidFee = 0,
    outstandingBalance = 0,
    payingNow = 0,
    remainingAfter = 0,
    discountAmount = 0,
    paymentOption = "full",
    paymentMethod = "Cash",
    nextInstallmentDate = "",
    photoFile = null,
    photoUrl = "",
    authorizedBy = "",
    classStartTime = "",
    classEndTime = "",
    isDuplicate = false,
  } = data;

  const studentName = String(name || "").trim();
  if (!studentName) {
    throw new Error("Student name is required to print the fee slip.");
  }

  const discount = Math.max(Number(discountAmount) || 0, 0);
  if (!(Number(payingNow) > 0) && !(discount > 0)) {
    throw new Error("Enter a payment or discount amount before printing the fee slip.");
  }

  const paymentType =
    paymentOption === "partial" ? "Partial Payment" : "Full Remaining Balance";
  const issuedAt = moment().format("DD MMM YYYY, hh:mm A");
  const cnicValue = String(cnic || "").trim() || "N/A";
  const totalBatchFee = Number(totalFee) || Number(batchFee) || 0;
  const paymentStatus =
    Number(remainingAfter) <= 0 ? "Fully Paid" : "Partially Paid";

  const includeBranding = mode !== "print";

  const [photoDataUrl, logoPng] = await Promise.all([
    toJpegDataUrl(photoFile || photoUrl),
    includeBranding
      ? svgUrlToPngDataUrl("/logo_dark.svg", 160, { iconOnly: true })
      : Promise.resolve(null),
  ]);

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

  drawFeeSlipBrandingHeader(doc, frame, {
    title: isDuplicate ? "FEE SLIP (DUPLICATE)" : "FEE PAYMENT SLIP",
    logoPng,
  });

  let y = getFeeSlipContentStartY(frame, 2.5);
  const photoX = innerX;
  const photoY = y;

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.55);
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, "FD");

  if (photoDataUrl) {
    try {
      const format = String(photoDataUrl).startsWith("data:image/png")
        ? "PNG"
        : "JPEG";
      doc.addImage(
        photoDataUrl,
        format,
        photoX + 0.6,
        photoY + 0.6,
        photoW - 1.2,
        photoH - 1.2
      );
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.ink);
      doc.text("Photo", photoX + photoW / 2, photoY + photoH / 2, {
        align: "center",
      });
    }
  } else {
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
    doc.text("No Photo", photoX + photoW / 2, photoY + photoH / 2, {
      align: "center",
    });
  }

  const infoX = photoX + photoW + 4;
  const infoMaxW = cardX + cardW - pad - infoX;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.text("STUDENT NAME", infoX, photoY + 3.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const nameLines = doc.splitTextToSize(studentName, infoMaxW);
  doc.text(nameLines.slice(0, 2), infoX, photoY + 8);

  const afterNameY = photoY + 8 + Math.min(nameLines.length, 2) * 3.2 + 1;

  const statusLabel = String(paymentStatus).toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  const statusTextW = Math.min(doc.getTextWidth(statusLabel) + 5, infoMaxW);
  doc.roundedRect(infoX, afterNameY, statusTextW, 4.5, 1, 1, "FD");
  doc.text(statusLabel, infoX + 2.5, afterNameY + 3.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.text(`Phone: ${phone || "N/A"}`, infoX, afterNameY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(...COLORS.muted);
  if (rollNumber) {
    doc.text(`Roll: ${rollNumber}`, infoX, afterNameY + 11);
    doc.text(`Issued: ${issuedAt}`, infoX, afterNameY + 13.5);
  } else {
    doc.text(`Issued: ${issuedAt}`, infoX, afterNameY + 11);
  }

  y = Math.max(photoY + photoH + 2.5, afterNameY + 15);

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

  drawChip(innerX, y, halfW, chipH, "Batch", batchName);
  drawChip(innerX + halfW + gap, y, halfW, chipH, "CNIC", cnicValue);
  y += chipH + gap;

  drawChip(innerX, y, halfW, chipH, "Payment", paymentType);
  drawChip(
    innerX + halfW + gap,
    y,
    halfW,
    chipH,
    "Method",
    paymentMethod || "N/A"
  );
  y += chipH + gap;

  drawChip(innerX, y, halfW, chipH, "Total Fee", formatCurrency(totalBatchFee));
  drawChip(innerX + halfW + gap, y, halfW, chipH, "Paid", formatCurrency(paidFee));
  y += chipH + gap;

  drawChip(
    innerX,
    y,
    halfW,
    chipH,
    "Outstanding",
    formatCurrency(outstandingBalance)
  );
  drawChip(
    innerX + halfW + gap,
    y,
    halfW,
    chipH,
    "Discount",
    formatCurrency(discount)
  );
  y += chipH + gap;

  drawChip(
    innerX,
    y,
    innerW,
    chipH,
    "Remaining",
    formatCurrency(remainingAfter)
  );
  y += chipH + gap;

  if (paymentOption === "partial" && nextInstallmentDate) {
    drawChip(
      innerX,
      y,
      innerW,
      chipH,
      "Next Due",
      moment(nextInstallmentDate).format("DD MMM YYYY")
    );
    y += chipH + gap;
  }

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.6);
  doc.roundedRect(innerX, y, innerW, bannerH, 1.2, 1.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.text("AMOUNT RECEIVED", innerX + 2.5, y + 4);

  doc.setFontSize(10.5);
  doc.text(formatCurrency(payingNow), innerX + 2.5, y + 9.5);
  y += bannerH + 2;

  doc.setLineWidth(0.35);
  doc.line(innerX + 3, y, cardX + cardW - pad - 3, y);
  y += 2;

  doc.setFontSize(5);
  doc.text("AUTHENTICATED FEE PAYMENT RECEIPT", cardX + cardW / 2, y, {
    align: "center",
  });
  y += 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    "Provisional receipt until payment is submitted.",
    cardX + cardW / 2,
    y,
    { align: "center", maxWidth: innerW - 4 }
  );
  y += 3.5;

  const signerName =
    String(authorizedBy || "").trim() || "Administration Office";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.black);
  doc.text(signerName, innerX, y);
  y += 1.2;
  doc.line(innerX, y, innerX + 28, y);
  doc.setFontSize(4.5);
  doc.text("Authorized Signature", innerX, y + 2.8);

  drawFeeSlipBrandingFooter(doc, frame);

  const fileName = buildFileName(studentName);

  if (mode === "print") {
    const { printFeeSlipPdf } = await import("./feeSlipPrint");
    await printFeeSlipPdf(doc);
  } else {
    doc.save(fileName);
  }

  return fileName;
};
