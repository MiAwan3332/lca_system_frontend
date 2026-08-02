import jsPDF from "jspdf";
import moment from "moment";

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

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const cardW = 100;
  const cardH = 186;
  const cardX = (pageWidth - cardW) / 2;
  const cardY = 14;
  const pad = 5;
  const innerX = cardX + pad;
  const innerW = cardW - pad * 2;

  const cnicValue = String(cnic || "").trim() || "N/A";
  const issuedAt = moment().format("DD MMM YYYY, hh:mm A");

  // Outer card — white with strong black border
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.9);
  doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, "FD");

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.35);
  doc.roundedRect(cardX + 2, cardY + 2, cardW - 4, cardH - 4, 2, 2, "S");

  // ===== Header (black bar, white text) =====
  const headerH = 22;
  doc.setFillColor(...COLORS.black);
  doc.rect(cardX, cardY, cardW, headerH, "F");
  doc.rect(cardX, cardY, cardW, 4, "F");

  const logoBox = 12;
  const logoBoxX = innerX;
  const logoBoxY = cardY + 5;
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.white);
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
  doc.text("PENDING FEE SLIP", titleX, cardY + 16);

  // ===== Photo + student name =====
  let y = cardY + headerH + 5;

  const photoW = 26;
  const photoH = 32;
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
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.black);
  doc.text("STUDENT NAME", infoX, photoY + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  const nameLines = doc.splitTextToSize(studentName, infoMaxW);
  doc.text(nameLines.slice(0, 3), infoX, photoY + 10);

  const afterNameY =
    photoY + 10 + Math.min(nameLines.length, 3) * 4.2 + 2;

  const statusLabel = "PENDING";
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
  doc.text(`Phone: ${phone || "N/A"}`, infoX, afterNameY + 11);

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
  y += chipH + gap + 1;

  // Outstanding balance — bold black box (same as Amount Received on admission)
  const bannerH = 15;
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.7);
  doc.roundedRect(innerX, y, innerW, bannerH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.black);
  doc.text("OUTSTANDING BALANCE", innerX + 3, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.black);
  doc.text(formatCurrency(pendingAmount), innerX + 3, y + 12);
  y += bannerH + 5;

  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.4);
  doc.line(innerX + 4, y, cardX + cardW - pad - 4, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.black);
  doc.text("PENDING DUES CONFIRMATION", cardX + cardW / 2, y, {
    align: "center",
  });
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.muted);
  const note =
    "Outstanding dues confirmed. Batch transfer is blocked until this balance is fully cleared.";
  const noteLines = doc.splitTextToSize(note, innerW - 4);
  doc.text(noteLines, cardX + cardW / 2, y, { align: "center" });
  y += noteLines.length * 2.4 + 5;

  const signerName =
    String(authorizedBy || "").trim() || "Administration Office";
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

  // Footer bar — black with white text
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
    "Lahore CSS Academy  ·  Pending Fee Slip",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

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
