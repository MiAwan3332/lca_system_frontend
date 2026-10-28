import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import AccessWorkspace from './AccessWorkspace';
import { can } from '../../utlls/accessCapabilities';
jest.mock('axios');
// The full Access Management screens render many form controls; jsdom needs longer than the 5s default.
jest.setTimeout(60000);
jest.mock('../../utlls/accessCapabilities', () => {
  const snapshot = { owner: true, userId: 'owner' };
  const actual = jest.requireActual('../../utlls/accessCapabilities');
  return { routeAllowed: actual.routeAllowed, routesForGrants: actual.routesForGrants, can: jest.fn(() => true), canUseField: () => true, refreshAccess: jest.fn(), accessSnapshot: () => snapshot, subscribeAccess: () => () => {} };
});
const role = { _id: 'r1', name: 'Admissions Officer', description: 'Admission duties', active: true, revision: 2, memberCount: 6, grants: [{ permission: 'students.get.students', scope: 'own' }] };
const desk = { _id: 'r2', code: 'lca-staff-information-desk', name: 'Information Desk', active: true, revision: 1, memberCount: 1, grants: [{ permission: 'students.get.students', scope: 'all' }] };
const pending = { _id: 'r3', code: 'lca-v1-pending-staff', name: 'Staff - Pending Assignment', active: true, revision: 1, grants: [{ permission: 'users.get.user', scope: 'own' }] };
const person = { _id: 'u1', name: 'Sara Staff', email: 'sara@example.invalid', accountType: 'staff', accessRoles: [{ _id: 'r3', name: pending.name, code: pending.code }] };
const rules = [{ code: 'lca-staff-information-desk', name: 'Information Desk', rules: ['Cannot apply discounts (owner only)'] }];
let api;
const respond = (path) => {
  if (path === '/catalog') return { permissions: [{ key: 'students.get.students', group: 'students', label: 'Get students', type: 'action' }, { key: 'fields.contact.read', group: 'fields', type: 'field', fields: ['phone', 'email'] }] };
  if (path === '/roles/r1') return role;
  if (path === '/roles/r2') return desk;
  if (path === '/roles') return { docs: [role, desk, pending], page: 1, totalDocs: 3, totalPages: 1 };
  if (path === '/rule-profiles') return rules;
  if (path === '/roles/r1/members') return { docs: [{ _id: 'a1', user: person, batches: [], courses: [], batchIds: [], courseIds: [] }], page: 1, totalDocs: 1, totalPages: 1 };
  if (path === '/users') return { docs: [person], page: 1, totalDocs: 1, totalPages: 1 };
  if (path === '/users/u1/effective') return { user: person, owner: false, roles: [desk], grants: [{ permission: 'students.get.students', scope: 'all', roleId: 'r2' }, { permission: 'fields.contact.read', scope: 'all', roleId: 'r2' }] };
  if (path === '/assignments/u1') return { docs: [{ _id: 'a9', role: pending, batches: [], courses: [] }], page: 1, totalDocs: 1 };
  return { docs: [], page: 1 };
};
beforeEach(() => {
  sessionStorage.clear(); jest.clearAllMocks();
  can.mockImplementation(() => true);
  api = { get: jest.fn(async (path) => ({ data: respond(path) })),
    post: jest.fn(async (path) => ({ data: path.endsWith('/preview') ? { activeAssignments: 6, onboardingDefaults: [], added: [], removed: [] }
      : path === '/assignments/bulk' ? { assigned: [{ userId: 'u1', name: 'Sara Staff' }], skipped: [], revoked: 1, keptPending: [] } : path === '/assignments/revoke' ? { revoked: 1, skipped: [] } : {} })),
    put: jest.fn(async () => ({ data: {} })), delete: jest.fn(async () => ({ data: {} })) };
  axios.create.mockReturnValue(api);
});
const open = (url = '/access-management') => render(<ChakraProvider><MemoryRouter initialEntries={[url]}><AccessWorkspace /></MemoryRouter></ChakraProvider>);
const advanced = () => fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
const startBlank = async () => { fireEvent.click(await screen.findByRole('button', { name: 'Create Role' })); fireEvent.click(await screen.findByRole('button', { name: 'Start from scratch' })); };
const reason = (dialog, text = 'Reviewed admission responsibilities') => fireEvent.change(within(dialog).getByLabelText('Reason for change'), { target: { value: text } });

test('people opens on staff and filters on the server with pagination reset', async () => {
  open('/access-management/people?page=4');
  await screen.findByLabelText('Filter account category');
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/users', expect.objectContaining({ params: expect.objectContaining({ category: 'staff', page: 4, limit: 25 }) })));
  fireEvent.click(screen.getByLabelText('Filter account category'));
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Student', exact: true }));
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/users', expect.objectContaining({ params: expect.objectContaining({ category: 'student', page: 1 }) })));
  fireEvent.click(screen.getByLabelText('Filter account status'));
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Inactive', exact: true }));
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/users', expect.objectContaining({ params: expect.objectContaining({ category: 'student', status: 'inactive', page: 1 }) })));
});
test('advanced create requires deliberate scope and reason, then reviews before publishing', async () => {
  open(); await startBlank();
  fireEvent.change(await screen.findByLabelText('Role name'), { target: { value: 'Batch Reviewer' } });
  advanced();
  fireEvent.click(screen.getByLabelText('View students'));
  expect(screen.getByLabelText(/^Scope students.get.students \d+$/)).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  expect(await screen.findByText(/Choose who view students applies to/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/^Scope students.get.students \d+$/));
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Own records', exact: true }, { timeout: 5000 }));
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByRole('button', { name: 'Create Role' })).toBeDisabled();
  reason(dialog);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create Role' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/roles', expect.objectContaining({ name: 'Batch Reviewer', reason: 'Reviewed admission responsibilities',
    grants: expect.arrayContaining([{ permission: 'students.get.students', scope: 'own' }, { permission: 'users.change.password', scope: 'own' }]) })));
});
test('a new role is built from pages with needed pages, limits and own-profile basics', async () => {
  open(); await startBlank();
  fireEvent.change(await screen.findByLabelText('Role name'), { target: { value: 'Cashier' } });
  const fees = screen.getByRole('group', { name: 'Fees access' });
  fireEvent.click(within(fees).getByLabelText('Fees: View'));
  fireEvent.click(within(screen.getByRole('group', { name: 'Fees access' })).getByLabelText('Collect fees'));
  fireEvent.change(screen.getByLabelText('Fees Collect fees maximum amount'), { target: { value: '5000' } });
  expect(within(screen.getByRole('group', { name: 'Students access' })).getByLabelText('Students: View')).toBeChecked();
  expect(within(screen.getByRole('group', { name: 'Students access' })).getByLabelText('Students: None')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Fees: None → View')).toBeInTheDocument();
  expect(within(dialog).getByText('Fees: + Collect fees')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'New hire' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create Role' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/roles', expect.objectContaining({ name: 'Cashier', reason: 'New hire', grants: expect.arrayContaining([
    { permission: 'fees.pay.fee', scope: 'all', maxAmount: 5000 }, { permission: 'students.get.students', scope: 'all' }, { permission: 'batches.get.batches', scope: 'all' }, { permission: 'users.get.user', scope: 'own' }]) })));
});
test('changing a page keeps its record scope and saves only that page plus what it needs', async () => {
  open('/access-management/roles/r1');
  const students = await screen.findByRole('group', { name: 'Students access' });
  expect(within(students).getByText(/Custom · 1 of/)).toBeInTheDocument();
  fireEvent.click(within(students).getByLabelText('Students: Admit & edit'));
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Students: Custom → Admit & edit')).toBeInTheDocument();
  expect(within(dialog).getByText('Batches: None → View')).toBeInTheDocument();
  reason(dialog);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(api.put).toHaveBeenCalled());
  const grants = api.put.mock.calls[0][1].grants;
  expect(grants).toEqual(expect.arrayContaining([{ permission: 'students.add.student', scope: 'own' }, { permission: 'batches.get.batches', scope: 'own' }]));
  expect(grants.filter((grant) => grant.permission.startsWith('fees.'))).toEqual([]);
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
  reason(dialog, 'Clarify the role purpose');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/roles/r1', expect.objectContaining({ revision: 2, description: 'Updated purpose', grants: [{ permission: 'students.get.students', scope: 'own' }] })));
});
test('technical keys are hidden until requested and amount controls are not shown for student reads', async () => {
  open('/access-management/roles/r1');
  await screen.findByLabelText('Role name'); advanced();
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
  advanced();
  expect(screen.getByLabelText('Scope students.get.students 0')).toHaveValue('own');
  expect(api.put).not.toHaveBeenCalled();
});
test('copying a built-in role from Create Role keeps its safeguards', async () => {
  open(); fireEvent.click(await screen.findByRole('button', { name: 'Create Role' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Copy Information Desk' }));
  expect(await screen.findByLabelText('Role name')).toHaveValue('Information Desk Copy');
  expect(await screen.findByText('Cannot apply discounts (owner only)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  const dialog = await screen.findByRole('dialog'); reason(dialog);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create Role' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/roles', expect.objectContaining({ name: 'Information Desk Copy', profile: 'lca-staff-information-desk' })));
});
test('a stale save reports a conflict and retains the draft', async () => {
  api.put.mockRejectedValueOnce({ response: { data: { message: 'Role changed. Reload before editing.' }, status: 409 } });
  open('/access-management/roles/r1');
  fireEvent.change(await screen.findByLabelText('Role name'), { target: { value: 'My draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review Changes' }));
  const dialog = await screen.findByRole('dialog');
  reason(dialog, 'Review conflict handling');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
  expect(await within(dialog).findByText('Role changed. Reload before editing.')).toBeInTheDocument();
  expect(screen.getByLabelText('Role name')).toHaveValue('My draft');
});
test('read-only access can inspect the role without editing or publishing', async () => {
  can.mockImplementation((permission) => permission !== 'access.manage');
  open('/access-management/roles/r1');
  expect(await screen.findByText('Viewing: Admissions Officer')).toBeInTheDocument();
  expect(screen.getByLabelText('Role name')).toBeDisabled();
  expect(within(screen.getByRole('group', { name: 'Students access' })).getByLabelText('Students: View')).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Review Changes' })).not.toBeInTheDocument();
});
test('role members can be removed together with a reason', async () => {
  open();
  fireEvent.click(await screen.findByRole('button', { name: 'People with Admissions Officer' }));
  fireEvent.click(await screen.findByLabelText('Select Sara Staff'));
  fireEvent.click(screen.getByRole('button', { name: 'Remove from role' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Left the organisation' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Remove from Role' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/assignments/revoke', { assignmentIds: ['a1'], reason: 'Left the organisation' }));
});
test('people are added to a role in bulk and leave the pending role', async () => {
  open('/access-management/roles/r1/members');
  fireEvent.click(await screen.findByRole('button', { name: 'Add People' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(await within(dialog).findByRole('checkbox', { name: /Sara Staff/ }));
  expect(within(dialog).getByRole('checkbox', { name: /Remove “Staff - Pending Assignment”/ })).toBeChecked();
  fireEvent.click(within(dialog).getByRole('button', { name: 'New hire' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Give Admissions Officer to 1' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/assignments/bulk', expect.objectContaining({ roleId: 'r1', userIds: ['u1'], replacePending: true, replaceRoleIds: [], reason: 'New hire' })));
  expect(await within(dialog).findByText(/1 previous role assignment was removed/)).toBeInTheDocument();
});
test('people selected in the list can be given a role together', async () => {
  open('/access-management/people');
  fireEvent.click(await screen.findByLabelText('Select Sara Staff'));
  fireEvent.click(screen.getByRole('button', { name: 'Assign Role to Selected' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Role to assign' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Information Desk' }, { timeout: 5000 }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Role change' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Give Information Desk to 1' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/assignments/bulk', expect.objectContaining({ roleId: 'r2', userIds: ['u1'] })));
});
test('a person shows readable access, their menu and the pending-role replacement', async () => {
  open('/access-management/people/u1');
  expect(await screen.findByText(/waiting for a role/)).toBeInTheDocument();
  const overview = screen.getByRole('region', { name: 'What they can do' });
  expect(within(overview).getAllByText('Students')).toHaveLength(2);
  expect(within(overview).getByText('From Information Desk')).toBeInTheDocument();
  expect(within(overview).getByText(/Contact details \(View\)/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Assign Role' }));
  expect(screen.getByRole('checkbox', { name: /Remove “Staff - Pending Assignment” after assigning/ })).toBeChecked();
  fireEvent.click(await screen.findByRole('button', { name: 'Role to assign' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Information Desk' }, { timeout: 5000 }));
  fireEvent.click(screen.getByRole('button', { name: 'Review Assignment' }));
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Staff - Pending Assignment will be removed.')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'New hire' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Assign Role' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/assignments', expect.objectContaining({ userId: 'u1', roleId: 'r2', replacePending: true, reason: 'New hire' })));
});
test('mixed bulk outcomes are reported person by person instead of as one error', async () => {
  open('/access-management/roles/r1/members');
  api.post.mockImplementation(async (path) => ({ data: path === '/assignments/bulk' ? { revoked: 1, keptPending: [], assigned: [{ userId: 'u1', name: 'Sara Staff', alreadyHad: true }],
    skipped: [{ userId: 'u2', name: 'Omar Staff', reason: 'You cannot remove Information Desk; it includes access you do not hold' }],
    failed: [{ userId: 'u3', name: 'Hina Staff', reason: 'The change could not be saved. Open this person to check their roles, then try again.' }] } : {} }));
  fireEvent.click(await screen.findByLabelText('Select Sara Staff'));
  fireEvent.click(screen.getByRole('button', { name: 'Move to another role' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Role to assign' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Information Desk' }, { timeout: 5000 }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Move 1 to Information Desk' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/assignments/bulk', expect.objectContaining({ roleId: 'r2', replaceRoleIds: ['r1'], reason: 'Role change' })));
  expect(await within(dialog).findByText('Could not be saved for 1 person')).toBeInTheDocument();
  expect(within(dialog).getByText(/Sara Staff already had Information Desk; they were removed from Admissions Officer/)).toBeInTheDocument();
  expect(within(dialog).getByText(/Omar Staff: You cannot remove Information Desk/)).toBeInTheDocument();
});
