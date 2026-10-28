import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import UpdateModal from './UpdateModal';
import { can } from '../../utlls/accessCapabilities';
jest.mock('react-redux', () => ({ useDispatch: () => jest.fn(), useSelector: () => ({ updateStatus: 'idle' }) }));
jest.mock('../../utlls/accessCapabilities', () => {
  const state = { owner: true };
  return { can: jest.fn(() => true), canUseField: () => true, accessFieldName: (value) => value, accessSnapshot: () => state, subscribeAccess: () => () => {} };
});
function Location() { return <div data-testid="location">{useLocation().pathname}</div>; }
const open = () => render(<ChakraProvider><MemoryRouter><UpdateModal user={{ _id: 'person1', name: 'Staff Person', email: 'staff@example.invalid', role: 'CEO', accountType: 'staff', phone: '03001234567' }} /><Location /></MemoryRouter></ChakraProvider>);
test('profile edit shows account category and opens the correct access screen', async () => {
  can.mockReturnValue(true); open();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Staff Person' }));
  expect(await screen.findByText('Account category')).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Manage Access' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/access-management/people/person1');
});
test('profile editors without assignment permission do not get the shortcut', async () => {
  can.mockImplementation((key) => key !== 'access.assign'); open();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Staff Person' }));
  await screen.findByText('Account category');
  expect(screen.queryByRole('button', { name: 'Manage Access' })).not.toBeInTheDocument();
});
