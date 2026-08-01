import React, { forwardRef } from "react";
import VoucherSlip from "./VoucherSlip";

const VoucherPrintSheet = forwardRef(function VoucherPrintSheet({ data }, ref) {
  if (!data) return null;

  return (
    <div ref={ref} id="finance-voucher-sheet" className="voucher-print-sheet">
      <VoucherSlip data={data} />
    </div>
  );
});

export default VoucherPrintSheet;
