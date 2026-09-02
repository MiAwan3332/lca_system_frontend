import moment from "moment";
import {
  createFeeSlipPdf,
  drawFeeNonRefundableNote,
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
  return `pending-fee-slip-${safeName}-${moment().format("YYYYMMDD-HHmm")}.pdf`;
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
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const toJpegDataUrl = async (source, maxSide = 900) => {
  if (!source) return null;

  let dataUrl = null;
  if (typeof source === "string") {
    try {
      if (source.startsWith("data:image/")) {
        dataUrl = source;
      } else {
        const img = await loadImage(source);
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
      }
    } catch {
      return null;
    }
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
 * Build a Pending Fee Slip PDF (same card layout as Admission Slip)
 * and return a File suitable for upload.
 */
export const generatePendingFeeSlipPdf = async (data = {}) => {
  const {
    name,
    phone,
    cnic = "",
    rollNumber = "",
    batchName = "N/A",
    totalFee = 0,
    paidFee = 0,
    pendingAmount = 0,
    photoUrl = null,
    photoFile = null,
    authorizedBy = "",
  } = data;

  const studentName = String(name || "").trim();
  if (!studentName) {
    throw new Error("Student name is required to generate the pending fee slip.");
  }

  if (!(Number(pendingAmount) > 0)) {
    throw new Error("Pending amount must be greater than zero.");
  }

  const [photoDataUrl, logoPng] = await Promise.all([
    toJpegDataUrl(photoFile || photoUrl),
    svgUrlToPngDataUrl("/logo_dark.svg", 160, { iconOnly: true }),
  ]);

  const doc = createFeeSlipPdf();
  const frame = getFeeSlipFrame(doc);
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
    chipH,
    gap,
    bannerH,
  } = frame;

  const cnicValue = String(cnic || "").trim() || "N/A";
  const issuedAt = moment().format("DD MMM YYYY, hh:mm A");

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.9);
  doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, "FD");

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX + 1.5, cardY + 1.5, cardW - 3, cardH - 3, 1.5, 1.5, "S");

  drawFeeSlipBrandingHeader(doc, frame, {
    title: "PENDING FEE SLIP",
    logoPng,
  });

  let y = getFeeSlipContentStartY(frame);
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
  doc.setFontSize(9);
  const nameLines = doc.splitTextToSize(studentName, infoMaxW);
  doc.text(nameLines.slice(0, 2), infoX, photoY + 8);

  const afterNameY = photoY + 8 + Math.min(nameLines.length, 2) * 3.5 + 1.5;

  const statusLabel = "PENDING";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  const statusTextW = Math.min(doc.getTextWidth(statusLabel) + 5, infoMaxW);
  doc.roundedRect(infoX, afterNameY, statusTextW, 5, 1, 1, "FD");
  doc.text(statusLabel, infoX + 2.5, afterNameY + 3.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(`Phone: ${phone || "N/A"}`, infoX, afterNameY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Issued: ${issuedAt}`, infoX, afterNameY + 12.5);

  y = Math.max(photoY + photoH + 3, afterNameY + 15);

  const drawChip = (x, chipY, w, h, label, value) => {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.black);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, chipY, w, h, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.5);
    doc.text(String(label).toUpperCase(), x + 2, chipY + 3.2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    const lines = doc.splitTextToSize(String(value || "N/A"), w - 4);
    doc.text(lines[0], x + 2, chipY + 7.2);
  };

  const halfW = (innerW - gap) / 2;

  drawChip(innerX, y, halfW, chipH, "Batch", batchName);
  drawChip(
    innerX + halfW + gap,
    y,
    halfW,
    chipH,
    "Roll No",
    rollNumber || "—"
  );
  y += chipH + gap;

  drawChip(innerX, y, halfW, chipH, "CNIC", cnicValue);
  drawChip(
    innerX + halfW + gap,
    y,
    halfW,
    chipH,
    "Total Fee",
    formatCurrency(totalFee)
  );
  y += chipH + gap;

  drawChip(innerX, y, halfW, chipH, "Paid Amount", formatCurrency(paidFee));
  drawChip(
    innerX + halfW + gap,
    y,
    halfW,
    chipH,
    "Remaining",
    formatCurrency(pendingAmount)
  );
  y += chipH + gap + 0.5;

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.6);
  doc.roundedRect(innerX, y, innerW, bannerH, 1.2, 1.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.text("OUTSTANDING BALANCE", innerX + 2.5, y + 4);

  doc.setFontSize(11);
  doc.text(formatCurrency(pendingAmount), innerX + 2.5, y + 9.5);
  y += bannerH + 2.5;

  doc.setLineWidth(0.35);
  doc.line(innerX + 3, y, cardX + cardW - pad - 3, y);
  y += 2.5;

  doc.setFontSize(5);
  doc.text("PENDING DUES CONFIRMATION", cardX + cardW / 2, y, {
    align: "center",
  });
  y += 2.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    "Batch transfer blocked until balance is cleared.",
    cardX + cardW / 2,
    y,
    { align: "center", maxWidth: innerW - 4 }
  );
  y += 3;
  drawFeeNonRefundableNote(doc, {
    x: cardX + cardW / 2,
    y,
    align: "center",
    fontSize: 8,
    color: COLORS.black,
  });
  y += 4;

  const signerName =
    String(authorizedBy || "").trim() || "Administration Office";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.black);
  doc.text(signerName, innerX, y);
  y += 1.5;
  doc.line(innerX, y, innerX + 30, y);
  doc.setFontSize(5);
  doc.text("Authorized Signature", innerX, y + 3);

  drawFeeSlipBrandingFooter(doc, frame);

  const fileName = buildFileName(studentName);
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

export const printFeeSlipUrl = async (slipUrl) => {
  const { printFeeSlipFromUrl } = await import("./feeSlipPrint");
  await printFeeSlipFromUrl(slipUrl);
};
