import React, { forwardRef } from "react";
import VoucherSlip from "./VoucherSlip";
import { VOUCHER_COPY_LABELS } from "../../utlls/financeVoucherUtils";

const VoucherPrintSheet = forwardRef(function VoucherPrintSheet({ data }, ref) {
  if (!data) return null;

  return (
    <div ref={ref} id="finance-voucher-sheet" className="voucher-print-sheet">
      {VOUCHER_COPY_LABELS.map((copyLabel) => (
        <VoucherSlip key={copyLabel} data={data} copyLabel={copyLabel} />
      ))}
    </div>
  );
});

export default VoucherPrintSheet;
