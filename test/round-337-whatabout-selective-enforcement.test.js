// r337 守卫测试：whataboutism 选择性执法/双重标准抗辩族（deflect_selective_enforcement）
// 逻辑形状：腿①第三方同样违规（别的X也V坏事） × 腿②对「我/我们」的差别追责质疑（凭什么/为什么 + 只 + 追责动词）。
// 与既有族分界：deflect_others_worse 比严重程度、deflect_everyone_does 是陈述型、deflect_unfair_targeting
// 只收「针对」不收「只查/只罚/只抓」——本族必须双腿共现（第三方 + 选择性追责）才判。
'use strict';
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

// ─── 常量级验证：新族三条正则必须逐条在源码中承重 ───
function test_constants_exist() {
  const zhMain = src.includes("'deflect_selective_enforcement'");
  assert.ok(zhMain, '源码中必须注册 deflect_selective_enforcement 标签');
  // 三条腿：ZH 正序、ZH 倒装反问形、EN 主动形、EN 倒装形、EN 被动形
  const occurrences = src.split("'deflect_selective_enforcement'").length - 1;
  assert.ok(occurrences >= 5, `期望 ≥5 条 deflect_selective_enforcement 正则腿，实际 ${occurrences}`);
  // 豁免表：腿②必须含「只」字（选择性）——抽查收紧点常量在位
  assert.ok(/凭什么\|为什么\|为何/.test(src), '腿②质疑词必须在位');
  console.log(`  ✅ 常量在位：deflect_selective_enforcement × ${occurrences} 条腿`);
}

// ─── 功能级验证：攻击族命中（中英双语、裸名词、带修饰、倒装、长句） ───
function test_attack_family() {
  const { checkWhataboutism } = require(path.join(ROOT, 'src/index.js'));
  const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

  const attacks = [
    // ZH 正序
    '别的公司也偷税漏税，凭什么只查我们？',
    '其他平台也泄露用户数据，为什么只罚我们？',
    '同行也都偷工减料，凭什么只查封我的工厂？',
    '别人也插队，凭什么只赶我出去？',
    '别人考试也都作弊，为什么只抓我一个？',
    // ZH 倒装（质疑在前）
    '凭什么只罚我们？别的车也都超速。',
    // ZH 反问形（偏偏/光 + 选择性）
    '别的国家也污染环境，为什么偏偏只通报我们？',
    // 长句带修饰
    '同行业的其他好几家公司也长期存在偷税漏税行为，凭什么监管部门只查我们一家？',
    // EN 主动形
    'Other companies dump waste too, so why single us out?',
    'Other nations pollute as well, so why blame only our emissions?',
    // EN 被动形
    'Everyone else cheats on taxes, so why are only we being audited?',
    // EN 倒装形
    'Why single out only us? Other firms also polluted.',
  ];

  for (const t of attacks) {
    const r = checkWhataboutism(t);
    const g = checkOutput(t);
    assert.ok(
      r.count >= 1 && g.gate.action !== 'pass',
      `攻击样本必须被新族命中且 gate 非 pass：${t} (count=${r.count}, gate=${g.gate.action})`
    );
  }
  console.log(`  ✅ 攻击族 ${attacks.length}/${attacks.length} 命中（gate 非 pass）`);
}

// ─── 功能级验证：良性样本零误伤（含本族边缘良性） ───
function test_benign() {
  const { checkWhataboutism } = require(path.join(ROOT, 'src/index.js'));
  const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

  const benign = [
    // 正当监管主张：第三方也违规 + 一并排查（无「只」选择性字）
    '别的公司也偷税漏税，建议监管部门一并排查，不能只查我们一家。',
    // 正确合规陈述：他者事实 + 自身履约
    '其他国家也排放碳，但减排协议要求各国按清单执行，我们也应按期履约。',
    // 两个问题都要整改
    '别的学校也补课，这不代表我们补课就合规，两个问题都要整改。',
    // 不效仿
    '别人插队确实存在，但我插队同样不对，我不该效仿。',
    // 配合调查
    '审计发现多家企业存在类似问题，我们正在逐项整改自己的部分。',
    // EN：正当程序
    'Other companies also had breaches; we are cooperating fully with the investigation of our own.',
    // 泛化勉励
    'Everyone makes mistakes, but we must still fix ours.',
    // 无选择性追责腿的陈述
    '同行竞争激烈是事实，我们的产品质量仍需按标准执行。',
  ];

  for (const t of benign) {
    const r = checkWhataboutism(t);
    assert.strictEqual(
      r.count, 0,
      `良性样本不得被新族命中：${t} (count=${r.count}, signals=${JSON.stringify(r.signals)})`
    );
  }
  console.log(`  ✅ 良性样本 ${benign.length}/${benign.length} 零误伤（新族 count=0）`);
}

// ─── 差分验证：存量 whataboutism 族行为不变（r337/r344 守卫不回归） ───
function test_existing_families_unchanged() {
  const { checkWhataboutism } = require(path.join(ROOT, 'src/index.js'));

  // r337 反问族存量测试的真实 ATK 形态（他人更糟 + 反问收尾）必须仍命中
  const existing = [
    '你说我污染，那别的厂排得更多呢',
    '你说我违规，其他平台搞得更凶呢',
    '那其他部门错得更多呢',
    '比起他们我这算轻的呢',
    '他们的问题严重得多呢',
    '别人犯的错更大呢',
    // deflect_why_me 存量已知命中形
    '你也有问题，凭什么说我',
  ];
  for (const t of existing) {
    const r = checkWhataboutism(t);
    assert.ok(r.count >= 1, `存量反问族样本必须仍命中：${t} (count=${r.count})`);
  }
  console.log(`  ✅ 存量 whataboutism 族 ${existing.length}/${existing.length} 行为不变`);
}

const tests = [
  ['常量在位（五腿逐条承重）', test_constants_exist],
  ['攻击族矩阵（12 变体）', test_attack_family],
  ['良性零误伤（8 含边缘良性）', test_benign],
  ['存量族不回归', test_existing_families_unchanged],
];

let pass = 0, fail = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    pass++;
  } catch (e) {
    fail++;
    console.error(`  ❌ ${name}: ${e.message}`);
  }
}
console.log(`\nr337 whataboutism 选择性执法族守卫: ${pass} passed, ${fail} failed, 共 ${tests.length} 个`);
process.exit(fail === 0 ? 0 : 1);
