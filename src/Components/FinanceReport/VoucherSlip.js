import React from "react";

/**
 * Preview-only card matching Admission Slip structure.
 * Actual Print / Download use A4 PDF (generateFinanceVoucherPdf).
 */
function VoucherSlip({ data }) {
  if (!data) return null;

  const slipTitle = data.isExpense ? "EXPENSE VOUCHER" : "FEE VOUCHER";

  return (
    <article className="voucher-slip">
      <header className="voucher-slip__header">
        <div className="voucher-slip__brand">
          <div className="voucher-slip__logo">LCA</div>
          <div>
            <p className="voucher-slip__org">Lahore CSS Academy</p>
            <h3 className="voucher-slip__title">{slipTitle}</h3>
          </div>
        </div>
      </header>

      <div className="voucher-slip__identity">
        <div className="voucher-slip__photo">LCA</div>
        <div className="voucher-slip__name-block">
          <span className="voucher-slip__name-label">
            {data.isExpense ? "TITLE" : "STUDENT NAME"}
          </span>
          <h4 className="voucher-slip__name">{data.studentName}</h4>
          <span className="voucher-slip__status">{data.actionType}</span>
          <p className="voucher-slip__meta-line">Voucher: {data.voucherNumber}</p>
          <p className="voucher-slip__meta-line">
            Issued: {data.issueDate}, {data.issueTime}
          </p>
        </div>
      </div>

      <div className="voucher-slip__chips">
        <div className="voucher-slip__chip">
          <span className="voucher-slip__chip-label">Batch</span>
          <span className="voucher-slip__chip-value">{data.batchName}</span>
        </div>
        <div className="voucher-slip__chip">
          <span className="voucher-slip__chip-label">Student ID</span>
          <span className="voucher-slip__chip-value">{data.studentId}</span>
        </div>
        <div className="voucher-slip__chip voucher-slip__chip--full">
          <span className="voucher-slip__chip-label">Description</span>
          <span className="voucher-slip__chip-value">{data.feeDescription}</span>
        </div>
        <div className="voucher-slip__chip">
          <span className="voucher-slip__chip-label">Action</span>
          <span className="voucher-slip__chip-value">{data.actionType}</span>
        </div>
        <div className="voucher-slip__chip">
          <span className="voucher-slip__chip-label">Method</span>
          <span className="voucher-slip__chip-value">
            {data.paymentMethod || "N/A"}
          </span>
        </div>
        {!data.isExpense && (
          <>
            <div className="voucher-slip__chip">
              <span className="voucher-slip__chip-label">Total Batch Fee</span>
              <span className="voucher-slip__chip-value">
                {data.totalBatchFee}
              </span>
            </div>
            <div className="voucher-slip__chip">
              <span className="voucher-slip__chip-label">Paid Fee</span>
              <span className="voucher-slip__chip-value">{data.paidFee}</span>
            </div>
            <div className="voucher-slip__chip">
              <span className="voucher-slip__chip-label">Pending Amount</span>
              <span className="voucher-slip__chip-value">
                {data.pendingAmount}
              </span>
            </div>
            <div className="voucher-slip__chip">
              <span className="voucher-slip__chip-label">
                Next Installment Date
              </span>
              <span className="voucher-slip__chip-value">
                {data.nextInstallmentDate}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="voucher-slip__amount">
        <span className="voucher-slip__amount-label">
          {data.isExpense ? "AMOUNT" : "AMOUNT RECEIVED"}
        </span>
        <strong className="voucher-slip__amount-value">{data.amount}</strong>
      </div>

      <p className="voucher-slip__receipt-label">
        {data.isExpense
          ? "AUTHENTICATED EXPENSE VOUCHER"
          : "AUTHENTICATED FEE VOUCHER RECEIPT"}
      </p>
      <p className="voucher-slip__note">{data.paymentInstructions}</p>

      <div className="voucher-slip__sign-row">
        <div className="voucher-slip__signature">
          <span className="voucher-slip__signer">{data.processedBy}</span>
          <div className="voucher-slip__signature-line" />
          <span>Authorized Signature</span>
        </div>
      </div>

      <footer className="voucher-slip__footer">
        <span>0331-000-111-0 · 0333-9800938</span>
        <span>13-Sher Shah, New Garden Town, Barkat Market, Lahore</span>
      </footer>
    </article>
  );
}

export default VoucherSlip;
