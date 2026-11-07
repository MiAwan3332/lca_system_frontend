const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const XLSX = require('xlsx');
let workbook;
const exported = {};
const source = fs.readFileSync('src/utlls/generateFinanceTransactionsReport.js', 'utf8');
const code = babel.transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
vm.runInNewContext(code, { exports: exported, require: (name) => name === 'xlsx' ? { ...XLSX, writeFile: (book) => { workbook = book; } } : require(name) });
const common = { student_id: 'student-1', batch_id: 'batch-1', student_name: 'Verification', roll_number: 'OC-VERIFY-1', action_type: 'Paid', payment_method: 'Cash', total_batch_fee: 100000, paid_fee: 55000, pending_fee: 45000 };
const payments = [{ ...common, action_amount: 30000 }, { ...common, action_amount: 25000 }];
const grouped = exported.buildCollectionRows(payments, { paymentsOnly: true });
assert.equal(grouped.length, 1); assert.equal(grouped[0].PAID, 55000); assert.equal(grouped[0].CASH, 55000); assert.equal(grouped[0].TOTAL, 100000);
const mixed = exported.buildCollectionRows([payments[0], { ...payments[1], payment_method: 'Bank Transfer' }, { ...common, action_type: 'Refund', action_amount: 5000 }], { paymentsOnly: true });
assert.equal(mixed[0].PAID, 50000); assert.equal(mixed[0].CASH, 25000); assert.equal(mixed[0].ONLINE, 25000);
assert.equal(exported.buildCollectionRows([payments[0], { ...payments[1], batch_id: 'batch-2' }], { paymentsOnly: true }).length, 2);
assert.equal(exported.buildCollectionRows([{ ...common, action_type: 'Created' }], { paymentsOnly: true }).length, 0);
exported.exportFinanceTransactionsExcel({ period: 'daily', date: '2026-10-24', transactions: payments });
assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets['Daily Collection']).filter((row) => row.NAMES === 'Verification').length, 1);
console.log('PASS daily Excel groups collection amounts, preserves totals/channels/refunds and separates batches');
const slip = fs.readFileSync('src/utlls/generatePendingPaymentSlip.js', 'utf8');
const formula = slip.slice(slip.indexOf('  const remainingAmount ='), slip.indexOf('  const isFullyDiscounted ='));
for (const data of [{ totalFee: 100000, paidFee: 55000, outstandingBalance: 70000, payingNow: 25000, remainingAfter: 45000 },
  { totalFee: 0, paidFee: 0, outstandingBalance: 100000, payingNow: 0, remainingAfter: 0, discountAmount: 100000 }]) {
  const totals = vm.runInNewContext(`(() => { ${formula} return [totalAfterDiscount, cumulativePaid, remainingAmount]; })()`,
    { data, payingNow: data.payingNow, remainingAfter: data.remainingAfter, discount: data.discountAmount || 0 });
  assert.equal(totals[0], data.totalFee); assert.equal(totals[1], data.paidFee); assert.equal(totals[2], data.remainingAfter);
}
assert.ok(!/drawRow\(["'](?:Remarks|Discount|Discount Remarks)/.test(slip));
console.log('PASS later-payment and zero-fee slips use cumulative totals and keep remarks/discount off print');
