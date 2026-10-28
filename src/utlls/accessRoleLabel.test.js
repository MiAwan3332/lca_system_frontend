import { accessRoleLabel } from './accessRoleLabel';

test('shows assigned Access Management roles instead of the legacy role', () => {
  expect(accessRoleLabel({ role: 'Information Office', accessRoleNames: ['Accounts Officer', 'Information Desk'] })).toBe('Accounts Officer, Information Desk');
  expect(accessRoleLabel({ role: 'Information Office', accessRoleNames: [] })).toBe('No role assigned');
  expect(accessRoleLabel({ role: 'Information Office', accessRoleNames: [] }, '')).toBe('');
  expect(accessRoleLabel({ role: 'CEO' })).toBe('CEO');
  expect(accessRoleLabel(null)).toBe('');
});
