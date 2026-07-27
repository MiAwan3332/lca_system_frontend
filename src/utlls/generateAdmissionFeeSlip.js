import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [245, 185, 66],
  goldSoft: [255, 230, 168],
  goldDark: [122, 90, 34],
  ink: [20, 24, 32],
  muted: [92, 101, 112],
  dark: [15, 17, 21],
  darkMid: [28, 31, 38],
  cream: [255, 249, 239],
  creamBorder: [240, 224, 184],
  white: [255, 255, 255],
  green: [56, 161, 105],
  orange: [221, 107, 32],
  gray: [113, 128, 150],
  grayLight: [247, 250, 252],
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

/** Normalize File/Blob/data-URL to JPEG so jsPDF can embed camera/uploads reliably. */
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

const getPaymentLabel = (paymentOption) => {
  if (paymentOption === "full") return "Full Payment";
  if (paymentOption === "partial") return "Partial Payment";
  return "Pay Later";
};

/**
 * Admission fee slip using the Student Card visual template.
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
    paymentStatus = "Unpaid",
    paymentOption = "later",
    paymentMethod = "N/A",
    photoFile = null,
    authorizedBy = "",
  } = data || {};

  if (!name?.trim()) {
    throw new Error("Student name is required to print the fee slip.");
  }

  if (!batchName) {
    throw new Error("Please select a batch to print the fee slip.");
  }

  const [photoDataUrl, logoPng] = await Promise.all([
    toJpegDataUrl(photoFile),
    svgUrlToPngDataUrl("/logo_dark.svg", 160, { iconOnly: true }),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Card proportions matching student ID template (centered on A4)
  const cardW = 95;
  const cardH = 172;
  const cardX = (pageWidth - cardW) / 2;
  const cardY = 16;
  const pad = 5;
  const innerX = cardX + pad;
  const innerW = cardW - pad * 2;

  const paymentLabel = getPaymentLabel(paymentOption);
  const cnicValue = String(cnic || "").trim() || "N/A";
  const issuedAt = moment().format("DD MMM YYYY, hh:mm A");

  // Card shadow / outer frame
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(cardX + 1.2, cardY + 1.5, cardW, cardH, 5, 5, "F");

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, "FD");

  // Inner gold frame
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.35);
  doc.setLineDashPattern([0.8, 0.6], 0);
  doc.roundedRect(cardX + 2, cardY + 2, cardW - 4, cardH - 4, 3.5, 3.5, "S");
  doc.setLineDashPattern([], 0);

  // ===== Dark header =====
  const headerH = 36;
  doc.setFillColor(...COLORS.dark);
  doc.roundedRect(cardX, cardY, cardW, headerH + 4, 5, 5, "F");
  doc.rect(cardX, cardY + headerH - 2, cardW, 8, "F");

  // LCA logo (left) + titles
  const logoBox = 11;
  const logoBoxX = innerX;
  const logoBoxY = cardY + 5;
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(logoBoxX, logoBoxY, logoBox, logoBox, 2, 2, "F");

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
      doc.setTextColor(...COLORS.ink);
      doc.text("LCA", logoBoxX + logoBox / 2, logoBoxY + 6.8, {
        align: "center",
      });
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.ink);
    doc.text("LCA", logoBoxX + logoBox / 2, logoBoxY + 6.8, {
      align: "center",
    });
  }

  const titleX = logoBoxX + logoBox + 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gold);
  doc.text("Lahore CSS Academy", titleX, cardY + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.text("Admission Slip", titleX, cardY + 15.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(154, 163, 178);
  doc.text(`Issued: ${issuedAt}`, titleX, cardY + 21);

  // ===== Photo + identity =====
  const photoW = 24;
  const photoH = 29;
  const photoX = innerX;
  const photoY = cardY + headerH - 4;

  // Gold photo frame
  doc.setFillColor(...COLORS.gold);
  doc.roundedRect(photoX - 0.8, photoY - 0.8, photoW + 1.6, photoH + 1.6, 2.5, 2.5, "F");
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, "F");

  if (photoDataUrl) {
    try {
      const format = String(photoDataUrl).startsWith("data:image/png")
        ? "PNG"
        : "JPEG";
      doc.addImage(photoDataUrl, format, photoX, photoY, photoW, photoH);
    } catch {
      doc.setFillColor(...COLORS.grayLight);
      doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(...COLORS.gray);
      doc.text("Photo", photoX + photoW / 2, photoY + photoH / 2, {
        align: "center",
      });
    }
  } else {
    doc.setFillColor(...COLORS.grayLight);
    doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(...COLORS.gray);
    doc.text("No Photo", photoX + photoW / 2, photoY + photoH / 2 - 1.5, {
      align: "center",
    });
    doc.text("Captured", photoX + photoW / 2, photoY + photoH / 2 + 2, {
      align: "center",
    });
  }

  // Name + status
  const infoX = photoX + photoW + 4;
  const infoMaxW = cardX + cardW - pad - infoX;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.ink);
  const nameLines = doc.splitTextToSize(String(name), infoMaxW);
  doc.text(nameLines.slice(0, 2), infoX, photoY + 6);

  // Status pill (dark)
  const statusY = photoY + 6 + nameLines.slice(0, 2).length * 3.5 + 2;
  doc.setFillColor(...COLORS.darkMid);
  const statusLabel = String(paymentStatus || "Unpaid").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  const statusTextW = doc.getTextWidth(statusLabel) + 6;
  doc.roundedRect(infoX, statusY, Math.min(statusTextW, infoMaxW), 5.5, 2.5, 2.5, "F");
  doc.setFillColor(...COLORS.gold);
  doc.circle(infoX + 2.5, statusY + 2.75, 0.9, "F");
  doc.setTextColor(...COLORS.gold);
  doc.text(statusLabel, infoX + 5, statusY + 3.7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Phone: ${phone || "N/A"}`, infoX, statusY + 10);

  // ===== Cream detail chips =====
  let y = Math.max(photoY + photoH + 4, statusY + 14);

  const drawChip = (x, chipY, w, h, label, value, valueColor = COLORS.ink) => {
    doc.setFillColor(...COLORS.cream);
    doc.setDrawColor(...COLORS.creamBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, chipY, w, h, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...COLORS.goldDark);
    doc.text(String(label).toUpperCase(), x + 2.5, chipY + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...valueColor);
    const lines = doc.splitTextToSize(String(value || "N/A"), w - 5);
    doc.text(lines[0], x + 2.5, chipY + 8.5);
  };

  const chipH = 12;
  const gap = 2.5;
  const halfW = (innerW - gap) / 2;

  drawChip(innerX, y, halfW, chipH, "Batch", batchName);
  drawChip(innerX + halfW + gap, y, halfW, chipH, "CNIC", cnicValue);
  y += chipH + gap;

  drawChip(innerX, y, halfW, chipH, "Payment Type", paymentLabel);
  drawChip(
    innerX + halfW + gap,
    y,
    halfW,
    chipH,
    "Method",
    payingNow > 0 ? paymentMethod : "N/A"
  );
  y += chipH + gap + 1;

  // Fee chips
  drawChip(innerX, y, halfW, chipH, "Total Fee", formatCurrency(batchFee));
  drawChip(
    innerX + halfW + gap,
    y,
    halfW,
    chipH,
    "Remaining",
    formatCurrency(remainingFee),
    remainingFee > 0 ? COLORS.orange : COLORS.green
  );
  y += chipH + gap + 2;

  // Amount received banner
  const bannerH = 16;
  doc.setFillColor(...COLORS.cream);
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.55);
  doc.roundedRect(innerX, y, innerW, bannerH, 2.5, 2.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("AMOUNT RECEIVED", innerX + 3, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.ink);
  doc.text(formatCurrency(payingNow), innerX + 3, y + 12.5);

  y += bannerH + 4;

  // Divider
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.35);
  doc.line(innerX + 8, y, cardX + cardW - pad - 8, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.muted);
  doc.text("AUTHENTICATED ADMISSION RECEIPT", cardX + cardW / 2, y, {
    align: "center",
  });
  y += 4;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(4.5);
  doc.setTextColor(...COLORS.gray);
  const note =
    "Provisional slip. Final records are created after Add Student.";
  const noteLines = doc.splitTextToSize(note, innerW - 4);
  doc.text(noteLines, cardX + cardW / 2, y, { align: "center" });
  y += noteLines.length * 2.2 + 5;

  // Signature — show logged-in user name by default
  const signerName = String(authorizedBy || "").trim() || "Administration Office";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.ink);
  doc.text(signerName, innerX, y);
  y += 2;
  doc.setDrawColor(...COLORS.ink);
  doc.setLineWidth(0.35);
  doc.line(innerX, y, innerX + 32, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(...COLORS.ink);
  doc.text("Authorized Signature", innerX, y + 3.5);

  // ===== Gold footer =====
  const footerH = 10;
  const footerY = cardY + cardH - footerH;
  doc.setFillColor(...COLORS.gold);
  doc.rect(cardX, footerY - 2, cardW, 4, "F");
  doc.roundedRect(cardX, footerY - 2, cardW, footerH + 2, 5, 5, "F");
  doc.rect(cardX, footerY - 2, cardW, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.ink);
  doc.text("0331-000-111-0  ·  0333-9800938", cardX + cardW / 2, footerY + 4.5, {
    align: "center",
  });

  // Page footer outside card
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    "Lahore CSS Academy  ·  Admission Fee Slip",
    pageWidth / 2,
    pageHeight - 10,
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
