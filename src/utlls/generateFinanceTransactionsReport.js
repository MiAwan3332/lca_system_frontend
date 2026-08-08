import * as XLSX from "xlsx";
import moment from "moment";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatRs = (value) =>
  toNumber(value).toLocaleString("en-PK", { maximumFractionDigits: 0 });

export const exportFinanceTransactionsExcel = ({
  transactions = [],
  period = "daily",
  date,
  batchName,
  collectedBy,
  totalCash = 0,
  totalOnline = 0,
  batchWise = [],
}) => {
  const safeDate = date ? moment(date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
  const label = period ? String(period).toLowerCase() : "daily";
  const fileName = `finance_transactions_${label}_${safeDate}.xlsx`;

  const rows = (transactions || []).map((t, index) => {
    const amountRaw =
      t.type === "expense"
        ? -toNumber(t.action_amount ?? t.amount)
        : toNumber(t.action_amount ?? t.amount);

    return {
      "#": index + 1,
      Date: t.action_date ? moment(t.action_date).format("YYYY-MM-DD HH:mm") : "",
      Type: t.type === "expense" ? "Expense" : "Fee",
      Student:
        t.type === "expense"
          ? t.title || ""
          : t.student_name || "",
      "Category / Batch": t.batch_name || "",
      Action: t.action_type || "",
      Payment:
        t.payment_method ||
        (t.action_type === "Paid" ? "Cash" : ""),
      Amount: amountRaw,
      By: t.action_by || "",
    };
  });

  const batchRows = (Array.isArray(batchWise) ? batchWise : []).map((batch, index) => ({
    "#": index + 1,
    Batch: batch.batch_name || "Unassigned",
    "Total Cash": toNumber(batch.total_cash),
    "Total Online": toNumber(batch.total_online),
    Total: toNumber(batch.total),
  }));

  const metaSheet = XLSX.utils.aoa_to_sheet([
    ["Lahore CSS Academy"],
    ["Finance Transactions Report"],
    ["Period", label],
    ["Date", safeDate],
    ["Batch", batchName || "All"],
    ["Collected by", collectedBy || "All admin users"],
    ["Total Rows", rows.length],
    [],
    ["Payment Collections"],
    ["Total Cash", formatRs(totalCash)],
    ["Total Online", formatRs(totalOnline)],
    ["Combined", formatRs(toNumber(totalCash) + toNumber(totalOnline))],
    [],
  ]);

  metaSheet["!cols"] = [{ wch: 26 }, { wch: 38 }];

  const dataSheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  dataSheet["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 22 },
  ];

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
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Report");
  XLSX.utils.book_append_sheet(workbook, batchSheet, "Batch Wise");
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Transactions");
  XLSX.writeFile(workbook, fileName);

  return fileName;
};
