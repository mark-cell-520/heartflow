// [r605] consciousnessSelf dispatch 接线守卫测试
// 覆盖：
//   ① 接线真实生效（_modules 注册 + 15 条 ALLOWED_ROUTES + routes() 可见）
//   ② 辨别能力实测：矛盾信念可检出、drift 修复可执行、脏记录不抛
//   ③ 删块注入负例：删掉注册行后 dispatch 必须重新抛 route not allowed
//   ④ 稳健性：空参/脏参数调用零抛（r604 判空修复的守卫）
// 只报数字与形状，不贴样本原文。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const HF = path.join(ROOT, 'src/core/heartflow.js');
const SM = path.join(ROOT, 'src/identity/self-model.js');

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
}

const EXPECT_ROUTES = [
  'updateBelief', 'getBeliefs', 'addCapability', 'addLimitation',
  'getCapabilities', 'getLimitations', 'detectDrift', 'repairDrift',
  'recordInstall', 'getInstallBase', 'updateGrowthMetrics', 'getGrowthMetrics',
  'getIdentityCore', 'counterfactual', 'getStats',
];

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  // ── ① 接线面 ────────────────────────────────────────────────
  console.log('== 接线面 ==');
  ok(hf._modules['consciousnessSelf'] === hf.consciousnessSelf, '实例进 _modules（identity 同一对象）');
  for (const m of EXPECT_ROUTES) {
    ok(HeartFlow.ALLOWED_ROUTES.has('consciousnessSelf.' + m), 'ALLOWED_ROUTES 含 consciousnessSelf.' + m);
  }
  const visible = (hf.routes()['consciousnessSelf'] || []).filter(r => !r.includes('[未注册'));
  ok(visible.length === EXPECT_ROUTES.length, 'routes() 可见 15 条且均未标「未注册」', '实得 ' + visible.length);
  // 假注册点守卫：'consciousness' 壳键不得被本改动重复注册/替换
  ok(hf._modules['consciousness'] !== hf.consciousnessSelf, '壳键 consciousness 未被本接线覆盖');

  // ── ② 辨别能力实测：dispatch 逐条真调 ───────────────────────
  console.log('== 辨别力 ==');
  const cs = hf.consciousnessSelf;
  const before = cs.detectDrift().beliefCount;

  // dispatch 是位置参数分发（engine-dispatcher L109: mod[method](...args)），
  // 因此参数按目标方法签名顺序展开，不传包裹对象。
  const add = hf.dispatch('consciousnessSelf.updateBelief', 'r605 probe belief always holds', 0.85, 'test');
  ok(add && add.id, 'dispatch updateBelief 返回 id', 'beliefCount ' + before + '→' + cs.getBeliefs().length);
  const add2 = hf.dispatch('consciousnessSelf.updateBelief', 'r605 probe belief never fails', 0.85, 'test');
  ok(add2 && add2.id, 'dispatch updateBelief 第二条');

  // 矛盾检出：always vs never 成对即应报 conflict
  const drift = hf.dispatch('consciousnessSelf.detectDrift');
  ok(drift && Array.isArray(drift.conflicts) && drift.conflicts.length > 0,
     'detectDrift 检出矛盾信念（非恒 false）', 'conflicts=' + (drift ? drift.conflicts.length : 'n/a'));
  ok(drift && typeof drift.driftScore === 'number', 'detectDrift 返回 driftScore 数值');

  // 漂移修复可执行
  const rep = hf.dispatch('consciousnessSelf.repairDrift', drift);
  ok(rep && rep.repaired === true, 'dispatch repairDrift 可执行', 'removed=' + (rep ? rep.removed : 'n/a'));

  // 反事实推理可执行
  const cf = hf.dispatch('consciousnessSelf.counterfactual', 'if this belief were false then the conclusion changes');
  ok(Array.isArray(cf) && cf.length >= 2, 'dispatch counterfactual 返回推理结果', 'len=' + (Array.isArray(cf) ? cf.length : 'n/a'));

  // 身份核心 + 成长指标 + 统计（其余路由覆盖）
  ok(hf.dispatch('consciousnessSelf.getIdentityCore') !== undefined, 'dispatch getIdentityCore 可达');
  ok(typeof hf.dispatch('consciousnessSelf.getStats') === 'object', 'dispatch getStats 可达');
  ok(typeof hf.dispatch('consciousnessSelf.getGrowthMetrics') === 'object', 'dispatch getGrowthMetrics 可达');
  hf.dispatch('consciousnessSelf.addCapability', 'r605-dispatch-probe');
  ok(cs.getCapabilities().includes('r605-dispatch-probe'), 'dispatch addCapability 生效');

  // ── ③ 删块注入负例（必须变红） ─────────────────────────────
  console.log('== 删块注入负例（必须变红） ==');
  const { arm, disarm, recover, restoreOne } = require('./mutation-guard-recovery.js');
  recover([HF]);
  const src = fs.readFileSync(HF, 'utf8');
  const REG = "this._modules['consciousnessSelf'] = this.consciousnessSelf;";
  ok(src.includes(REG), '注册行存在于源码（负例前置确认）');

  arm(HF, src);
  try {
    const mutated = src.replace(REG, '/* r605 negative-test: registration removed */');
    if (mutated === src) throw new Error('mutation did not change source');
    fs.writeFileSync(HF, mutated);
    delete require.cache[require.resolve(HF)];
    const M = require(HF);
    const Fresh = M.HeartFlow || (M.default && M.default.HeartFlow) || M;
    if (typeof Fresh !== 'function') throw new Error('mutated module export is not a constructor');
    const hf2 = new Fresh();
    hf2.start();
    let threw = false;
    try { hf2.dispatch('consciousnessSelf.detectDrift', {}); } catch (e) { threw = /not allowed/i.test(e.message); }
    ok(threw, '删掉注册行后 dispatch 重新抛 route not allowed', '负例生效');
    ok(!hf2._modules['consciousnessSelf'], '删掉注册行后 _modules 无该键');
    ok(Fresh.ALLOWED_ROUTES.has('consciousnessSelf.detectDrift') === false, '删掉注册行后 ALLOWED_ROUTES 不再含该路由');
  } catch (e) {
    console.log('  FAIL 负例执行异常: ' + e.message);
    fail++;
  } finally {
    restoreOne(HF);
    disarm(HF);
    delete require.cache[require.resolve(HF)];
  }

  // 还原后仍可用
  delete require.cache[require.resolve(HF)];
  const M2 = require(HF);
  const Fresh2 = M2.HeartFlow || (M2.default && M2.default.HeartFlow) || M2;
  const hf3 = new Fresh2();
  hf3.start();
  ok(!!hf3._modules['consciousnessSelf'], '恢复后注册归位');
  ok(fs.readFileSync(HF, 'utf8').includes(REG), '恢复后源码含注册行（字节级确认）');
  ok(hf3.dispatch('consciousnessSelf.getStats', {}) !== undefined, '恢复后 dispatch 仍可达');

  // ── ④ 稳健性：脏信念记录下不抛（r604/r605 判空守卫） ────────
  console.log('== 稳健性 ==');
  const { SelfModel } = require(SM);
  const tmpRoot = path.join(ROOT, 'data', '_tmp_r605_selftest');
  fs.mkdirSync(tmpRoot, { recursive: true });
  // 手工构造脏数据：缺 content / content 非字符串 / confidence 非数字
  fs.writeFileSync(path.join(tmpRoot, 'self-model.json'), JSON.stringify({
    beliefs: {
      b1: { confidence: 0.9, source: 'x', createdAt: 1 },
      b2: { content: null, confidence: 0.8, createdAt: 2 },
      b3: 'not-an-object',
      b4: { content: 'always', confidence: 'high', createdAt: 3 },
    },
    capabilities: [], limitations: [], identityHistory: [],
    growthMetrics: {}, installBase: 0, whoAmI: [], meaning: [], painPoints: [],
  }));
  let noThrow = true, why = '';
  try {
    const sm2 = new SelfModel(tmpRoot);
    sm2.detectDrift();
    sm2.repairDrift({ conflicts: ['x'] });
    sm2.getStats();
    sm2.counterfactual('if x then y');
    sm2.counterfactual(undefined);
    sm2.updateBelief(undefined);
    sm2.updateBelief('');
    ok(sm2.getBeliefs().length === 3, '脏记录被清洗到 3 条（非对象删除、缺 content 补空串）', '实得 ' + sm2.getBeliefs().length);
    const b4 = sm2.getBeliefs().find(b => b.content === 'always');
    ok(b4 && typeof b4.confidence === 'number' && Number.isFinite(b4.confidence), '非数字 confidence 被归一化', 'confidence=' + (b4 ? b4.confidence : 'n/a'));
  } catch (e) { noThrow = false; why = e.message; }
  ok(noThrow, '脏信念记录下 6 个方法零抛', why);
  try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (e) { /* 清理失败不影响结论 */ }

  console.log('\n== 汇总 ==');
  console.log('passed=' + pass + ' failed=' + fail);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
