import * as XLSX from "xlsx";
import moment from "moment";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const exportFinanceTransactionsExcel = ({
  transactions = [],
  period = "daily",
  date,
  batchName,
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
      Details: t.type === "expense" ? t.title : t.student_name,
      "Category / Batch": t.batch_name || "",
      Action: t.action_type || "",
      Amount: amountRaw,
      By: t.action_by || "",
    };
  });

  const metaSheet = XLSX.utils.aoa_to_sheet([
    ["Finance Transactions Report"],
    ["Period", label],
    ["Date", safeDate],
    ["Batch", batchName || "All"],
    ["Total Rows", rows.length],
    [],
  ]);

  metaSheet["!cols"] = [{ wch: 26 }, { wch: 38 }];

  const dataSheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  dataSheet["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 10 },
    { wch: 30 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Report");
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Transactions");
  XLSX.writeFile(workbook, fileName);

  return fileName;
};

