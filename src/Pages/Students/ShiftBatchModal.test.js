import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, fireEvent } from '@testing-library/react';
import ShiftBatchModal from './ShiftBatchModal';
import { transferStudentBatch } from '../../Features/studentSlice';
import { can } from '../../utlls/accessCapabilities';

const mockDispatch = jest.fn();
const mockAccess = { managed: true };
const mockBatches = [{ _id: 'destination', name: 'Destination', batch_fee: '15000', is_paid_batch: true }];
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch, useSelector: (selector) => selector({ students: { transferBatchStatus: 'idle', pendingFeeSlipStatus: 'idle' } }) }));
jest.mock('../../Features/batchSlice', () => ({ fetchBatches: jest.fn(() => ({ type: 'fetch-batches' })), selectActiveBatches: () => mockBatches }));
jest.mock('../../Features/studentSlice', () => ({ transferStudentBatch: jest.fn(), getOrCreatePendingFeeSlip: jest.fn(), fetchStudents: jest.fn() }));
jest.mock('../../utlls/accessCapabilities', () => ({ can: jest.fn(() => true), accessSnapshot: () => mockAccess, subscribeAccess: () => () => {}, canUseField: () => true }));
jest.mock('../../utlls/useful', () => ({ canShiftStudentBatch: () => true, getMediaUrl: value => value }));
jest.mock('../../Components/ActionButton', () => ({ onClick }) => <button onClick={onClick}>Open shift</button>);
jest.mock('../../Components/SearchableBatchSelect', () => ({ value, onChange }) => <select aria-label="Destination" value={value} onChange={e => onChange(e.target.value)}><option value="">Choose</option><option value="destination">Destination</option></select>);
jest.mock('../../utlls/generatePendingFeeSlip', () => ({ generatePendingFeeSlipPdf: jest.fn(), openFeeSlipUrl: jest.fn() }));

beforeEach(() => { mockDispatch.mockClear(); transferStudentBatch.mockClear(); can.mockReturnValue(true); global.fetch = jest.fn(); });

test('opening and choosing a batch never posts a transfer as a metadata probe', () => {
  render(<ChakraProvider><ShiftBatchModal student={{ _id: 'student', batch: { _id: 'source', name: 'Source' }, pending_fee: 6000 }} /></ChakraProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Open shift' }));
  fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'destination' } });
  expect(global.fetch).not.toHaveBeenCalled();
  expect(transferStudentBatch).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Transfer Pending Dues to New Batch' })).toBeEnabled();
});

test('shift permission alone does not enable the discounting transfer', () => {
  can.mockReturnValue(false);
  render(<ChakraProvider><ShiftBatchModal student={{ _id: 'student', batch: { _id: 'source', name: 'Source' }, pending_fee: 6000 }} /></ChakraProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Open shift' }));
  fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'destination' } });
  expect(screen.getByRole('button', { name: 'Transfer Pending Dues to New Batch' })).toBeDisabled();
});
