const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('@babel/core');
const { randomUUID } = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '../src/utlls/creationRecovery.js'), 'utf8');
const { code } = transformSync(source, { babelrc: false, configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'] });
const storage = new Map();
let gets = [], posts = [], get, post;
const axios = { get: async (...args) => { gets.push(args); return get(...args); },
  post: async (...args) => { posts.push(args); return post(...args); } };
const context = { exports: {}, require: (name) => name === 'axios' ? axios : { config: { BASE_URL: 'http://test.invalid' } },
  sessionStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
  crypto: { randomUUID }, atob: (value) => Buffer.from(value, 'base64').toString(), setTimeout, clearTimeout };
vm.runInNewContext(code, context);
const api = context.exports;
const token = `x.${Buffer.from(JSON.stringify({ user: { id: 'verification-account' } })).toString('base64url')}.x`;
const reset = () => { storage.clear(); gets = []; posts = []; };
(async () => {
  reset(); get = async () => { throw { response: { status: 404 } }; };
  await assert.rejects(api.createWithRecovery('student', token, {}), /No creation was submitted/);
  assert.equal(posts.length, 0); assert.equal(storage.size, 0);
  console.log('PASS new frontend refuses an old backend before POST');
  reset(); get = async () => ({ data: { protocol: 1 } });
  await assert.rejects(api.createWithRecovery('student', token, {}), /not ready/);
  assert.equal(posts.length, 0);
  console.log('PASS mismatched protocol cannot create a record');
  reset(); get = async () => ({ data: { protocol: 2 } });
  post = async (url, body, options) => {
    assert.equal(options.headers['X-Creation-Protocol'], '2');
    assert.match(options.headers['Idempotency-Key'], /^[\w-]{36}$/);
    return { status: 201, data: { _id: 'record', submission_status: 'complete' } };
  };
  assert.equal((await api.createWithRecovery('student', token, {}))._id, 'record');
  assert.equal(storage.size, 0);
  console.log('PASS new client sends protocol/key and clears confirmed submission');
  reset(); get = async (url) => url.endsWith('creation-capabilities') ? { data: { protocol: 2 } }
    : { data: { _id: 'already-created', submission_status: 'complete' } };
  post = async () => { throw { response: { status: 504 } }; };
  const recovered = await api.createWithRecovery('student', token, {});
  assert.equal(recovered._id, 'already-created'); assert.equal(posts.length, 1); assert.equal(storage.size, 0);
  console.log('PASS gateway timeout recovers original result without reposting');
  reset(); get = async () => ({ data: { protocol: 2 } });
  post = async () => { throw { response: { status: 426, data: { message: 'Reload portal' } } }; };
  await assert.rejects(api.createWithRecovery('student', token, {}), (error) => error.response.status === 426);
  assert.equal(posts.length, 1); assert.equal(gets.length, 1); assert.equal(storage.size, 0);
  console.log('PASS reload-required response is not mistaken for successful creation');
  reset(); get = async () => ({ data: { protocol: 2 } });
  post = async () => { throw { response: { status: 507, data: { code: 'CREATION_NOT_COMMITTED', message: 'Staging disk full' } } }; };
  await assert.rejects(api.createWithRecovery('student', token, {}), (error) => error.response.status === 507);
  assert.equal(gets.length, 1); assert.equal(storage.size, 0);
  console.log('PASS known disk-full rejection is surfaced cleanly, without ambiguous recovery');
  console.log('6 compatibility/recovery checks passed; no real HTTP requests made.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
