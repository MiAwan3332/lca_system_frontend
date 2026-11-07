import axios from 'axios';
import Cookies from 'js-cookie';
import { config } from './config';
import catalog from '../config/accessCatalog.generated.json';

let snapshot = { ready: false, managed: false, owner: false, grants: [], routes: [] };
const listeners = new Set();
let generation = 0;
export function resetAccess() {
  generation++;
  snapshot = { ready: false, managed: true, owner: false, grants: [], routes: [] };
  listeners.forEach((listener) => listener());
}
export const subscribeAccess = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const accessSnapshot = () => snapshot;
export async function refreshAccess() {
  const current = generation;
  try {
    const { data } = await axios.get(`${config.BASE_URL}/access/me`, { headers: { Authorization: `Bearer ${Cookies.get('authToken')}` }, timeout: 10000 });
    if (current !== generation) return snapshot;
    snapshot = { ...data, ready: true, error: null };
  } catch {
    if (current !== generation) return snapshot;
    snapshot = { ready: true, managed: true, owner: false, grants: [], routes: [], error: 'Unable to verify your current access. Please try again.' };
  }
  listeners.forEach((listener) => listener());
  return snapshot;
}
export const can = (permission) => snapshot.ready && !snapshot.error && (snapshot.owner || snapshot.grants.some((grant) => grant.permission === permission));
export function canUseOutput(resource, action) {
  return !snapshot.managed || can(`${resource}.${action}`);
}
export function resourceAccess(resource, legacy, write = false) {
  if (!snapshot.managed) return legacy;
  return snapshot.ready && !snapshot.error && (snapshot.owner || snapshot.routes.some((route) => route.resource === resource && (!write || !['GET', 'HEAD'].includes(route.method))));
}
export function requireOutput(resource, action) {
  if (!canUseOutput(resource, action)) throw new Error(`You do not have permission to ${action} ${resource}`);
}
export function canUseField(field, action = 'read', raw = false) {
  if (!snapshot.managed) return true;
  field = raw ? String(field) : accessFieldName(field);
  if (action === 'write' && catalog.readOnlyFields?.includes(field)) return false;
  if (action === 'read' && /password|secret|credential|token|api[_-]?key|private[_-]?key/i.test(field)) return false;
  if (!snapshot.ready || snapshot.error) return false;
  const group = Object.entries(catalog.fieldGroups).find(([, fields]) => fields.includes(field))?.[0] || 'general';
  return snapshot.owner || snapshot.grants.some((grant) => grant.permission === `fields.${group}.${action}` && (!grant.fields?.length || grant.fields.includes(field)));
}
const fieldAliases = { special_fee_rows: 'special_fee_options' };
export function accessFieldName(field) {
  const root = String(field || '').split(/[.[\]]/)[0];
  return fieldAliases[root] || root;
}
const compact = (value) => String(value).replace(/[_\s.-]/g, '').toLowerCase().replace(/^(view|list)/, 'get').replace(/^(add|create)/, 'create').replace(/^edit/, 'update');
const actionAliases = { Update_Student: ['students.basic.student.update', 'students.update.student'] };
export function dynamicPermission(permissions) {
  if (!snapshot.ready || !snapshot.managed) return undefined;
  return [].concat(permissions || []).some((permission) => can(permission) || (actionAliases[permission] || []).some(can) || catalog.routes.some((route) =>
    compact(route.handler) === compact(permission) && can(route.permission)));
}
const resources = { '/student': 'students', '/deleted-students': 'students', '/user': 'users', '/teacher': 'teachers',
  '/batch': 'batches', '/course': 'courses', '/fees': 'fees', '/finance-report': 'fees', '/expenses': 'expenses',
  '/request-management': 'refund-requests', '/timetable': 'timetable', '/attendance': 'attendence', '/seminar': 'seminars',
  '/mcq': 'mcqs', '/quiz': 'quiz', '/assignments': 'assignments', '/course-quizzes': 'course-quizzes', '/complaints': 'complaints',
  '/announcements': 'announcements', '/notifications': 'notifications', '/qualifiers': 'qualifiers', '/panelists': 'panelists',
  '/interview-panel': 'interview-panels', '/interview-panel-schedules': 'interview-panels', '/dashboard': 'statistics',
  '/whatsapp': 'whatsapp', '/whatsapp-templates': 'whatsapp', '/whatsapp-queue': 'whatsapp' };
export function dynamicRoute(path) {
  if (!snapshot.ready || !snapshot.managed) return undefined;
  if (snapshot.error) return false;
  return routeAllowed(path, snapshot);
}
// Pure page check shared by the live menu and Access Management previews of another person's access.
export const routesForGrants = (grants, owner = false) => catalog.routes.filter((route) => !route.public && !route.blocked && (owner || grants.some((grant) => grant.permission === route.permission)));
export function routeAllowed(path, access) {
  const can = (permission) => access.owner || access.grants.some((grant) => grant.permission === permission);
  if (path === '/profile') return true;
  if (path === '/role' || path === '/permission' || path === '/access-management' || path.startsWith('/access-management/')) return can('access.read');
  if (path.startsWith('/activity-logs')) return access.routes.some((route) => route.resource === 'activity-logs');
  if (/^\/interview-panel-schedules\/[^/]+\/conduct\/[^/]+$/.test(path)) return can('interview-panels.get.conduct.interview');
  if (/^\/interview-panel\/[^/]+\/schedules$/.test(path)) return can('interview-panels.get.interview.panel');
  const pagePermissions = {
    '/user': 'users.get.users', '/student': 'students.get.students', '/deleted-students': 'students.get.deleted.students',
    '/teacher': 'teachers.get.teachers', '/batch': 'batches.get.batches', '/course': 'courses.get.courses',
    '/fees': 'fees.get.fees', '/finance-report': 'fees.get.finance.report', '/expenses': 'expenses.get.expenses',
    '/request-management': 'refund-requests.get.refund.requests', '/timetable': 'timetable.get.all.time.tables',
    '/attendance': 'attendence.get.attendences', '/seminar': 'seminars.get.seminars', '/mcq': 'mcqs.get.all.mcqs',
    '/quiz': 'quiz.get.quiz.subjects', '/assignments': 'assignments.get.assignments', '/course-quizzes': 'course-quizzes.get.course.quizzes',
    '/complaints': 'complaints.get.complaints', '/announcements': 'announcements.get.announcements',
    '/notifications': 'notifications.get.notifications', '/qualifiers': 'qualifiers.get.qualifiers', '/panelists': 'panelists.get.panelists',
    '/interview-panel': 'interview-panels.add.interview.panel', '/interview-panel-schedules': 'interview-panels.get.interview.panels',
    '/dashboard': 'statistics.get.statistics', '/google-workspace': 'google.get.google.status',
    '/whatsapp': 'whatsapp.get.whats.app.config', '/whatsapp-templates': 'whatsapp.create.whats.app.template',
    '/whatsapp-queue': 'whatsapp.list.whats.app.queue',
  };
  if (pagePermissions[path]) return can(pagePermissions[path]);
  const resource = resources[path];
  return Boolean(resource && access.routes.some((route) => route.resource === resource && route.method === 'GET'));
}
