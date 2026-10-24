import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import StudentPaymentEvidenceEditor from './StudentPaymentEvidenceEditor';
jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock('./CreationProcessing', () => () => <span>Processing saved evidence</span>);

beforeEach(() => {
  axios.get.mockReset(); axios.post.mockReset();
  URL.createObjectURL = jest.fn(() => 'blob:verification'); URL.revokeObjectURL = jest.fn();
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'verification-key-123456789' } });
});

test('retains selected old evidence and submits multiple new photos without another payment', async () => {
  axios.get.mockResolvedValue({ data: { docs: [{ _id: 'paid-log', action_amount: 500, action_date: '2026-10-24', payment_method: 'Online Payment',
    payment_evidence: ['https://example.invalid/one.jpg', 'https://example.invalid/two.jpg'] }], hasNextPage: true } });
  axios.post.mockResolvedValue({ data: { submission_status: 'complete', idempotency_key: 'verification-key-123456789', processing_status: 'pending' } });
  const { container } = render(<StudentPaymentEvidenceEditor studentId="student-id" authToken="test-token" />);
  await waitFor(() => expect(screen.getByRole('option', { name: /500/ })).toBeInTheDocument());
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'paid-log' } });
  fireEvent.click(screen.getByLabelText('Keep attachment 1'));
  fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [new File(['one'], 'one.png', { type: 'image/png' }), new File(['two'], 'two.png', { type: 'image/png' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Payment Evidence' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
  const [url, body] = axios.post.mock.calls[0];
  expect(url).toMatch(/student-id\/payment-evidence\/paid-log$/);
  expect(body.getAll('payment_evidence')).toHaveLength(2);
  expect(JSON.parse(body.get('keep_evidence'))).toEqual(['https://example.invalid/two.jpg']);
  expect(body.has('amount')).toBe(false);
  await waitFor(() => expect(screen.getByText('Processing saved evidence')).toBeInTheDocument());
});
