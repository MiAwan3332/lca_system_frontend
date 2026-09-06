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

  // --- Summary Cards (Highly Visible) ---
  const summaryCards = [
    { label: "No Of Entries", value: String(totals.count) },
    { label: "Fee Collection", value: `Rs. ${formatAmount(totals.fee)}` },
    { label: "Expenses", value: `Rs. ${formatAmount(totals.expense)}` },
    { label: "Net Balance", value: `Rs. ${formatAmount(totals.fee - totals.expense)}` },
    { label: "Cash", value: `Rs. ${formatAmount(cashTotal)}` },
    { label: "Online", value: `Rs. ${formatAmount(onlineTotal)}` },
  ];

  const cardGap = 1.5;
  const cardY = y;
  const cardW = contentWidth / summaryCards.length - cardGap;
  const cardH = 15;

  summaryCards.forEach((card, index) => {
    const cardX = margin + index * (cardW + cardGap);

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.roundedRect(cardX, cardY, cardW, cardH, 1, 1, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(card.label, cardX + cardW / 2, cardY + 5.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.text(card.value, cardX + cardW / 2, cardY + 11.5, { align: "center" });
  });

  y += cardH + 5;

  // Batch-wise Cash / Online / Pending / Total cards
  if (batchList.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.goldDark);
    doc.text("Batch collections:", margin, y);
    y += 4;

    const colsPerRow = Math.min(2, batchList.length);
    const bGap = 2;
    const bCardW = (contentWidth - bGap * (colsPerRow - 1)) / colsPerRow;
    const bCardH = 28;
    let bCardX = margin;
    let bCardY = y;
    let colIndex = 0;

    batchList.forEach((b) => {
      if (colIndex >= colsPerRow) {
        colIndex = 0;
        bCardX = margin;
        bCardY += bCardH + 3;
      }

      doc.setFillColor(255, 252, 245);
      doc.setDrawColor(...COLORS.goldDark);
      doc.setLineWidth(0.35);
      doc.roundedRect(bCardX, bCardY, bCardW, bCardH, 1.2, 1.2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.goldDark);
      const batchNameLines = doc.splitTextToSize(
        b.batch_name || "Unassigned",
        bCardW - 4
      );
      doc.text(batchNameLines.slice(0, 1), bCardX + bCardW / 2, bCardY + 5.5, {
        align: "center",
      });

      const metrics = [
        { label: "Cash", value: `Rs. ${formatAmount(b.total_cash)}` },
        { label: "Online", value: `Rs. ${formatAmount(b.total_online)}` },
        { label: "Pending", value: `Rs. ${formatAmount(b.total_pending)}` },
        { label: "Total", value: `Rs. ${formatAmount(b.total)}` },
      ];
      const innerGap = 1.2;
      const innerPad = 2;
      const innerW = (bCardW - innerPad * 2 - innerGap * 3) / 4;
      const innerH = 16;
      const innerY = bCardY + 9;

      metrics.forEach((m, mi) => {
        const innerX = bCardX + innerPad + mi * (innerW + innerGap);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.roundedRect(innerX, innerY, innerW, innerH, 0.8, 0.8, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.gray);
        doc.text(m.label, innerX + innerW / 2, innerY + 5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(33, 37, 41);
        doc.text(m.value, innerX + innerW / 2, innerY + 11.5, {
          align: "center",
        });
      });

      bCardX += bCardW + bGap;
      colIndex += 1;
    });

    y = bCardY + bCardH + 6;
  }

  // Larger fonts → controlled entries per page
  const ENTRIES_PER_PAGE = 18;
  const col = {
    no: 10,
    date: 30,
    type: 16,
    student: 48,
    action: 20,
    payment: 26,
    amount: 26,
    by: 28,
  };
  const tableW =
    col.no +
    col.date +
    col.type +
    col.student +
    col.action +
    col.payment +
    col.amount +
    col.by;
  const x0 = margin + Math.max(0, (contentWidth - tableW) / 2);
  const headerH = 8.5;
  const rowH = 8.5;
  const batchTitleH = 9;

  // Group transactions by batch name (expenses without batch go last)
  const batchGroups = [];
  const batchMap = new Map();
  txns.forEach((t) => {
    const key = String(t.batch_name || "Unassigned / Expenses").trim() || "Unassigned / Expenses";
    if (!batchMap.has(key)) {
      const group = { name: key, items: [] };
      batchMap.set(key, group);
      batchGroups.push(group);
    }
    batchMap.get(key).items.push(t);
  });

  const drawTableHeader = () => {
    doc.setFillColor(...COLORS.grayLight);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.rect(x0, y, tableW, headerH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    let x = x0;
    const put = (txt, w, align = "left") => {
      const tx = align === "right" ? x + w - 1.5 : x + 1.5;
      doc.text(String(txt), tx, y + 5.5, { align });
      x += w;
    };

    put("#", col.no);
    put("Date", col.date);
    put("Type", col.type);
    put("Student", col.student);
    put("Action", col.action);
    put("Payment", col.payment);
    put("Amount", col.amount, "right");
    put("By", col.by);
    y += headerH;
  };

  const drawBatchTitle = (batchName, entryCount) => {
    doc.setFillColor(255, 243, 224);
    doc.setDrawColor(...COLORS.goldDark);
    doc.setLineWidth(0.25);
    doc.roundedRect(x0, y, tableW, batchTitleH, 0.8, 0.8, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.goldDark);
    doc.text(
      clip(doc, `Batch: ${batchName}  (${entryCount} entries)`, tableW - 4),
      x0 + 2.5,
      y + 6
    );
    y += batchTitleH;
  };

  const startNewPage = ({ withTableHeader = true } = {}) => {
    drawFooter();
    doc.addPage();
    drawHeader();
    y = 16;
    if (withTableHeader) drawTableHeader();
  };

  let globalIndex = 0;
  let pageEntryCount = 0;
  let tableStarted = false;

  const ensureEntrySpace = (needed) => {
    if (pageEntryCount >= ENTRIES_PER_PAGE || y + needed > pageHeight - margin - 5) {
      startNewPage({ withTableHeader: true });
      pageEntryCount = 0;
      return true;
    }
    return false;
  };

  batchGroups.forEach((group) => {
    group.items.forEach((t, itemIndex) => {
      const needsBatchTitle = itemIndex === 0 || pageEntryCount === 0;
      const spaceNeeded = (needsBatchTitle ? batchTitleH : 0) + rowH;

      if (!tableStarted) {
        if (y + spaceNeeded + headerH > pageHeight - margin - 5) {
          startNewPage({ withTableHeader: false });
          pageEntryCount = 0;
        }
        drawTableHeader();
        tableStarted = true;
      } else {
        ensureEntrySpace(spaceNeeded);
      }

      // Re-draw batch title when starting a new batch or continuing a batch on a new page
      const showBatchTitle = itemIndex === 0 || pageEntryCount === 0;
      if (showBatchTitle) {
        if (y + batchTitleH + rowH > pageHeight - margin - 5) {
          startNewPage({ withTableHeader: true });
          pageEntryCount = 0;
        }
        drawBatchTitle(group.name, group.items.length);
      }

      const isExpense = t.type === "expense";
      const amount =
        (isExpense ? -1 : 1) * toNumber(t.action_amount ?? t.amount);
      const amountLabel = amount.toLocaleString("en-PK", {
        maximumFractionDigits: 0,
      });
      const typeLabel = isExpense ? "Exp" : "Fee";
      const dateLabel = t.action_date
        ? moment(t.action_date).format("DD/MM/YY HH:mm")
        : "";
      const paymentLabel =
        t.payment_method || (t.action_type === "Paid" ? "Cash" : "—");
      const studentLabel = isExpense
        ? t.title || t.student_name || "—"
        : t.student_name || "—";

      globalIndex += 1;
      pageEntryCount += 1;

      if (pageEntryCount % 2 === 0) {
        doc.setFillColor(...COLORS.rowAlt);
        doc.rect(x0, y, tableW, rowH, "F");
      }

      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.15);
      doc.line(x0, y + rowH, x0 + tableW, y + rowH);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      let x = x0;
      const textY = y + 5.5;
      const cell = (txt, w, align = "left", color = COLORS.text) => {
        doc.setTextColor(...color);
        const tx = align === "right" ? x + w - 1.5 : x + 1.5;
        doc.text(clip(doc, txt, w - 3), tx, textY, { align });
        x += w;
      };

      cell(globalIndex, col.no);
      cell(dateLabel, col.date, "left", COLORS.gray);
      cell(typeLabel, col.type, "left", isExpense ? COLORS.expense : COLORS.fee);
      cell(studentLabel, col.student);
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
  });

  if (!tableStarted) {
    drawTableHeader();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text("No transactions found for this period.", x0 + 2, y + 6);
  }

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
