import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const base = '/mbas-example/',
  root = resolve('dist');
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (!path.startsWith(base)) throw Error();
    const p = resolve(root, decodeURIComponent(path.slice(base.length)) || 'index.html');
    if (!p.startsWith(root + '/') && p !== root) throw Error();
    const data = await readFile(p);
    res.setHeader(
      'Content-Type',
      { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(p)] ||
        'application/octet-stream',
    );
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const hash of [
    '',
    '#essence',
    '#finance',
    '#relations',
    '#periods',
    '#elements',
    '#method',
  ]) {
    const r = await fetch(origin + base + hash);
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.match(html, /lang="zh-Hant"/);
    for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
      assert.ok(m[1].startsWith('./'), '資產應為相對路徑');
      const url = new URL(m[1], origin + base);
      assert.equal((await fetch(url)).status, 200);
    }
  }
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  assert.ok(!/https?:\/\//.test(html), '產出不依賴外部CDN');
  console.log(
    'PASS：正式產物在 /mbas-example/ 子路徑可載入；七個 hash URL 與所有引用資產 HTTP 200。',
  );
} finally {
  server.close();
}
