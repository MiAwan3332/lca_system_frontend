// UI review only: loopback-only, fake data, no database or production services.
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const catalog = require('../src/config/accessCatalog.generated.json');
const builtIn = require('../src/Pages/Roles/__fixtures__/builtInRoles.json');
const users = [{ _id: '000000000000000000000001', name: 'Local Review Owner', email: 'owner@example.invalid', accountType: 'staff', role: 'superadmin', platformOwner: true },
  { _id: '000000000000000000000002', name: 'Demo Admissions Staff', email: 'staff@example.invalid', accountType: 'staff', role: 'CEO', phone: '03000000000' },
  { _id: '000000000000000000000003', name: 'Demo Student', email: 'student@example.invalid', accountType: 'student', disabledAt: new Date() },
  ...['Ayesha', 'Bilal', 'Hamza', 'Sana'].map((name, index) => ({ _id: `00000000000000000000001${index}`, name: `Demo ${name}`, email: `${name.toLowerCase()}@example.invalid`, accountType: 'staff', role: 'Information Office' }))];
const roles = builtIn.map((role, index) => ({ _id: `1000000000000000000000${String(index + 10)}`, code: role.code, managed: true, name: role.name, description: role.description || '', active: true, revision: 1, grants: role.grants }));
const roleByCode = (code) => roles.find((role) => role.code === code);
const rules = [['lca-staff-principle', 'Principle', ['Cannot apply discounts (owner only)', 'WhatsApp: custom, admission, qualifier welcome and fee messages', 'Admission slips are issued from the saved student record']],
  ['lca-staff-vice-principle', 'Vice Principle', ['Cannot apply discounts (owner only)', 'WhatsApp: custom messages only', 'Admission slips are issued from the saved student record']],
  ['lca-staff-account-officer', 'Account Officer', ['Cannot apply discounts (owner only)', 'Cannot move a student to another batch while editing', 'WhatsApp: fee payment, reminder and overdue messages from saved templates, to students only', 'Admission slips are issued from the saved student record']],
  ['lca-staff-information-desk', 'Information Desk', ['Cannot apply discounts (owner only)', 'Cannot move a student to another batch while editing', 'WhatsApp: admission and qualifier welcome messages from saved templates', 'Admission slips are issued from the saved student record']]].map(([code, name, list]) => ({ code, name, rules: list }));
const assignments = [{ _id: '200000000000000000000001', user: users[1]._id, role: roleByCode('lca-v1-executive'), batchIds: [], courseIds: [], createdAt: new Date() },
  ...users.slice(3).map((user, index) => ({ _id: `20000000000000000000001${index}`, user: user._id, role: roleByCode(index < 2 ? 'lca-staff-information-desk' : 'lca-v1-pending-staff'), batchIds: [], courseIds: [], createdAt: new Date() }))];
const audits = [{ _id: '300000000000000000000001', actor: users[0], createdAt: new Date(), action: 'role.update.intent', target: roles[0]._id, reason: 'Align admission responsibilities', before: { ...roles[0], revision: 2, description: 'Earlier description' }, after: roles[0] }];
const scopeItems = { batches: [{ _id: '400000000000000000000001', name: 'CSS Weekend Batch' }, { _id: '400000000000000000000002', name: 'PMS Evening Batch' }], courses: [{ _id: '500000000000000000000001', name: 'English Essay' }, { _id: '500000000000000000000002', name: 'Current Affairs' }] };
let defaults = { roles: {}, revision: 0 }, frontend, origin;
const id = () => crypto.randomBytes(12).toString('hex');
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key, X-Creation-Protocol');
  res.setHeader('Access-Control-Expose-Headers', 'Idempotency-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/review') {
    const token = ['e30', Buffer.from(JSON.stringify({ user: { id: users[0]._id, role: 'superadmin', permissions: [] }, exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url'), 'local-preview-not-a-real-signature'].join('.');
    res.setHeader('Set-Cookie', `authToken=${token}; Path=/; SameSite=Lax`);
    res.writeHead(302, { Location: `${origin}/role` }); return res.end();
  }
  const send = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  const page = (items) => { const current = Math.max(1, Number(url.searchParams.get('page')) || 1), limit = 25;
    return { docs: items.slice((current - 1) * limit, current * limit), page: current, limit, totalDocs: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)), hasNextPage: current * limit < items.length }; };
  try {
    const chunks = []; for await (const chunk of req) { chunks.push(chunk); if (Buffer.concat(chunks).length > 1048576) throw new Error('Preview payload too large'); }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const route = url.pathname;
    if (route === '/access/me') return send({ managed: true, owner: true, userId: users[0]._id, accountType: 'staff', grants: [], roles: [], routes: catalog.routes });
    if (route === '/access/catalog') return send(catalog);
    if (/^\/access\/users\/[^/]+\/effective$/.test(route)) { const user = users.find((item) => item._id === route.split('/')[3]); const assigned = assignments.filter((item) => item.user === user?._id); return send({ user, owner: user?.platformOwner, disabled: false, roles: assigned.map((item) => item.role), grants: assigned.flatMap((item) => item.role.grants.map((grant) => ({ ...grant, roleId: item.role._id }))) }); }
    if (route === '/access/users') return send(page(users.filter((user) => (!url.searchParams.get('category') || user.accountType === url.searchParams.get('category')) && (!url.searchParams.get('status') || (url.searchParams.get('status') === 'inactive' ? Boolean(user.disabledAt) : !user.disabledAt)) && `${user.name} ${user.email}`.toLowerCase().includes((url.searchParams.get('query') || '').toLowerCase())).map((user) => ({ ...user, accessRoles: assignments.filter((item) => item.user === user._id).map((item) => item.role) }))));
    if (route === '/access/rule-profiles') return send(rules);
    if (route === '/access/account-categories') return send(page([{ _id: 'c1', name: 'Information Office' }, { _id: 'c2', name: 'Accounts' }, { _id: 'c3', name: 'Principal' }]));
    if (route === '/operations/creation-capabilities') return send({ protocol: 2 });
    if (route === '/users/add' && req.method === 'POST') {
      const created = { _id: id(), name: body.name, email: body.email, accountType: 'staff', role: body.role };
      users.push(created);
      assignments.push({ _id: id(), user: created._id, role: roles.find((role) => role._id === body.accessRoleId) || roleByCode('lca-v1-pending-staff'), batchIds: body.accessBatchIds || [], courseIds: body.accessCourseIds || [], createdAt: new Date() });
      return send({ idempotency_key: req.headers['idempotency-key'], submission_status: 'complete', processing_status: 'complete', record_id: created._id }, 201);
    }
    if (route === '/users') return send(page(users.filter((user) => user.accountType === 'staff' && !user.platformOwner)));
    if (route.startsWith('/users/')) return send(users[0]);
    if (route === '/access/audit') return send(page(audits));
    if (route.startsWith('/access/scopes/')) return send(page((scopeItems[route.split('/')[3]] || []).filter((item) => item.name.toLowerCase().includes((url.searchParams.get('query') || '').toLowerCase()))));
    if (route === '/access/defaults') { if (req.method === 'PUT') defaults = { roles: body.roles, revision: defaults.revision + 1 }; return send(defaults); }
    if (route === '/access/explain') return send({ allowed: body.userId === users[0]._id, reason: 'Local UI preview result; not a production authorization decision' });
    if (route.startsWith('/access/roles')) {
      const role = roles.find((item) => item._id === route.split('/')[3]);
      if (route.endsWith('/members')) { const query = (url.searchParams.get('query') || '').toLowerCase(); return send(page(assignments.filter((item) => item.role._id === role?._id).map((item) => ({ ...item, role: item.role._id, user: users.find((user) => user._id === item.user), batches: [], courses: [] })).filter((item) => `${item.user?.name} ${item.user?.email}`.toLowerCase().includes(query)))); }
      if (route.endsWith('/preview')) return send({ activeAssignments: assignments.filter((item) => item.role._id === role?._id).length, added: body.grants || [], removed: [], onboardingDefaults: [] });
      if (req.method === 'POST') {
        const created = { _id: id(), code: crypto.randomUUID(), managed: true, name: body.name, description: body.description, grants: body.grants, active: body.active !== false, revision: 1, profile: body.profile || null };
        roles.push(created); return send(created, 201);
      }
      if (role && req.method === 'PUT') {
        if (Number(body.revision) !== role.revision) return send({ message: 'Reload the changed demo role' }, 409);
        audits.unshift({ _id: id(), createdAt: new Date(), actor: users[0], action: 'preview.role.update', target: role._id, reason: body.reason, before: { ...role } });
        Object.assign(role, { name: body.name, description: body.description, grants: body.grants, active: body.active, revision: role.revision + 1, ...(body.profile !== undefined ? { profile: body.profile } : {}) }); return send(role);
      }
      return send(role || page(roles.filter((item) => item.name.toLowerCase().includes((url.searchParams.get('query') || '').toLowerCase())).map((item) => ({ ...item, memberCount: assignments.filter((assignment) => assignment.role._id === item._id).length }))));
    }
    if (route === '/access/assignments/bulk') {
      const role = roles.find((item) => item._id === body.roleId), result = { assigned: [], skipped: [], revoked: 0, keptPending: [] };
      for (const userId of body.userIds || []) {
        const user = users.find((item) => item._id === userId);
        if (!user || user.platformOwner) { result.skipped.push({ userId, name: user?.name || 'Unavailable person', reason: user ? 'Protected platform owner' : 'Not found' }); continue; }
        if (assignments.some((item) => item.user === userId && item.role._id === role._id)) { result.skipped.push({ userId, name: user.name, reason: 'Already has this role' }); continue; }
        assignments.push({ _id: id(), user: userId, role, batchIds: body.batchIds || [], courseIds: body.courseIds || [], expiresAt: body.expiresAt, createdAt: new Date() });
        for (let index = assignments.length - 1; index >= 0; index--) {
          const item = assignments[index];
          if (item.user === userId && ((body.replaceRoleIds || []).includes(item.role._id) || (body.replacePending && item.role.code === 'lca-v1-pending-staff' && role.code !== 'lca-v1-pending-staff'))) { assignments.splice(index, 1); result.revoked++; }
        }
        result.assigned.push({ userId, name: user.name });
      }
      return send(result, result.assigned.length ? 201 : 200);
    }
    if (route === '/access/assignments/revoke') {
      let revoked = 0;
      for (const assignmentId of body.assignmentIds || []) { const index = assignments.findIndex((item) => item._id === assignmentId); if (index >= 0) { assignments.splice(index, 1); revoked++; } }
      return send({ revoked, skipped: [] });
    }
    if (route.startsWith('/access/assignments')) {
      if (req.method === 'POST') { const item = { ...body, _id: id(), user: body.userId, role: roles.find((role) => role._id === body.roleId), createdAt: new Date() }; assignments.push(item); if (body.replacePending) for (let index = assignments.length - 1; index >= 0; index--) if (assignments[index].user === body.userId && assignments[index].role.code === 'lca-v1-pending-staff' && item.role.code !== 'lca-v1-pending-staff') assignments.splice(index, 1); return send(item, 201); }
      if (req.method === 'DELETE') { const index = assignments.findIndex((item) => item._id === route.split('/')[3]); if (index >= 0) assignments.splice(index, 1); return send({ success: true }); }
      return send(page(assignments.filter((item) => item.user === route.split('/')[3]).map((item) => ({ ...item, batches: (item.batchIds || []).map((id) => scopeItems.batches.find((batch) => batch._id === id)), courses: (item.courseIds || []).map((id) => scopeItems.courses.find((course) => course._id === id)) }))));
    }
    if (route.startsWith('/notifications')) return send({ docs: [], unreadCount: 0, totalDocs: 0 });
    return send({ message: 'Only Access Management is available in this isolated UI preview' }, 501);
  } catch (error) { return send({ message: error.message }, 400); }
});
const freePort = () => new Promise((resolve) => { const probe = net.createServer(); probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(() => resolve(port)); }); });
(async () => {
  // Optional fixed ports (--port=, --api-port=) let an editor's preview pane attach; both stay on loopback.
  const option = (name) => Number(process.argv.find((item) => item.startsWith(`--${name}=`))?.split('=')[1]) || 0;
  const port = option('port') || await freePort(); origin = `http://127.0.0.1:${port}`;
  server.listen(option('api-port'), '127.0.0.1', () => {
    const api = `http://127.0.0.1:${server.address().port}`;
    frontend = spawn(process.execPath, [require.resolve('react-scripts/scripts/start')], { cwd: require('node:path').resolve(__dirname, '..'),
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), BROWSER: 'none', REACT_APP_BASE_URL: api }, stdio: 'inherit', windowsHide: true });
    console.log(`LOCAL_ACCESS_REVIEW_URL=${api}/review`);
    console.log('Fake data only. Changes disappear when this preview stops. No production services are connected.');
    frontend.on('exit', () => server.close());
  });
})();
process.on('SIGTERM', () => { frontend?.kill(); server.close(); });
process.on('SIGINT', () => { frontend?.kill(); server.close(); });
