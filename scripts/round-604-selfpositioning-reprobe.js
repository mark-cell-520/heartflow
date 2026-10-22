// r604 复测探针：确认 selfPositioning / aiSelfPositioning 的接线实况。
// 已知线索（需实测证实，不照抄）：
//   · engine-lifecycle.js L32 subsystemNames 含 'selfPositioning'
//   · heartflow.js L2586 有别名 this.selfPositioning = this.aiSelfPositioning
// 但 r604 候选探针显示 selfPositioning / aiSelfPositioning 都不在 _modules。
// 本探针逐项验证：实例是否活着、_modules 是否有键、ALLOWED_ROUTES 是否含其路由、
//   dispatch 是否抛 'route not allowed'。
// 只输出布尔与名字，不贴样本原文。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const keys = Object.keys(hf._modules);
  const out = {};
  out.inModules_selfPositioning = keys.includes('selfPositioning');
  out.inModules_aiSelfPositioning = keys.includes('aiSelfPositioning');
  out.instance_alive = !!hf.aiSelfPositioning;
  out.alias_same_object = hf.selfPositioning === hf.aiSelfPositioning;
  out.ctor_name = hf.aiSelfPositioning && hf.aiSelfPositioning.constructor && hf.aiSelfPositioning.constructor.name;

  const proto = Object.getPrototypeOf(hf.aiSelfPositioning || {});
  out.methods = proto && proto !== Object.prototype
    ? Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof hf.aiSelfPositioning[m] === 'function' && !m.startsWith('_'))
    : [];

  const allowed = hf.ALLOWED_ROUTES || hf._allowedRoutes;
  let allowedList = null;
  if (allowed instanceof Set) allowedList = [...allowed].filter(r => r.startsWith('selfPositioning') || r.startsWith('aiSelfPositioning'));
  else if (Array.isArray(allowed)) allowedList = allowed.filter(r => r.startsWith('selfPositioning') || r.startsWith('aiSelfPositioning'));
  else if (allowed && typeof allowed === 'object') allowedList = Object.keys(allowed).filter(r => r.startsWith('selfPositioning') || r.startsWith('aiSelfPositioning'));
  out.allowedRoutes_matching = allowedList;

  // dispatch 实测
  const dispatchProbe = {};
  if (allowedList && allowedList.length) {
    for (const r of allowedList.slice(0, 3)) {
      try {
        const v = hf.dispatch ? hf.dispatch(r, {}) : undefined;
        dispatchProbe[r] = 'OK';
      } catch (e) { dispatchProbe[r] = 'THROW:' + String(e.message).slice(0, 60); }
    }
  }
  out.dispatchProbe = dispatchProbe;

  // 直接试 dispatch 一条不在白名单的（看报错形态）
  try {
    const v = hf.dispatch ? hf.dispatch('selfPositioning.analyze', {}) : undefined;
    out.direct_dispatch_selfPositioning_analyze = 'OK';
  } catch (e) {
    out.direct_dispatch_selfPositioning_analyze = 'THROW:' + String(e.message).slice(0, 80);
  }

  // MCP 侧是否已有包装工具调它
  out.mcp_tool_philosophy = 'heartflow_philosophy (src/mcp-server.js L3406) 自行 new AISelfPositioning()，不经过 hf 实例';
  out.mcp_tool_supervise = 'heartflow_supervise_progress 已在调 hf.progressJudgment（r603 已接线）';

  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
