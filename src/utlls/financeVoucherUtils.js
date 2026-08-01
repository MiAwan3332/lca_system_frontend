import moment from "moment";

export const VOUCHER_COPY_LABELS = ["Official Copy"];

export const PAYMENT_INSTRUCTIONS =
  "Official voucher. Retain this copy as proof of the recorded transaction.";

export const formatVoucherAmount = (transaction) => {
  const raw = transaction.action_amount ?? transaction.amount;
  const value = Number(raw) || 0;
  return transaction.type === "expense"
    ? `- Rs. ${value.toLocaleString()}`
    : `Rs. ${value.toLocaleString()}`;
};

const formatRs = (value) => {
  if (value == null || value === "") return "N/A";
  return `Rs. ${Number(value || 0).toLocaleString()}`;
};

export const buildVoucherData = (transaction) => {
  if (!transaction) return null;

  const voucherNumber = `LCA-V-${String(transaction._id || "").slice(-8).toUpperCase()}`;
  const isExpense = transaction.type === "expense";

  const studentName = isExpense
    ? transaction.title || transaction.student_name || "N/A"
    : transaction.student_name || "N/A";
  const batchName = transaction.batch_name || transaction.program || "N/A";

  const paidFeeRaw =
    transaction.paid_fee ?? transaction.paid_amount ?? null;
  const totalBatchFeeRaw =
    transaction.total_batch_fee ??
    transaction.total_fee ??
    transaction.batch_fee ??
    null;
  const pendingAmountRaw =
    transaction.pending_amount ??
    transaction.fee_pending_amount ??
    transaction.pending_fee ??
    null;
  const nextInstallmentRaw =
    transaction.next_installment_date ||
    (Number(pendingAmountRaw) > 0 ? transaction.due_date : null);

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
    paidFee: !isExpense ? formatRs(paidFeeRaw) : null,
    totalBatchFee: !isExpense ? formatRs(totalBatchFeeRaw) : null,
    pendingAmount: !isExpense ? formatRs(pendingAmountRaw ?? 0) : null,
    nextInstallmentDate: !isExpense
      ? nextInstallmentRaw
        ? moment(nextInstallmentRaw).format("DD MMM YYYY")
        : Number(pendingAmountRaw) > 0
          ? "N/A"
          : "Fully Paid"
      : null,
    paymentMethod: !isExpense
      ? transaction.payment_method ||
        (transaction.action_type === "Paid" ? "Cash" : null)
      : transaction.payment_method || null,
    dueDate: transaction.due_date
      ? moment(transaction.due_date).format("DD MMM YYYY")
      : "N/A",
    issueDate: moment(transaction.action_date).format("DD MMM YYYY"),
    issueTime: moment(transaction.action_date).format("hh:mm A"),
    paymentInstructions: PAYMENT_INSTRUCTIONS,
    processedBy: transaction.action_by || "Administration Office",
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
