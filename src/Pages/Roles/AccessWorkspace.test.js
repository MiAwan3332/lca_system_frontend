import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import axios from 'axios';
import AccessWorkspace from './AccessWorkspace';
jest.mock('axios');
jest.mock('../../utlls/accessCapabilities', () => ({ can: () => true, refreshAccess: jest.fn() }));

test('role editor publishes explicit grants with a required reason', async () => {
  const api = { get: jest.fn(async (path) => ({ data: path === '/catalog' ? { permissions: [
    { key: 'students.get.students', group: 'students', label: 'List students', type: 'action' },
  ] } : path === '/defaults' ? { roles: {}, revision: 0 } : { docs: [], hasNextPage: false } })), post: jest.fn(async () => ({ data: {} })) };
  axios.create.mockReturnValue(api);
  render(<ChakraProvider><AccessWorkspace /></ChakraProvider>);
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/catalog'));
  fireEvent.click(screen.getByRole('button', { name: 'Create Role' }));
  fireEvent.change(screen.getByLabelText('Role name'), { target: { value: 'Batch Reviewer' } });
  fireEvent.click(await screen.findByLabelText('List students'));
  expect(screen.getByRole('button', { name: 'Publish Role' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Change reason'), { target: { value: 'Review admissions in selected batches' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish Role' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/roles', expect.objectContaining({ name: 'Batch Reviewer',
    grants: [expect.objectContaining({ permission: 'students.get.students', scope: 'all' })], reason: 'Review admissions in selected batches' })));
});
