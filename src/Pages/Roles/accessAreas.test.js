import catalog from '../../config/accessCatalog.generated.json';
import builtIn from './__fixtures__/builtInRoles.json';
import { AREAS, FIELD_AREAS, ADMIN_AREAS, BASELINE, areaPermissions, areaState, classifiedPermissions, otherGrants, setAreaLevel, setAreaExtra, setAreaScope,
  setAreaLimit, setFieldLevel, fieldState, setAdmin, adminState, addBaseline, missingBaseline, minimumLevel, missingNeeds, fixNeeds, defaultScope, accessSummary, setAreaAction, pageChanges, ABILITIES, MENU_PAGES, selfServiceGaps, addSelfService } from './accessAreas';
import { draftErrors, fingerprint } from './accessUi';

const area = (key) => AREAS.find((item) => item.key === key);
const role = (code) => builtIn.find((item) => item.code === code).grants;
const keys = (grants) => grants.map((grant) => `${grant.permission}:${grant.scope}`).sort();
const strip = (grants) => grants.map(({ _key, _fieldMode, ...grant }) => grant);

test('every page permission exists in the catalog and belongs to exactly one place', () => {
  const known = new Set(catalog.permissions.map((item) => item.key));
  const listed = [...AREAS.flatMap(areaPermissions), ...ADMIN_AREAS.flatMap((item) => item.permissions), ...BASELINE.map((item) => item.permission)];
  expect(listed.filter((key) => !known.has(key))).toEqual([]);
  const owned = AREAS.flatMap(areaPermissions);
  expect(owned.filter((key, index) => owned.indexOf(key) !== index)).toEqual([]);
  expect(FIELD_AREAS.flatMap((item) => [`fields.${item.key}.read`, `fields.${item.key}.write`]).filter((key) => !known.has(key))).toEqual([]);
});
test('only legacy administration and server maintenance stay outside the grid', () => {
  const outside = catalog.permissions.map((item) => item.key).filter((key) => !classifiedPermissions().has(key));
  expect(outside.every((key) => /^(roles|permissions|operations)\./.test(key) || /^notifications\.(export|print)$/.test(key))).toBe(true);
});
test('built-in roles read as page levels without changing anything', () => {
  const account = role('lca-staff-account-officer'), desk = role('lca-staff-information-desk'), vice = role('lca-staff-vice-principle');
  expect(areaState(area('fees'), account)).toMatchObject({ level: 'manage', scope: 'all', extras: expect.objectContaining({ collect: true, discount: false }) });
  expect(areaState(area('refunds'), account)).toMatchObject({ level: 'manage', extras: expect.objectContaining({ payout: true, approve: false }) });
  expect(areaState(area('students'), desk).level).toBe('manage');
  expect(areaState(area('fees'), desk).level).toBe('none');
  expect(areaState(area('timetable'), vice).level).toBe('manage');
  expect(areaState(area('assignments'), role('lca-v1-teacher'))).toMatchObject({ level: 'manage', scope: 'assigned' });
  expect(accessSummary(role('lca-v1-pending-staff')).map((item) => item.area.key)).toEqual(['dashboard']);
  for (const item of builtIn) expect(otherGrants(item.grants)).toEqual([]);
});
test('changing one page leaves every other page and the account basics untouched', () => {
  for (const item of builtIn) {
    for (const target of AREAS) {
      const before = item.grants, after = setAreaLevel(before, target, 'none');
      const untouched = (grants) => keys(grants.filter((grant) => !areaPermissions(target).includes(grant.permission) || (grant.scope === 'own' && ['users.get.user', 'users.update.user'].includes(grant.permission))));
      expect(untouched(after)).toEqual(untouched(before));
      expect(areaState(target, after).level).toBe('none');
    }
  }
});
test('switching a clean page off and back restores the same grants', () => {
  const grants = role('lca-staff-account-officer');
  for (const target of AREAS) {
    const state = areaState(target, grants);
    if (!['view', 'manage'].includes(state.level) || !state.scope || state.scope === 'mixed') continue;
    let next = setAreaLevel(grants, target, 'none');
    next = setAreaLevel(next, target, state.level, state.scope);
    for (const [key, enabled] of Object.entries(state.extras)) if (enabled === true) next = setAreaExtra(next, target, key, true, state.scope);
    expect(new Set(keys(next))).toEqual(new Set(keys(grants)));
  }
});
test('view and manage add what the page needs with the row scope', () => {
  let grants = setAreaLevel([], area('students'), 'manage', 'assigned');
  expect(areaState(area('students'), grants)).toMatchObject({ level: 'manage', scope: 'assigned' });
  expect(areaState(area('batches'), grants)).toMatchObject({ level: 'view', scope: 'assigned' });
  expect(areaState(area('courses'), grants).level).toBe('view');
  expect(minimumLevel(area('batches'), grants)).toBe('view');
  // Form-field grants are not record-scoped; they always use "all".
  expect(grants.every((grant) => grant.scope === 'assigned' || /\.(export|print)$/.test(grant.permission) || grant.permission.startsWith('fields.'))).toBe(true);
  grants = setAreaLevel(grants, area('students'), 'view');
  expect(areaState(area('students'), grants).level).toBe('view');
  expect(grants.some((grant) => grant.permission === 'students.add.student')).toBe(false);
  expect(missingNeeds(area('students'), setAreaLevel(grants, area('batches'), 'none')).map((item) => item.area.key)).toEqual(['batches']);
});
test('pages added because another page needs them bring their own needs', () => {
  const grants = setAreaLevel([], area('fees'), 'view');
  for (const key of ['students', 'batches', 'courses']) expect(areaState(area(key), grants).level).toBe('view');
  expect(missingNeeds(area('students'), grants)).toEqual([]);
  const studentsOnly = setAreaLevel(setAreaLevel(setAreaLevel([], area('students'), 'view'), area('batches'), 'none'), area('courses'), 'none');
  expect(missingNeeds(area('students'), studentsOnly).map((item) => item.area.key)).toEqual(['batches', 'courses']);
  const fixed = fixNeeds(studentsOnly, area('students'));
  expect(['batches', 'courses'].map((key) => areaState(area(key), fixed).level)).toEqual(['view', 'view']);
});
test('extras, limits, approvals and scope changes stay inside the page', () => {
  let grants = setAreaLevel([], area('fees'), 'view');
  grants = setAreaExtra(grants, area('fees'), 'collect', true);
  expect(areaState(area('fees'), grants).extras.collect).toBe(true);
  expect(areaState(area('students'), grants).level).toBe('view');
  grants = setAreaLimit(grants, area('fees'), 'collect', 50000);
  expect(grants.filter((grant) => ['fees.pay.fee', 'fees.collect.pending.fee'].includes(grant.permission)).every((grant) => grant.maxAmount === 50000)).toBe(true);
  expect(grants.find((grant) => grant.permission === 'students.edit.payment.evidence').maxAmount).toBeUndefined();
  expect(areaState(area('fees'), grants).limits.collect).toBe(50000);
  grants = setAreaLevel(grants, area('expenses'), 'view');
  grants = setAreaExtra(grants, area('expenses'), 'approve', true);
  expect(grants.filter((grant) => grant.permission.startsWith('expenses.approve')).every((grant) => grant.noSelfApproval)).toBe(true);
  grants = setAreaExtra(grants, area('fees'), 'export', true);
  grants = setAreaScope(grants, area('fees'), 'selected');
  expect(areaState(area('fees'), grants).scope).toBe('selected');
  expect(grants.find((grant) => grant.permission === 'fees.export').scope).toBe('all');
  expect(areaState(area('expenses'), grants).scope).toBe('all');
  grants = setAreaAction(grants, area('fees'), 'fees.get.fee.logs', false);
  expect(areaState(area('fees'), grants).level).toBe('custom');
});
test('information, administration and basics produce valid editor grants', () => {
  let grants = addBaseline([]);
  expect(missingBaseline(grants)).toEqual([]);
  grants = setFieldLevel(grants, 'contact', 'edit');
  expect(fieldState('contact', grants)).toEqual({ level: 'edit', limited: false });
  grants = setFieldLevel(grants, 'contact', 'view');
  expect(fieldState('contact', grants).level).toBe('view');
  grants = setAdmin(grants, ADMIN_AREAS.find((item) => item.key === 'assign'), true);
  expect(adminState(ADMIN_AREAS[0], grants)).toBe(true);
  grants = setAdmin(grants, ADMIN_AREAS[0], false);
  expect(grants.some((grant) => grant.permission.startsWith('access.'))).toBe(false);
  grants = setAreaLevel(grants, area('students'), 'manage');
  expect(draftErrors({ name: 'Desk', grants })).toEqual([]);
  expect(defaultScope(role('lca-v1-teacher'))).toBe('assigned');
});
test('unsaved state ignores grant order', () => {
  const grants = setAreaLevel([], area('fees'), 'view');
  expect(fingerprint({ name: 'A', grants: strip(grants) })).toBe(fingerprint({ name: 'A', grants: strip([...grants].reverse()) }));
});
test('review text describes page changes in plain language', () => {
  const before = setAreaLevel([], area('students'), 'view');
  let after = setAreaLevel(before, area('students'), 'manage');
  after = setAreaExtra(after, area('students'), 'delete', true);
  after = setFieldLevel(after, 'identity', 'view');
  const changes = pageChanges(before, after);
  expect(changes.slice(0, 2)).toEqual(['Students: View → Admit & edit', 'Students: + Delete']);
  // Form fields the new actions need are listed by name, and limited grants say so.
  expect(changes).toContain('General record details: Hidden → View & edit (selected fields)');
  expect(changes.find((line) => line.startsWith('General record details: can edit'))).toMatch(/father name/);
  expect(changes.some((line) => line.startsWith('Identity: Hidden → View'))).toBe(true);
  expect(pageChanges(before, before)).toEqual([]);
});
test('every check-access ability and menu page is real', () => {
  const known = new Set(catalog.permissions.map((item) => item.key));
  expect(ABILITIES.every((item) => known.has(item.permission))).toBe(true);
  const routes = require('fs').readFileSync(require('path').join(__dirname, '../../routes.js'), 'utf8');
  for (const page of MENU_PAGES) expect(routes).toContain(`path: "${page.path}"`);
});
test('own-account checks include the fields each request writes, and Add basics fills only those gaps', () => {
  const own = (...permissions) => permissions.map((permission) => ({ permission, scope: 'own' }));
  const ops = own('users.get.user', 'users.update.user', 'users.change.avatar', 'users.change.password', 'notifications.get.notifications');
  expect(selfServiceGaps(ops)).toEqual(['view their own profile', 'edit their own profile', 'change their own photo', 'change their own password']);
  const reads = ['general', 'contact', 'evidence'].map((group) => ({ permission: `fields.${group}.read`, scope: 'all' }));
  const writesOnly = [...ops, ...['general', 'contact', 'evidence'].map((group) => ({ permission: `fields.${group}.write`, scope: 'all' })),
    { permission: 'fields.credentials.write', scope: 'all', fields: ['currentPassword', 'newPassword'] }];
  expect(selfServiceGaps(writesOnly)).toEqual(['view their own profile']);
  expect(selfServiceGaps(addSelfService(writesOnly))).toEqual([]);
  const desk = [...ops, ...reads, { permission: 'fields.general.write', scope: 'all', fields: ['name'] }, { permission: 'fields.contact.write', scope: 'all' },
    { permission: 'fields.evidence.write', scope: 'all', fields: ['avatar'] }, { permission: 'fields.credentials.write', scope: 'all', fields: ['currentPassword', 'newPassword'] }];
  expect(selfServiceGaps(desk)).toEqual(['change their own photo']);
  const fixed = addSelfService(desk);
  expect(selfServiceGaps(fixed)).toEqual([]);
  expect(fixed.find((grant) => grant.permission === 'fields.general.write').fields).toEqual(['name', 'id']);
  expect(fixed.find((grant) => grant.permission === 'fields.contact.write').fields).toBeUndefined();
  expect(pageChanges(desk, fixed)).toContain('+ People can change their own photo');
  expect(pageChanges(fixed, desk)).toContain('− People can no longer change their own photo');
  const blank = addSelfService([]);
  expect(selfServiceGaps(blank)).toEqual([]);
  expect(blank.filter((grant) => grant.permission.startsWith('fields.')).every((grant) => grant.fields?.length)).toBe(true);
});

test('selecting financial decision actions includes only their precise supporting fields', () => {
 let grants=setAreaExtra(role('lca-staff-account-officer'),area('fees'),'discount',true);
 expect(grants.find(g=>g.permission==='fields.financial.write').fields).toContain('discount_amount');
 expect(grants.find(g=>g.permission==='fields.financial.write').fields).not.toContain('paid_fee');
 grants=setAreaExtra(grants,area('refunds'),'approve',true);
 expect(grants.find(g=>g.permission==='fields.general.write').fields).toContain('comment');
 expect(grants.filter(g=>g.permission.startsWith('refund-requests.')&&g.permission.includes('approve')).every(g=>g.noSelfApproval)).toBe(true);
 expect(draftErrors({name:'Finance',grants})).toEqual([]);
});

test('granting a page brings the form fields its actions send, without unrelated access', () => {
  const limited = [{ permission: 'fields.general.write', scope: 'all', fields: ['name'] }];
  const next = setAreaLevel(limited, area('qualifiers'), 'manage');
  const general = next.find((grant) => grant.permission === 'fields.general.write').fields;
  for (const key of ['exam_type', 'css_pms_roll_no', 'class_type', 'province', 'father_name', 'latest_degree', 'no_of_attempts']) expect(general).toContain(key);
  expect(next.find((grant) => grant.permission === 'fields.contact.write').fields).toContain('city');
  expect(next.some((grant) => ['fees.discount.fee', 'qualifiers.toggle.qualifier.status'].includes(grant.permission))).toBe(false);
  expect(general).not.toContain('is_active');
  // Field grants that already allow every field stay unrestricted.
  const open = setAreaLevel([{ permission: 'fields.general.write', scope: 'all' }], area('qualifiers'), 'manage');
  expect(open.find((grant) => grant.permission === 'fields.general.write').fields).toBeUndefined();
});

test('undoing payments is its own fees option, off by default, with an amount limit and no undoing own collections', () => {
  let grants = setAreaLevel([], area('fees'), 'manage');
  expect(grants.some((grant) => grant.permission === 'fees.revert.payment')).toBe(false);
  grants = setAreaExtra(grants, area('fees'), 'revert', true);
  const revert = grants.find((grant) => grant.permission === 'fees.revert.payment');
  expect(revert.noSelfApproval).toBe(true);
  grants = setAreaLimit(grants, area('fees'), 'revert', 5000);
  expect(grants.find((grant) => grant.permission === 'fees.revert.payment').maxAmount).toBe(5000);
  expect(grants.some((grant) => grant.permission === 'fields.general.write' && ['reason', 'note'].every((key) => grant.fields?.includes(key)))).toBe(true);
});

test('Set passwords is its own Users option, off unless chosen', () => {
  let grants = setAreaLevel([], area('users'), 'manage');
  expect(grants.some((grant) => grant.permission === 'users.set.user.password')).toBe(false);
  grants = setAreaExtra(grants, area('users'), 'password', true);
  expect(grants.some((grant) => grant.permission === 'users.set.user.password')).toBe(true);
});
