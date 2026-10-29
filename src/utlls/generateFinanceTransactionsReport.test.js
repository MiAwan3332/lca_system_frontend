import * as XLSX from 'xlsx';
import { buildCollectionRows, financeTotals, exportFinanceTransactionsExcel } from './generateFinanceTransactionsReport';
jest.mock('./accessCapabilities', () => ({ requireOutput: () => {} }));
jest.mock('xlsx', () => {
  const actual = jest.requireActual('xlsx');
  return { ...actual, writeFile: jest.fn(), utils: actual.utils };
});

const paid = { _id: 'p1', type: 'fee', action_type: 'Paid', action_amount: 5000, student_id: 's1', student_name: 'Paying Student', batch_id: 'b1', batch_name: 'Batch A', payment_method: 'Cash', paid_fee: 5000, pending_amount: 15000, total_batch_fee: 20000, student_cash_amount: 90000 };
const created = { _id: 'c2', type: 'fee', action_type: 'Created', action_amount: 20000, student_id: 's2', student_name: 'Free Student', batch_id: 'b1', batch_name: 'Batch A', paid_fee: 0, pending_amount: 0, total_batch_fee: 20000 };
const fullDiscount = { _id: 'd2', type: 'fee', action_type: 'Discounted', action_amount: 20000, student_id: 's2', student_name: 'Free Student', batch_id: 'b1', batch_name: 'Batch A', paid_fee: 0, pending_amount: 0, total_batch_fee: 20000 };
const refund = { _id: 'r3', type: 'refund', action_type: 'Refund', action_amount: -3000, student_id: 's3', student_name: 'Refunded Student', batch_id: 'b2', batch_name: 'Batch B', payment_method: 'Online Payment', paid_fee: 7000, pending_amount: 0, total_batch_fee: 10000 };

test('the daily sheet lists fully discounted students, who have no payment entry', () => {
  const rows = buildCollectionRows([paid, created, fullDiscount, refund], { paymentsOnly: true });
  expect(rows.map((row) => row.NAMES)).toEqual(['Paying Student', 'Refunded Student', 'Free Student']);
  const free = rows.find((row) => row.NAMES === 'Free Student');
  expect(free).toMatchObject({ PAID: 0, CASH: 0, ONLINE: 0, REMAINING: 0, TOTAL: 20000 });
  expect(free.REMARKS).toMatch(/100% discount: Rs 20,000/);
  expect(rows.find((row) => row.NAMES === 'Refunded Student')).toMatchObject({ ONLINE: -3000, PAID: -3000 });
});

test('a partial discount on a payment day is noted on that payment row', () => {
  const discount = { ...fullDiscount, student_id: 's1', student_name: 'Paying Student', action_amount: 2000, pending_amount: 15000, paid_fee: 5000 };
  const rows = buildCollectionRows([paid, discount], { paymentsOnly: true });
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ PAID: 5000, CASH: 5000 });
  expect(rows[0].REMARKS).toMatch(/^Discount: Rs 2,000/);
});

test('entries that move no money add nothing to cash or online', () => {
  const rows = buildCollectionRows([paid, created, fullDiscount]);
  expect(rows.reduce((sum, row) => sum + row.CASH + row.ONLINE, 0)).toBe(5000);
});

test('totals count payments less refunds, and show refunds and discounts on their own', () => {
  const expense = { type: 'expense', action_type: 'Expense', action_amount: 1000 };
  expect(financeTotals([paid, created, fullDiscount, refund, expense])).toEqual({ count: 5, fee: 2000, expense: 1000, refund: 3000, discount: 20000 });
});

test.each([['daily', '2026-10-29', '2026-10-29', ['Daily Collection', 'Batch Wise']], ['monthly', '2026-10-01', '2026-10-31', ['Collection', 'Batch Wise', 'Report Info']]])(
  'every %s Excel export has refunds per batch', (period, startDate, endDate, sheets) => {
    exportFinanceTransactionsExcel({ transactions: [paid, fullDiscount, refund], period, date: startDate, startDate, endDate,
      batchWise: [{ batch_name: 'Batch A', total_cash: 5000, total_online: 0, total_refund: 0, total: 5000 }, { batch_name: 'Batch B', total_cash: 0, total_online: -3000, total_refund: 3000, total: -3000 }] });
    const workbook = XLSX.writeFile.mock.calls.at(-1)[0];
    expect(workbook.SheetNames).toEqual(sheets);
    const batches = XLSX.utils.sheet_to_json(workbook.Sheets['Batch Wise']);
    expect(batches[1]).toMatchObject({ Batch: 'Batch B', 'Total Refund': 3000 });
  });
