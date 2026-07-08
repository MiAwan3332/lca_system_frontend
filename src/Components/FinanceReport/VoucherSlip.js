import React from "react";
import { QRCodeSVG } from "qrcode.react";

function VoucherSlip({ data, copyLabel }) {
  if (!data) return null;

  const fields = [
    ["Voucher No.", data.voucherNumber],
    ["Student Name", data.studentName],
    ["Student ID", data.studentId],
    ["Program / Course", data.program],
    ["Fee Description", data.feeDescription],
    ["Amount", data.amount],
    ["Due Date", data.dueDate],
    ["Issue Date", `${data.issueDate} ${data.issueTime}`],
  ];

  return (
    <article className="voucher-slip">
      <header className="voucher-slip__header">
        <div>
          <p className="voucher-slip__org">LCA — Learning & Career Academy</p>
          <h3 className="voucher-slip__title">
            {data.isExpense ? "Official Expense Voucher" : "Official Fee Voucher"}
          </h3>
        </div>
        <span className="voucher-slip__copy-badge">{copyLabel}</span>
      </header>

      <div className="voucher-slip__body">
        <div className="voucher-slip__fields">
          {fields.map(([label, value]) => (
            <div key={label} className="voucher-slip__field">
              <span className="voucher-slip__label">{label}</span>
              <span className="voucher-slip__value">{value}</span>
            </div>
          ))}
        </div>

        <div className="voucher-slip__qr-wrap">
          <QRCodeSVG value={data.qrValue} size={72} level="M" includeMargin />
          <span className="voucher-slip__qr-caption">Scan to verify</span>
          <span className="voucher-slip__qr-meta">{data.studentName}</span>
          <span className="voucher-slip__qr-meta">{data.batchName}</span>
        </div>
      </div>

      <section className="voucher-slip__instructions">
        <strong>Payment Instructions:</strong> {data.paymentInstructions}
      </section>

      <footer className="voucher-slip__footer">
        <div className="voucher-slip__signature">
          <span>Authorized Signature</span>
          <div className="voucher-slip__signature-line" />
        </div>
        <div className="voucher-slip__meta">
          <span>Processed by: {data.processedBy}</span>
          <span>Action: {data.actionType}</span>
        </div>
      </footer>
    </article>
  );
}

export default VoucherSlip;
