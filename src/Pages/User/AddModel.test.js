import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import axios from 'axios';
import AddModel from './AddModel';
import { can } from '../../utlls/accessCapabilities';
import { addUser } from '../../Features/userSlice';
jest.mock('axios');
// The full Access Management screens render many form controls; jsdom needs longer than the 5s default.
jest.setTimeout(60000);
// The submission itself is covered by the creation tests; stop after the request is built so no status polling starts.
jest.mock('react-redux', () => ({ useDispatch: () => () => ({ unwrap: () => Promise.reject(new Error('Not submitted in this test')) }), useSelector: () => ({ addStatus: 'idle' }) }));
jest.mock('../../Features/userSlice', () => ({ addUser: jest.fn((payload) => ({ type: 'users/addUser', payload })), fetchUsers: jest.fn(() => ({ type: 'users/fetchUsers' })) }));
jest.mock('../../utlls/creationRecovery', () => ({ pendingCreationKey: () => null }));
jest.mock('../../utlls/accessCapabilities', () => {
  const state = { owner: true };
  return { can: jest.fn(() => true), canUseField: () => true, accessFieldName: (value) => value, accessSnapshot: () => state, subscribeAccess: () => () => {} };
});
const desk = { _id: 'r2', name: 'Information Desk', active: true, grants: [{ permission: 'students.get.students', scope: 'all' }] };
beforeEach(() => {
  jest.clearAllMocks(); document.cookie = 'authToken=test-only-token; path=/';
  can.mockImplementation(() => true); addUser.mockImplementation((payload) => ({ type: 'users/addUser', payload }));
  axios.create.mockReturnValue({ get: jest.fn(async () => ({ data: { docs: [desk], page: 1, totalDocs: 1, totalPages: 1 } })) });
});
const fill = async () => {
  render(<ChakraProvider><AddModel isOpen onClose={() => {}} /></ChakraProvider>);
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { name: 'name', value: 'New Desk' } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { name: 'email', value: 'desk@example.invalid' } });
  fireEvent.change(screen.getByLabelText(/^Contact Number/), { target: { name: 'phone', value: '03001234567' } });
};
test('Add User asks for the access role, not the old job title', async () => {
  await fill();
  expect(screen.queryByLabelText(/Job title/)).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: 'Access role' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Information Desk' }, { timeout: 5000 }));
  expect(screen.getByText(/work as Information Desk straight away/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^Add/ }));
  await waitFor(() => expect(addUser).toHaveBeenCalledWith(expect.objectContaining({ formData: expect.objectContaining({ accessRoleId: 'r2', accessBatchIds: [], accessCourseIds: [] }) })));
  expect(addUser.mock.calls[0][0].formData.role).toBeUndefined();
});
test('people who cannot assign roles keep the default onboarding behaviour', async () => {
  can.mockImplementation((key) => key !== 'access.assign');
  await fill();
  expect(screen.queryByRole('button', { name: 'Access role' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^Add/ }));
  await waitFor(() => expect(addUser).toHaveBeenCalled());
  expect(addUser.mock.calls[0][0].formData.accessRoleId).toBeUndefined();
});
