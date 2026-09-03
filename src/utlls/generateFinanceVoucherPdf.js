import {
  buildVoucherData,
  getVoucherFileName,
} from "./financeVoucherUtils";
import {
  createFeeSlipPdf,
  drawFeeNonRefundableNote,
  getFeeSlipContentStartY,
  getFeeSlipFrame,
} from "./feeSlipLayout";

/** Compact palette — identical to Admission Slip. */
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

const toJpegDataUrl = async (source, maxSide = 900) => {
  if (!source) return null;

  let dataUrl = null;
  if (typeof source === "string") {
    dataUrl = source;
  } else if (
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

const resolveQrDataUrl = async (qrValue) => {
  if (!qrValue) return null;
  try {
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(qrValue, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    return null;
  }
};

const QR_LABEL = "SCAN TO VERIFY";
const QR_LABEL_H = 3.2;

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
    // Keep label under QR and clipped to the QR column width
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
 * Finance voucher PDF — truly identical visual aesthetics to Admission Slip.
 * Returns { fileName, blobUrl, blob, doc }.
 */
export const generateFinanceVoucherPdf = async (transaction, options = {}) => {
  const includeBranding = options.includeBranding !== false;
  const data = buildVoucherData(transaction);
  if (!data) {
    throw new Error("Transaction is required to generate the voucher.");
  }

  const slipTitle = data.isExpense ? "EXPENSE VOUCHER" : "FEE VOUCHER";
  const issuedAt = `${data.issueDate}, ${data.issueTime}`;
  const receiptLabel = data.isExpense
    ? "AUTHENTICATED EXPENSE VOUCHER"
    : "AUTHENTICATED FEE VOUCHER RECEIPT";

  const doc = createFeeSlipPdf();
  const frame = getFeeSlipFrame(doc, {
    includeBranding: false,
    usePrintMargins: !includeBranding,
  });

  const {
    cardW,
    cardH,
    cardX,
    cardY,
    pad,
    innerX,
    innerW,
    gap,
    photoW,
    photoH,
  } = frame;

  const photoDataUrl = await toJpegDataUrl(data.studentImage);
  const resolvedQrDataUrl = await resolveQrDataUrl(data.qrValue);
  const hasQr = Boolean(resolvedQrDataUrl);

  const contentBottom = cardY + cardH - pad * 0.5;

  doc.setFillColor(...COLORS.white);
  doc.rect(cardX, cardY, cardW, cardH, "F");

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.35);
  doc.roundedRect(innerX - 0.5, cardY + 0.5, innerW + 1, cardH - 1, 1.5, 1.5, "S");

  let y = getFeeSlipContentStartY(frame, 0.5);

  // ── Title ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.charcoal);
  doc.text(slipTitle, cardX + cardW / 2, y + 3.5, { align: "center" });
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.line(innerX + 8, y + 5.5, innerX + innerW - 8, y + 5.5);
  y += 8;

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
  // Center the QR + label block inside the card so "SCAN TO VERIFY" stays inside
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
  const nameLines = doc.splitTextToSize(String(data.studentName || "N/A"), infoMaxW).slice(0, 2);
  doc.text(nameLines, infoX, identityTop + 4.5);

  const statusLabel = String(data.actionType || "N/A").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  const statusTextW = Math.min(doc.getTextWidth(statusLabel) + 5, infoMaxW);
  doc.setFillColor(...COLORS.goldSoft);
  doc.roundedRect(infoX, identityTop + 8, statusTextW, 4.5, 1, 1, "F");
  doc.setTextColor(...COLORS.charcoal);
  doc.text(statusLabel, infoX + 2.5, identityTop + 11.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  const metaLine = `Voucher: ${data.voucherNumber} · ${issuedAt}`;
  const issuedLines = doc.splitTextToSize(metaLine, infoMaxW);
  doc.text(issuedLines.slice(0, 1), infoX, identityTop + 17);

  if (hasQr) {
    drawQrBadge(doc, resolvedQrDataUrl, qrX, qrY, qrSize);
  }

  y = identityTop + identityH + 2.5;

  // ── Compact detail rows (Matches Admission Slip) ──
  const rowH = 6.2;
  const labelW = innerW * 0.38;

  const drawRow = (label, value, rowY, alt = false) => {
    if (rowY + rowH > contentBottom - 20) return rowY;
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
    const valLines = doc.splitTextToSize(String(value || "N/A"), innerW - labelW - 3);
    doc.text(valLines[0], innerX + labelW, rowY + 4.2);
    return rowY + rowH + 0.4;
  };

  y = drawRow("Batch / Program", data.batchName, y);
  y = drawRow("Description", data.feeDescription, y, true);
  y = drawRow("Payment Method", data.paymentMethod || "N/A", y);

  if (!data.isExpense) {
    y += 1.5;
    const chipH = 10;
    const halfW = (innerW - gap) / 2;
    const chips = [
      { label: "Total", value: data.totalBatchFee },
      { label: "Paid", value: data.paidFee },
      { label: "Pending", value: data.pendingAmount },
      { label: "Next Due", value: data.nextInstallmentDate || "N/A" },
    ];

    chips.forEach((chip, i) => {
      const isSecondRow = i > 1;
      const col = i % 2;
      const cx = innerX + col * (halfW + gap);
      const cy = y + (isSecondRow ? chipH + gap : 0);
      
      doc.setFillColor(...COLORS.soft);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.25);
      doc.roundedRect(cx, cy, halfW, chipH, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(...COLORS.label);
      doc.text(chip.label.toUpperCase(), cx + 1.5, cy + 3.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.charcoal);
      const vLines = doc.splitTextToSize(String(chip.value || "N/A"), halfW - 3);
      doc.text(vLines[0], cx + 1.5, cy + 8);
    });
    y += (chipH * 2) + gap + 2;
  } else {
    y += 1.5;
  }

  // ── Amount Banner ──
  const bannerH = 12;
  doc.setFillColor(...COLORS.panel);
  doc.setDrawColor(...COLORS.softBorder);
  doc.setLineWidth(0.2);
  doc.roundedRect(innerX, y, innerW, bannerH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.label);
  doc.text(data.isExpense ? "AMOUNT" : "AMOUNT RECEIVED", innerX + 2.5, y + 4.5);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.charcoal);
  doc.text(String(data.amount), innerX + 2.5, y + 10);
  y += bannerH + 4;

  // ── Receipt Footer ──
  const footerY = contentBottom - 2;

  const signerName = String(data.processedBy || "").trim() || "System";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.charcoal);
  doc.text(signerName, innerX, footerY - 4);
  doc.setDrawColor(...COLORS.charcoal);
  doc.setLineWidth(0.3);
  doc.line(innerX, footerY - 2.5, innerX + 32, footerY - 2.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.muted);
  doc.text("Authorized Signature", innerX, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.charcoal);
  doc.text(receiptLabel, innerX + innerW, footerY - 4, { align: "right" });

  if (!data.isExpense) {
    drawFeeNonRefundableNote(doc, {
      x: innerX + innerW,
      y: footerY,
      align: "right",
      fontSize: 10,
      color: COLORS.ink,
    });
  }

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