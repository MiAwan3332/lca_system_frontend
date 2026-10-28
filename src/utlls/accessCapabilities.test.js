import axios from 'axios';
import { refreshAccess, resetAccess, can, dynamicPermission, dynamicRoute, canUseField, requireOutput } from './accessCapabilities';
import { isTeacherRole } from './teacherAccess';
import { isStudentRole } from './studentAccess';
import { isQualifierRole } from './qualifierAccess';
import { isPanelistRole } from './panelistAccess';
jest.mock('axios');

beforeEach(() => { resetAccess(); jest.clearAllMocks(); });
test('fresh capabilities replace stale roles, constrain fields and revoke immediately', async () => {
  sessionStorage.setItem('role', 'superadmin');
  axios.get.mockResolvedValueOnce({ data: { managed: true, owner: false, grants: [
    { permission: 'students.get.students', scope: 'selected' },
    { permission: 'fields.contact.read', scope: 'all', fields: ['email'] },
  ], routes: [{ resource: 'students', method: 'GET' }] } });
  await refreshAccess();
  expect(dynamicPermission(['Get_Students'])).toBe(true);
  expect(dynamicPermission(['Delete_Student'])).toBe(false);
  expect(dynamicRoute('/student')).toBe(true);
  expect(canUseField('email')).toBe(true);
  expect(canUseField('phone')).toBe(false);
  expect(() => requireOutput('students', 'export')).toThrow();
  axios.get.mockResolvedValueOnce({ data: { managed: true, owner: false, grants: [], routes: [] } });
  await refreshAccess();
  expect(can('students.get.students')).toBe(false);
  expect(dynamicRoute('/student')).toBe(false);
});
test('network failures and logout fail closed, including in-flight refreshes', async () => {
  axios.get.mockRejectedValueOnce(new Error('Offline'));
  await refreshAccess();
  expect(can('anything')).toBe(false);
  let resolve;
  axios.get.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  const pending = refreshAccess(); resetAccess();
  resolve({ data: { managed: true, owner: true, grants: [], routes: [] } }); await pending;
  expect(can('anything')).toBe(false);
});
test('renamed roles retain their stable account category and UI action aliases match actual endpoints', async () => {
  sessionStorage.setItem('role', 'An arbitrary renamed role');
  for (const [accountType, check] of [['teacher', isTeacherRole], ['student', isStudentRole], ['qualifier', isQualifierRole], ['panelist', isPanelistRole]]) {
    axios.get.mockResolvedValueOnce({ data: { managed: true, owner: false, accountType, grants: [{ permission: 'students.basic.student.update', scope: 'own' }], routes: [] } });
    await refreshAccess(); expect(check()).toBe(true); expect(dynamicPermission(['Update_Student'])).toBe(true);
  }
});
test('own profile reads do not expose staff-list or global finance pages', async () => {
  axios.get.mockResolvedValueOnce({ data: { managed: true, owner: false, grants: [
    { permission: 'users.get.user', scope: 'own' }, { permission: 'fees.get.fees.by.student.id', scope: 'own' },
    { permission: 'interview-panels.get.conduct.interview', scope: 'assigned' },
  ], routes: [{ resource: 'users', method: 'GET' }, { resource: 'fees', method: 'GET' }] } });
  await refreshAccess();
  expect(dynamicRoute('/user')).toBe(false); expect(dynamicRoute('/fees')).toBe(false); expect(dynamicRoute('/finance-report')).toBe(false);
  expect(dynamicRoute('/interview-panel-schedules/123/conduct/0')).toBe(true);
});

test('business messaging does not expose gateway or template administration pages', async () => {
  axios.get.mockResolvedValueOnce({ data: { managed: true, owner: false, grants: [
    { permission: 'whatsapp.list.whats.app.queue', scope: 'all' },
    { permission: 'whatsapp.list.whats.app.templates', scope: 'all' },
    { permission: 'whatsapp.enqueue.bulk.whats.app', scope: 'all' },
  ], routes: [{ resource: 'whatsapp', method: 'GET' }] } });
  await refreshAccess();
  expect(dynamicRoute('/whatsapp-queue')).toBe(true);
  expect(dynamicRoute('/whatsapp')).toBe(false);
  expect(dynamicRoute('/whatsapp-templates')).toBe(false);
});
