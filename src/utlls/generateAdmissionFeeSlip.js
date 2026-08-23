import moment from "moment";
import { formatClassTimeRange } from "./classTime";
import {
  createFeeSlipPdf,
  getFeeSlipContentStartY,
  getFeeSlipFrame,
} from "./feeSlipLayout";

/** Compact palette — readable on 5×7" thermal paper. */
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

const getPaymentLabel = (paymentOption) => {
  if (paymentOption === "full") return "Full Payment";
  if (paymentOption === "partial") return "Partial Payment";
  return "Pay Later";
};

/**
 * Admission fee slip — compact layout for 5×7" paper (all info in printable area).
 */
export const generateAdmissionFeeSlip = async (data, mode = "print") => {
  const {
    name,
    cnic,
    phone,
    batchName,
    batchFee = 0,
    payingNow = 0,
    remainingFee = 0,
    paymentOption = "later",
    paymentMethod = "N/A",
    photoFile = null,
    authorizedBy = "",
    classStartTime = "",
    classEndTime = "",
  } = data || {};

  const studentName = String(name || "").trim();
  if (!studentName) {
    throw new Error("Student name is required to print the fee slip.");
  }
  if (!batchName) {
    throw new Error("Please select a batch to print the fee slip.");
  }

  const classTimeLabel =
    formatClassTimeRange(classStartTime, classEndTime) || "N/A";
  const photoDataUrl = await toJpegDataUrl(photoFile);

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
    bannerH,
  } = frame;

  const paymentLabel = getPaymentLabel(paymentOption);
  const cnicValue = String(cnic || "").trim() || "N/A";
  const issuedAt = moment().format("DD MMM YYYY · hh:mm A");
  const signerName =
    String(authorizedBy || "").trim() || "Administration Office";
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
  doc.text("ADMISSION SLIP", cardX + cardW / 2, y + 3.5, { align: "center" });
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.line(innerX + 8, y + 5.5, innerX + innerW - 8, y + 5.5);
  y += 8;

  // ── Student block (photo + info) ──
  const photoX = innerX + 1.5;
  const identityH = Math.max(photoH + 3, 26);
  const identityTop = y;
  const infoX = photoX + photoW + 3;
  const infoMaxW = cardX + cardW - pad - infoX - 1;

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
  const issuedLines = doc.splitTextToSize(issuedAt, infoMaxW);
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
    const valLines = doc.splitTextToSize(String(value || "N/A"), innerW - labelW - 3);
    doc.text(valLines[0], innerX + labelW, rowY + 4.2);
    return rowY + rowH + 0.4;
  };

  y = drawRow("Batch", batchName, y);
  y = drawRow("CNIC", cnicValue, y, true);
  y = drawRow("Class Time", classTimeLabel, y);
  y = drawRow("Payment", paymentLabel, y, true);
  y = drawRow(
    "Method",
    payingNow > 0 ? paymentMethod : "N/A",
    y
  );
  y += 1.5;

  // ── Fee chips (3 across) ──
  const chipH = 10;
  const thirdW = (innerW - gap * 2) / 3;
  const chips = [
    { label: "Total", value: formatCurrency(batchFee) },
    { label: "Remaining", value: formatCurrency(remainingFee) },
    { label: "Received", value: formatCurrency(payingNow), highlight: true },
  ];

  chips.forEach((chip, i) => {
    const cx = innerX + i * (thirdW + gap);
    doc.setFillColor(...(chip.highlight ? COLORS.charcoal : COLORS.soft));
    doc.setDrawColor(...(chip.highlight ? COLORS.charcoal : COLORS.border));
    doc.setLineWidth(0.25);
    doc.roundedRect(cx, y, thirdW, chipH, 1, 1, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...(chip.highlight ? COLORS.goldSoft : COLORS.label));
    doc.text(chip.label.toUpperCase(), cx + 1.5, y + 3.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...(chip.highlight ? COLORS.white : COLORS.charcoal));
    const vLines = doc.splitTextToSize(chip.value, thirdW - 3);
    doc.text(vLines[0], cx + 1.5, y + 8);
  });
  y += chipH + 2;

  // ── Amount banner (if space) ──
  if (y + bannerH + 14 <= contentBottom) {
    doc.setFillColor(...COLORS.goldSoft);
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.35);
    doc.roundedRect(innerX, y, innerW, bannerH, 1.2, 1.2, "FD");
    doc.setFillColor(...COLORS.gold);
    doc.rect(innerX, y, 1.2, bannerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.label);
    doc.text("AMOUNT RECEIVED", innerX + 3.5, y + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.charcoal);
    doc.text(formatCurrency(payingNow), innerX + 3.5, y + 9.5);
    y += bannerH + 2;
  }

  // ── Footer: receipt + signature (pinned near bottom of content area) ──
  const footerStart = Math.max(y, contentBottom - 16);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(innerX, footerStart, innerX + innerW, footerStart);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.charcoal);
  doc.text("AUTHENTICATED ADMISSION RECEIPT", cardX + cardW / 2, footerStart + 3.5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    "Provisional slip · confirmed after student is added.",
    cardX + cardW / 2,
    footerStart + 7,
    { align: "center", maxWidth: innerW - 4 }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.ink);
  doc.text(signerName, innerX, footerStart + 11.5);
  doc.setDrawColor(...COLORS.charcoal);
  doc.setLineWidth(0.3);
  doc.line(innerX, footerStart + 13, innerX + 32, footerStart + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.muted);
  doc.text("Authorized Signature", innerX, footerStart + 15.5);

  const fileName = buildFileName(studentName);

  if (mode === "print") {
    const { printFeeSlipPdf } = await import("./feeSlipPrint");
    await printFeeSlipPdf(doc);
  } else {
    doc.save(fileName);
  }

  return fileName;
};
