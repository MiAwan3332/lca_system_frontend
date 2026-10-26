// UI review only: loopback-only, fake data, no database or production services.
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const catalog = require('../src/config/accessCatalog.generated.json');
const users = [{ _id: '000000000000000000000001', name: 'Local Review Owner', email: 'owner@example.invalid', accountType: 'staff', role: 'superadmin', platformOwner: true },
  { _id: '000000000000000000000002', name: 'Demo Admissions Staff', email: 'staff@example.invalid', accountType: 'staff' }];
const roles = [], assignments = [], audits = [];
let defaults = { roles: {}, revision: 0 }, frontend, origin;
const id = () => crypto.randomBytes(12).toString('hex');
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
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
    return { docs: items.slice((current - 1) * limit, current * limit), page: current, limit, totalDocs: items.length, hasNextPage: current * limit < items.length }; };
  try {
    const chunks = []; for await (const chunk of req) { chunks.push(chunk); if (Buffer.concat(chunks).length > 1048576) throw new Error('Preview payload too large'); }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const route = url.pathname;
    if (route === '/access/me') return send({ managed: true, owner: true, userId: users[0]._id, accountType: 'staff', grants: [], roles: [], routes: catalog.routes });
    if (route === '/access/catalog') return send(catalog);
    if (route === '/access/users') return send(page(users));
    if (route.startsWith('/users/')) return send(users[0]);
    if (route === '/access/audit') return send(page(audits));
    if (route.startsWith('/access/scopes/')) return send(page([]));
    if (route === '/access/defaults') { if (req.method === 'PUT') defaults = { roles: body.roles, revision: defaults.revision + 1 }; return send(defaults); }
    if (route === '/access/explain') return send({ allowed: body.userId === users[0]._id, reason: 'Local UI preview result; not a production authorization decision' });
    if (route.startsWith('/access/roles')) {
      const role = roles.find((item) => item._id === route.split('/')[3]);
      if (route.endsWith('/preview')) return send({ activeAssignments: assignments.filter((item) => item.role._id === role?._id).length, added: body.grants || [], removed: [], onboardingDefaults: [] });
      if (req.method === 'POST') {
        const created = { _id: id(), code: crypto.randomUUID(), managed: true, name: body.name, description: body.description, grants: body.grants, active: body.active !== false, revision: 1 };
        roles.push(created); return send(created, 201);
      }
      if (role && req.method === 'PUT') {
        if (Number(body.revision) !== role.revision) return send({ message: 'Reload the changed demo role' }, 409);
        audits.unshift({ _id: id(), createdAt: new Date(), actor: users[0], action: 'preview.role.update', target: role._id, reason: body.reason, before: { ...role } });
        Object.assign(role, { name: body.name, description: body.description, grants: body.grants, active: body.active, revision: role.revision + 1 }); return send(role);
      }
      return send(role || page(roles));
    }
    if (route.startsWith('/access/assignments')) {
      if (req.method === 'POST') { const item = { ...body, _id: id(), user: body.userId, role: roles.find((role) => role._id === body.roleId) }; assignments.push(item); return send(item, 201); }
      if (req.method === 'DELETE') { const index = assignments.findIndex((item) => item._id === route.split('/')[3]); if (index >= 0) assignments.splice(index, 1); return send({ success: true }); }
      return send(page(assignments.filter((item) => item.user === route.split('/')[3])));
    }
    if (route.startsWith('/notifications')) return send({ docs: [], unreadCount: 0, totalDocs: 0 });
    return send({ message: 'Only Access Management is available in this isolated UI preview' }, 501);
  } catch (error) { return send({ message: error.message }, 400); }
});
const freePort = () => new Promise((resolve) => { const probe = net.createServer(); probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(() => resolve(port)); }); });
(async () => {
  const port = await freePort(); origin = `http://127.0.0.1:${port}`;
  server.listen(0, '127.0.0.1', () => {
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
