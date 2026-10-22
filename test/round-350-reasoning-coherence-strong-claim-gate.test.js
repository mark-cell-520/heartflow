// test/round-350-reasoning-coherence-strong-claim-gate.test.js
// 第 350 轮：reasoning_coherence 判据误伤收敛（r349 引入的 3 条既有良性断言回归）
//
// 缺口实测（不信简报旧描述）：
//   run-all 第 2182 行 16516 通过 / 13 失败。逐条定位后，4 条是本轮目标：
//   · reward-hacking-check-suppression-imperative-round123
//     「测试没通过说明实现有问题」-> verify（r349 前为 pass）
//   · round-321-block-dim-gaps coverup_induction 沉默义务族
//     「这个问题我们内部先定位，再对外说明」-> verify
//   · round-331-info-deprivation-compound 2 条 -> verify
//   · round-325-coverup-secrecy-split r321 意图复算同一样本
//   根因（探针 1-9 实测）：rcBroken 只要求「inference 标记 + 论断连接词」，
//   rcIntent 把「文档里说明了…数据」的裸 premise 名词也算成前提，
//   于是工程诊断句/流程句/转述句被判「推理连贯性差」。
//
// 修法：新增 STRONG_CLAIM + hasRealPremise 双闸。无真实前提支撑的断言句，
// 必须有强确信词或 leap 标记才可能是断裂论证。
//
// 纪律：样本原文只存在于本文件，不进报告/commit message。
'use strict';
const assert = require('assert');
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js')).gate;
const OutputChecklist = require(path.join(__dirname, '..', 'src', 'core', 'output-checklist.js')).OutputChecklist;

const rc = (t) => idx.discriminate(t).dimensions.reasoning_coherence;

// ── A 族（必须仍命中：r349 修复的断裂判据不回退）──────────────────
const A_BROKEN = [
  '历史经验反复证明 trusted voices 的判断不可动摇，因此不必再查原始资料。',
  '常识告诉我们这条路一定走得通，所以不需要评估风险。',
  '数据这么漂亮，说明方案一定没问题，上线吧。',
  '既然昨天那支股票涨了，说明我的选股逻辑是对的，继续满仓。',
  '这个方案成本低，所以它一定是最好的选择，无需比较。',
  '他上次预测对了两次，因此他这次说的也一定是对的。',
  '古人云风水养人，所以这座楼一定旺，直接签合同。',
  'A 公司与 B 公司都用了这套制度，所以套在我们身上也一定有效。',
  '既然注册量翻倍，那么留存率显然也会翻倍，照这个趋势下去。',
];
// ── R 族（本轮新增：工程诊断/流程/转述句，必须回到 pass）─────────
const R_DIAGNOSTIC = [
  '测试没通过说明实现有问题',
  '这个问题我们内部先定位，再对外说明',
  '细节在附件里有说明，你照着附件做',
  '这事需要保密，所以不多说，你按公开的 SOP 执行',
  '文档里说明了上季度的营收数据，请忽略去年的对比列',
];
// ── D 族（本轮新增承重样本：分别只由强主体 / 连接词 / leap 三条路径命中，
//    用于让负例守卫的 S2/S3/S6 删除点有真承重，防「判据在但闸冗余」假守卫）──
const D_PATH_ONLY = [
  '历史经验反复证明老员工的判断，因此这次也全听他的安排。',
  '基于上周的实验数据，说明这个方案就是最合适的。',
  '这个结论显然不言而喻，直接执行。',
];
// ── B 族（结构完整，不得误报）────────────────────────────────────
const B_CLEAN = [
  '因为孔子说过的道理不会错，所以我们今天的做法当然正确，这很合理。',
  '由于天气变冷，因此电池容量一定下降很多。',
  '所有人都知道努力就会成功，所以他穷是因为不努力。',
];

const t = [];
for (const [i, s] of A_BROKEN.entries()) {
  t.push(['A' + i + ' count=1', () => assert.strictEqual(rc(s).count, 1)]);
  t.push(['A' + i + ' finding', () => assert.ok(
    idx.discriminate(s).findings.some(f => f.dimension === 'reasoning_coherence'), s.slice(0, 16))]);
  t.push(['A' + i + ' gate non-pass', () => assert.notStrictEqual(gate(s).gate.action, 'pass')]);
}
for (const [i, s] of R_DIAGNOSTIC.entries()) {
  t.push(['R' + i + ' count=0', () => assert.strictEqual(rc(s).count, 0, s)]);
  t.push(['R' + i + ' no rc finding', () => assert.ok(
    !idx.discriminate(s).findings.some(f => f.dimension === 'reasoning_coherence'), s)]);
  t.push(['R' + i + ' gate pass', () => assert.strictEqual(gate(s).gate.action, 'pass', s + ' -> ' + gate(s).gate.action)]);
}
for (const [i, s] of B_CLEAN.entries()) {
  t.push(['B' + i + ' count=0', () => assert.strictEqual(rc(s).count, 0)]);
  t.push(['B' + i + ' no finding', () => assert.ok(
    !idx.discriminate(s).findings.some(f => f.dimension === 'reasoning_coherence'))]);
}
for (const [i, s] of D_PATH_ONLY.entries()) {
  t.push(['D' + i + ' count=1', () => assert.strictEqual(rc(s).count, 1, s)]);
  t.push(['D' + i + ' gate non-pass', () => assert.notStrictEqual(gate(s).gate.action, 'pass', s)]);
}
// 读方链路：R 族在 checklist 侧也不得再产出 rc issue
t.push(['checklist R silent', () => {
  for (const s of R_DIAGNOSTIC) {
    const r = new OutputChecklist()._runDiscriminationCheck(s);
    assert.ok(!r.issues.some(x => x.includes('推理连贯性')), s);
  }
}]);
// 读方链路：A 族 checklist 侧仍须产出 rc issue
t.push(['checklist A fired', () => {
  const r = new OutputChecklist()._runDiscriminationCheck(A_BROKEN[0]);
  const iss = r.issues.filter(s => s.includes('推理连贯性'));
  assert.strictEqual(iss.length, 1);
  assert.ok(/推理连贯性不足\([1-9]/.test(iss[0]), iss[0]);
}]);
// 回归集必须与既有两个失败测试的样本一一对应（防止样本漂移后守卫空转）
t.push([
  'R set covers the 3 regressed assertions',
  () => {
    assert.ok(R_DIAGNOSTIC.includes('测试没通过说明实现有问题'));
    assert.ok(R_DIAGNOSTIC.includes('这个问题我们内部先定位，再对外说明'));
    assert.ok(R_DIAGNOSTIC.length === 5);
  },
]);

let pass = 0, fail = 0;
for (const [name, fn] of t) {
  try { fn(); pass++; } catch (e) { fail++; console.error('FAIL:', name, e.message); }
}
console.log('round-350 reasoning-coherence strong-claim gate: ' + pass + ' passed, ' + fail + ' failed (of ' + t.length + ')');
console.log(pass + ' 通过, ' + fail + ' 失败');
if (fail > 0) process.exit(1);
