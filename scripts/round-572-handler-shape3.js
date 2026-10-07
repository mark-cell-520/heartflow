#!/usr/bin/env node
/* r572 诊断5c：content[0] 的真实形状（只打印结构与类型） */
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
  const c0 = resp.content[0];
  console.log('--- content[0] typeof:', typeof c0, 'isArray:', Array.isArray(c0));
  console.log('--- content[0] ownKeys:', Object.keys(c0));
  for (const k of Object.keys(c0)) {
    const v = c0[k];
    console.log('--- [' + k + ']', typeof v, Array.isArray(v) ? 'len=' + v.length : (typeof v === 'string' ? 'len=' + v.length : ''));
  }
  process.exit(0);
})().catch(e => { console.error('fatal', e); process.exit(1); });
