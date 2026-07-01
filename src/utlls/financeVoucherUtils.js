import moment from "moment";

export const VOUCHER_COPY_LABELS = [
  "Student Copy",
  "Admin Office Copy",
  "Finance Team Copy",
  "LCA Copy",
];

export const PAYMENT_INSTRUCTIONS =
  "Pay at the LCA finance office during working hours. Retain this voucher as proof of payment. For bank transfers, include the voucher number in the payment reference.";

export const formatVoucherAmount = (transaction) => {
  const raw = transaction.action_amount ?? transaction.amount;
  const value = Number(raw) || 0;
  return transaction.type === "expense"
    ? `- Rs. ${value.toLocaleString()}`
    : `Rs. ${value.toLocaleString()}`;
};

export const buildVoucherData = (transaction) => {
  if (!transaction) return null;

  const voucherNumber = `LCA-V-${String(transaction._id || "").slice(-8).toUpperCase()}`;
  const isExpense = transaction.type === "expense";

  const studentName = isExpense
    ? transaction.title || transaction.student_name || "N/A"
    : transaction.student_name || "N/A";
  const batchName = transaction.batch_name || transaction.program || "N/A";

  return {
    voucherNumber,
    studentName,
    batchName,
    studentId: transaction.student_id || "N/A",
    program: transaction.program || transaction.batch_name || "N/A",
    feeDescription:
      transaction.fee_description ||
      transaction.description ||
      (isExpense ? "Approved Expense" : `${transaction.action_type || "Fee"} Payment`),
    amount: formatVoucherAmount(transaction),
    dueDate: transaction.due_date
      ? moment(transaction.due_date).format("DD MMM YYYY")
      : "N/A",
    issueDate: moment(transaction.action_date).format("DD MMM YYYY"),
    issueTime: moment(transaction.action_date).format("hh:mm A"),
    paymentInstructions: PAYMENT_INSTRUCTIONS,
    processedBy: transaction.action_by || "N/A",
    actionType: transaction.action_type || "N/A",
    qrValue: [
      voucherNumber,
      `Student: ${studentName}`,
      `Batch: ${batchName}`,
      transaction.student_id && transaction.student_id !== "N/A"
        ? `ID: ${transaction.student_id}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
    isExpense,
  };
};

export const getVoucherFileName = (transaction) => {
  const id = String(transaction?._id || "").slice(-8).toUpperCase() || "VOUCHER";
  const date = moment(transaction?.action_date).format("YYYYMMDD");
  return `finance-voucher-${id}-${date}.pdf`;
};
