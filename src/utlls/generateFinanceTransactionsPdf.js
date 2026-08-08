import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [255, 203, 130],
  goldDark: [133, 101, 45],
  border: [200, 210, 218],
  gray: [90, 100, 110],
  grayLight: [245, 247, 249],
  text: [35, 45, 55],
  white: [255, 255, 255],
  expense: [200, 50, 50],
  fee: [40, 70, 140],
  rowAlt: [250, 251, 252],
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read logo file."));
    reader.readAsDataURL(blob);
  });

const svgIconToPngDataUrl = async (svgUrl, widthPx = 140) => {
  const res = await fetch(svgUrl);
  if (!res.ok) {
    throw new Error("Could not load LCA logo.");
  }

  const svgText = await res.text();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const svgDataUrl = await blobToDataUrl(svgBlob);

  const img = new Image();
  img.decoding = "async";
  img.src = svgDataUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error("Could not render LCA logo."));
  });

  const iconFraction = 27 / 138;
  const srcWidth = img.width * iconFraction;
  const scale = widthPx / srcWidth;

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available for logo rendering.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, srcWidth, img.height, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
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
 * Compact landscape finance PDF — minimal gaps so batches fit in ~1.5–2 pages.
 */
export const exportFinanceTransactionsPdf = async ({
  transactions = [],
  period = "daily",
  date,
  batchName,
  collectedBy,
  totalCash = 0,
  totalOnline = 0,
  batchWise = [],
  mode = "download",
}) => {
  const safeDate = date ? moment(date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
  const label = period ? String(period).toLowerCase() : "daily";
  const collectedByLabel = collectedBy || "All admin users";
  const fileName = `finance_transactions_${label}_${safeDate}.pdf`;
  const cashTotal = toNumber(totalCash);
  const onlineTotal = toNumber(totalOnline);
  const batchList = Array.isArray(batchWise) ? batchWise : [];
  const formatAmount = (value) =>
    toNumber(value).toLocaleString("en-PK", { maximumFractionDigits: 0 });

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const margin = 6;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  let iconPng;
  try {
    iconPng = await svgIconToPngDataUrl("/logo_dark.svg", 120);
  } catch {
    iconPng = null;
  }

  const drawFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      "Lahore CSS Academy · Finance Transactions Report",
      margin,
      pageHeight - 3.5
    );
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 3.5, {
      align: "right",
    });
  };

  const drawHeader = () => {
    const headerH = 14;
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 0, pageWidth, headerH, "F");

    const logoBoxH = 9;
    const logoBoxY = 2.5;
    const logoBoxX = margin;
    const iconW = 7;
    const iconH = 6.5;

    doc.setFillColor(...COLORS.white);
    doc.roundedRect(logoBoxX, logoBoxY, 52, logoBoxH, 1, 1, "F");

    if (iconPng) {
      doc.addImage(iconPng, "PNG", logoBoxX + 1.5, logoBoxY + 1.2, iconW, iconH, undefined, "FAST");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.goldDark);
    doc.text("Lahore CSS Academy", logoBoxX + 10, logoBoxY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.text("Finance Transactions", logoBoxX + 55, logoBoxY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `${label.toUpperCase()} · ${safeDate} · Batch: ${batchName || "All"} · By: ${collectedByLabel}`,
      pageWidth - margin,
      logoBoxY + 6,
      { align: "right" }
    );

    return headerH;
  };

  const txns = Array.isArray(transactions) ? transactions : [];
  const totals = txns.reduce(
    (acc, t) => {
      const isExpense = t.type === "expense";
      const amount = toNumber(t.action_amount ?? t.amount);
      if (isExpense) acc.expense += amount;
      else acc.fee += amount;
      acc.count += 1;
      return acc;
    },
    { count: 0, fee: 0, expense: 0 }
  );

  drawHeader();
  let y = 16;

  // Compact summary line (no card gaps)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.text);
  const summaryBits = [
    `Rows: ${totals.count}`,
    `Fee: Rs. ${formatAmount(totals.fee)}`,
    `Expense: Rs. ${formatAmount(totals.expense)}`,
    `Net: Rs. ${formatAmount(totals.fee - totals.expense)}`,
    `Cash: Rs. ${formatAmount(cashTotal)}`,
    `Online: Rs. ${formatAmount(onlineTotal)}`,
  ];
  doc.text(summaryBits.join("   ·   "), margin, y);
  y += 3.5;

  // Compact batch-wise one-liners
  if (batchList.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.goldDark);
    doc.text("Batch collections:", margin, y);
    y += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.text);
    const batchLine = batchList
      .map(
        (b) =>
          `${b.batch_name || "Unassigned"} C${formatAmount(b.total_cash)}/O${formatAmount(b.total_online)}=${formatAmount(b.total)}`
      )
      .join("  |  ");
    const batchLines = doc.splitTextToSize(batchLine, contentWidth);
    doc.text(batchLines.slice(0, 3), margin, y);
    y += Math.min(batchLines.length, 3) * 2.8 + 1.5;
  }

  // Dense transaction table
  const col = {
    no: 7,
    date: 26,
    type: 12,
    student: 42,
    batch: 38,
    action: 16,
    payment: 22,
    amount: 22,
    by: 28,
  };
  const tableW =
    col.no +
    col.date +
    col.type +
    col.student +
    col.batch +
    col.action +
    col.payment +
    col.amount +
    col.by;
  const x0 = margin + Math.max(0, (contentWidth - tableW) / 2);
  const headerH = 5.5;
  const rowH = 4.8;

  const drawTableHeader = () => {
    doc.setFillColor(...COLORS.grayLight);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.rect(x0, y, tableW, headerH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.text);

    let x = x0;
    const put = (txt, w, align = "left") => {
      const tx = align === "right" ? x + w - 1.2 : x + 1.2;
      doc.text(String(txt), tx, y + 3.7, { align });
      x += w;
    };

    put("#", col.no);
    put("Date", col.date);
    put("Type", col.type);
    put("Student", col.student);
    put("Batch", col.batch);
    put("Action", col.action);
    put("Payment", col.payment);
    put("Amount", col.amount, "right");
    put("By", col.by);
    y += headerH;
  };

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin - 5) {
      drawFooter();
      doc.addPage();
      drawHeader();
      y = 16;
      drawTableHeader();
    }
  };

  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);

  txns.forEach((t, index) => {
    ensureSpace(rowH);
    const isExpense = t.type === "expense";
    const amount =
      (isExpense ? -1 : 1) * toNumber(t.action_amount ?? t.amount);
    const amountLabel = amount.toLocaleString("en-PK", { maximumFractionDigits: 0 });
    const typeLabel = isExpense ? "Exp" : "Fee";
    const dateLabel = t.action_date
      ? moment(t.action_date).format("DD/MM/YY HH:mm")
      : "";
    const paymentLabel =
      t.payment_method ||
      (t.action_type === "Paid" ? "Cash" : "—");
    const studentLabel = isExpense
      ? t.title || t.student_name || "—"
      : t.student_name || "—";

    if (index % 2 === 1) {
      doc.setFillColor(...COLORS.rowAlt);
      doc.rect(x0, y, tableW, rowH, "F");
    }

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.15);
    doc.line(x0, y + rowH, x0 + tableW, y + rowH);

    let x = x0;
    const textY = y + 3.3;
    const cell = (txt, w, align = "left", color = COLORS.text) => {
      doc.setTextColor(...color);
      const tx = align === "right" ? x + w - 1.2 : x + 1.2;
      doc.text(clip(doc, txt, w - 2.4), tx, textY, { align });
      x += w;
    };

    cell(index + 1, col.no);
    cell(dateLabel, col.date, "left", COLORS.gray);
    cell(typeLabel, col.type, "left", isExpense ? COLORS.expense : COLORS.fee);
    cell(studentLabel, col.student);
    cell(t.batch_name || "—", col.batch);
    cell(t.action_type || "—", col.action);
    cell(paymentLabel, col.payment);
    cell(
      `Rs. ${amountLabel}`,
      col.amount,
      "right",
      isExpense ? COLORS.expense : COLORS.text
    );
    cell(t.action_by || "—", col.by);

    y += rowH;
  });

  drawFooter();

  if (mode === "print") {
    doc.autoPrint();
    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl, "_blank");
    if (!printWindow) {
      throw new Error("Pop-up blocked. Allow pop-ups to print the report.");
    }
    printWindow.focus();
  } else {
    doc.save(fileName);
  }

  return fileName;
};
