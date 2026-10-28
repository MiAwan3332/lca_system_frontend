import catalog from '../../config/accessCatalog.generated.json';
import { approvalRule, financialRule, scopeChoices } from './accessUi';
import { completeWorkflowAccess } from '../../utlls/accessWorkflowRules';

// Page-based view over role grants. The backend still stores and enforces individual grants;
// these definitions only translate between sidebar pages and the permissions those pages need.
const k = (resource, ...actions) => actions.map((action) => `${resource}.${action}`);
const exports = (...resources) => resources.map((resource) => `${resource}.export`);
const prints = (...resources) => resources.map((resource) => `${resource}.print`);
const output = (...resources) => [{ key: 'export', label: 'Export', permissions: exports(...resources) }, { key: 'print', label: 'Print', permissions: prints(...resources) }];

export const AREAS = [
  { key: 'dashboard', label: 'Dashboard', pages: ['Dashboard'], view: k('statistics', 'get.statistics'),
    extras: [{ key: 'finance', label: 'Batch finance figures', permissions: k('statistics', 'get.batch.finance.stats') }, ...output('statistics')] },
  { key: 'students', label: 'Students', pages: ['Students', 'Deleted Students'],
    view: [...k('students', 'get.students', 'get.student', 'get.students.by.batch', 'get.qr.code', 'check.student.fields', 'lookup.student.identity',
      'get.students.graph', 'get.students.by.batches.graph', 'get.pending.fee.slip', 'latest.fee.receipt'), ...k('enrollments', 'get.enrollments', 'get.entrollmentby.student')],
    manage: [...k('students', 'add.student', 'update.student', 'basic.student.update', 'get.creation.by.key', 'get.creation.status', 'retry.creation',
      'ensure.student.roll.number'), ...k('admission-slips', 'issue.admission.slip.verification')],
    manageLabel: 'Admit & edit',
    extras: [
      { key: 'history', label: 'Payment & change history', permissions: k('students', 'get.student.history', 'get.student.payment.logs', 'list.evidence.payments') },
      { key: 'status', label: 'Activate / deactivate', permissions: k('students', 'toggle.student.status', 'toggle.batch.students.status') },
      { key: 'transfer', label: 'Transfer batch', permissions: k('students', 'transfer.student.batch', 'get.batch.shifts') },
      { key: 'import', label: 'Bulk import', permissions: k('students', 'bulk.import.students', 'fill.null.student.field') },
      { key: 'deleted', label: 'See deleted students', permissions: k('students', 'get.deleted.students', 'get.deleted.student.archive') },
      { key: 'delete', label: 'Delete', permissions: k('students', 'delete.student'), danger: true },
      ...output('students', 'enrollments', 'admission-slips')],
    advanced: [...k('students', 'change.student.password', 'get.students.contacts', 'delete.all.students', 'update.studentinfo'), ...k('enrollments', 'create.enrollment')],
    needs: { view: { batches: 'view', courses: 'view' } } },
  { key: 'qualifiers', label: 'Qualifiers', pages: ['Qualifiers'], view: k('qualifiers', 'get.qualifiers', 'get.qualifier'), manage: k('qualifiers', 'add.qualifier', 'update.qualifier'),
    extras: [{ key: 'status', label: 'Activate / deactivate', permissions: k('qualifiers', 'toggle.qualifier.status') },
      { key: 'import', label: 'Bulk import', permissions: k('qualifiers', 'bulk.import.qualifiers', 'fill.null.qualifier.field') },
      { key: 'delete', label: 'Delete', permissions: k('qualifiers', 'delete.qualifier'), danger: true }, ...output('qualifiers')],
    advanced: k('qualifiers', 'change.qualifier.password') },
  { key: 'fees', label: 'Fees', pages: ['Fees'], view: k('fees', 'get.fees', 'get.fee.logs', 'get.fees.by.student.id', 'get.fee.by.id', 'get.student.fees.report'),
    manage: k('fees', 'create.fee'), manageLabel: 'Assign fees',
    extras: [{ key: 'collect', label: 'Collect fees', permissions: [...k('fees', 'pay.fee', 'collect.pending.fee'), ...k('students', 'get.or.create.pending.fee.slip', 'edit.payment.evidence')], limit: true, needs: { students: 'view' } },
      { key: 'discount', label: 'Apply discounts', permissions: k('fees', 'discount.fee'), limit: true },
      { key: 'due', label: 'Fee-due report', permissions: k('notifications', 'get.fee.due.report') },
      { key: 'delete', label: 'Delete fee records', permissions: k('fees', 'delete.fee'), danger: true }, ...output('fees')],
    needs: { view: { students: 'view' } } },
  { key: 'financeReport', label: 'Finance Report', pages: ['Finance Report'], view: [...k('fees', 'get.finance.report'), ...k('users', 'get.fee.collectors')], needs: { view: { batches: 'view' } } },
  { key: 'users', label: 'Users', pages: ['Users'], view: k('users', 'get.users', 'get.user'),
    manage: k('users', 'add.user', 'update.user', 'get.creation.by.key', 'get.creation.status', 'retry.creation'),
    extras: [{ key: 'delete', label: 'Delete accounts', permissions: k('users', 'delete.user'), danger: true }, ...output('users')],
    advanced: k('users', 'reset.password.for.all.students') },
  { key: 'expenses', label: 'Expenses', pages: ['Expenses'], view: k('expenses', 'get.expenses', 'get.expense'), manage: k('expenses', 'add.expense', 'update.expense'),
    extras: [{ key: 'approve', label: 'Approve / reject', permissions: k('expenses', 'approve.expense', 'reject.expense'), limit: true, selfApproval: true },
      { key: 'delete', label: 'Delete', permissions: k('expenses', 'delete.expense'), danger: true }, ...output('expenses')] },
  { key: 'refunds', label: 'Request Management', pages: ['Request Management'], view: k('refund-requests', 'get.refund.requests'), manage: k('refund-requests', 'create.refund.request'),
    manageLabel: 'Request refunds',
    extras: [{ key: 'approve', label: 'Approve / reject refunds', permissions: k('refund-requests', 'approve.refund.request', 'reject.refund.request'), limit: true, selfApproval: true },
      { key: 'payout', label: 'Pay out approved refunds', permissions: k('refund-requests', 'process.refund.request', 'update.refund.payout'), limit: true }, ...output('refund-requests')],
    needs: { view: { students: 'view' } } },
  { key: 'teachers', label: 'Teachers', pages: ['Teachers'], view: k('teachers', 'get.teachers', 'get.teacher'), manage: k('teachers', 'add.teacher', 'update.teacher'),
    extras: [{ key: 'delete', label: 'Delete', permissions: k('teachers', 'delete.teacher'), danger: true }, ...output('teachers')] },
  { key: 'batches', label: 'Batches', pages: ['Batches'], view: k('batches', 'get.batches', 'get.batch', 'get.batch.courses', 'get.batch.teachers', 'get.batch.teacher.assignments'),
    advanced: k('batches', 'get.batch.assignment.options'),
    manage: k('batches', 'add.batch', 'update.batch', 'toggle.batch.status', 'assign.courses.to.batch', 'assign.teachers.to.batch', 'assign.teacher.courses.to.batch'),
    extras: [{ key: 'deleted', label: 'See deleted batches', permissions: k('batches', 'get.deleted.batches', 'get.deleted.batch.archive') },
      { key: 'delete', label: 'Delete', permissions: k('batches', 'delete.batch'), danger: true }, ...output('batches')] },
  { key: 'courses', label: 'Courses', pages: ['Courses'], view: k('courses', 'get.courses', 'get.course', 'get.batch.and.courses'), manage: k('courses', 'add.course', 'update.course'),
    extras: [{ key: 'delete', label: 'Delete', permissions: k('courses', 'delete.course'), danger: true }, ...output('courses')] },
  { key: 'timetable', label: 'Timetable', pages: ['Timetable'], view: k('timetable', 'get.all.time.tables', 'get.time.table.by.id', 'get.time.table.by.student.id', 'get.today.time.tables'),
    manage: k('timetable', 'create.time.table', 'update.time.table', 'delete.time.table'), extras: output('timetable'), needs: { view: { batches: 'view', courses: 'view' } } },
  { key: 'attendance', label: 'Attendance', pages: ['Attendance'], view: k('attendence', 'get.attendences', 'get.today.attendence.by.student.id'),
    manage: k('attendence', 'create.attendence'), manageLabel: 'Mark attendance', extras: output('attendence'), needs: { manage: { students: 'view', batches: 'view' } } },
  { key: 'seminars', label: 'Seminars', pages: ['Seminars'],
    view: [...k('seminars', 'get.seminars', 'get.seminar', 'get.today.seminars', 'get.seminars.with.attendee.counts', 'getall.seminarwith.attendees'), ...k('attendees', 'get.attendees', 'get.attendee', 'get.attendees.by.seminar')],
    manage: [...k('seminars', 'add.seminar', 'update.seminar'), ...k('attendees', 'create.attendee', 'update.attendee')],
    extras: [{ key: 'delete', label: 'Delete', permissions: [...k('seminars', 'delete.seminar'), ...k('attendees', 'delete.attendee')], danger: true }, ...output('seminars', 'attendees')] },
  { key: 'interviews', label: 'Interview Panel', pages: ['Interview Panel', 'All Panel Schedules', 'Conduct Interview'], view: k('interview-panels', 'get.interview.panels', 'get.interview.panel'),
    manage: k('interview-panels', 'add.interview.panel', 'update.interview.panel'),
    extras: [{ key: 'book', label: 'Book interview slots', permissions: k('interview-panels', 'book.interview.slot') },
      { key: 'conduct', label: 'Conduct & evaluate', permissions: k('interview-panels', 'get.conduct.interview', 'get.interview.evaluation.details', 'start.interview', 'submit.interview.evaluation') },
      { key: 'delete', label: 'Delete', permissions: k('interview-panels', 'delete.interview.panel'), danger: true }, ...output('interview-panels')] },
  { key: 'panelists', label: 'Panelists', pages: ['Panelists'], view: k('panelists', 'get.panelists', 'get.panelist'), manage: k('panelists', 'add.panelist', 'update.panelist'),
    extras: [{ key: 'delete', label: 'Delete', permissions: k('panelists', 'delete.panelist'), danger: true }, ...output('panelists')], advanced: k('panelists', 'change.panelist.password') },
  { key: 'mcqs', label: 'Mcqs', pages: ['Mcqs'], view: [...k('mcqs', 'get.all.mcqs', 'get.mcqs.by.course.id', 'get.mcq.by.id'), ...k('pastPapers', 'get.all.past.papers', 'get.past.paper.by.id', 'get.past.paper.by.course.and.year')],
    manage: [...k('mcqs', 'create.mcq', 'update.mcq', 'bulk.import.mcqs'), ...k('pastPapers', 'create.past.paper', 'update.past.paper')],
    extras: [{ key: 'delete', label: 'Delete', permissions: [...k('mcqs', 'delete.mcq'), ...k('pastPapers', 'delete.past.paper')], danger: true }, ...output('mcqs', 'pastPapers')],
    needs: { view: { courses: 'view' } } },
  { key: 'quiz', label: 'Quiz', pages: ['Quiz'], view: k('quiz', 'get.quiz.subjects', 'get.quiz.attempts', 'get.quiz.attempt.log', 'get.quiz.attempt'),
    extras: [{ key: 'take', label: 'Take quizzes', permissions: k('quiz', 'start.quiz', 'save.quiz.answer', 'submit.quiz') }, ...output('quiz')] },
  { key: 'assignments', label: 'Assignments', pages: ['Assignments'],
    view: k('assignments', 'get.assignments', 'get.assignment.by.id', 'get.batch.courses.for.assignment', 'get.assignment.submissions'),
    manage: k('assignments', 'create.assignment', 'update.assignment', 'publish.assignment', 'grade.submission'), manageLabel: 'Create & grade',
    extras: [{ key: 'submit', label: 'Submit own work', permissions: k('assignments', 'get.my.assignment.courses', 'submit.assignment') },
      { key: 'delete', label: 'Delete', permissions: k('assignments', 'delete.assignment'), danger: true }, ...output('assignments')],
    needs: { manage: { batches: 'view', courses: 'view' } } },
  { key: 'courseQuizzes', label: 'Course Quizzes', pages: ['Course Quizzes'],
    view: k('course-quizzes', 'get.course.quizzes', 'get.course.quiz.by.id', 'get.batch.courses.for.quiz', 'get.course.quiz.attempts', 'get.course.quiz.attempt.by.id'),
    manage: k('course-quizzes', 'create.course.quiz', 'update.course.quiz', 'publish.course.quiz', 'review.course.quiz.attempt', 'publish.course.quiz.results'), manageLabel: 'Create & review',
    extras: [{ key: 'take', label: 'Take quizzes', permissions: k('course-quizzes', 'start.course.quiz.attempt', 'save.course.quiz.answer', 'submit.course.quiz.attempt') },
      { key: 'delete', label: 'Delete', permissions: k('course-quizzes', 'delete.course.quiz'), danger: true }, ...output('course-quizzes')],
    needs: { manage: { batches: 'view', courses: 'view' } } },
  { key: 'complaints', label: 'Complaints', pages: ['Complaints'], view: k('complaints', 'get.complaint.meta', 'get.complaints', 'get.complaint.by.id'), manage: k('complaints', 'respond.to.complaint'),
    manageLabel: 'Respond', extras: [{ key: 'submit', label: 'Submit complaints', permissions: k('complaints', 'create.complaint') },
      { key: 'delete', label: 'Delete', permissions: k('complaints', 'delete.complaint'), danger: true }, ...output('complaints')] },
  { key: 'announcements', label: 'Announcements', pages: ['Announcements'], view: k('announcements', 'get.announcements', 'get.announcement.by.id', 'mark.announcement.as.read'),
    manage: k('announcements', 'create.announcement', 'update.announcement'), manageLabel: 'Publish',
    extras: [{ key: 'delete', label: 'Delete', permissions: k('announcements', 'delete.announcement'), danger: true }, ...output('announcements')] },
  { key: 'whatsapp', label: 'WhatsApp', pages: ['WhatsApp', 'WA Templates', 'WA Queue'],
    view: k('whatsapp', 'list.whats.app.queue', 'get.whats.app.queue.stats', 'list.whats.app.templates', 'get.whats.app.template', 'list.whats.app.template.tags', 'preview.whats.app.template'),
    manage: k('whatsapp', 'enqueue.bulk.whats.app'), manageLabel: 'Send messages',
    extras: [{ key: 'templates', label: 'Create & edit templates', permissions: k('whatsapp', 'create.whats.app.template', 'update.whats.app.template', 'test.whats.app.template') },
      { key: 'cancel', label: 'Cancel queued messages', permissions: k('whatsapp', 'cancel.whats.app.queue.message', 'cancel.all.whats.app.queue') },
      { key: 'delete', label: 'Delete templates', permissions: k('whatsapp', 'delete.whats.app.template'), danger: true },
      { key: 'connection', label: 'Connection settings', danger: true, permissions: k('whatsapp', 'get.whats.app.config', 'list.whats.app.sessions', 'create.whats.app.session', 'connect.whats.app',
        'get.whats.app.session', 'start.whats.app.session', 'stop.whats.app.session', 'logout.whats.app.session', 'delete.whats.app.session', 'get.whats.app.session.qr', 'request.whats.app.pairing.code') },
      ...output('whatsapp')] },
  { key: 'google', label: 'Google Workspace', pages: ['Google Workspace'], view: k('google', 'get.google.status', 'get.google.connect.url', 'disconnect.google'), viewLabel: 'Connect own account',
    manage: k('google', 'sync.batch.classroom.course', 'sync.assignment.coursework', 'sync.timetable.calendar.event'), manageLabel: 'Sync classes', extras: output('google') },
  { key: 'activityLogs', label: 'Activity Logs', pages: ['Activity Logs'], view: k('activity-logs', 'get.activity.logs', 'get.activity.log.modules'), extras: output('activity-logs') },
];

// Sidebar entries from routes.js (hidden pages excluded), used to preview someone's menu.
export const MENU_PAGES = [['Dashboard', '/dashboard'], ['Students', '/student'], ['Qualifiers', '/qualifiers'], ['Fees', '/fees'], ['Finance Report', '/finance-report'],
  ['Users', '/user'], ['Expenses', '/expenses'], ['Request Management', '/request-management'], ['Teachers', '/teacher'], ['Batches', '/batch'], ['Courses', '/course'],
  ['Timetable', '/timetable'], ['Attendance', '/attendance'], ['Seminars', '/seminar'], ['Interview Panel', '/interview-panel'], ['Panelists', '/panelists'],
  ['All Panel Schedules', '/interview-panel-schedules'], ['Mcqs', '/mcq'], ['Quiz', '/quiz'], ['Assignments', '/assignments'], ['Course Quizzes', '/course-quizzes'],
  ['Announcements', '/announcements'], ['WhatsApp', '/whatsapp'], ['WA Templates', '/whatsapp-templates'], ['WA Queue', '/whatsapp-queue'], ['Notifications', '/notifications'],
  ['Access Management', '/access-management'], ['Activity Logs', '/activity-logs']].map(([name, path]) => ({ name, path }));
export const areaRoleIds = (area, grants) => [...new Set(grants.filter((grant) => ownedBy(area, grant) && grant.roleId).map((grant) => String(grant.roleId)))];
export const FIELD_AREAS = [
  { key: 'general', label: 'General record details', help: 'Names, dates, statuses and other everyday fields' },
  { key: 'contact', label: 'Contact details', help: 'Phone numbers, email addresses and addresses' },
  { key: 'identity', label: 'Identity', help: 'CNIC and date of birth' },
  { key: 'financial', label: 'Fee & payment amounts', help: 'Fees, payments, discounts and balances' },
  { key: 'evidence', label: 'Documents & photos', help: 'Payment evidence, CNIC images, resumes and photos' },
  { key: 'internal', label: 'Internal notes', help: 'Remarks, approval and rejection comments' },
  { key: 'integration', label: 'Google class links', help: 'Classroom, Calendar and Meet links' },
];
export const ADMIN_AREAS = [
  { key: 'review', label: 'View roles and change history', permissions: ['access.read', 'access.audit'] },
  { key: 'explain', label: "Check people's access", permissions: ['access.explain'], needs: ['review'] },
  { key: 'assign', label: 'Assign roles to people', permissions: ['access.assign'], needs: ['review'] },
  { key: 'manage', label: 'Create and edit roles', permissions: ['access.manage'], needs: ['review'] },
];
// Every account needs these to use its own profile; they are added to new roles automatically.
export const BASELINE = [
  ...k('users', 'get.user', 'update.user', 'change.avatar', 'change.password').map((permission) => ({ permission, scope: 'own' })),
  ...k('notifications', 'get.notifications', 'mark.as.read', 'mark.all.as.read').map((permission) => ({ permission, scope: 'own' })),
  { permission: 'fields.credentials.write', scope: 'all', fields: ['currentPassword', 'newPassword', 'password'] },
  { permission: 'operations.get.creation.capabilities', scope: 'all' }, { permission: 'files.download', scope: 'all' },
];
const baselineOnly = new Set(['users.change.avatar', 'users.change.password', 'notifications.get.notifications', 'notifications.mark.as.read',
  'notifications.mark.all.as.read', 'fields.credentials.write', 'operations.get.creation.capabilities', 'files.download']);
export const isBaselineGrant = (grant) => baselineOnly.has(grant.permission) || (grant.scope === 'own' && ['users.get.user', 'users.update.user'].includes(grant.permission));
export const BASELINE_LABELS = ['Own profile, photo and password', 'Own notifications', 'Download files they are allowed to see'];

export const areaPermissions = (area) => [...area.view, ...(area.manage || []), ...(area.extras || []).flatMap((extra) => extra.permissions), ...(area.advanced || [])];
const owners = new Map(AREAS.flatMap((area) => areaPermissions(area).map((permission) => [permission, area.key])));
export const areaOf = (permission) => owners.get(permission);
const ownedBy = (area, grant) => owners.get(grant.permission) === area.key && !isBaselineGrant(grant);
const single = (permission) => permission.startsWith('fields.') || scopeChoices(permission).length === 1;
const same = (set, list) => set.size === list.length && list.every((item) => set.has(item));
const RANK = { none: 0, view: 1, manage: 2 };
const byKey = (key) => AREAS.find((area) => area.key === key);
const levelPermissions = (area, level) => level === 'manage' ? [...area.view, ...(area.manage || [])] : level === 'view' ? area.view : [];

export function areaState(area, grants) {
  const owned = grants.filter((grant) => ownedBy(area, grant));
  const present = new Set(owned.map((grant) => grant.permission));
  const core = new Set([...area.view, ...(area.manage || [])].filter((permission) => present.has(permission)));
  const level = !owned.length ? 'none' : same(core, area.view) ? 'view' : area.manage?.length && same(core, levelPermissions(area, 'manage')) ? 'manage' : 'custom';
  const extras = Object.fromEntries((area.extras || []).map((extra) => {
    const count = extra.permissions.filter((permission) => present.has(permission)).length;
    return [extra.key, count === 0 ? false : count === extra.permissions.length ? true : 'partial'];
  }));
  const scopes = [...new Set(owned.filter((grant) => !single(grant.permission)).map((grant) => grant.scope))];
  const limits = Object.fromEntries((area.extras || []).filter((extra) => extra.limit).map((extra) => {
    const values = [...new Set(owned.filter((grant) => extra.permissions.includes(grant.permission) && financialRule(grant.permission)).map((grant) => grant.maxAmount ?? null))];
    return [extra.key, values.length === 1 ? values[0] : values.length ? 'mixed' : null];
  }));
  return { level, extras, limits, scope: scopes.length === 1 ? scopes[0] : scopes.length ? 'mixed' : null, permissions: present,
    advanced: (area.advanced || []).filter((permission) => present.has(permission)).length, actions: core.size, total: area.view.length + (area.manage?.length || 0) };
}

function addMissing(grants, permissions, scope) {
  const next = [...grants];
  for (const permission of permissions) {
    if (next.some((grant) => grant.permission === permission && !isBaselineGrant(grant))) continue;
    next.push({ permission, scope: single(permission) ? 'all' : scope || 'all', ...(approvalRule(permission) ? { noSelfApproval: true } : {}), _key: `${permission}-${next.length}-${Math.random().toString(36).slice(2, 7)}` });
  }
  return next;
}
const levelAtLeast = (area, grants, level) => levelPermissions(area, level).every((permission) => grants.some((grant) => grant.permission === permission && !isBaselineGrant(grant)));
// Pages raised to satisfy a need bring their own needs too (Fees → Students → Batches and Courses).
function applyNeeds(grants, needs = {}, scope, seen = new Set()) {
  let next = grants;
  for (const [key, level] of Object.entries(needs)) {
    const target = byKey(key), mark = `${key}:${level}`;
    if (!target || seen.has(mark)) continue;
    seen.add(mark);
    if (!levelAtLeast(target, next, level)) next = applyNeeds(addMissing(next, levelPermissions(target, level), scope), areaNeeds(target, level), scope, seen);
  }
  return next;
}
const rowScope = (area, grants, fallback) => { const scope = areaState(area, grants).scope; return scope && scope !== 'mixed' ? scope : fallback; };
export const areaNeeds = (area, level) => ({ ...(RANK[level] >= 1 ? area.needs?.view : {}), ...(RANK[level] >= 2 ? area.needs?.manage : {}) });

export function setAreaLevel(grants, area, level, fallbackScope = 'all') {
  const scope = rowScope(area, grants, fallbackScope);
  if (level === 'none') return grants.filter((grant) => !ownedBy(area, grant));
  const wanted = levelPermissions(area, level);
  const kept = grants.filter((grant) => !ownedBy(area, grant) || !(area.manage || []).includes(grant.permission) || wanted.includes(grant.permission));
  return applyNeeds(addMissing(kept, wanted, scope), areaNeeds(area, level), scope);
}
export function setAreaExtra(grants, area, extraKey, enabled, fallbackScope = 'all') {
  const extra = area.extras.find((item) => item.key === extraKey), scope = rowScope(area, grants, fallbackScope);
  if (!enabled) return grants.filter((grant) => !(ownedBy(area, grant) && extra.permissions.includes(grant.permission)));
  const next = applyNeeds(addMissing(grants, extra.permissions, scope), extra.needs, scope);
  const newlyEnabled = extra.permissions.some(permission => !grants.some(g => g.permission === permission));
  const workflows = (catalog.workflows || []).filter(rule => ['fee-discounts', 'expense-rejection', 'refund-decisions', 'refund-approval-amount'].includes(rule.id) && rule.any.some(p => extra.permissions.includes(p)));
  if (!newlyEnabled || !workflows.length) return next;
  return completeWorkflowAccess(next, { ...catalog, workflows }).map((grant, index) => grant.permission.startsWith('fields.') ? { ...grant,
    _fieldMode: grant._fieldMode || (grant.fields?.length ? 'selected' : 'all'), _key: grant._key || `workflow-${grant.permission}-${index}` } : grant);
}
export function setAreaScope(grants, area, scope) {
  const seen = new Set();
  return grants.map((grant) => ownedBy(area, grant) && !single(grant.permission) ? { ...grant, scope } : grant).filter((grant) => {
    if (!ownedBy(area, grant)) return true;
    const key = `${grant.permission}:${grant.scope}`; if (seen.has(key)) return false; seen.add(key); return true;
  });
}
export function setAreaLimit(grants, area, extraKey, maxAmount) {
  const extra = area.extras.find((item) => item.key === extraKey);
  return grants.map((grant) => ownedBy(area, grant) && extra.permissions.includes(grant.permission) && financialRule(grant.permission) ? { ...grant, maxAmount } : grant);
}
export function setAreaSelfApproval(grants, area, extraKey, noSelfApproval) {
  const extra = area.extras.find((item) => item.key === extraKey);
  return grants.map((grant) => ownedBy(area, grant) && extra.permissions.includes(grant.permission) && approvalRule(grant.permission) ? { ...grant, noSelfApproval } : grant);
}
export function setAreaAction(grants, area, permission, enabled, fallbackScope = 'all') {
  if (!enabled) return grants.filter((grant) => !(ownedBy(area, grant) && grant.permission === permission));
  return addMissing(grants, [permission], rowScope(area, grants, fallbackScope));
}
// Areas currently relying on this one; their minimum level cannot be removed from the grid.
export function requiredBy(area, grants) {
  return AREAS.flatMap((other) => {
    if (other.key === area.key) return [];
    const state = areaState(other, grants);
    const needs = { ...(['view', 'manage'].includes(state.level) ? areaNeeds(other, state.level) : {}) };
    for (const extra of other.extras || []) if (state.extras[extra.key] === true) Object.assign(needs, extra.needs);
    return needs[area.key] ? [{ area: other, level: needs[area.key] }] : [];
  });
}
export const minimumLevel = (area, grants) => requiredBy(area, grants).reduce((level, item) => RANK[item.level] > RANK[level] ? item.level : level, 'none');
export function missingNeeds(area, grants) {
  const state = areaState(area, grants);
  const needs = { ...(['view', 'manage'].includes(state.level) ? areaNeeds(area, state.level) : {}) };
  for (const extra of area.extras || []) if (state.extras[extra.key] === true) Object.assign(needs, extra.needs);
  return Object.entries(needs).filter(([key, level]) => !levelAtLeast(byKey(key), grants, level)).map(([key, level]) => ({ area: byKey(key), level }));
}
export const fixNeeds = (grants, area, fallbackScope = 'all') => applyNeeds(grants, Object.fromEntries(missingNeeds(area, grants).map((item) => [item.area.key, item.level])), rowScope(area, grants, fallbackScope));

export function fieldState(group, grants) {
  const read = grants.filter((grant) => grant.permission === `fields.${group}.read`), write = grants.filter((grant) => grant.permission === `fields.${group}.write`);
  const level = !read.length && !write.length ? 'none' : read.length && write.length ? 'edit' : read.length ? 'view' : 'custom';
  return { level, limited: [...read, ...write].some((grant) => grant.fields?.length) };
}
export function setFieldLevel(grants, group, level) {
  const read = `fields.${group}.read`, write = `fields.${group}.write`;
  let next = grants.filter((grant) => !(level === 'none' && [read, write].includes(grant.permission)) && !(level === 'view' && grant.permission === write));
  if (level !== 'none') next = addMissing(next, level === 'edit' ? [read, write] : [read], 'all');
  return next.map((grant) => [read, write].includes(grant.permission) && !grant._fieldMode ? { ...grant, _fieldMode: grant.fields?.length ? 'selected' : 'all' } : grant);
}
export const adminState = (item, grants) => { const count = item.permissions.filter((permission) => grants.some((grant) => grant.permission === permission)).length; return count === 0 ? false : count === item.permissions.length ? true : 'partial'; };
export function setAdmin(grants, item, enabled) {
  if (!enabled) {
    const dependants = ADMIN_AREAS.filter((other) => other.needs?.includes(item.key) && adminState(other, grants));
    const removed = new Set([...item.permissions, ...dependants.flatMap((other) => other.permissions)]);
    return grants.filter((grant) => !removed.has(grant.permission));
  }
  const required = (item.needs || []).flatMap((key) => ADMIN_AREAS.find((other) => other.key === key).permissions);
  return addMissing(grants, [...required, ...item.permissions], 'all');
}
export const missingBaseline = (grants) => BASELINE.filter((base) => !grants.some((grant) => grant.permission === base.permission && (grant.scope === base.scope || grant.scope === 'all')));
// Own-account requests as the portal sends them, mirroring selfService() in the API: the operation, every field the request writes
// and the fields the response must show.
export const SELF_SERVICE = [['view their own profile', 'users.get.user', [], ['name', 'email', 'phone', 'avatar']], ['edit their own profile', 'users.update.user', ['name', 'phone']],
  ['change their own photo', 'users.change.avatar', ['id', 'avatar']], ['change their own password', 'users.change.password', ['email', 'currentPassword', 'newPassword']],
  ['read their notifications', 'notifications.get.notifications', []]];
const fieldGroupOf = (key) => Object.entries(catalog.fieldGroups).find(([, fields]) => fields.includes(key))?.[0] || 'general';
const canUseField = (grants, key, action) => grants.some((grant) => grant.permission === `fields.${fieldGroupOf(key)}.${action}` && (!grant.fields?.length || grant.fields.includes(key)));
const holdsOwn = (grants, permission) => grants.some((grant) => grant.permission === permission && ['own', 'all'].includes(grant.scope));
const fieldNeeds = (writes, reads = []) => [...writes.map((key) => [key, 'write']), ...reads.map((key) => [key, 'read'])];
export const selfServiceGaps = (grants) => SELF_SERVICE.filter(([, permission, writes, reads]) => !holdsOwn(grants, permission) ||
  fieldNeeds(writes, reads).some(([key, action]) => !canUseField(grants, key, action))).map(([name]) => name);
// Adds only what is missing: own-scope operations and the exact fields, appended to an existing limited field list where there is one.
export function addSelfService(grants) {
  const next = [...grants];
  for (const [, permission, writes, reads] of SELF_SERVICE) {
    if (!holdsOwn(next, permission)) next.push({ permission, scope: 'own', _key: `self-${permission}` });
    for (const [key, action] of fieldNeeds(writes, reads)) {
      if (canUseField(next, key, action)) continue;
      const field = `fields.${fieldGroupOf(key)}.${action}`, index = next.findIndex((grant) => grant.permission === field);
      if (index >= 0) next[index] = { ...next[index], fields: [...next[index].fields, key], _fieldMode: 'selected' };
      else next.push({ permission: field, scope: 'all', fields: [key], _fieldMode: 'selected', _key: `self-${field}` });
    }
  }
  return addBaseline(next);
}
export const addBaseline = (grants) => [...grants, ...missingBaseline(grants).map((base, index) => ({ ...base, ...(base.fields ? { _fieldMode: 'selected' } : {}), _key: `base-${index}-${base.permission}` }))];
const classified = new Set([...owners.keys(), ...baselineOnly, 'users.get.user', 'users.update.user', ...ADMIN_AREAS.flatMap((item) => item.permissions),
  ...FIELD_AREAS.flatMap((item) => [`fields.${item.key}.read`, `fields.${item.key}.write`])]);
// Legacy role/permission administration and server maintenance remain in Advanced only.
export const otherGrants = (grants) => grants.filter((grant) => !classified.has(grant.permission));
export const classifiedPermissions = () => classified;

export function defaultScope(grants) {
  const counts = {};
  for (const grant of grants) if (areaOf(grant.permission) && !isBaselineGrant(grant) && !single(grant.permission)) counts[grant.scope] = (counts[grant.scope] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'all';
}
export const levelName = (area, level) => ({ none: 'None', view: area.viewLabel || 'View', manage: area.manageLabel || 'Manage', custom: 'Custom' }[level]);
// Plain-language differences for the review dialog.
export function pageChanges(before, after) {
  const changes = [];
  for (const area of AREAS) {
    const was = areaState(area, before), now = areaState(area, after);
    if (was.level !== now.level) changes.push(`${area.label}: ${levelName(area, was.level)} → ${levelName(area, now.level)}`);
    else if (now.level === 'custom' && [...was.permissions].sort().join() !== [...now.permissions].sort().join()) changes.push(`${area.label}: individual actions changed`);
    if (now.level !== 'none' && was.scope !== now.scope && was.scope && now.scope) changes.push(`${area.label}: records changed to ${now.scope === 'mixed' ? 'mixed' : { all: 'all records', own: 'own records', assigned: 'assigned classes', selected: 'selected batches / courses' }[now.scope]}`);
    for (const extra of area.extras || []) {
      if (now.level === 'none' && was.level !== 'none') break;
      if (was.extras[extra.key] !== true && now.extras[extra.key] === true) changes.push(`${area.label}: + ${extra.label}`);
      if (was.extras[extra.key] === true && now.extras[extra.key] !== true && now.level !== 'none') changes.push(`${area.label}: − ${extra.label}`);
      if (extra.limit && now.extras[extra.key] === true && was.limits[extra.key] !== now.limits[extra.key]) changes.push(`${area.label}: ${extra.label} limit ${now.limits[extra.key] == null ? 'removed' : `PKR ${now.limits[extra.key]}`}`);
    }
  }
  const fieldLabel = { none: 'Hidden', view: 'View', edit: 'View & edit', custom: 'Custom' };
  for (const item of FIELD_AREAS) {
    const was = fieldState(item.key, before), now = fieldState(item.key, after);
    if (was.level !== now.level) changes.push(`${item.label}: ${fieldLabel[was.level]} → ${fieldLabel[now.level]}`);
  }
  for (const item of ADMIN_AREAS) if (adminState(item, before) !== adminState(item, after)) changes.push(`${adminState(item, after) ? '+' : '−'} ${item.label}`);
  const gapsBefore = selfServiceGaps(before), gapsAfter = selfServiceGaps(after);
  for (const name of gapsBefore.filter((item) => !gapsAfter.includes(item))) changes.push(`+ People can ${name}`);
  for (const name of gapsAfter.filter((item) => !gapsBefore.includes(item))) changes.push(`− People can no longer ${name}`);
  return changes;
}
// One-line summary used for people and role overviews.
export function accessSummary(grants) {
  return AREAS.map((area) => ({ area, state: areaState(area, grants) })).filter(({ state }) => state.level !== 'none').map(({ area, state }) => ({
    area, state, label: levelName(area, state.level),
    extras: (area.extras || []).filter((extra) => state.extras[extra.key] === true).map((extra) => extra.label),
  }));
}
// The main action behind each page level or option, used by "Can they…?" checks.
export const ABILITIES = AREAS.flatMap((area) => [
  { area, label: levelName(area, 'view'), permission: area.view[0] },
  ...(area.manage?.length ? [{ area, label: levelName(area, 'manage'), permission: area.manage[0] }] : []),
  ...(area.extras || []).map((extra) => ({ area, label: extra.label, permission: extra.permissions[0] })),
]);
