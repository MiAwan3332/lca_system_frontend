import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import FeesRecordsTable from './FeesRecordsTable';
let mockPermissions = [];
const mockAccess = { managed: true, ready: true, grants: [] };
jest.mock('../utlls/accessCapabilities', () => ({ ...jest.requireActual('../utlls/accessCapabilities'), accessSnapshot: () => mockAccess, can: (permission) => mockPermissions.includes(permission) }));
jest.mock('../Pages/Fees/PayFeeModal', () => () => <span>Pay Fee</span>);
jest.mock('../Pages/Fees/DeleteFeeModal', () => () => <span>Delete Fee</span>);
jest.mock('../Pages/Fees/DiscountFeeModal', () => () => <span>Apply Discount</span>);
jest.mock('../Pages/Fees/FeeHistoryModal', () => () => null);
const fee = { _id: 'fixture', amount: 500, status: 'Pending', due_date: '2099-01-01', student: { _id: 's', name: 'Fixture student' }, batch: { _id: 'b', name: 'Fixture batch' } };
const show = () => render(<ChakraProvider><FeesRecordsTable fees={[fee]} fetchStatus="succeeded" viewOnly={false} pagination={{ page: 1, totalPages: 1, totalDocs: 1, limit: 10 }} /></ChakraProvider>);

const openActions = () => fireEvent.click(screen.getByRole('button', { name: 'More actions' }));

test('the discount action appears only for roles with discount permission', async () => {
  mockPermissions = [];
  const { unmount } = show(); openActions();
  expect(await screen.findByText('Pay Fee')).toBeInTheDocument();
  expect(screen.queryByText('Apply Discount')).toBeNull();
  unmount();
  mockPermissions = ['fees.discount.fee'];
  show(); openActions();
  expect(await screen.findByText('Apply Discount')).toBeInTheDocument();
});
