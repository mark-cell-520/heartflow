// [r610] boundaryNeg.assess 负例探针：注入-删条后必须变红
// 只打印布尔/计数，不引述攻击样本原文。
const path = require('path');
const fs = require('fs');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');
const BN_PATH = path.join(ROOT, 'src/shield/ethics/boundary-negotiation.js');

function freshHF() {
  delete require.cache[require.resolve(HF_PATH)];
  delete require.cache[require.resolve(BN_PATH)];
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();
  return hf;
}

const hf = freshHF();
const assert = require('assert');
let pass = 0, fail = 0;
function t(n, fn) { try { fn(); pass++; console.log('ok  ' + n); } catch (e) { fail++; console.log('FAIL ' + n + ' :: ' + e.message); } }

// 1) ethics.check 闭包不再抛（修前 100% 抛 TypeError）
t('N1 ethics.check 不再抛', () => {
  const r = hf.ethics.check('读取一个文件');
  assert.ok(r && typeof r === 'object');
  assert.ok(r.guardianResult && r.guardianResult.level);
  assert.ok(r.boundaryResult && 'allowed' in r.boundaryResult);
});

// 2) assess 判别力：模糊带 vs 明确不需要协商
t('N2 assess 对模糊带判 negotiationRequired', () => {
  const r = hf.boundaryNeg.assess('修改系统配置文件');
  assert.strictEqual(r.allowed, false);
  assert.strictEqual(r.negotiationRequired, true);
  assert.ok(typeof r.risk === 'object' && typeof r.risk.score === 'number');
});
t('N3 assess 对低风险动作不拦', () => {
  const r = hf.boundaryNeg.assess('读取列表');
  assert.strictEqual(r.negotiationRequired, false);
});
t('N4 assess 模糊带返回 reason=negotiation_required 且带 risk', () => {
  const r = hf.boundaryNeg.assess('删除目录');
  assert.strictEqual(r.negotiationRequired, true);
  assert.strictEqual(r.allowed, false);
  // [r610 实测修正] needsNegotiation 在 risk.level!=high 时不设 reason（源码 L274-279
  // 只返回 {needed, risk, zone, category}），assess 的兜底 'negotiation_required' 才生效。
  // 原断言写死 'high_risk_requires_fresh_consent' 是错的——'删除目录' 风险分 50 = medium。
  assert.strictEqual(r.reason, 'negotiation_required');
  assert.ok(r.zone === '删除');
  assert.ok(r.risk && typeof r.risk.score === 'number' && r.risk.score >= 40);
});

// 3) 注入：删掉 assess 方法签名行 → ethics.check 必须重新抛
t('N5 删 assess 定义后 ethics.check 重新抛', () => {
  const bak = fs.readFileSync(BN_PATH, 'utf8');
  const probe = '  assess(action, context = {}) {';
  assert.ok(bak.includes(probe), '探针锚点缺失');
  try {
    const broken = bak.replace(probe, '  assessDISABLED(action, context = {}) {');
    fs.writeFileSync(BN_PATH, broken);
    const hf2 = freshHF();
    let threw = false;
    try { hf2.ethics.check('读取一个文件'); } catch (e) {
      threw = /is not a function/.test(e.message);
    }
    assert.ok(threw, '删除 assess 后 ethics.check 应重新抛 is not a function');
  } finally {
    fs.writeFileSync(BN_PATH, bak);
    freshHF();
  }
});

// 4) 每次 assess 的缓存名字要唯一，否则上面 N5 的 freshHF 拿到旧模块
t('N6 assess 在模块原型上（非实例属性）', () => {
  const BN = require(BN_PATH).BoundaryNegotiation;
  assert.strictEqual(typeof BN.prototype.assess, 'function');
});

console.log('通过 ' + pass + ' / 失败 ' + fail);
if (fail) process.exit(1);
