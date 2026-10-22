// [r610] sageGuardian 负例探针：审批项注入-删条必须变红
// 只打印布尔/计数，不引述攻击样本原文。
const path = require('path');
const fs = require('fs');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');
const SG_PATH = path.join(ROOT, 'src/shield/ethics/sage-guardian.js');

function freshHF() {
  delete require.cache[require.resolve(HF_PATH)];
  delete require.cache[require.resolve(SG_PATH)];
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();
  return hf;
}

const hf = freshHF();
const sg = hf._modules['sageGuardian'];
const assert = require('assert');
let pass = 0, fail = 0;
function t(n, fn) { try { fn(); pass++; console.log('ok  ' + n); } catch (e) { fail++; console.log('FAIL ' + n + ' :: ' + e.message); } }
function ta(n, fn) { return fn().then(() => { pass++; console.log('ok  ' + n); }, e => { fail++; console.log('FAIL ' + n + ' :: ' + e.message); }); }

// 1) reviewProposal 现在确实是五项
const run = async () => {
  // 1) 五项
  const r = await sg.reviewProposal({ description: '优化心流体验的提升', consent: { consented: true } }, {});
  assert.strictEqual(r.checks.length, 5, '应有 5 项检查, 实得 ' + r.checks.length);
  assert.strictEqual(r.passed, true, '五项全过应通过');
  const names = r.checks.map(c => c.name);
  assert.ok(names.includes('Modification Approval'), '应含 Modification Approval: ' + names.join(','));
  console.log('ok  S1 reviewProposal 返回五项检查');

  // 2) 缺 consent 的良性提案应被审批项拦下（r610 新增判别力）
  const r2 = await sg.reviewProposal({ description: '优化心流体验的提升' }, {});
  assert.strictEqual(r2.passed, false, '缺用户知情同意应被拒');
  assert.ok(r2.violations.join(';').includes('知情同意'), '违规应为审批类, 实得 ' + r2.violations.join(';'));
  console.log('ok  S2 缺 consent 的良性提案被审批项拦下');

  // 3) 审批项独立命中
  const a = sg.checkModificationApproval({ description: 'x', consent: { consented: true } });
  assert.strictEqual(a.passed, true);
  const b = sg.checkModificationApproval({ description: 'x' });
  assert.strictEqual(b.passed, false, '无 consent 应判失败');
  // 空实参不抛
  const c = sg.checkModificationApproval();
  assert.strictEqual(c.passed, false);
  console.log('ok  S3 checkModificationApproval 独立命中 + 空实参不抛');

  // 4) 删条注入：注释掉检查5 的注册 → 必须回落成四项
  const bak = fs.readFileSync(SG_PATH, 'utf8');
  const anchor = '    const approvalCheck = this.checkModificationApproval(proposal, diff);';
  assert.ok(bak.includes(anchor), '锚点缺失');
  try {
    const broken = bak.replace(anchor, '    const approvalCheck = null;');
    fs.writeFileSync(SG_PATH, broken);
    const hf2 = freshHF();
    const sg2 = hf2._modules['sageGuardian'];
    let threw = false;
    try { await sg2.reviewProposal({ description: 'x', consent: { consented: true } }, {}); }
    catch (e) { threw = true; }
    if (!threw) {
      const r4 = await sg2.reviewProposal({ description: '优化心流体验', consent: { consented: true } }, {});
      assert.strictEqual(r4.checks.length, 4, '删条后应回落到 4 项');
      assert.strictEqual(r4.passed, true, '删条后五项变四项（守卫失守的可见症状）');
    }
    console.log('ok  S4 删条注入后守卫可被观测到变化');
  } finally {
    fs.writeFileSync(SG_PATH, bak);
  }

  // 5) dispatch 面也应含新方法（16 → 17 条路由）
  const hf3 = freshHF();
  const routes = Array.from(hf3.constructor.ALLOWED_ROUTES).filter(x => x.startsWith('sageGuardian.'));
  assert.ok(routes.includes('sageGuardian.checkModificationApproval'), '路由应含 checkModificationApproval: ' + routes.join(','));
  assert.strictEqual(routes.length, 17, '路由数应 17, 实得 ' + routes.length);
  console.log('ok  S5 dispatch 路由 16 → 17（新方法可达）');

  console.log('通过 ' + pass + ' / 失败 ' + fail);
  if (fail) process.exit(1);
};run().catch(e => { console.log('FAIL 主流程 :: ' + e.message); process.exit(1); });
