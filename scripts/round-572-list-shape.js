#!/usr/bin/env node
/* r572 诊断6：tools/list 返回 shape（只打印结构） */
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const srv = require(path.join(ROOT, 'src/mcp-server.js'));
srv.initHeartFlow();
(async () => {
  const resp = await srv.handleRequest(
    { jsonrpc: '2.0', id: 9, method: 'tools/list', params: {} }, 'd', { __stdio: true });
  console.log('--- top keys:', Object.keys(resp));
  console.log('--- content isArray:', Array.isArray(resp.content), 'len:', Array.isArray(resp.content) ? resp.content.length : 'N/A');
  const c0 = resp.content && resp.content[0];
  if (c0) {
    console.log('--- content[0] keys:', Object.keys(c0));
    const t = c0.text;
    if (typeof t === 'string') {
      try {
        const p = JSON.parse(t);
        console.log('--- parsed 顶层键:', Object.keys(p));
        if (Array.isArray(p.tools)) console.log('--- p.tools len:', p.tools.length);
        if (Array.isArray(p)) console.log('--- parsed 本身是数组 len:', p.length);
      } catch (e) { console.log('--- text not JSON, len:', t.length, 'head:', t.slice(0, 80)); }
    }
  }
  process.exit(0);
})().catch(e => { console.error('fatal', e); process.exit(1); });
