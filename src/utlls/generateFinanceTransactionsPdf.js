import jsPDF from "jspdf";
import moment from "moment";

const COLORS = {
  gold: [255, 203, 130],
  goldDark: [133, 101, 45],
  border: [224, 232, 236],
  gray: [113, 128, 150],
  grayLight: [247, 250, 252],
  text: [45, 55, 72],
  white: [255, 255, 255],
  expense: [229, 62, 62],
  fee: [45, 65, 133],
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

const svgUrlToPngDataUrl = async (svgUrl, widthPx = 420) => {
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

  const canvas = document.createElement("canvas");
  const scale = widthPx / (img.width || 1);
  canvas.width = widthPx;
  canvas.height = Math.round((img.height || 1) * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available for logo rendering.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
};

const wrapText = (doc, text, maxWidth) =>
  doc.splitTextToSize(String(text ?? ""), maxWidth);

export const exportFinanceTransactionsPdf = async ({
  transactions = [],
  period = "daily",
  date,
  batchName,
  mode = "download",
}) => {
  const safeDate = date ? moment(date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
  const label = period ? String(period).toLowerCase() : "daily";
  const fileName = `finance_transactions_${label}_${safeDate}.pdf`;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  let logoPng;
  try {
    logoPng = await svgUrlToPngDataUrl("/logo_dark.svg", 360);
  } catch {
    logoPng = null;
  }

  const drawFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      "Lahore CSS Academy · Finance Transactions Report",
      margin,
      pageHeight - 5
    );
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 5, {
      align: "right",
    });
  };

  const drawHeader = () => {
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 0, pageWidth, 24, "F");

    if (logoPng) {
      doc.addImage(logoPng, "PNG", margin, 6, 46, 12, undefined, "FAST");
    } else {
      doc.setFillColor(...COLORS.goldDark);
      doc.roundedRect(margin, 7, 16, 10, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.white);
      doc.text("LCA", margin + 8, 13.5, { align: "center" });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.text);
    doc.text("Finance Transactions", margin + 52, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `${label.toUpperCase()} report · ${safeDate} · Batch: ${batchName || "All"}`,
      margin + 52,
      18
    );
  };

  const drawSummaryRow = (y, totalCount, totalFee, totalExpense, net) => {
    const cardH = 14;
    const gap = 4;
    const cardW = (contentWidth - gap * 3) / 4;

    const drawCard = (x, labelText, valueText, accent) => {
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, "FD");
      doc.setFillColor(...accent);
      doc.roundedRect(x, y, cardW, 3, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      doc.text(labelText, x + 3, y + 7.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.text);
      doc.text(String(valueText), x + 3, y + 12);
    };

    drawCard(margin, "Transactions", totalCount, COLORS.gold);
    drawCard(margin + (cardW + gap) * 1, "Fee Income", `Rs. ${totalFee}`, COLORS.fee);
    drawCard(margin + (cardW + gap) * 2, "Expenses", `Rs. ${totalExpense}`, COLORS.expense);
    drawCard(margin + (cardW + gap) * 3, "Net", `Rs. ${net}`, COLORS.goldDark);
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

  const feeTotal = totals.fee.toLocaleString("en-PK", { maximumFractionDigits: 0 });
  const expenseTotal = totals.expense.toLocaleString("en-PK", { maximumFractionDigits: 0 });
  const netTotal = (totals.fee - totals.expense).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  });

  drawHeader();
  let y = 30;
  drawSummaryRow(y, totals.count, feeTotal, expenseTotal, netTotal);
  y += 20;

  // Table layout (landscape A4)
  const col = {
    no: 8,
    date: 28,
    type: 14,
    details: 58,
    batch: 34,
    action: 18,
    amount: 22,
    by: 28,
  };
  const tableW =
    col.no + col.date + col.type + col.details + col.batch + col.action + col.amount + col.by;
  const x0 = margin + Math.max(0, (contentWidth - tableW) / 2);
  const rowH = 8;

  const drawTableHeader = () => {
    doc.setFillColor(...COLORS.grayLight);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x0, y, tableW, 9, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);

    let x = x0;
    const put = (txt, w, align = "left") => {
      const tx = align === "right" ? x + w - 2 : x + 2;
      doc.text(String(txt), tx, y + 6, { align });
      x += w;
    };

    put("#", col.no);
    put("Date", col.date);
    put("Type", col.type);
    put("Details", col.details);
    put("Batch", col.batch);
    put("Action", col.action);
    put("Amount", col.amount, "right");
    put("By", col.by);

    y += 11;
  };

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin - 8) {
      drawFooter();
      doc.addPage();
      drawHeader();
      y = 30;
      drawSummaryRow(y, totals.count, feeTotal, expenseTotal, netTotal);
      y += 20;
      drawTableHeader();
    }
  };

  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  txns.forEach((t, index) => {
    const isExpense = t.type === "expense";
    const amount =
      (isExpense ? -1 : 1) * toNumber(t.action_amount ?? t.amount);
    const amountLabel = amount.toLocaleString("en-PK", { maximumFractionDigits: 0 });
    const typeLabel = isExpense ? "Expense" : "Fee";
    const details = isExpense ? t.title : t.student_name;
    const dateLabel = t.action_date ? moment(t.action_date).format("DD/MM/YYYY HH:mm") : "";

    const detailLines = wrapText(doc, details || "—", col.details - 4);
    const byLines = wrapText(doc, t.action_by || "—", col.by - 4);
    const maxLines = Math.min(2, Math.max(detailLines.length, byLines.length, 1));
    const h = rowH + (maxLines - 1) * 4;

    ensureSpace(h + 2);

    doc.setDrawColor(...COLORS.border);
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(x0, y - 6, tableW, h, 1.5, 1.5, "FD");

    let x = x0;
    const cellText = (txt, w, align = "left", color = COLORS.text) => {
      doc.setTextColor(...color);
      const tx = align === "right" ? x + w - 2 : x + 2;
      doc.text(String(txt ?? ""), tx, y, { align, maxWidth: w - 4 });
      x += w;
    };

    const cellLines = (lines, w) => {
      doc.setTextColor(...COLORS.text);
      const startX = x + 2;
      const max = Math.min(lines.length, 2);
      for (let i = 0; i < max; i += 1) {
        doc.text(String(lines[i] ?? ""), startX, y + i * 4, { maxWidth: w - 4 });
      }
      x += w;
    };

    cellText(index + 1, col.no);
    cellText(dateLabel, col.date, "left", COLORS.gray);
    cellText(typeLabel, col.type, "left", isExpense ? COLORS.expense : COLORS.fee);
    cellLines(detailLines, col.details);
    cellText(t.batch_name || "—", col.batch);
    cellText(t.action_type || "—", col.action);
    cellText(`Rs. ${amountLabel}`, col.amount, "right", isExpense ? COLORS.expense : COLORS.text);
    cellLines(byLines, col.by);

    y += h + 2;
  });

  drawFooter();

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

