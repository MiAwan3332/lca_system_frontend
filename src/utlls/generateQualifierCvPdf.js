import jsPDF from "jspdf";
import moment from "moment";
import { ACADEMY_BRANDING } from "./academyBranding";
import { normalizeEducationBackground } from "./qualifierEducation";
import { getMediaUrl } from "./useful";
import { loadExportLogo } from "./exportPdfHeader";

const COLORS = {
  navy: [22, 42, 64],
  ink: [28, 36, 44],
  muted: [96, 110, 124],
  line: [214, 222, 230],
  soft: [246, 248, 251],
  gold: [196, 149, 74],
  white: [255, 255, 255],
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const toJpegDataUrl = async (source, maxSide = 360) => {
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
    ctx.fillStyle = "#eef2f6";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return null;
  }
};

const textOrDash = (value) => {
  const text = String(value ?? "").trim();
  return text || "—";
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

/**
 * Single-page professional CV-style PDF for a qualifier profile.
 * Content is compacted so the document never exceeds one A4 page.
 */
export const generateQualifierCvPdf = async (
  qualifier,
  { mode = "download" } = {}
) => {
  if (!qualifier) {
    throw new Error("Qualifier profile is required");
  }

  try {
    const { requireOutput } = await import("./accessCapabilities");
    requireOutput("qualifiers", "print");
  } catch {
    // Details view already authorizes the user; still allow print/download.
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const issuedOn = moment().format("DD MMMM YYYY");
  const fileStamp = moment().format("YYYYMMDD");
  const name = textOrDash(qualifier.name);
  const safeName = name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  const fileName = `Qualifier-CV-${safeName}-${fileStamp}.pdf`;
  const documentTitle = "Official Candidate Curriculum Vitae";
  const documentIssued = `Issued on ${issuedOn}`;
  const documentPurpose = "For interview assessment use";

  const footerTop = pageHeight - 11;
  const remarksTitleH = 8;
  const remarksMinBoxH = 26;
  const remarksGap = 2.5;
  const contentBottom = footerTop - (remarksTitleH + 2 + remarksMinBoxH + 2);

  const [logo, photo] = await Promise.all([
    loadExportLogo(),
    toJpegDataUrl(qualifier.photo),
  ]);

  const education = normalizeEducationBackground(
    qualifier.education_background
  ).slice(0, 2);
  const subjects = Array.isArray(qualifier.optional_subjects)
    ? qualifier.optional_subjects.filter(Boolean)
    : [];

  // Header with LCA logo + title + candidate photo
  const headerH = 46;
  const accentH = 1.4;
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, headerH, "F");
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, headerH, pageWidth, accentH, "F");

  // Candidate photo (right)
  const photoSize = 38;
  const photoX = pageWidth - margin - photoSize;
  const photoY = (headerH - photoSize) / 2;
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(
    photoX - 1.1,
    photoY - 1.1,
    photoSize + 2.2,
    photoSize + 2.2,
    1.6,
    1.6,
    "F"
  );
  if (photo) {
    try {
      doc.addImage(photo, "JPEG", photoX, photoY, photoSize, photoSize);
    } catch {
      doc.setFillColor(...COLORS.soft);
      doc.roundedRect(photoX, photoY, photoSize, photoSize, 1.3, 1.3, "F");
    }
  } else {
    doc.setFillColor(...COLORS.soft);
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 1.3, 1.3, "F");
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(8);
    doc.text("No Photo", photoX + photoSize / 2, photoY + photoSize / 2 + 1, {
      align: "center",
    });
  }

  // LCA logo (left) — wide academy mark for dark backgrounds
  let textX = margin;
  const logoMaxW = 40;
  const logoAspect = 138 / 37;
  const logoW = logoMaxW;
  const logoH = logoW / logoAspect;
  if (logo) {
    try {
      const logoY = (headerH - logoH) / 2;
      doc.addImage(logo, "PNG", margin, logoY, logoW, logoH, undefined, "FAST");
      textX = margin + logoW + 4;
      doc.setDrawColor(70, 90, 110);
      doc.setLineWidth(0.35);
      doc.line(textX, 10, textX, headerH - 10);
      textX += 4;
    } catch {
      textX = margin;
    }
  }

  const titleMaxW = photoX - textX - 6;
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    clip(doc, ACADEMY_BRANDING.name.toUpperCase(), titleMaxW),
    textX,
    15
  );
  doc.setFontSize(10.5);
  doc.setTextColor(255, 214, 160);
  doc.text(clip(doc, documentTitle, titleMaxW), textX, 23);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(186, 198, 210);
  doc.text(documentIssued, textX, 31);
  doc.setFontSize(9.5);
  doc.setTextColor(186, 198, 210);
  doc.text(documentPurpose, textX, 38.5);

  let y = headerH + accentH + 7;

  // Name block
  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(clip(doc, name, contentWidth - 28), margin, y);
  y += 6.5;

  const subtitleParts = [
    qualifier.exam_type,
    qualifier.class_type,
    qualifier.batch?.name,
  ].filter(Boolean);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    clip(doc, subtitleParts.join("  ·  ") || "Interview Qualifier", contentWidth),
    margin,
    y
  );
  y += 5;

  const isActive = qualifier.is_active !== false;
  doc.setFillColor(...(isActive ? [232, 248, 236] : [240, 242, 245]));
  doc.roundedRect(margin, y, 22, 5.8, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...(isActive ? [37, 121, 71] : [96, 110, 124]));
  doc.text(isActive ? "Active" : "Inactive", margin + 11, y + 3.9, {
    align: "center",
  });
  y += 9.5;

  const drawSectionTitle = (title) => {
    if (y + 9 > contentBottom) return false;
    doc.setFillColor(...COLORS.soft);
    doc.roundedRect(margin, y, contentWidth, 7.2, 1, 1, "F");
    doc.setFillColor(...COLORS.gold);
    doc.rect(margin, y, 1.4, 7.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLORS.navy);
    doc.text(title.toUpperCase(), margin + 4, y + 4.9);
    y += 10;
    return true;
  };

  const drawKvGrid = (rows) => {
    const colGap = 5;
    const colWidth = (contentWidth - colGap) / 2;
    for (let i = 0; i < rows.length; i += 2) {
      if (y + 10 > contentBottom) return;
      const left = rows[i];
      const right = rows[i + 1];
      const drawCell = (item, x) => {
        if (!item) return;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.muted);
        doc.text(item.label, x, y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(...COLORS.ink);
        doc.text(clip(doc, textOrDash(item.value), colWidth - 1), x, y + 4.5);
      };
      drawCell(left, margin);
      drawCell(right, margin + colWidth + colGap);
      y += 10.5;
    }
  };

  if (drawSectionTitle("Personal Information")) {
    drawKvGrid([
      { label: "Phone", value: qualifier.phone },
      { label: "Email", value: qualifier.email },
      { label: "CNIC", value: qualifier.cnic },
      { label: "City", value: qualifier.city },
      { label: "Province", value: qualifier.province },
      { label: "Father Name", value: qualifier.father_name },
      { label: "Father Phone", value: qualifier.father_phone },
      { label: "Interview Batch", value: qualifier.batch?.name },
    ]);
  }

  if (drawSectionTitle("Exam Profile")) {
    drawKvGrid([
      { label: "CSS / PMS", value: qualifier.exam_type },
      { label: "CSS/PMS Roll No", value: qualifier.css_pms_roll_no },
      { label: "Mode", value: qualifier.class_type },
      {
        label: "No. of Attempts",
        value:
          qualifier.no_of_attempts != null
            ? String(qualifier.no_of_attempts)
            : "0",
      },
      { label: "Latest Degree", value: qualifier.latest_degree },
    ]);
  }

  if (drawSectionTitle("Optional Subjects")) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    if (subjects.length) {
      doc.setTextColor(...COLORS.ink);
      const lines = doc
        .splitTextToSize(subjects.join("  ·  "), contentWidth)
        .slice(0, 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    } else {
      doc.setTextColor(...COLORS.muted);
      doc.text("No optional subjects listed", margin, y);
      y += 7;
    }
  }

  if (drawSectionTitle("Education")) {
    if (!education.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.muted);
      doc.text("No education details recorded", margin, y);
      y += 7;
    } else {
      for (const entry of education) {
        if (y + 14 > contentBottom) break;
        const meta = [
          entry.board_or_university,
          entry.year,
          entry.grade ? `Grade: ${entry.grade}` : "",
        ]
          .filter(Boolean)
          .join("  ·  ");
        doc.setDrawColor(...COLORS.line);
        doc.setLineWidth(0.25);
        doc.roundedRect(margin, y, contentWidth, 13, 1.1, 1.1, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(...COLORS.navy);
        doc.text(
          clip(doc, textOrDash(entry.qualification), contentWidth - 8),
          margin + 3,
          y + 5
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...COLORS.ink);
        doc.text(
          clip(
            doc,
            [textOrDash(entry.institution), meta].filter(Boolean).join("  ·  "),
            contentWidth - 8
          ),
          margin + 3,
          y + 10
        );
        y += 15;
      }
    }
  }

  // Interviewer remarks — placed tightly under Education on the same page
  const remarksTitleY = Math.min(y + remarksGap, footerTop - remarksTitleH - remarksMinBoxH - 4);
  const remarksTop = remarksTitleY + remarksTitleH + 1;
  const remarksBoxH = Math.max(remarksMinBoxH, footerTop - remarksTop - 2);

  doc.setFillColor(...COLORS.soft);
  doc.roundedRect(margin, remarksTitleY, contentWidth, remarksTitleH, 1, 1, "F");
  doc.setFillColor(...COLORS.gold);
  doc.rect(margin, remarksTitleY, 1.2, remarksTitleH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.navy);
  doc.text("INTERVIEWER REMARKS", margin + 4, remarksTitleY + 4.8);

  doc.setDrawColor(...COLORS.line);
  doc.setFillColor(...COLORS.white);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, remarksTop, contentWidth, remarksBoxH, 1.4, 1.4, "FD");

  doc.setDrawColor(230, 235, 240);
  doc.setLineWidth(0.2);
  for (
    let lineY = remarksTop + 10;
    lineY <= remarksTop + remarksBoxH - 5;
    lineY += 7
  ) {
    doc.line(margin + 3.5, lineY, pageWidth - margin - 3.5, lineY);
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    "Interviewer observations, assessment notes, and recommendations.",
    margin + 3.5,
    remarksTop + 6
  );

  // Footer (single page only)
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(margin, footerTop, pageWidth - margin, footerTop);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    `${ACADEMY_BRANDING.name}  ·  ${ACADEMY_BRANDING.phonesLine}`,
    margin,
    pageHeight - 6
  );
  doc.text("Single-page confidential profile", pageWidth - margin, pageHeight - 6, {
    align: "right",
  });

  if (mode === "print") {
    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl, "_blank");
    if (!printWindow) {
      throw new Error("Pop-up blocked. Allow pop-ups to print the CV.");
    }
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // user can print manually from the opened tab
      }
    }, 500);
    return { fileName, mode: "print" };
  }

  doc.save(fileName);
  return { fileName, mode: "download" };
};

export default generateQualifierCvPdf;
