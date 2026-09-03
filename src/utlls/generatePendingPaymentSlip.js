import moment from "moment";
import { formatClassTimeRange } from "./classTime";
import { getMediaUrl } from "./useful.js";
import {
  createFeeSlipPdf,
  drawFeeNonRefundableNote,
  getFeeSlipContentStartY,
  getFeeSlipFrame,
} from "./feeSlipLayout";

/** Compact palette — matches Admission Slip for clear thermal printing. */
const COLORS = {
  charcoal: [33, 37, 41],
  ink: [26, 32, 44],
  muted: [100, 105, 115],
  label: [90, 95, 105],
  border: [210, 215, 220],
  softBorder: [230, 233, 238],
  white: [255, 255, 255],
  soft: [248, 249, 251],
  panel: [242, 244, 247],
  gold: [180, 130, 55],
  goldSoft: [245, 236, 220],
};

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const buildFileName = (studentName = "student", isDuplicate = false) => {
  const safeName = String(studentName).replace(/\s+/g, "-").toLowerCase();
  const prefix = isDuplicate ? "duplicate-fee-slip" : "fee-payment-slip";
  return `${prefix}-${safeName}-${moment().format("YYYYMMDD-HHmm")}.pdf`;
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

const getImageFormat = (dataUrl) =>
  String(dataUrl || "").includes("image/jpeg") ? "JPEG" : "PNG";

const QR_LABEL = "SCAN TO VERIFY";
const QR_LABEL_H = 3.2;

const resolveQrDataUrl = async (qrDataUrl, verifyUrl) => {
  if (qrDataUrl) return qrDataUrl;
  if (!verifyUrl) return null;
  try {
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    return null;
  }
};

const drawQrBadge = (doc, dataUrl, x, y, size) => {
  if (!dataUrl) return false;
  try {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.charcoal);
    doc.setLineWidth(0.35);
    doc.roundedRect(x - 0.8, y - 0.8, size + 1.6, size + 1.6, 0.8, 0.8, "FD");
    doc.addImage(dataUrl, getImageFormat(dataUrl), x, y, size, size);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(3.2);
    doc.setTextColor(...COLORS.charcoal);
    doc.text(QR_LABEL, x + size / 2, y + size + 2.4, {
      align: "center",
      maxWidth: size + 2,
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Fee payment / duplicate slip — same compact layout as Admission Slip.
 * When isDuplicate is true, title clearly marks it as a duplicate copy.
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
    qrDataUrl = null,
    verifyUrl = "",
  } = data;

  const studentName = String(name || "").trim();
  if (!studentName) {
    throw new Error("Student name is required to print the fee slip.");
  }

  const discount = Math.max(Number(discountAmount) || 0, 0);
  if (!(Number(payingNow) > 0) && !(discount > 0)) {
    throw new Error(
      "Enter a payment or discount amount before printing the fee slip."
    );
  }

  const paymentLabel =
    paymentOption === "partial" ? "Partial Payment" : "Full Payment";
  const classTimeLabel =
    formatClassTimeRange(classStartTime, classEndTime) || "N/A";
  const issuedAt = moment().format("DD MMM YYYY · hh:mm A");
  const cnicValue = String(cnic || "").trim() || "N/A";
  const totalBatchFee = Number(totalFee) || Number(batchFee) || 0;
  const signerName =
    String(authorizedBy || "").trim() || "Administration Office";

  const photoDataUrl = await toJpegDataUrl(photoFile || photoUrl);
  const resolvedQrDataUrl = await resolveQrDataUrl(qrDataUrl, verifyUrl);
  const hasQr = Boolean(resolvedQrDataUrl);

  const doc = createFeeSlipPdf();
  const frame = getFeeSlipFrame(doc, {
    includeBranding: false,
    usePrintMargins: mode === "print",
  });
  const {
    cardW,
    cardH,
    cardX,
    cardY,
    pad,
    innerX,
    innerW,
    photoW,
    photoH,
    gap,
  } = frame;

  const contentBottom = cardY + cardH - pad * 0.5;

  doc.setFillColor(...COLORS.white);
  doc.rect(cardX, cardY, cardW, cardH, "F");

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.35);
  doc.roundedRect(innerX - 0.5, cardY + 0.5, innerW + 1, cardH - 1, 1.5, 1.5, "S");

  let y = getFeeSlipContentStartY(frame, 0.5);

  // ── Title (same style as Admission Slip) ──
  const slipTitle = isDuplicate ? "DUPLICATE SLIP" : "FEE SLIP";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.charcoal);
  doc.text(slipTitle, cardX + cardW / 2, y + 3.5, { align: "center" });
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.line(innerX + 8, y + 5.5, innerX + innerW - 8, y + 5.5);
  y += 8;

  // Clear duplicate notice under title
  if (isDuplicate) {
    const noticeH = 5.5;
    doc.setFillColor(...COLORS.goldSoft);
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.3);
    doc.roundedRect(innerX, y, innerW, noticeH, 1, 1, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.charcoal);
    doc.text("THIS IS A DUPLICATE COPY", cardX + cardW / 2, y + 3.7, {
      align: "center",
    });
    y += noticeH + 2;
  }

  // ── Student block (photo + info + QR on card right) ──
  const qrSize = hasQr ? Math.min(photoW, 16) : 0;
  const qrPad = 1.5;
  const qrBlockH = hasQr ? qrSize + 2.4 + QR_LABEL_H : 0;
  const photoX = innerX + 1.5;
  const identityH = Math.max(photoH + 3, qrBlockH + 3, 26);
  const identityTop = y;
  const qrX = innerX + innerW - qrSize - qrPad;
  const infoX = photoX + photoW + 3;
  const infoMaxW = Math.max(
    20,
    hasQr ? qrX - infoX - 2.5 : cardX + cardW - pad - infoX - 1
  );
  const qrY = identityTop + (identityH - qrBlockH) / 2;

  doc.setFillColor(...COLORS.soft);
  doc.setDrawColor(...COLORS.softBorder);
  doc.roundedRect(innerX, identityTop, innerW, identityH, 1.5, 1.5, "FD");

  const photoY = identityTop + (identityH - photoH) / 2;
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.4);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1.2, 1.2, "FD");

  if (photoDataUrl) {
    try {
      const format = String(photoDataUrl).startsWith("data:image/png")
        ? "PNG"
        : "JPEG";
      doc.addImage(
        photoDataUrl,
        format,
        photoX + 0.5,
        photoY + 0.5,
        photoW - 1,
        photoH - 1
      );
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.muted);
      doc.text("Photo", photoX + photoW / 2, photoY + photoH / 2, {
        align: "center",
      });
    }
  } else {
    doc.setFillColor(...COLORS.panel);
    doc.roundedRect(photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.muted);
    doc.text("No Photo", photoX + photoW / 2, photoY + photoH / 2, {
      align: "center",
    });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.charcoal);
  const nameLines = doc.splitTextToSize(studentName, infoMaxW).slice(0, 2);
  doc.text(nameLines, infoX, identityTop + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.ink);
  doc.text(`Ph: ${phone || "N/A"}`, infoX, identityTop + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  const metaLine = rollNumber
    ? `Roll: ${rollNumber} · ${issuedAt}`
    : issuedAt;
  const issuedLines = doc.splitTextToSize(metaLine, infoMaxW);
  doc.text(issuedLines.slice(0, 1), infoX, identityTop + 16.5);

  y = identityTop + identityH + 2.5;

  // ── Compact detail rows ──
  const rowH = 6.2;
  const labelW = innerW * 0.38;

  const drawRow = (label, value, rowY, alt = false) => {
    if (rowY + rowH > contentBottom - 38) return rowY;
    doc.setFillColor(...(alt ? COLORS.soft : COLORS.white));
    doc.setDrawColor(...COLORS.softBorder);
    doc.setLineWidth(0.15);
    doc.rect(innerX, rowY, innerW, rowH, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.label);
    doc.text(String(label), innerX + 2, rowY + 4.2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.ink);
    const valLines = doc.splitTextToSize(
      String(value || "N/A"),
      innerW - labelW - 3
    );
    doc.text(valLines[0], innerX + labelW, rowY + 4.2);
    return rowY + rowH + 0.4;
  };

  y = drawRow("Batch", batchName, y);
  y = drawRow("CNIC", cnicValue, y, true);
  y = drawRow("Class Time", classTimeLabel, y);
  y = drawRow("Payment", paymentLabel, y, true);
  y = drawRow("Method", paymentMethod || "N/A", y);
  if (paymentOption === "partial" && nextInstallmentDate) {
    y = drawRow(
      "Next Due",
      moment(nextInstallmentDate).format("DD MMM YYYY"),
      y,
      true
    );
  }
  if (discount > 0) {
    y = drawRow("Discount", formatCurrency(discount), y, true);
  }
  y += 1.5;

  // ── Fee chips (Total + Remaining) — same as Admission Slip ──
  const chipH = 10;
  const halfW = (innerW - gap) / 2;
  const chips = [
    { label: "Total", value: formatCurrency(totalBatchFee) },
    { label: "Remaining", value: formatCurrency(remainingAfter) },
  ];

  chips.forEach((chip, i) => {
    const cx = innerX + i * (halfW + gap);
    doc.setFillColor(...COLORS.soft);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(cx, y, halfW, chipH, 1, 1, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...COLORS.label);
    doc.text(chip.label.toUpperCase(), cx + 1.5, y + 3.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.charcoal);
    const vLines = doc.splitTextToSize(chip.value, halfW - 3);
    doc.text(vLines[0], cx + 1.5, y + 8);
  });
  y += chipH + 2;

  // ── Footer: signature ──
  const footerStart = Math.max(y, contentBottom - 18);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(innerX, footerStart, innerX + innerW, footerStart);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.charcoal);
  doc.text(
    isDuplicate
      ? "AUTHENTICATED DUPLICATE FEE RECEIPT"
      : "AUTHENTICATED FEE PAYMENT RECEIPT",
    innerX,
    footerStart + 3.5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    isDuplicate
      ? "Duplicate copy of an already issued fee slip."
      : hasQr
        ? "Scan QR to confirm this fee slip is verified."
        : "Provisional receipt until payment is submitted.",
    innerX,
    footerStart + 7,
    { maxWidth: innerW - 2 }
  );

  if (verifyUrl) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(3.8);
    doc.setTextColor(...COLORS.label);
    const shortUrl = String(verifyUrl).replace(/^https?:\/\//, "");
    const urlLines = doc.splitTextToSize(shortUrl, innerW - 4);
    doc.text(urlLines.slice(0, 1), innerX, footerStart + 10);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.charcoal);
  doc.text(isDuplicate ? "DUPLICATE RECEIPT" : "AUTHENTICATED FEE RECEIPT", innerX + innerW, footerStart + 13.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    hasQr
      ? "Scan QR to confirm real vs fake."
      : "Official fee slip generated upon payment.",
    innerX + innerW,
    footerStart + 15.5,
    { align: "right" }
  );

  if (verifyUrl) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(3.8);
    doc.setTextColor(...COLORS.label);
    const shortUrl = String(verifyUrl).replace(/^https?:\/\//, "");
    doc.text(shortUrl, innerX + innerW, footerStart + 17.5, { align: "right" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.ink);
  doc.text(signerName, innerX, footerStart + 13.5);
  doc.setDrawColor(...COLORS.charcoal);
  doc.setLineWidth(0.3);
  doc.line(innerX, footerStart + 15, innerX + 32, footerStart + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.muted);
  doc.text("Authorized Signature", innerX, footerStart + 17.5);
  drawFeeNonRefundableNote(doc, {
    x: innerX + innerW,
    y: footerStart + 10.5,
    align: "right",
    fontSize: 10,
    color: COLORS.ink,
  });

  if (hasQr) {
    drawQrBadge(doc, resolvedQrDataUrl, qrX, qrY, qrSize);
  }

  const fileName = buildFileName(studentName, isDuplicate);

  if (mode === "print") {
    const { printFeeSlipPdf } = await import("./feeSlipPrint");
    await printFeeSlipPdf(doc);
  } else {
    doc.save(fileName);
  }

  return fileName;
};
