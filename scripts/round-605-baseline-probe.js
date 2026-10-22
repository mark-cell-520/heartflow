// r605 基线分辨探针：判断 doc-numbers 的 7 个失败哪些是本轮引入。
// 1) _modules 键数（去掉 consciousnessSelf 即改动前基线）
// 2) MCP 工具数实测
// 3) dispatch 路由总数
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});
(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  const keys = Object.keys(hf._modules);
  console.log('modules_total=' + keys.length);
  console.log('modules_excluding_consciousnessSelf=' + keys.filter(k => k !== 'consciousnessSelf').length);
  console.log('has_consciousnessSelf=' + keys.includes('consciousnessSelf'));
  console.log('has_progressJudgment=' + keys.includes('progressJudgment'));
  console.log('has_topicScope=' + keys.includes('topicScope'));
  console.log('allowed_routes=' + HeartFlow.ALLOWED_ROUTES.size);

  // MCP 工具实测
  try {
    const mcpSrc = require('fs').readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
    const m = mcpSrc.match(/name:\s*['"]heartflow_[a-zA-Z0-9_]+['"]/g) || [];
    const uniq = [...new Set(m.map(s => s.replace(/.*['"]/, '')))];
    console.log('mcp_tools_named=' + uniq.length);
  } catch (e) { console.log('mcp_tools_err=' + e.message); }
})().catch(e => { console.error('ERR ' + e.message); process.exit(1); });
