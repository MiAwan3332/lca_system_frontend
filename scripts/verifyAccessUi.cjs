const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const catalog = require('../src/config/accessCatalog.generated.json');
const root = path.resolve(__dirname, '../build');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
    const file = path.resolve(root, relative || 'index.html');
    if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) { res.writeHead(403).end(); return; }
    const candidate = await fs.stat(file).catch(() => null);
    const actual = candidate?.isFile() ? file : path.join(root, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(actual)] || 'application/octet-stream'); res.end(await fs.readFile(actual));
  } catch { res.writeHead(500).end(); }
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'lca-access-ui-'));
  try {
    const context = await browser.newContext();
    const token = ['e30', Buffer.from(JSON.stringify({ user: { id: '000000000000000000000001', role: 'superadmin', permissions: [] }, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'local-mock'].join('.');
    await context.addCookies([{ name: 'authToken', value: token, url: origin }]);
    let policy = { ready: true, managed: true, owner: true, roles: [], grants: [], routes: catalog.routes };
    let savedBody = '';
    const student = { _id: '000000000000000000000002', name: 'Read Only Name', phone: '03000000000',
      batch: { _id: '000000000000000000000003', name: 'Review batch' }, is_active: true, roll_number: 'On-REVIEW-1' };
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      const empty = { docs: [], totalDocs: 0, hasNextPage: false, page: 1, limit: 25 };
      let data = empty;
      if (url.pathname === '/access/me') data = policy;
      else if (url.pathname === '/access/catalog') data = catalog;
      else if (url.pathname === '/access/defaults') data = { roles: {}, revision: 0 };
      else if (url.pathname === '/students') data = { ...empty, docs: [student], totalDocs: 1 };
      else if (url.pathname.startsWith('/students/basic-update/')) { savedBody = route.request().postData() || ''; data = { message: 'Saved' }; }
      else if (/^\/users\//.test(url.pathname)) data = { _id: '000000000000000000000001', name: 'Local Review Owner', role: 'superadmin' };
      return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${origin}/role`);
    await page.getByRole('button', { name: 'Create Role', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Create Role', exact: true }).click();
    await page.getByLabel('Role name', { exact: true }).fill('Local review role');
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
    for (const width of [768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `Page overflow at ${width}`);
      await page.screenshot({ path: path.join(output, `${width}.png`), fullPage: true });
    }
    policy = { ready: true, managed: true, owner: false, roles: [], accountType: 'staff', grants: [
      { permission: 'students.get.students', scope: 'all' }, { permission: 'students.basic.student.update', scope: 'all' },
      { permission: 'fields.general.read', scope: 'all' }, { permission: 'fields.contact.read', scope: 'all', fields: ['phone'] },
      { permission: 'fields.contact.write', scope: 'all', fields: ['phone'] },
    ], routes: catalog.routes.filter((route) => ['students.get.students', 'students.basic.student.update'].includes(route.permission)) };
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${origin}/student`);
    await page.getByText('Read Only Name', { exact: true }).first().waitFor();
    await page.getByRole('button', { name: /actions/i }).first().click();
    await page.getByRole('button', { name: 'Update Student', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Update Student', exact: true }).waitFor();
    assert.equal(await dialog.locator('input[name="name"]').isDisabled(), true);
    assert.equal(await dialog.locator('input[name="phone"]').isDisabled(), false);
    assert.equal(await dialog.locator('input[name="cnic"]').count(), 0);
    await dialog.locator('input[name="phone"]').fill('03001234567');
    await page.screenshot({ path: path.join(output, 'phone-only-editor.png'), fullPage: true });
    await dialog.getByRole('button', { name: 'Update Student', exact: true }).click();
    try { await dialog.waitFor({ state: 'hidden', timeout: 10000 }); }
    catch (error) { await page.screenshot({ path: path.join(output, 'save-failure.png'), fullPage: true }); throw new Error(`${error.message}; body=${savedBody}; page=${await page.locator('body').innerText()}`); }
    assert.ok(savedBody.includes('03001234567'));
    assert.ok(!/name="(name|cnic|remarks|skip_profile_completion)"/.test(savedBody));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ browserChecks: 'desktop/tablet/mobile', externalServicesCalled: false, screenshots: output }));
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
})().catch((error) => { console.error(error); server.close(); process.exitCode = 1; });
