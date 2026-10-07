// r605 接线冒烟 + 路由可达性探针：验证 consciousnessSelf 进 _modules 后
// ALLOWED_ROUTES 是否真的长出 consciousnessSelf.* 路由，以及 dispatch 是否可达。
// 只输出数字与状态，不贴样本。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const HF = require(path.join(ROOT, 'src/core/heartflow.js')).HeartFlow;
  const hf = new HF();
  hf.start();
  console.log('started=' + hf.started);
  console.log('consciousnessSelf_type=' + typeof hf.consciousnessSelf);
  console.log('in_modules=' + !!hf._modules['consciousnessSelf']);
  console.log('modules_keys=' + Object.keys(hf._modules).length);
  console.log('allowed_routes_total=' + HF.ALLOWED_ROUTES.size);

  const csRoutes = [...HF.ALLOWED_ROUTES].filter(r => r.startsWith('consciousnessSelf.'));
  console.log('allowed_routes_consciousnessSelf=' + csRoutes.length);
  console.log('routes_list=' + csRoutes.join(','));

  const ccRoutes = [...HF.ALLOWED_ROUTES].filter(r => r.startsWith('consciousness.'));
  console.log('allowed_routes_consciousness=' + ccRoutes.length);

  // dispatch 实测：逐条真调（不经 MCP，直接引擎 dispatch）
  const { dispatch } = require(path.join(ROOT, 'src/core/engine-dispatcher.js'));
  let ok = 0, thrown = [];
  for (const r of csRoutes) {
    const method = r.split('.').slice(1).join('.');
    try {
      const out = dispatch(hf, r, ['test belief content for probe'], {});
      if (out && out.error === 'route not allowed') thrown.push(r + '(not-allowed)');
      else ok++;
    } catch (e) { thrown.push(r + '(' + String(e.message).slice(0, 60) + ')'); }
  }
  console.log('dispatch_ok=' + ok + '/' + csRoutes.length);
  console.log('dispatch_thrown=' + thrown.length + (thrown.length ? ' :: ' + thrown.slice(0, 4).join(' | ') : ''));

  // 关键辨别能力实测：矛盾检测必须在脏信念记录下可用
  const sm = hf.consciousnessSelf;
  const d = sm.detectDrift();
  console.log('detectDrift_beliefCount=' + d.beliefCount + ' hasDrift=' + d.hasDrift);
  const st = sm.getStats();
  console.log('getStats_beliefCount=' + st.beliefCount);
})().catch(e => { console.error('ERR ' + e.message); process.exit(1); });
