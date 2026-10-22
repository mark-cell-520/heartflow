// r597：以正确姿势（await handleRequest）验证 r596 遗留的四条 MCP 坏接线是否已修好，
// 并实测 registry 缺口现状——给本轮接线动作做前后对照。
const srv = require('../src/mcp-server.js');

const CASES = [
  { name: 'heartflow_lesson_search', arguments: { query: 'supervisorctl profile status' } },
  { name: 'heartflow_lesson_bank', arguments: { query: 'supervisorctl profile status' } },
  { name: 'heartflow_audit_trace', arguments: { action: 'tags' } },
  { name: 'heartflow_retention_log', arguments: { action: 'query', limit: 1 } },
];

(async () => {
  for (const c of CASES) {
    try {
      const r = await srv.handleRequest({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: c });
      const s = JSON.stringify(r);
      console.log(c.name, '=> len', s.length, '|', s.slice(0, 180));
    } catch (e) {
      console.log(c.name, '=> THROWS', e && e.message);
    }
  }
  // registry 可见性
  const reg = await srv.handleRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const names = (reg.tools || []).map(t => t.name);
  console.log('tools/list 可见数 =', names.length);
  for (const c of CASES) console.log('  registry 可见:', c.name, '=', names.includes(c.name));
})();
