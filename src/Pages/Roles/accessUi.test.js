import { draftErrors, editable, rolePayload, permissionName, financialRule } from './accessUi';
test('UI-only metadata is stripped and existing scope restrictions are preserved', () => {
  const role = editable({ name: 'Test', active: true, revision: 4, grants: [{ permission: 'students.get.students', scope: 'own' }, { permission: 'students.get.students', scope: 'selected', maxAmount: 100, noSelfApproval: true }] });
  expect(rolePayload(role).grants).toEqual([{ permission: 'students.get.students', scope: 'own' }, { permission: 'students.get.students', scope: 'selected', maxAmount: 100, noSelfApproval: true }]);
  expect(draftErrors(role)).toEqual([]);
});
test('empty field selection cannot silently become all fields', () => {
  expect(draftErrors({ name: 'Test', grants: [{ permission: 'fields.contact.read', scope: 'all', _fieldMode: 'selected', fields: [] }] }).length).toBe(1);
});
test('duplicate scopes are rejected and human names do not require technical keys', () => {
  expect(draftErrors({ name: 'Test', grants: [{ permission: 'students.get.students', scope: 'own' }, { permission: 'students.get.students', scope: 'own' }] }).length).toBe(1);
  expect(permissionName('students.get.students')).toBe('View students');
  expect(financialRule('students.get.students')).toBe(false);
  expect(financialRule('expenses.approve.expense')).toBe(true);
});
