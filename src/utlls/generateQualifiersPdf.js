import jsPDF from "jspdf";
import moment from "moment";
import { ACADEMY_BRANDING } from "./academyBranding";
import { normalizeEducationBackground } from "./qualifierEducation";
import { isQualifierProfileComplete } from "./qualifierProfile";
import { getMediaUrl } from "./useful";

const COLORS = {
  gold: [255, 203, 130],
  goldSoft: [255, 236, 205],
  goldDark: [133, 101, 45],
  navy: [28, 48, 72],
  text: [35, 45, 55],
  muted: [100, 112, 125],
  border: [220, 228, 234],
  rowAlt: [248, 250, 252],
  white: [255, 255, 255],
  green: [37, 121, 71],
  greenSoft: [232, 248, 236],
  orange: [180, 100, 30],
  orangeSoft: [255, 240, 220],
  avatarBg: [230, 235, 240],
  avatarInk: [150, 160, 170],
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read logo file."));
    reader.readAsDataURL(blob);
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

const svgIconToPngDataUrl = async (svgUrl, widthPx = 140) => {
  const res = await fetch(svgUrl);
  if (!res.ok) throw new Error("Could not load LCA logo.");
  const svgText = await res.text();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const svgDataUrl = await blobToDataUrl(svgBlob);

  const img = await loadImage(svgDataUrl);
  const iconFraction = 27 / 138;
  const srcWidth = img.width * iconFraction;
  const scale = widthPx / srcWidth;
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available for logo rendering.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, srcWidth, img.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
};

/** Square JPEG data URL for PDF, or null on failure. */
const toJpegDataUrl = async (source, maxSide = 240) => {
  if (!source) return null;
  try {
    const resolved =
      typeof source === "string"
        ? source.startsWith("data:")
          ? source
          : getMediaUrl(source) || source
        : null;
    if (!resolved) return null;

    const img = await loadImage(resolved);
    const scale = Math.min(
      1,
      maxSide / Math.max(img.width || 1, img.height || 1)
    );
    const w = Math.max(1, Math.round((img.width || 1) * scale));
    const h = Math.max(1, Math.round((img.height || 1) * scale));
    const size = Math.max(w, h);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#f0f2f5";
    ctx.fillRect(0, 0, size, size);
    const dx = Math.round((size - w) / 2);
    const dy = Math.round((size - h) / 2);
    ctx.drawImage(img, dx, dy, w, h);
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return null;
  }
};

const clip = (doc, text, maxWidth) => {
  const value = String(text ?? "");
  if (!value) return "—";
  if (doc.getTextWidth(value) <= maxWidth) return value;
  let clipped = value;
  while (clipped.length > 1 && doc.getTextWidth(`${clipped}…`) > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}…`;
};

const educationSummary = (value) => {
  const entries = normalizeEducationBackground(value);
  if (!entries.length) return "—";
  const first = entries[0];
  return [first.qualification, first.institution].filter(Boolean).join(" · ") || "—";
};

const isUpdated = (qualifier) =>
  typeof qualifier?.profile_updated === "boolean"
    ? qualifier.profile_updated
    : isQualifierProfileComplete(qualifier);

const drawBlankAvatar = (doc, x, y, size) => {
  doc.setFillColor(...COLORS.avatarBg);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, size, size, 1.2, 1.2, "FD");

  // Simple person silhouette
  const cx = x + size / 2;
  const headR = size * 0.16;
  doc.setFillColor(...COLORS.avatarInk);
  doc.circle(cx, y + size * 0.35, headR, "F");
  doc.ellipse(cx, y + size * 0.72, size * 0.28, size * 0.2, "F");
};

const drawPhotoCell = (doc, photoDataUrl, x, y, size) => {
  const pad = 0.8;
  const inner = size - pad * 2;
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, size, size, 1.2, 1.2, "FD");

  if (photoDataUrl) {
    try {
      const format = String(photoDataUrl).startsWith("data:image/png")
        ? "PNG"
        : "JPEG";
      doc.addImage(
        photoDataUrl,
        format,
        x + pad,
        y + pad,
        inner,
        inner,
        undefined,
        "FAST"
      );
      return;
    } catch {
      // fall through to blank avatar
    }
  }
  drawBlankAvatar(doc, x, y, size);
};

/**
 * Branded landscape PDF of qualifier profiles.
 * Updated profiles show photo; others show blank avatar.
 */
export const exportQualifiersPdf = async ({
  qualifiers = [],
  batchName = "",
  profileFilterLabel = "All Profiles",
  classTypeLabel = "All Modes",
} = {}) => {
  const list = Array.isArray(qualifiers) ? qualifiers : [];
  const stamp = moment().format("DD MMM YYYY, hh:mm A");
  const fileStamp = moment().format("DD-MM-YYYY");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  let logoPng = null;
  try {
    logoPng = await svgIconToPngDataUrl(
      ACADEMY_BRANDING.logoSrc || "/logo_dark.svg",
      140
    );
  } catch {
    logoPng = null;
  }

  // Preload photos only for updated profiles that have a photo URL
  const photoById = {};
  await Promise.all(
    list.map(async (qualifier) => {
      const id = String(qualifier?._id || "");
      if (!id) return;
      if (!isUpdated(qualifier)) {
        photoById[id] = null;
        return;
      }
      const photoUrl = String(qualifier?.photo || "").trim();
      if (!photoUrl) {
        photoById[id] = null;
        return;
      }
      photoById[id] = await toJpegDataUrl(photoUrl);
    })
  );

  const updatedCount = list.filter(isUpdated).length;
  const notUpdatedCount = list.length - updatedCount;
  const onlineCount = list.filter((q) => q.class_type === "Online").length;
  const campusCount = list.filter((q) => q.class_type === "On Campus").length;

  const drawHeader = () => {
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 0, pageWidth, 3, "F");

    doc.setFillColor(...COLORS.navy);
    doc.roundedRect(margin, 7, contentWidth, 22, 2.5, 2.5, "F");

    if (logoPng) {
      doc.setFillColor(...COLORS.white);
      doc.roundedRect(margin + 3, 10, 14, 14, 2, 2, "F");
      doc.addImage(logoPng, "PNG", margin + 4.5, 11.5, 11, 11, undefined, "FAST");
    }

    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(ACADEMY_BRANDING.name || "Lahore CSS Academy", margin + 21, 15.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gold);
    doc.text("Qualifier Profiles Report", margin + 21, 21);

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.text(stamp, pageWidth - margin - 3, 15.5, { align: "right" });
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.goldSoft);
    doc.text(
      ACADEMY_BRANDING.phonesLine || "",
      pageWidth - margin - 3,
      21,
      { align: "right" }
    );

    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.6);
    doc.line(margin, 31, pageWidth - margin, 31);
  };

  const drawMeta = (y) => {
    doc.setFillColor(...COLORS.goldSoft);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "F");

    doc.setTextColor(...COLORS.goldDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const batchLabel = batchName || "All Interview Batches";
    doc.text(`Batch: ${batchLabel}`, margin + 3, y + 4.2);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Profile: ${profileFilterLabel}   ·   Mode: ${classTypeLabel}   ·   Records: ${list.length}`,
      margin + 3,
      y + 7.8
    );
    return y + 14;
  };

  const drawStatChip = (x, y, w, label, value, soft, ink) => {
    doc.setFillColor(...soft);
    doc.roundedRect(x, y, w, 12, 1.5, 1.5, "F");
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(String(value), x + 3, y + 5.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(label, x + 3, y + 9.2);
  };

  const drawStats = (y) => {
    const gap = 3;
    const chipW = (contentWidth - gap * 3) / 4;
    drawStatChip(margin, y, chipW, "Total Qualifiers", list.length, COLORS.rowAlt, COLORS.navy);
    drawStatChip(
      margin + chipW + gap,
      y,
      chipW,
      "Profile Updated",
      updatedCount,
      COLORS.greenSoft,
      COLORS.green
    );
    drawStatChip(
      margin + (chipW + gap) * 2,
      y,
      chipW,
      "Not Updated",
      notUpdatedCount,
      COLORS.orangeSoft,
      COLORS.orange
    );
    drawStatChip(
      margin + (chipW + gap) * 3,
      y,
      chipW,
      `Online ${onlineCount} / Campus ${campusCount}`,
      `${onlineCount + campusCount}`,
      COLORS.goldSoft,
      COLORS.goldDark
    );
    return y + 16;
  };

  const photoSize = 11;
  const columns = [
    { key: "no", label: "#", w: 7 },
    { key: "photo", label: "Photo", w: 14 },
    { key: "name", label: "Name", w: 34 },
    { key: "roll", label: "CSS/PMS Roll", w: 22 },
    { key: "phone", label: "Phone", w: 22 },
    { key: "mode", label: "Mode", w: 18 },
    { key: "city", label: "City", w: 20 },
    { key: "batch", label: "Batch", w: 30 },
    { key: "profile", label: "Profile", w: 20 },
    { key: "education", label: "Education", w: 40 },
  ];
  const totalW = columns.reduce((s, c) => s + c.w, 0);
  columns.forEach((c) => {
    c.w = (c.w / totalW) * contentWidth;
  });

  const rowH = 14;
  const headerH = 8;

  const drawTableHeader = (y) => {
    doc.setFillColor(...COLORS.navy);
    doc.roundedRect(margin, y, contentWidth, headerH, 1.2, 1.2, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    let x = margin;
    columns.forEach((col) => {
      doc.text(col.label, x + 1.5, y + 5.2);
      x += col.w;
    });
    return y + headerH + 1;
  };

  const drawFooter = (pageNum, totalPages) => {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      ACADEMY_BRANDING.address || "Lahore CSS Academy",
      margin,
      pageHeight - 6
    );
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: "right" }
    );
  };

  drawHeader();
  let y = drawMeta(34);
  y = drawStats(y);
  y = drawTableHeader(y);

  const bottomLimit = pageHeight - 14;

  list.forEach((qualifier, index) => {
    if (y + rowH > bottomLimit) {
      doc.addPage();
      drawHeader();
      y = 36;
      y = drawTableHeader(y);
    }

    const profileUpdated = isUpdated(qualifier);
    const id = String(qualifier?._id || "");
    const photoDataUrl = profileUpdated ? photoById[id] || null : null;

    const values = {
      no: String(index + 1),
      name: qualifier.name || "—",
      roll: qualifier.css_pms_roll_no || "—",
      phone: qualifier.phone || "—",
      mode: qualifier.class_type || "—",
      city: qualifier.city || "—",
      batch: qualifier.batch?.name || "—",
      profile: profileUpdated ? "Updated" : "Not Updated",
      education: educationSummary(qualifier.education_background),
    };

    if (index % 2 === 1) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(margin, y, contentWidth, rowH, "F");
    }

    if (profileUpdated) {
      doc.setFillColor(...COLORS.green);
      doc.rect(margin, y, 1.2, rowH, "F");
    } else {
      doc.setFillColor(...COLORS.orange);
      doc.rect(margin, y, 1.2, rowH, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.text);

    let x = margin;
    columns.forEach((col) => {
      if (col.key === "photo") {
        const photoX = x + (col.w - photoSize) / 2;
        const photoY = y + (rowH - photoSize) / 2;
        drawPhotoCell(doc, photoDataUrl, photoX, photoY, photoSize);
      } else {
        const text = clip(doc, values[col.key], col.w - 3);
        if (col.key === "profile") {
          doc.setTextColor(...(profileUpdated ? COLORS.green : COLORS.orange));
          doc.setFont("helvetica", "bold");
        } else if (col.key === "name") {
          doc.setTextColor(...COLORS.navy);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(...COLORS.text);
          doc.setFont("helvetica", "normal");
        }
        doc.text(text, x + 1.8, y + rowH / 2 + 1.2);
      }
      x += col.w;
    });

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

    y += rowH;
  });

  if (list.length === 0) {
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      "No qualifier profiles found for the selected filters.",
      pageWidth / 2,
      y + 20,
      { align: "center" }
    );
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    drawFooter(p, totalPages);
  }

  const batchPart = batchName
    ? `_${String(batchName).replace(/[^\w-]+/g, "_").slice(0, 40)}`
    : "";
  const fileName = `LCA_Qualifier_Profiles${batchPart}_${fileStamp}.pdf`;
  doc.save(fileName);
  return fileName;
};
