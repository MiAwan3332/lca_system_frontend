export const ACCESS_ROOT = '/access-management';
export const moduleName = (value = '') => ({ attendence: 'Attendance', pastPapers: 'Past Papers', 'course-quizzes': 'Course Quizzes', 'admission-slips': 'Admission Slips', 'refund-requests': 'Refunds', mcqs: 'Question Bank', google: 'Google Integration', fields: 'Information & Documents', access: 'Access Administration', operations: 'Processing & Recovery' }[value] || words(value));
export function words(value = '') {
  return String(value).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_.-]+/g, ' ').replace(/\b(id|ids)\b/gi, 'ID').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
const labels = { 'students.get.students': 'View students', 'students.add.student': 'Create students', 'students.basic.student.update': 'Edit student profiles', 'fees.pay.fee': 'Record fee payments', 'fees.collect.pending.fee': 'Collect pending fees', 'fees.discount.fee': 'Apply fee discounts', 'users.get.fee.collectors': 'View cashier names', 'fields.credentials.write': 'Change passwords', 'files.download': 'Download permitted files' };
export function permissionName(permission) {
  const key = typeof permission === 'string' ? permission : permission.key;
  if (labels[key]) return labels[key];
  if (key.startsWith('fields.')) { const [, group, action] = key.split('.'); return `${action === 'read' ? 'View' : 'Edit'} ${words(group).toLowerCase()} information`; }
  const parts = key.split('.').slice(1);
  const verb = { get: 'View', add: 'Create', create: 'Create', update: 'Edit', delete: 'Delete', export: 'Export', print: 'Print', bulk: 'Bulk' }[parts[0]] || words(parts[0]);
  return `${verb} ${parts.slice(1).join(' ')}`.trim();
}
export const scopeName = (scope) => ({ all: 'All records', own: 'Own records', assigned: 'Assigned classes', selected: 'Selected batches / courses' }[scope] || 'Choose access scope');
export const financialRule = (key) => /^(fees\.(pay|collect|discount)|expenses\.(add|update|approve|reject)|refund-requests\.(create|approve|reject|process|update))/.test(key);
export const approvalRule = (key) => /^(expenses|refund-requests)\.(approve|reject)/.test(key);
export const scopeChoices = (key) => ['access', 'whatsapp', 'roles', 'permissions', 'operations', 'activity-logs', 'files'].includes(key.split('.')[0]) || /\.(export|print)$/.test(key) ? ['all'] : ['own', 'assigned', 'selected', 'all'];
export const wireGrants = (grants) => grants.map(({ permission, scope, maxAmount, noSelfApproval, fields }) => ({ permission, scope, ...(maxAmount != null ? { maxAmount: Number(maxAmount) } : {}), ...(noSelfApproval ? { noSelfApproval: true } : {}), ...(fields?.length ? { fields } : {}) }));
export const rolePayload = (draft) => ({ name: draft.name.trim(), description: draft.description || '', active: draft.active, revision: draft.revision, grants: wireGrants(draft.grants),
  ...(draft.profile !== undefined ? { profile: draft.profile || null } : {}) });
// Grant order carries no meaning, so toggling a page off and on again is not an unsaved change.
export const fingerprint = (draft) => { const payload = rolePayload(draft); return JSON.stringify({ ...payload, grants: payload.grants.map((grant) => JSON.stringify(grant)).sort() }); };
export function draftErrors(draft) {
  const errors = [];
  if (!draft.name.trim()) errors.push('Enter a role name.');
  const seen = new Set();
  for (const grant of draft.grants) {
    if (!grant.scope) errors.push(`Choose who ${permissionName(grant.permission).toLowerCase()} applies to.`);
    if (grant.permission.startsWith('fields.') && (!grant._fieldMode || (grant._fieldMode === 'selected' && !grant.fields?.length))) errors.push(`Choose the fields for ${permissionName(grant.permission).toLowerCase()}.`);
    if (grant.maxAmount != null && (!Number.isFinite(Number(grant.maxAmount)) || Number(grant.maxAmount) < 0)) errors.push('Amount limits must be zero or greater.');
    const key = `${grant.permission}:${grant.scope}`;
    if (seen.has(key)) errors.push(`Remove the duplicate scope for ${permissionName(grant.permission).toLowerCase()}.`);
    seen.add(key);
  }
  return [...new Set(errors)];
}
export const editable = (role) => ({ ...role, grants: (role.grants || []).map((grant, index) => ({ ...grant, _key: `${grant.permission}-${index}`, _fieldMode: grant.fields?.length ? 'selected' : 'all' })) });
