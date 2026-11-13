import jsPDF from "jspdf";
import moment from "moment";
import { ACADEMY_BRANDING } from "./academyBranding";
import { getMediaUrl } from "./useful";
import { drawExportHeader, loadExportLogo } from "./exportPdfHeader";

const COLORS = {
  navy: [22, 42, 64],
  ink: [28, 36, 44],
  muted: [90, 104, 118],
  border: [55, 70, 88],
  labelBg: [232, 240, 248],
  labelInk: [30, 58, 95],
  valueBg: [255, 255, 255],
  optionalsBg: [214, 232, 245],
  optionalsAlt: [245, 249, 252],
  white: [255, 255, 255],
  softLine: [198, 210, 222],
  footer: [20, 20, 20],
  accent: [255, 203, 130],
  filterBg: [248, 250, 252],
  filterBorder: [226, 232, 240],
  filterInk: [45, 55, 72],
  filterLabel: [113, 128, 150],
  photoBg: [236, 241, 246],
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

const toJpegDataUrl = async (source, maxSide = 420) => {
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
 * Build professional portrait PDF of qualifier profiles.
 * Card template: details left, large photo right.
 * @param {"preview"|"download"|"print"} mode
 * @returns {Promise<{ fileName: string, blob?: Blob, blobUrl?: string, mode: string }>}
 */
export const generateQualifiersPdf = async ({
  qualifiers = [],
  batchName = "",
  profileFilterLabel = "All Profiles",
  classTypeLabel = "All Modes",
  statusFilterLabel = "All Status",
  examTypeLabel = "All CSS/PMS",
  totalCount = null,
  mode = "download",
} = {}) => {
  const { requireOutput } = await import("./accessCapabilities");
  requireOutput("qualifiers", "export");

  const list = Array.isArray(qualifiers) ? qualifiers : [];
  const stamp = moment().format("DD MMMM YYYY, hh:mm A");
  const fileStamp = moment().format("DD-MM-YYYY");
  const matchedTotal =
    totalCount != null && Number.isFinite(Number(totalCount))
      ? Number(totalCount)
      : list.length;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const footerH = 12;
  const cardsPerPage = 3;
  const headerH = 20;
  const topGap = 4;
  const cardGap = 3.5;
  // Content pages: header only (filters appear once on the title page)
  const usableH = pageHeight - footerH - headerH - topGap - margin - 2;
  const cardH = (usableH - cardGap * (cardsPerPage - 1)) / cardsPerPage;
  const cardsStartY = headerH + topGap;

  const batchLabel = batchName || "All interview batches";
  const filterRows = [
    { label: "Interview Batch", value: batchLabel },
    { label: "Profile", value: profileFilterLabel },
    { label: "Mode", value: classTypeLabel },
    { label: "Status", value: statusFilterLabel },
    { label: "CSS / PMS", value: examTypeLabel },
  ];

  const [logo, ...photos] = await Promise.all([
    loadExportLogo(700),
    ...list.map((qualifier) => toJpegDataUrl(qualifier?.photo)),
  ]);
  const photoById = {};
  list.forEach((qualifier, index) => {
    const id = String(qualifier?._id || index);
    photoById[id] = photos[index] || null;
  });

  const drawFooter = (pageNum, totalPages) => {
    doc.setFillColor(...COLORS.footer);
    doc.rect(0, pageHeight - footerH, pageWidth, footerH, "F");
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, pageHeight - footerH, pageWidth, 0.7, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      `${ACADEMY_BRANDING.phonesLine}   ·   ${ACADEMY_BRANDING.address}`,
      pageWidth / 2,
      pageHeight - 4.8,
      { align: "center" }
    );
    doc.setFontSize(6.5);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 4.8, {
      align: "right",
    });
    doc.text(`Generated ${stamp}`, margin, pageHeight - 4.8);
  };

  const drawTopHeader = ({ subtitle, details }) => {
    drawExportHeader(doc, {
      logo,
      margin,
      height: headerH,
      title: "Qualifier Profiles",
      subtitle,
      details,
    });
  };

  /** Page 1 — title + applied filters (printed once only) */
  const drawTitlePage = (totalPages) => {
    drawTopHeader({
      subtitle: `${ACADEMY_BRANDING.name}  ·  Interview assessment list`,
      details: [
        { label: "Total", value: String(matchedTotal) },
        { label: "Cards", value: String(list.length) },
        { label: "Generated", value: moment().format("DD MMM YYYY, hh:mm A") },
      ],
    });

    let y = headerH + 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...COLORS.navy);
    doc.text("Qualifier Profile Report", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.muted);
    doc.text("Interview assessment export", pageWidth / 2, y, { align: "center" });
    y += 6;

    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(1.1);
    doc.line(pageWidth / 2 - 28, y, pageWidth / 2 + 28, y);
    y += 14;

    // Summary totals
    const summaryCards = [
      { label: "Total Profiles", value: String(matchedTotal) },
      { label: "In This Export", value: String(list.length) },
      { label: "Pages", value: String(Math.max(totalPages, 1)) },
    ];
    const summaryGap = 4;
    const summaryW = (contentWidth - summaryGap * (summaryCards.length - 1)) / summaryCards.length;
    summaryCards.forEach((card, i) => {
      const x = margin + i * (summaryW + summaryGap);
      doc.setFillColor(...COLORS.filterBg);
      doc.setDrawColor(...COLORS.filterBorder);
      doc.setLineWidth(0.35);
      doc.roundedRect(x, y, summaryW, 22, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.filterLabel);
      doc.text(card.label.toUpperCase(), x + summaryW / 2, y + 7.5, {
        align: "center",
      });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...COLORS.navy);
      doc.text(card.value, x + summaryW / 2, y + 16.5, { align: "center" });
    });
    y += 34;

    // Applied filters — once only on title page
    const filtersBoxH = 14 + filterRows.length * 9 + 4;
    doc.setFillColor(...COLORS.filterBg);
    doc.setDrawColor(...COLORS.filterBorder);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, filtersBoxH, 2.2, 2.2, "FD");
    doc.setFillColor(...COLORS.accent);
    doc.rect(margin, y, 2.2, filtersBoxH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.navy);
    doc.text("APPLIED FILTERS", margin + 8, y + 9);

    doc.setDrawColor(...COLORS.filterBorder);
    doc.setLineWidth(0.25);
    doc.line(margin + 8, y + 12, margin + contentWidth - 8, y + 12);

    filterRows.forEach((row, i) => {
      const rowY = y + 18 + i * 9;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.filterLabel);
      doc.text(row.label, margin + 10, rowY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.filterInk);
      doc.text(
        clip(doc, row.value, contentWidth - 80),
        margin + contentWidth - 10,
        rowY,
        { align: "right" }
      );
      if (i < filterRows.length - 1) {
        doc.setDrawColor(...COLORS.softLine);
        doc.setLineWidth(0.2);
        doc.line(margin + 10, rowY + 3.5, margin + contentWidth - 10, rowY + 3.5);
      }
    });
    y += filtersBoxH + 16;

    if (list.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(
        "Profile cards begin on the next page.",
        pageWidth / 2,
        y,
        { align: "center" }
      );
      y += 6;
      doc.setFontSize(8.5);
      doc.text(
        "Each card shows candidate details, optional subjects, and photo.",
        pageWidth / 2,
        y,
        { align: "center" }
      );
    }

    drawFooter(1, totalPages);
  };

  /** Content pages — top header only (no applied filters) */
  const drawContentHeader = (pageNum, totalPages) => {
    drawTopHeader({
      subtitle: `${ACADEMY_BRANDING.name}  ·  Profile cards`,
      details: [
        { label: "Total", value: String(matchedTotal) },
        { label: "Generated", value: moment().format("DD MMM YYYY, hh:mm A") },
      ],
    });
    drawFooter(pageNum, totalPages);
  };

  const drawPairCell = (x, y, labelW, valueW, rowH, label, value, zebra) => {
    doc.setFillColor(...(zebra ? COLORS.labelBg : [238, 244, 250]));
    doc.rect(x, y, labelW, rowH, "F");
    doc.setFillColor(...COLORS.valueBg);
    doc.rect(x + labelW, y, valueW, rowH, "F");
    doc.setDrawColor(...COLORS.softLine);
    doc.setLineWidth(0.25);
    doc.rect(x, y, labelW, rowH, "S");
    doc.rect(x + labelW, y, valueW, rowH, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.labelInk);
    doc.text(clip(doc, label, labelW - 3), x + 1.6, y + rowH / 2 + 1);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.ink);
    doc.text(
      clip(doc, textOrDash(value), valueW - 3.2),
      x + labelW + 1.8,
      y + rowH / 2 + 1.05
    );
  };

  const drawCard = (qualifier, index, cardY) => {
    const id = String(qualifier?._id || index);
    const photo = photoById[id];
    const subjects = Array.isArray(qualifier?.optional_subjects)
      ? qualifier.optional_subjects
          .map((s) => String(s ?? "").trim())
          .filter(Boolean)
      : [];

    const pad = 2.8;
    const gap = 2.2;
    const photoW = 42;
    const detailsW = contentWidth - photoW - pad * 2 - gap;
    const optionalsTitleH = 6.2;
    const optionalsGap = 2.2;
    const subjectPadX = 2.5;
    const subjectPadY = 2;
    const subjectLineH = 4.2;
    const optionalsW = contentWidth - pad * 2;

    const fieldPairs = [
      ["Sr. No", String(index + 1), "Name", qualifier?.name],
      [
        "Roll No",
        qualifier?.css_pms_roll_no,
        "CNIC",
        qualifier?.cnic,
      ],
      [
        "City / Province",
        [qualifier?.city, qualifier?.province].filter(Boolean).join(" / "),
        "Mobile No.",
        qualifier?.phone,
      ],
      [
        "Degree",
        qualifier?.latest_degree,
        "CSS / PMS",
        qualifier?.exam_type,
      ],
      [
        "Mode",
        qualifier?.class_type,
        "Batch",
        qualifier?.batch?.name || batchName,
      ],
    ];

    // 2 columns only when names fit; otherwise single column to avoid overlap
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.6);
    const longestSubjectW = subjects.reduce((max, subject, i) => {
      const w = doc.getTextWidth(`${i + 1}.  ${subject}`);
      return Math.max(max, w);
    }, 0);
    const subjectCols =
      subjects.length >= 4 && longestSubjectW <= optionalsW / 2 - 8 ? 2 : 1;
    const colGap = 3.5;
    const colInnerW =
      subjectCols === 1
        ? optionalsW - subjectPadX * 2
        : (optionalsW - subjectPadX * 2 - colGap) / 2;

    // Wrap each subject inside its own column width (no cross-column bleed)
    const subjectBlocks = subjects.length
      ? subjects.map((subject, i) => {
          const lines = doc.splitTextToSize(
            `${i + 1}.  ${subject}`,
            colInnerW - 1
          );
          return Array.isArray(lines) ? lines : [String(lines)];
        })
      : [["No optional subjects listed"]];

    const colLineCounts = Array.from({ length: subjectCols }, () => 0);
    const colSubjectCounts = Array.from({ length: subjectCols }, () => 0);
    subjectBlocks.forEach((lines, i) => {
      const col = subjectCols === 1 ? 0 : i % subjectCols;
      colLineCounts[col] += lines.length;
      colSubjectCounts[col] += 1;
    });
    const maxColLines = Math.max(1, ...colLineCounts);
    const maxColSubjects = Math.max(1, ...colSubjectCounts);
    const optionalsBodyH =
      subjectPadY * 2 +
      maxColLines * subjectLineH +
      Math.max(0, maxColSubjects - 1) * 0.6 +
      1;
    const optionalsBlockH = optionalsTitleH + optionalsBodyH;

    // Keep details readable; shrink optionals line spacing only if needed
    const minTopBandH = fieldPairs.length * 5.2;
    let topBandH = cardH - pad * 2 - optionalsGap - optionalsBlockH;
    let drawSubjectLineH = subjectLineH;
    let drawOptionalsBodyH = optionalsBodyH;
    if (topBandH < minTopBandH) {
      topBandH = minTopBandH;
      drawOptionalsBodyH = Math.max(
        10,
        cardH - pad * 2 - optionalsGap - optionalsTitleH - topBandH
      );
      drawSubjectLineH = Math.max(
        3.3,
        (drawOptionalsBodyH - subjectPadY * 2 - 1) / maxColLines
      );
    }

    const rowH = topBandH / fieldPairs.length;
    const labelW = 24;
    const colW = detailsW / 2;
    const valueW = colW - labelW;

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.55);
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(margin, cardY, contentWidth, cardH, 1.4, 1.4, "FD");

    const leftX = margin + pad;
    const photoX = margin + pad + detailsW + gap;
    const photoY = cardY + pad;
    const photoH = topBandH;

    fieldPairs.forEach((pair, i) => {
      const y = cardY + pad + i * rowH;
      drawPairCell(leftX, y, labelW, valueW, rowH, pair[0], pair[1], i % 2 === 0);
      drawPairCell(
        leftX + colW,
        y,
        labelW,
        valueW,
        rowH,
        pair[2],
        pair[3],
        i % 2 === 0
      );
    });

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.45);
    doc.setFillColor(...COLORS.photoBg);
    doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, "FD");
    if (photo) {
      try {
        const inset = 1.1;
        doc.addImage(
          photo,
          "JPEG",
          photoX + inset,
          photoY + inset,
          photoW - inset * 2,
          photoH - inset * 2,
          undefined,
          "FAST"
        );
      } catch {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.muted);
        doc.text("No Photo", photoX + photoW / 2, photoY + photoH / 2, {
          align: "center",
        });
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text("No Photo", photoX + photoW / 2, photoY + photoH / 2, {
        align: "center",
      });
    }

    const optionalsTop = cardY + pad + topBandH + optionalsGap;

    doc.setFillColor(...COLORS.optionalsBg);
    doc.setDrawColor(...COLORS.softLine);
    doc.setLineWidth(0.3);
    doc.rect(leftX, optionalsTop, optionalsW, optionalsTitleH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.navy);
    doc.text("Optional Subjects", leftX + 2.5, optionalsTop + 4.2);
    if (subjects.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.muted);
      doc.text(
        `${subjects.length} subject${subjects.length === 1 ? "" : "s"}`,
        leftX + optionalsW - 2.5,
        optionalsTop + 4.2,
        { align: "right" }
      );
    }

    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.softLine);
    doc.rect(
      leftX,
      optionalsTop + optionalsTitleH,
      optionalsW,
      drawOptionalsBodyH,
      "FD"
    );

    const bodyTop = optionalsTop + optionalsTitleH;
    const bodyBottom = bodyTop + drawOptionalsBodyH - 1;
    const colCursorY = Array.from(
      { length: subjectCols },
      () => bodyTop + subjectPadY + 3
    );

    subjectBlocks.forEach((lines, i) => {
      const col = subjectCols === 1 ? 0 : i % subjectCols;
      const sx = leftX + subjectPadX + col * (colInnerW + colGap);
      const isEmptyNote = !subjects.length;

      lines.forEach((line) => {
        if (colCursorY[col] > bodyBottom) return;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.6);
        doc.setTextColor(...(isEmptyNote ? COLORS.muted : COLORS.ink));
        doc.text(line, sx, colCursorY[col]);
        colCursorY[col] += drawSubjectLineH;
      });

      // Small gap between subjects in the same column
      if (!isEmptyNote) colCursorY[col] += 0.6;
    });

    doc.setDrawColor(55, 95, 145);
    doc.setLineWidth(1);
    doc.line(
      margin,
      cardY + cardH + 1.1,
      pageWidth - margin,
      cardY + cardH + 1.1
    );
  };

  const contentPageCount = list.length
    ? Math.ceil(list.length / cardsPerPage)
    : 0;
  const totalPages = Math.max(1, 1 + contentPageCount); // title + content

  drawTitlePage(totalPages);

  if (!list.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      "No qualifier profiles found for the selected filters.",
      pageWidth / 2,
      pageHeight - footerH - 28,
      { align: "center" }
    );
  } else {
    list.forEach((qualifier, index) => {
      const contentPageIndex = Math.floor(index / cardsPerPage);
      const slot = index % cardsPerPage;
      if (slot === 0) {
        doc.addPage();
        drawContentHeader(contentPageIndex + 2, totalPages);
      }
      const cardY = cardsStartY + slot * (cardH + cardGap);
      drawCard(qualifier, index, cardY);
    });
  }

  const batchPart = batchName
    ? `_${String(batchName).replace(/[^\w-]+/g, "_").slice(0, 40)}`
    : "";
  const fileName = `LCA_Qualifier_Profiles${batchPart}_${fileStamp}.pdf`;

  if (mode === "preview") {
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    return { fileName, blob, blobUrl, mode: "preview" };
  }

  if (mode === "print") {
    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl, "_blank");
    if (!printWindow) {
      throw new Error("Pop-up blocked. Allow pop-ups to print the report.");
    }
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // user can print manually
      }
    }, 500);
    return { fileName, blobUrl, mode: "print" };
  }

  doc.save(fileName);
  return { fileName, mode: "download" };
};

/** @deprecated Prefer generateQualifiersPdf({ mode: "download" }) */
export const exportQualifiersPdf = async (options = {}) => {
  const result = await generateQualifiersPdf({ ...options, mode: "download" });
  return result.fileName;
};

export default generateQualifiersPdf;
