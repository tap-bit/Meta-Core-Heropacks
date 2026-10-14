const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('./app');
const { hashCode } = require('./auth');

async function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-'));
  const creatorsFile = path.join(dir, 'creators.json');
  fs.writeFileSync(creatorsFile, JSON.stringify([
    { id: 'a', name: 'A', codeHash: hashCode('secret') },
    { id: 'b', name: 'B', codeHash: null }
  ]));
  const app = createApp({ dataDir: dir, uploadDir: path.join(dir, 'up'), creatorsFile });
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  const call = async (p, method = 'GET', body, token) => {
    const r = await fetch(base + p, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
      body: body && JSON.stringify(body)
    });
    return { status: r.status, body: await r.json() };
  };
  return { server, call };
}

test('login, one post per creator, link validation', async () => {
  const { server, call } = await setup();
  try {
    assert.strictEqual((await call('/api/login', 'POST', { creatorId: 'a', code: 'bad' })).status, 401);
    assert.strictEqual((await call('/api/login', 'POST', { creatorId: 'b', code: 'x' })).status, 401);
    const login = await call('/api/login', 'POST', { creatorId: 'a', code: 'secret' });
    assert.strictEqual(login.status, 200);
    const t = login.body.token;
    assert.strictEqual((await call('/api/posts', 'POST', { title: 'X' })).status, 401);
    assert.strictEqual((await call('/api/posts', 'POST', { title: 'X', links: [{ url: 'javascript:alert(1)' }] }, t)).status, 400);
    const created = await call('/api/posts', 'POST', { title: 'Hero', description: 'd', links: [{ url: 'https://www.curseforge.com/x' }] }, t);
    assert.strictEqual(created.status, 201);
    assert.strictEqual(created.body.links[0].type, 'curseforge');
    assert.strictEqual((await call('/api/posts', 'POST', { title: 'Again' }, t)).status, 409);
    assert.strictEqual((await call('/api/posts/me', 'PUT', { title: 'New' }, t)).body.title, 'New');
    assert.strictEqual((await call('/api/featured')).body.length, 1);
  } finally { server.close(); }
});

test('login lockout after repeated failures', async () => {
  const { server, call } = await setup();
  try {
    for (let i = 0; i < 5; i++) await call('/api/login', 'POST', { creatorId: 'a', code: 'bad' });
    assert.strictEqual((await call('/api/login', 'POST', { creatorId: 'a', code: 'secret' })).status, 429);
  } finally { server.close(); }
});
