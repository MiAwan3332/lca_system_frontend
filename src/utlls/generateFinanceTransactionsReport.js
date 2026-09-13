import * as XLSX from "xlsx";
import moment from "moment";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatRs = (value) =>
  toNumber(value).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const isOnlineMethod = (method) => {
  const normalized = String(method || "")
    .trim()
    .toLowerCase();
  return (
    normalized === "online payment" ||
    normalized === "online" ||
    normalized === "bank transfer"
  );
};

/** Required columns for Finance Report Excel (must match Accounts daily sheet). */
export const FINANCE_EXPORT_HEADERS = [
  "SR",
  "NAMES",
  "CONTACTS",
  "TOTAL",
  "PAID",
  "REMAINING",
  "CASH",
  "ONLINE",
  "REMARKS",
];

const buildCollectionRows = (transactions = [], { paymentsOnly = false } = {}) => {
  let source = Array.isArray(transactions) ? [...transactions] : [];

  // Daily collection sheet focuses on fee activity (not org expenses).
  source = source.filter(
    (t) => t?.type !== "expense" && String(t?.action_type || "") !== "Expense"
  );

  if (paymentsOnly) {
    const paidOrRefund = source.filter((t) => {
      const action = String(t?.action_type || "").toLowerCase();
      return (
        action === "paid" ||
        action === "refund" ||
        t?.type === "refund"
      );
    });
    if (paidOrRefund.length) {
      source = paidOrRefund;
    }
  }

  return source.map((t, index) => {
    const paymentAmount = Math.abs(toNumber(t.action_amount ?? t.amount));
    const method =
      t.payment_method ||
      (String(t.action_type || "") === "Paid" ? "Cash" : "");
    const action = String(t.action_type || "");
    const isPaidRow = action === "Paid";
    const isRefundRow =
      action.toLowerCase() === "refund" || t.type === "refund";

    let cash = 0;
    let online = 0;
    if (isPaidRow || isRefundRow) {
      const signed = isRefundRow ? -paymentAmount : paymentAmount;
      if (isOnlineMethod(method)) {
        online = signed;
      } else if (method || isPaidRow || isRefundRow) {
        // Cash + Cheque + empty method count as cash channel for the day.
        cash = signed;
      }
    } else {
      cash = toNumber(t.student_cash_amount);
      online = toNumber(t.student_online_amount);
    }

    const remarksParts = [
      t.batch_name && t.batch_name !== "N/A" ? `Batch: ${t.batch_name}` : "",
      t.roll_number ? `Roll: ${t.roll_number}` : "",
      action ? `Action: ${action}` : "",
      method ? `Method: ${method}` : "",
      t.description || t.fee_description || "",
      t.action_by && t.action_by !== "N/A" ? `By: ${t.action_by}` : "",
      t.action_date
        ? `Date: ${moment(t.action_date).format("DD MMM YYYY HH:mm")}`
        : "",
    ].filter(Boolean);

    return {
      SR: index + 1,
      NAMES:
        t.type === "expense"
          ? t.title || t.student_name || ""
          : t.student_name || "",
      CONTACTS: String(t.student_phone || t.phone || t.contact || "").trim(),
      TOTAL: toNumber(t.total_batch_fee ?? t.total_fee),
      PAID: toNumber(t.paid_fee),
      REMAINING: toNumber(t.pending_amount ?? t.pending_fee),
      CASH: cash,
      ONLINE: online,
      REMARKS: remarksParts.join(" | "),
    };
  });
};

const sheetFromCollectionRows = (rows) => {
  const aoa = [
    FINANCE_EXPORT_HEADERS,
    ...rows.map((row) => FINANCE_EXPORT_HEADERS.map((key) => row[key])),
  ];

  if (rows.length) {
    const totalCash = rows.reduce((sum, row) => sum + toNumber(row.CASH), 0);
    const totalOnline = rows.reduce((sum, row) => sum + toNumber(row.ONLINE), 0);
    aoa.push([]);
    aoa.push([
      "",
      "TOTAL",
      "",
      "",
      "",
      "",
      totalCash,
      totalOnline,
      `Combined: ${formatRs(totalCash + totalOnline)}`,
    ]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 48 },
  ];
  return sheet;
};

export const exportFinanceTransactionsExcel = ({
  transactions = [],
  period = "daily",
  date,
  startDate,
  endDate,
  batchName,
  collectedBy,
  totalCash = 0,
  totalOnline = 0,
  batchWise = [],
}) => {
  const safeDate = date
    ? moment(date).format("YYYY-MM-DD")
    : startDate
      ? moment(startDate).format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
  const label = period ? String(period).toLowerCase() : "daily";
  const isDaily =
    label === "daily" ||
    (startDate && endDate && String(startDate) === String(endDate));
  const fileName = `finance_transactions_${label}_${safeDate}.xlsx`;

  // Must-have Accounts columns on every export; daily prefers payment rows.
  const collectionRows = buildCollectionRows(transactions, {
    paymentsOnly: isDaily,
  });

  const batchRows = (Array.isArray(batchWise) ? batchWise : []).map(
    (batch, index) => ({
      "#": index + 1,
      Batch: batch.batch_name || "Unassigned",
      "Total Cash": toNumber(batch.total_cash),
      "Total Online": toNumber(batch.total_online),
      Total: toNumber(batch.total),
    })
  );

  const dateRangeLabel =
    startDate && endDate && startDate !== endDate
      ? `${startDate} to ${endDate}`
      : safeDate;

  const metaSheet = XLSX.utils.aoa_to_sheet([
    ["Lahore CSS Academy"],
    ["Finance Transactions Report"],
    ["Period", label],
    ["Date", dateRangeLabel],
    ["Batch", batchName || "All"],
    ["Collected by", collectedBy || "All admin users"],
    ["Total Rows", collectionRows.length],
    [],
    ["Payment Collections"],
    ["Total Cash", formatRs(totalCash)],
    ["Total Online", formatRs(totalOnline)],
    ["Combined", formatRs(toNumber(totalCash) + toNumber(totalOnline))],
    [],
    ["Sheet columns (required)"],
    [FINANCE_EXPORT_HEADERS.join(" | ")],
  ]);

  metaSheet["!cols"] = [{ wch: 28 }, { wch: 42 }];

  const collectionSheet = sheetFromCollectionRows(collectionRows);
  const collectionSheetName = isDaily ? "Daily Collection" : "Collection";

  const batchSheet =
    batchRows.length > 0
      ? XLSX.utils.json_to_sheet(batchRows, { skipHeader: false })
      : XLSX.utils.aoa_to_sheet([
          ["#", "Batch", "Total Cash", "Total Online", "Total"],
          ["", "No batch collections in this period", "", "", ""],
        ]);

  batchSheet["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  // Required collection columns first so the file opens on the Accounts sheet.
  XLSX.utils.book_append_sheet(workbook, collectionSheet, collectionSheetName);
  XLSX.utils.book_append_sheet(workbook, batchSheet, "Batch Wise");
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Report Info");
  XLSX.writeFile(workbook, fileName);

  return fileName;
};
