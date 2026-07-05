import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [255, 203, 130],
  goldDark: [133, 101, 45],
  goldLight: [255, 251, 245],
  blue: [130, 180, 255],
  blueDark: [45, 65, 133],
  green: [72, 187, 120],
  greenDark: [39, 103, 73],
  orange: [237, 137, 54],
  red: [229, 62, 62],
  gray: [113, 128, 150],
  grayLight: [247, 250, 252],
  border: [224, 232, 236],
  white: [255, 255, 255],
  text: [45, 55, 72],
};

const ACTION_COLORS = {
  Created: COLORS.blueDark,
  Paid: COLORS.green,
  Discounted: COLORS.orange,
  Deleted: COLORS.red,
};

const formatRs = (value) =>
  `${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })} Rs.`;

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read logo file."));
    reader.readAsDataURL(blob);
  });

const svgUrlToPngDataUrl = async (svgUrl, widthPx = 360) => {
  try {
    const res = await fetch(svgUrl);
    if (!res.ok) return null;

    const svgText = await res.text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const svgDataUrl = await blobToDataUrl(svgBlob);

    const img = new Image();
    img.decoding = "async";
    img.src = svgDataUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const scale = widthPx / (img.width || 1);
    canvas.width = widthPx;
    canvas.height = Math.round((img.height || 1) * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

const getActionLabel = (actionType) => {
  switch (actionType) {
    case "Created":
      return "Fee Created";
    case "Paid":
      return "Fee Paid";
    case "Discounted":
      return "Fee Discounted";
    case "Deleted":
      return "Fee Deleted";
    default:
      return actionType || "N/A";
  }
};

const getAmountDetail = (log) => {
  if (log.action_type === "Created" || log.action_type === "Deleted") {
    return formatRs(log.amount);
  }
  const remaining = (log.amount ?? 0) - (log.action_amount ?? 0);
  return `${formatRs(log.amount)} − ${formatRs(log.action_amount)} = ${formatRs(remaining)}`;
};

const buildFileName = (studentName = "student") => {
  const safeName = String(studentName).replace(/\s+/g, "-").toLowerCase();
  return `lca-student-fees-details-${safeName}-${moment().format("YYYYMMDD")}.pdf`;
};

export const generateStudentFeeDetailsReport = async (fee, feeLogs = [], mode = "download") => {
  if (!fee) {
    throw new Error("Fee details are not available.");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const studentName = fee?.student?.name || "N/A";
  const batchName = fee?.batch?.name || "N/A";
  const phone = fee?.student?.phone || "N/A";
  const email = fee?.student?.email || "N/A";
  const rollNumber = fee?.student?.roll_number || "—";
  const feeAmount = fee?.amount ?? 0;
  const dueDate = fee?.due_date
    ? moment(fee.due_date).format("DD MMM YYYY")
    : "N/A";
  const status = fee?.status || "N/A";
  const isPaid = status === "Paid";

  const logoPng = await svgUrlToPngDataUrl("/logo_dark.svg", 320);

  const drawPageFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      "Lahore CSS Academy · Student Fees Details Report",
      margin,
      pageHeight - 5
    );
    doc.text(
      `Page ${doc.internal.getNumberOfPages()}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: "right" }
    );
  };

  const ensureSpace = (needed = 10) => {
    if (y + needed > pageHeight - margin - 8) {
      drawPageFooter();
      doc.addPage();
      y = margin;
    }
  };

  const drawSectionTitle = (title, subtitle = "") => {
    ensureSpace(subtitle ? 16 : 12);
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(margin, y, 3, subtitle ? 12 : 8, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text(title, margin + 6, y + 5);
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      doc.text(subtitle, margin + 6, y + 10);
      y += 14;
    } else {
      y += 10;
    }
  };

  const drawInfoCard = (x, cardY, width, label, value, accent = COLORS.blueDark) => {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x, cardY, width, 20, 2, 2, "FD");
    doc.setFillColor(...accent);
    doc.roundedRect(x, cardY, width, 3, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(label, x + 3, cardY + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    const valueLines = doc.splitTextToSize(String(value), width - 6);
    doc.text(valueLines, x + 3, cardY + 14);
  };

  // ── Header banner ──
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setFillColor(...COLORS.goldDark);
  doc.rect(0, 28, pageWidth, 4, "F");

  if (logoPng) {
    doc.addImage(logoPng, "PNG", margin, 8, 42, 11, undefined, "FAST");
  } else {
    doc.setFillColor(...COLORS.goldDark);
    doc.roundedRect(margin, 9, 16, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.text("LCA", margin + 8, 14.5, { align: "center" });
  }

  const textStartX = margin + (logoPng ? 50 : 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.goldDark);
  doc.text("Lahore CSS Academy", textStartX, 12);

  doc.setFontSize(11);
  doc.text("Student Fees Details Report", textStartX, 17.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text("Finance Department", textStartX, 22.5);

  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.goldDark);
  doc.text(
    `Generated ${moment().format("DD MMM YYYY, hh:mm A")}`,
    pageWidth - margin,
    12,
    { align: "right" }
  );
  doc.text("Official fee statement & transaction history", pageWidth - margin, 17, {
    align: "right",
  });
  doc.text(`Ref: FEE-${String(fee._id || "").slice(-8).toUpperCase()}`, pageWidth - margin, 22, {
    align: "right",
  });

  y = 40;

  // ── Summary cards ──
  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  drawInfoCard(margin, y, cardWidth, "Total Fee Amount", formatRs(feeAmount), COLORS.blueDark);
  drawInfoCard(
    margin + cardWidth + cardGap,
    y,
    cardWidth,
    "Due Date",
    dueDate,
    COLORS.orange
  );
  drawInfoCard(
    margin + (cardWidth + cardGap) * 2,
    y,
    cardWidth,
    "Payment Status",
    status,
    isPaid ? COLORS.green : COLORS.red
  );
  y += 26;

  // ── Student profile panel ──
  drawSectionTitle("Student Profile", "Registered student and batch information");

  const profileRows = [
    ["Student Name", studentName],
    ["Roll Number", rollNumber],
    ["Batch", batchName],
    ["Phone", phone],
    ["Email", email],
    ["Report Date", moment().format("DD MMM YYYY")],
  ];

  const colW = contentWidth / 2 - 4;
  let leftY = y + 10;
  let rightY = y + 10;

  profileRows.forEach(([label, value], index) => {
    const isLeft = index % 2 === 0;
    const valueLines = doc.splitTextToSize(String(value), colW - 4);
    const blockH = 8 + valueLines.length * 3.8;
    if (isLeft) leftY += blockH + 2;
    else rightY += blockH + 2;
  });

  const profileBoxH = Math.max(leftY, rightY) - y + 2;
  ensureSpace(profileBoxH + 2);

  doc.setFillColor(...COLORS.goldLight);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, y, contentWidth, profileBoxH, 3, 3, "FD");

  leftY = y + 10;
  rightY = y + 10;
  profileRows.forEach(([label, value], index) => {
    const isLeft = index % 2 === 0;
    const x = margin + 6 + (isLeft ? 0 : colW + 8);
    const currentY = isLeft ? leftY : rightY;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray);
    doc.text(label, x, currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    const valueLines = doc.splitTextToSize(String(value), colW - 4);
    doc.text(valueLines, x, currentY + 4);

    const blockH = 8 + valueLines.length * 3.8;
    if (isLeft) leftY += blockH + 2;
    else rightY += blockH + 2;
  });

  y += profileBoxH + 4;

  // ── Status badge strip ──
  ensureSpace(12);
  doc.setFillColor(...(isPaid ? COLORS.green : COLORS.red));
  doc.roundedRect(margin, y, contentWidth, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  doc.text(
    isPaid
      ? "✓  Fee fully settled — no outstanding balance on this record"
      : "⚠  Outstanding fee — payment pending as per due date",
    margin + 4,
    y + 6
  );
  y += 14;

  // ── Transaction History ──
  drawSectionTitle(
    "Transaction History",
    feeLogs.length
      ? `${feeLogs.length} recorded ${feeLogs.length === 1 ? "entry" : "entries"} on this fee`
      : "No transactions recorded yet"
  );

  const drawHistoryEntry = (log, index) => {
    const actionType = log.action_type || "N/A";
    const actionLabel = getActionLabel(actionType);
    const dateStr = moment(log.action_date).format("DD MMM YYYY");
    const amountStr = getAmountDetail(log);
    const byStr = log.action_by?.name || "System";
    const methodStr = log.action_type === "Paid" ? log.payment_method || "" : "";
    const descStr = log.description || "No description";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(descStr, contentWidth - 12);
    const amountLines = doc.splitTextToSize(amountStr, contentWidth - 12);

    const entryH =
      16 + amountLines.length * 3.6 + descLines.length * 3.6 + (methodStr ? 4 : 0);
    ensureSpace(entryH + 3);

    doc.setFillColor(...(index % 2 === 0 ? COLORS.white : COLORS.grayLight));
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, y, contentWidth, entryH, 2, 2, "FD");

    let lineY = y + 5;
    const accent = ACTION_COLORS[actionType] || COLORS.gray;
    doc.setFillColor(...accent);
    doc.roundedRect(margin + 4, lineY - 3.2, 28, 6.5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.white);
    doc.text(actionLabel, margin + 18, lineY + 0.6, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(dateStr, pageWidth - margin - 4, lineY + 0.6, { align: "right" });

    lineY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.blueDark);
    doc.text(amountLines, margin + 4, lineY);

    lineY += amountLines.length * 3.8 + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.gray);
    const metaLine = methodStr
      ? `Processed by: ${byStr}  ·  Payment: ${methodStr}`
      : `Processed by: ${byStr}`;
    doc.text(metaLine, margin + 4, lineY);

    lineY += 5;
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    doc.text(descLines, margin + 4, lineY);

    y += entryH + 3;
  };

  if (!feeLogs.length) {
    ensureSpace(14);
    doc.setFillColor(...COLORS.grayLight);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text("No fee history found for this student record.", margin + 4, y + 7);
    y += 16;
  } else {
    feeLogs.forEach((log, index) => drawHistoryEntry(log, index));
  }

  // ── Footer note ──
  ensureSpace(18);
  y += 2;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.gray);
  const footerNote =
    "This is a computer-generated fee statement from Lahore CSS Academy. " +
    "For payment queries or corrections, contact the finance office with this reference number.";
  const noteLines = doc.splitTextToSize(footerNote, contentWidth);
  doc.text(noteLines, margin, y);

  drawPageFooter();

  const fileName = buildFileName(studentName);

  if (mode === "print") {
    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl);
    if (!printWindow) {
      throw new Error("Pop-up blocked. Allow pop-ups to print the report.");
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
