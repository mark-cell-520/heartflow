#!/usr/bin/env node
/* r572 诊断5b：handleRequest 返回 shape 细化（只打印结构） */
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const srv = require(path.join(ROOT, 'src/mcp-server.js'));
srv.initHeartFlow();
(async () => {
  const resp = await srv.handleRequest({
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'heartflow_associative', arguments: { action: 'process', text: '代码里的函数调用算法时需要调试编译错误。' } },
  }, 'diag-session', { __stdio: true });
  console.log('--- top keys:', Object.keys(resp), 'isError:', resp.isError);
  console.log('--- content type:', typeof resp.content, 'isArray:', Array.isArray(resp.content));
  if (typeof resp.content === 'object' && resp.content) {
    console.log('--- content keys:', Object.keys(resp.content));
    console.log('--- content.type:', resp.content.type);
    const t = resp.content.text;
    console.log('--- text type:', typeof t);
    if (typeof t === 'string') {
      try {
        const p = JSON.parse(t);
        console.log('--- parsed keys:', Object.keys(p));
        console.log('--- coreConcepts n:', (p.coreConcepts || []).length, 'responseLen:', (p.response || '').length);
      } catch (e) { console.log('--- text not JSON:', String(t).slice(0, 100)); }
    }
  }
  process.exit(0);
})().catch(e => { console.error('fatal', e); process.exit(1); });
