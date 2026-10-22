// r596：确认 handleRequest 可用（单样本探路，不跑全量）
const srv = require('../src/mcp-server.js');
console.log('exports =', Object.keys(srv).join(', '));
console.log('handleRequest type =', typeof srv.handleRequest);
try {
  const r = srv.handleRequest({ jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'heartflow_status', arguments: {} } });
  const s = JSON.stringify(r);
  console.log('status 调用长度 =', s.length);
  console.log('前 200 字 =', s.slice(0, 200));
} catch (e) {
  console.log('调用抛错 =', e.message);
}
