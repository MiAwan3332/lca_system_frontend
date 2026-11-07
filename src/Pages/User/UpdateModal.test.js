import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import UpdateModal from './UpdateModal';
import { can } from '../../utlls/accessCapabilities';
import axios from 'axios';
jest.mock('axios');
jest.mock('react-redux', () => ({ useDispatch: () => jest.fn(() => ({ unwrap: () => Promise.resolve() })), useSelector: () => ({ updateStatus: 'idle' }) }));
jest.mock('../../utlls/accessCapabilities', () => {
  const state = { owner: true };
  return { can: jest.fn(() => true), canUseField: () => true, accessFieldName: (value) => value, accessSnapshot: () => state, subscribeAccess: () => () => {} };
});
function Location() { return <div data-testid="location">{useLocation().pathname}</div>; }
const open = () => render(<ChakraProvider><MemoryRouter><UpdateModal user={{ _id: 'person1', name: 'Staff Person', email: 'staff@example.invalid', role: 'CEO', accountType: 'staff', phone: '03001234567' }} /><Location /></MemoryRouter></ChakraProvider>);
test('profile edit shows the access role and opens the correct access screen', async () => {
  can.mockReturnValue(true); open();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Staff Person' }));
  expect(await screen.findByText('Access role')).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Manage Access' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/access-management/people/person1');
});
test('profile editors without assignment permission do not get the shortcut', async () => {
  can.mockImplementation((key) => key !== 'access.assign'); open();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Staff Person' }));
  await screen.findByText('Access role');
  expect(screen.queryByRole('button', { name: 'Manage Access' })).not.toBeInTheDocument();
});
test('people with Set passwords can give a new password while editing', async () => {
  can.mockReturnValue(true); axios.post.mockResolvedValue({ data: { message: 'Password updated for Staff Person' } }); open();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Staff Person' }));
  const field = await screen.findByLabelText('New password');
  expect(field).not.toBeDisabled();
  fireEvent.change(field, { target: { name: 'password', value: 'short' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  expect(await screen.findByText('At least 8 characters')).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
  fireEvent.change(field, { target: { name: 'password', value: 'longenough1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/users\/person1\/password$/), { newPassword: 'longenough1' }, expect.anything()));
});
test('the password field stays locked without Set passwords', async () => {
  can.mockImplementation((key) => key !== 'users.set.user.password'); open();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Staff Person' }));
  expect(await screen.findByLabelText('New password')).toBeDisabled();
});
