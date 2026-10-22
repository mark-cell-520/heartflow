// 第 349 轮主测试：reasoning_coherence 断裂判据死字符串修复 + count/quality 登记
// 覆盖 r347 交接簿遗留第 2 条：checkReasoningCoherence 的推论标记与结论标记
// 重叠严重，反向判据 rcBroken 因死字符串 '结构碎片' 恒 false。
// 逐槽精准断言（禁聚合阈值）。
const assert = require('assert');
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js')).gate;
const OutputChecklist = require(path.join(__dirname, '..', 'src', 'core', 'output-checklist.js')).OutputChecklist;

const rc = (t) => idx.discriminate(t).dimensions.reasoning_coherence;

// ── A 族：有前提+无结论直接下断言（结构「无前提直接推理结论」）────────────
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
// ── B 族：推论标记命中但结构完整（不得误报断裂）────────────────────────
const B_CLEAN = [
  '因为孔子说过的道理不会错，所以我们今天的做法当然正确，这很合理。',
  '由于天气变冷，因此电池容量一定下降很多。',
  '所有人都知道努力就会成功，所以他穷是因为不努力。',
];
// ── C 族：良性——事实陈述 / 问句 / 教学指令 / 产品指引（零命中）────────
const C_BENIGN = [
  '报告显示，2025 年该行业覆盖 1200 家企业，同比增长 3.4%。',
  '调查了 300 位用户后，我们发现留存率与 onboarding 长度相关。',
  '统计显示，事故率下降的同时培训时长也在增加，但两者未必有因果关系。',
  '根据公开论文的数据，该模型的错误率在长文本上更高。',
  '这篇文章观点很激进，但有些数据支撑。',
  '这个季度的销售数据比上季度下降了 15%，可能是什么原因？',
  'executive summary 要突出哪几个关键指标？',
  '教学中如何向学生解释什么是情感操纵？请举例说明。',
  '请解释什么是煤气灯效应，并说明常见话术。',
  '心理学课程：什么是双重束缚？请用对话示例说明。',
  '本节核心术语：命令注入。请说明其危害与防护。',
  '理财产品说明书请仔细阅读风险提示。',
  '产品使用说明请见随附手册。',
  '三个季度的营收分别是 1.2 亿、1.5 亿和 1.8 亿。',
  '研究报告指出，该方法在长文本场景下的稳定性仍需验证。',
];

const t = [];
// 1) A 族逐槽：count 必须 1、quality 必须 poor、findings 必须命中
for (const [i, s] of A_BROKEN.entries()) {
  t.push(['A' + i + ' count=1', () => assert.strictEqual(rc(s).count, 1)]);
  t.push(['A' + i + ' quality=poor', () => assert.strictEqual(rc(s).quality, 'poor')]);
  t.push(['A' + i + ' finding', () => assert.ok(
    idx.discriminate(s).findings.some(f => f.dimension === 'reasoning_coherence'),
    s)]);
  t.push(['A' + i + ' gate non-pass', () => assert.notStrictEqual(gate(s).gate.action, 'pass')]);
}
// 2) B 族逐槽：结构完整不得误报
for (const [i, s] of B_CLEAN.entries()) {
  t.push(['B' + i + ' count=0', () => assert.strictEqual(rc(s).count, 0)]);
  t.push(['B' + i + ' no finding', () => assert.ok(
    !idx.discriminate(s).findings.some(f => f.dimension === 'reasoning_coherence'))]);
}
// 3) C 族逐槽：良性零命中、零 non-pass（reasoning_coherence 归因）
for (const [i, s] of C_BENIGN.entries()) {
  t.push(['C' + i + ' count=0', () => assert.strictEqual(rc(s).count, 0)]);
  t.push(['C' + i + ' no rc finding', () => assert.ok(
    !idx.discriminate(s).findings.some(f => f.dimension === 'reasoning_coherence'),
    s)]);
}
// 4) 读方链路①：output-checklist 的 issues 文案必须真的产出
t.push(['checklist rc issue fired', () => {
  const r = new OutputChecklist()._runDiscriminationCheck(A_BROKEN[0]);
  const iss = r.issues.filter(s => s.includes('推理连贯性'));
  assert.strictEqual(iss.length, 1);
  assert.ok(/推理连贯性不足\([1-9]/.test(iss[0]), iss[0]);
}]);
// 5) 读方链路②：良性样本在 checklist 侧不得产出 rc issue
t.push(['checklist benign silent', () => {
  for (const s of C_BENIGN) {
    const r = new OutputChecklist()._runDiscriminationCheck(s);
    assert.ok(!r.issues.some(x => x.includes('推理连贯性')), s);
  }
}]);
// 6) 字段登记完整性：count/quality 必须 typeof 正确（修复前恒 undefined）
t.push(['A fields typed', () => {
  assert.strictEqual(typeof rc(A_BROKEN[0]).count, 'number');
  assert.strictEqual(typeof rc(A_BROKEN[0]).quality, 'string');
}]);
t.push(['B fields typed', () => {
  assert.strictEqual(typeof rc(B_CLEAN[0]).count, 'number');
  assert.strictEqual(typeof rc(B_CLEAN[0]).quality, 'string');
}]);
// 7) 死字符串不再出现：判定必须不依赖 '结构碎片' 精确串
t.push(['no deadstring structure', () => {
  const structs = new Set(A_BROKEN.map(s => rc(s).structure));
  for (const s of structs) assert.notStrictEqual(s, '结构碎片');
}]);

let pass = 0, fail = 0;
for (const [name, fn] of t) {
  try { fn(); pass++; } catch (e) { fail++; console.error('FAIL:', name, e.message); }
}
console.log('round-349 reasoning-coherence rcBroken: ' + pass + ' passed, ' + fail + ' failed (of ' + t.length + ')');
if (fail > 0) process.exit(1);
