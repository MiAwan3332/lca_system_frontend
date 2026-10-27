import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import AccessWorkspace from './AccessWorkspace';
import { can } from '../../utlls/accessCapabilities';
jest.mock('axios');
jest.mock('../../utlls/accessCapabilities', () => {
  const snapshot = { owner: true, userId: 'owner' };
  return { can: jest.fn(() => true), canUseField: () => true, refreshAccess: jest.fn(), accessSnapshot: () => snapshot, subscribeAccess: () => () => {} };
});
const role = { _id: 'r1', name: 'Admissions Officer', description: 'Admission duties', active: true, revision: 2, memberCount: 6, grants: [{ permission: 'students.get.students', scope: 'own' }] };
let api;
beforeEach(() => {
  sessionStorage.clear(); jest.clearAllMocks();
  can.mockImplementation(() => true);
  api = { get: jest.fn(async (path) => ({ data: path === '/catalog' ? { permissions: [
    { key: 'students.get.students', group: 'students', label: 'Get students', type: 'action' },
    { key: 'fields.contact.read', group: 'fields', type: 'field', fields: ['phone', 'email'] },
  ] } : path === '/roles/r1' ? role : path === '/roles' ? { docs: [role], page: 1, totalDocs: 1 } : { docs: [], page: 1 } })), post: jest.fn(async (path) => ({ data: path.endsWith('/preview') ? { activeAssignments: 6, onboardingDefaults: [], added: [], removed: [] } : {} })), put: jest.fn(async () => ({ data: {} })) };
  axios.create.mockReturnValue(api);
});
const open = (url = '/access-management') => render(<ChakraProvider><MemoryRouter initialEntries={[url]}><AccessWorkspace /></MemoryRouter></ChakraProvider>);
test('create requires deliberate scope and reason, then reviews before publishing', async () => {
  open();
  fireEvent.click(await screen.findByRole('button', { name: 'Create Role' }));
  fireEvent.change(await screen.findByLabelText('Role name'), { target: { value: 'Batch Reviewer' } });
  fireEvent.click(screen.getByLabelText('View students'));
  expect(screen.getByLabelText('Scope students.get.students 0')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  expect(await screen.findByText(/Choose who view students applies to/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Scope students.get.students 0'), { target: { value: 'own' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByRole('button', { name: 'Create Role' })).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText('Reason for change'), { target: { value: 'Reviewed admission responsibilities' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create Role' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/roles', expect.objectContaining({ name: 'Batch Reviewer', grants: [{ permission: 'students.get.students', scope: 'own' }], reason: 'Reviewed admission responsibilities' })));
});
test('editing has context, back navigation and discard confirmation', async () => {
  open('/access-management/roles/r1');
  expect(await screen.findByText('Editing: Admissions Officer')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Role name'), { target: { value: 'Changed role' } });
  fireEvent.click(screen.getByRole('button', { name: 'Back to Roles' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(screen.getByLabelText('Role name')).toHaveValue('Changed role');
  fireEvent.click(screen.getByRole('button', { name: 'Back to Roles' }));
  fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Discard Changes' }));
  expect(await screen.findByRole('button', { name: 'Create Role' })).toBeInTheDocument();
  expect(api.put).not.toHaveBeenCalled();
});
test('description edits require review, retain revision, and do not drop existing grants', async () => {
  open('/access-management/roles/r1');
  fireEvent.change(await screen.findByLabelText('Description'), { target: { value: 'Updated purpose' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Description changed.')).toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText('Reason for change'), { target: { value: 'Clarify the role purpose' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/roles/r1', expect.objectContaining({ revision: 2, description: 'Updated purpose', grants: [{ permission: 'students.get.students', scope: 'own' }] })));
});
test('technical keys are hidden until requested and amount controls are not shown for student reads', async () => {
  open('/access-management/roles/r1');
  await screen.findByLabelText('Role name');
  expect(screen.queryByText('students.get.students')).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Amount students/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Technical details'));
  expect(screen.getByText('students.get.students')).toBeInTheDocument();
});
test('role draft survives leaving and reopening the editor', async () => {
  const view = open('/access-management/roles/r1');
  fireEvent.change(await screen.findByLabelText('Role name'), { target: { value: 'Retained draft' } });
  await waitFor(() => expect(sessionStorage.getItem('access-role-draft:owner:r1')).toContain('Retained draft'));
  view.unmount(); open('/access-management/roles/r1');
  expect(await screen.findByLabelText('Role name')).toHaveValue('Retained draft');
});
test('clone starts with copied permissions but no saved role identity', async () => {
  open(); fireEvent.click(await screen.findByRole('button', { name: 'Clone Admissions Officer' }));
  expect(await screen.findByLabelText('Role name')).toHaveValue('Admissions Officer Copy');
  expect(screen.getByLabelText('Scope students.get.students 0')).toHaveValue('own');
  expect(api.put).not.toHaveBeenCalled();
});
test('a stale save reports a conflict and retains the draft', async () => {
  api.put.mockRejectedValueOnce({ response: { data: { message: 'Role changed. Reload before editing.' }, status: 409 } });
  open('/access-management/roles/r1');
  fireEvent.change(await screen.findByLabelText('Role name'), { target: { value: 'My draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Reason for change'), { target: { value: 'Review conflict handling' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
  expect(await within(dialog).findByText('Role changed. Reload before editing.')).toBeInTheDocument();
  expect(screen.getByLabelText('Role name')).toHaveValue('My draft');
});
test('read-only access can inspect the role without editing or publishing', async () => {
  can.mockImplementation((permission) => permission !== 'access.manage');
  open('/access-management/roles/r1');
  expect(await screen.findByText('Viewing: Admissions Officer')).toBeInTheDocument();
  expect(screen.getByLabelText('Role name')).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Review Changes' })).not.toBeInTheDocument();
});
