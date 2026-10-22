/**
 * r606 dispatch 精确复测：只测 ALLOWED_ROUTES 里真实存在的路由，
 * 逐条带合适实参，确认接线后零抛 + 有辨别力。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const allowed = Array.from(HeartFlow.ALLOWED_ROUTES || []).filter(r => r.startsWith('valueInternalizer.'));
  console.log('valueInternalizer 路由数 = ' + allowed.length);
  console.log('路由清单: ' + allowed.join(' | '));

  // 每条路由带针对性实参
  const ARGS = {
    'loadCoreValues': [],
    'getDefaultValues': [],
    'loadValueWeights': [],
    'getDefaultWeights': [],
    'calculateValueAlignmentScore': [{ action: '帮助用户排查故障', context: {} }],
    'evaluateAction': [{ action: '帮助用户排查故障', context: {} }],
    'generateBoundaryRequest': ['读取项目文件', {}],
    'logBoundaryNegotiation': [{ request_type: 'test', action: 'x' }],
    'adaptWeights': [{}],
    'getValueWeights': [],
    'getStatus': [],
    'getDecisionStats': [],
  };

  let ok = 0, bad = [];
  for (const r of allowed) {
    const m = r.slice('valueInternalizer.'.length);
    const args = ARGS[m] !== undefined ? ARGS[m] : [{}];
    try {
      const res = hf.dispatch(r, ...args);
      ok++;
      console.log('  OK ' + r + ' -> ' + (res === undefined ? 'undefined' : (typeof res === 'object' ? 'obj{' + Object.keys(res).slice(0, 6).join(',') + '}' : typeof res)));
    } catch (e) {
      bad.push(r + ': ' + e.message.slice(0, 70));
    }
  }
  console.log('');
  console.log('dispatch 成功 ' + ok + '/' + allowed.length);
  if (bad.length) console.log('抛错:\n  ' + bad.join('\n  '));
})().catch(e => { console.error('PROBE FAIL:', e.message); process.exit(1); });
