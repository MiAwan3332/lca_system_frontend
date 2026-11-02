import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import axios from 'axios';
import RevertPaymentModal, { canSubmitReversal, removalLines } from './RevertPaymentModal';
import { paymentTimeline, newestUndoableId } from './StudentHistoryModal';

jest.mock('axios');
jest.mock('../../Components/PaymentEvidenceGallery', () => () => null);

const preview = (extra = {}) => ({
  student: { _id: 's', name: 'Umee Habiba', roll_number: 'OC-MARATHON-193', batch: 'Marathon' },
  step: { _id: 'p', type: 'Paid', label: 'Payment', amount: 20000, date: '2026-10-28T10:00:00Z', by: 'Cashier', description: 'Desk', payment_method: 'Cash', payment_evidence: '', batch: 'Marathon' },
  receipts: [{ _id: 'r', amount: 20000, created_at: '2026-10-28T10:00:05Z' }],
  slips: [{ _id: 'sl', amount: 20000, issued_at: '2026-10-28T10:00:08Z' }],
  fee_changes: [{ fee: 'f', batch: 'Marathon', before_amount: 5000, after_amount: 25000, before_status: 'Pending', after_status: 'Pending' }],
  refund_request: null,
  totals_before: { paid_fee: 20000, pending_fee: 5000, total_fee: 25000, cash_amount: 20000, online_amount: 0 },
  totals_after: { paid_fee: 0, pending_fee: 25000, total_fee: 25000, cash_amount: 0, online_amount: 0 },
  blockers: [], warnings: [], legacy: false, reasons: ['Payment never received', 'Other'], ...extra,
});
const show = (onReverted = jest.fn(), log = { _id: 'p', action_type: 'Paid' }) => render(<ChakraProvider><RevertPaymentModal log={log} onReverted={onReverted} /></ChakraProvider>);

test('lists every record the undo removes or changes', () => {
  const lines = removalLines(preview());
  expect(lines).toHaveLength(4);
  expect(lines[0]).toMatch(/Payment entry Rs\. 20,000 · Marathon · Cash/);
  expect(lines[1]).toMatch(/Fee receipt/);
  expect(lines[2]).toMatch(/verification link will show it as cancelled/);
  expect(lines[3]).toMatch(/Rs\. 5,000 → Rs\. 25,000, Pending/);
});

test('the revert needs a reason, details, the confirmation, acknowledged warnings and no blockers', () => {
  const ok = { preview: preview(), reason: 'Other', note: 'Never received at desk', acknowledged: false, understood: true };
  expect(canSubmitReversal(ok)).toBe(true);
  expect(canSubmitReversal({ ...ok, reason: '' })).toBe(false);
  expect(canSubmitReversal({ ...ok, note: 'too short' })).toBe(false);
  expect(canSubmitReversal({ ...ok, understood: false })).toBe(false);
  expect(canSubmitReversal({ ...ok, preview: preview({ warnings: ['Moved batch'] }) })).toBe(false);
  expect(canSubmitReversal({ ...ok, acknowledged: true, preview: preview({ warnings: ['Moved batch'] }) })).toBe(true);
  expect(canSubmitReversal({ ...ok, preview: preview({ blockers: ['Later payment'] }) })).toBe(false);
});

test('the popup previews the payment, then reverts with the reason and refreshes the history', async () => {
  axios.post.mockResolvedValueOnce({ data: preview() }).mockResolvedValueOnce({ data: { message: 'Rs 20000 payment reverted.' } });
  const onReverted = jest.fn();
  show(onReverted);
  fireEvent.click(screen.getByRole('button', { name: 'Undo payment' }));
  expect(await screen.findByText('Umee Habiba')).toBeInTheDocument();
  const dialog = screen.getByRole('dialog');
  expect(axios.post.mock.calls[0][1]).toEqual({ preview: true });
  const submit = within(dialog).getByRole('button', { name: 'Undo payment' });
  expect(submit).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Payment never received' } });
  fireEvent.change(screen.getByLabelText('Details'), { target: { value: 'Cashier confirmed no money arrived' } });
  fireEvent.click(screen.getByText(/I understand this changes/));
  expect(submit).toBeEnabled();
  fireEvent.click(submit);
  await waitFor(() => expect(onReverted).toHaveBeenCalled());
  expect(axios.post.mock.calls[1][1]).toEqual({ reason: 'Payment never received', note: 'Cashier confirmed no money arrived', acknowledged: false });
});

test('a blocked payment shows why and cannot be reverted', async () => {
  axios.post.mockResolvedValueOnce({ data: preview({ blockers: ['A later payment of Rs 4000 was recorded after this one. Undo the newest payment first.'] }) });
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Undo payment' }));
  expect(await screen.findByText(/Undo the newest payment first/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Reason')).toBeNull();
  expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Undo payment' })).toBeDisabled();
});

test('reverted payments stay on the timeline in date order', () => {
  const items = paymentTimeline({
    payment_logs: [{ _id: 'a', action_date: '2026-10-01' }, { _id: 'b', action_date: '2026-10-20' }],
    payment_reversals: [{ _id: 'r', reverted_at: '2026-10-29' }],
  });
  expect(items.map(({ kind, item }) => `${kind}:${item._id}`)).toEqual(['reversal:r', 'log:b', 'log:a']);
});

test('each step type lists exactly what undoing it changes', () => {
  const discount = removalLines(preview({ step: { ...preview().step, type: 'Discounted', label: 'Discount', amount: 5000, description: 'Sibling' }, receipts: [], slips: [] }));
  expect(discount[0]).toBe('Discount entry Rs. 5,000 · Marathon (Sibling)');
  const refund = removalLines(preview({ step: { ...preview().step, type: 'Refund', label: 'Refund', amount: 3000, batch: '' }, receipts: [], slips: [], fee_changes: [], refund_request: { amount: 3000 } }));
  expect(refund).toEqual(['Refund entry Rs. 3,000 · Cash', 'Refund request of Rs. 3,000 goes back to approved, not yet paid out', 'The student is marked active again']);
  const fee = removalLines(preview({ step: { ...preview().step, type: 'Created', label: 'Fee assignment', amount: 100000 }, receipts: [], slips: [], fee_changes: [{ fee: 'f', removes_fee: true }] }));
  expect(fee).toEqual(['Fee assignment Rs. 100,000 · Marathon: the fee record is removed']);
});

test('steps saved at the same moment keep their saved order, and only the newest can be undone', () => {
  const at = '2026-11-01T10:00:00Z';
  const timeline = paymentTimeline({ payment_logs: [
    { _id: '6a0000000000000000000001', action_date: at, action_type: 'Created' },
    { _id: '6a0000000000000000000003', action_date: at, action_type: 'Paid' },
    { _id: '6a0000000000000000000002', action_date: at, action_type: 'Discounted' },
  ] });
  expect(timeline.map(({ item }) => item.action_type)).toEqual(['Paid', 'Discounted', 'Created']);
  expect(newestUndoableId(timeline)).toBe('6a0000000000000000000003');
});
