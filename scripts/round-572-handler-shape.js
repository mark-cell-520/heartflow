#!/usr/bin/env node
/* r572 诊断5：handleRequest 真实返回形状（只打印结构，不打印样本原文） */
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
  console.log('--- 顶层键:', Object.keys(resp));
  console.log('--- jsonrpc:', resp.jsonrpc, 'id:', resp.id);
  console.log('--- result 键:', resp.result ? Object.keys(resp.result) : 'null');
  console.log('--- content 类型:', resp.result && resp.result.content ? typeof resp.result.content : 'null');
  const c = resp.result && resp.result.content;
  if (c) {
    console.log('--- content 是数组:', Array.isArray(c), 'len:', Array.isArray(c) ? c.length : 'N/A');
    if (Array.isArray(c) && c[0]) {
      console.log('--- content[0] 键:', Object.keys(c[0]));
      console.log('--- content[0].type:', c[0].type);
      const t = c[0].text;
      console.log('--- text 类型:', typeof t, 'len:', t ? String(t).length : 0);
      if (t) {
        try {
          const parsed = JSON.parse(t);
          console.log('--- parsed 键:', Object.keys(parsed));
          console.log('--- parsed.coreConcepts n:', (parsed.coreConcepts || []).length);
        } catch (e) { console.log('--- text 非 JSON，前120字:', String(t).slice(0, 120)); }
      }
    }
  }
  // 也看别的方法名：tools/list 可能叫 tools/list 之外的
  for (const m of ['tools/list', 'listTools', 'tools.calls']) {
    try {
      const r2 = await srv.handleRequest({ jsonrpc: '2.0', id: 2, method: m, params: {} }, 'd', { __stdio: true });
      console.log('--- 方法', m, '→', r2 && r2.error ? 'error: ' + r2.error.message : 'ok, keys=' + Object.keys(r2.result || {}));
    } catch (e) { console.log('--- 方法', m, '→ threw', e.message); }
  }
  process.exit(0);
})().catch(e => { console.error('fatal', e); process.exit(1); });
