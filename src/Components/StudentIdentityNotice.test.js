import React from 'react';
import { act, render, screen } from '@testing-library/react';
import axios from 'axios';
import StudentIdentityNotice from './StudentIdentityNotice';
jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn() } }));

beforeEach(() => { jest.useFakeTimers(); axios.post.mockReset(); });
afterEach(() => jest.useRealTimers());
const completeLookup = async () => act(async () => { jest.advanceTimersByTime(450); await Promise.resolve(); });

test('ordinary new admission waits for phone lookup and then enables proceeding', async () => {
  const result = jest.fn();
  axios.post.mockResolvedValue({ data: { found: false, pending_total: 0, dues: [] } });
  render(<StudentIdentityNotice phone="03001234567" batch="next" authToken="test-token" active onResult={result} />);
  expect(result).toHaveBeenLastCalledWith({ blocked: true, loading: true });
  await completeLookup();
  expect(screen.getByText('New student')).toBeInTheDocument();
  expect(result.mock.calls.at(-1)[0].blocked).toBe(false);
});

test('existing student dues show the batch and block admission', async () => {
  const result = jest.fn();
  axios.post.mockResolvedValue({ data: { found: true, student: { name: 'Existing Student', batch: 'old' }, pending_total: 12500,
    dues: [{ batch_id: 'old', batch_name: 'Previous CSS Batch', pending: 12500 }] } });
  render(<StudentIdentityNotice phone="03001234567" batch="next" authToken="test-token" active onResult={result} />);
  await completeLookup();
  expect(screen.getByText(/Previous CSS Batch/)).toHaveTextContent('12,500');
  expect(result.mock.calls.at(-1)[0].blocked).toBe(true);
});

test('same batch is blocked but a settled existing student can join another batch', async () => {
  const result = jest.fn();
  axios.post.mockResolvedValue({ data: { found: true, student: { name: 'Existing Student', batch: 'old' }, pending_total: 0, dues: [] } });
  const { rerender } = render(<StudentIdentityNotice phone="03001234567" batch="old" authToken="test-token" active onResult={result} />);
  await completeLookup(); expect(result.mock.calls.at(-1)[0].blocked).toBe(true);
  rerender(<StudentIdentityNotice phone="03001234567" batch="new" authToken="test-token" active onResult={result} />);
  await completeLookup(); expect(result.mock.calls.at(-1)[0].blocked).toBe(false);
  expect(screen.getByText(/No duplicate account or student/)).toBeInTheDocument();
});

test('lookup errors fail closed instead of enabling duplicate admission', async () => {
  const result = jest.fn();
  axios.post.mockRejectedValue({ response: { data: { message: 'Identity needs review' } } });
  render(<StudentIdentityNotice phone="03001234567" batch="new" authToken="test-token" active onResult={result} />);
  await completeLookup(); expect(result.mock.calls.at(-1)[0].blocked).toBe(true);
  expect(screen.getByText('Identity needs review')).toBeInTheDocument();
});
