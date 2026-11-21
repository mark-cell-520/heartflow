/**
 * r446 轮测：guilt_by_association「被动连坐」句式族（真升级②扩族）
 *
 * 覆盖：
 *  1. 逐常量承重：PASSIVE_REL_EXTRA / PASSIVE_INFER_RE 每族攻击命中
 *  2. 良性负例注入：含边缘良性（合作合规/世交招标/清白审计结论）全 pass
 *  3. gate 层端到端归因：攻击非 pass 且归因 guilt_by_association
 *  4. 存量族回归：R1/R2 老腿族不因插入失效
 *  5. 裸名词自查（r161 教训）：同族词去后缀形态命中验证
 */
'use strict';

const path = require('path');
const assert = require('assert');

const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const { checkGuiltByAssociation, __internals } = require(path.join(__dirname, '..', 'src', 'guilt-by-association.js'));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ✗ ${name} — ${e.message}`);
  }
}

// ── 1. 被动连坐攻击族（腿① × 腿② × 腿③ 缺一不判）──────────────
const ATTACKS = [
  // 基本形
  '他既然和那帮人一起吃过饭，干净不到哪去',
  '她跟那个公司有过合作，屁股肯定不干净',
  '他跟那伙人混过，身上洗不清',
  // 疑问反问形（能脱得了干系吗 / 说得清吗）
  '他俩是发小，能脱得了干系吗',
  '她跟那帮人互相关注，说得清吗',
  // 关系指称扩展腿①（老板 / 圈子 / 走得近）
  '这人和那老板吃过几次饭，怎么也撇不清关系',
  '他和前男友是一个圈子的，能好到哪里',
  '他跟那家公司关系那么近，能干净到哪去',
  // 长句 / 连接词前置 / 倒装
  '两人是老乡，出了这种事能跑得掉',
  '既然他和那伙人混在一起，这事他就说不清',
  '作为他的老同事，你让我怎么相信他能跑得掉',
  '跟那种人走得太近，早晚有一天说不清楚',
  // 名词化反问（有何清白可言 / 置身事外 / 沾亲带故）
  '既然两人有那么深的交情，出事之后他怎么可能置身事外',
  '跟那种人走得那么近，能有什么清白可言',
  // 裸指称 + 无连接词（r161 教训自查）
  '他是那伙人的老乡，本身就不干净',
  '跟他沾亲带故的，他自己能有多干净',
  '他跟那老板一个圈子混的，屁股底下能有多干净',
];

// ── 2. 良性样本（含边缘良性）────────────────────────────────────
const BENIGNS = [
  // 反连坐程序陈述（腿③ PASSIVE_REBUTTAL 承重）
  '他跟那伙人吃过饭，不等于参与其事，责任要按本人行为认定',
  '他和那家公司合作过，但项目本身合规，我们看合同履行记录',
  '两人虽是老乡，但这起事件的证据链与本人无关',
  '她关注了那些人，这只是社交行为，不能作为定罪依据',
  // 事务性清白（非人身株连）
  '他很干净地完成了审计，没有发现问题',
  '这份报告洗清了公司的嫌疑，证据链完整',
  '这衣服洗得很干净',
  '审计结论很干净：没有任何问题',
  // 关系词 + 良性断言（无清白不可能修辞）
  '他跑得掉吗？当然跑不掉，所以我们按证据办',
  '他俩虽是发小，但这件事要分别认定，与本人无关',
  '他跟他同事共事三年，工作记录清白',
  '他和前任合伙开的店，账目都经得起审计',
  // 权威/世交关系 + 良性语境
  '他跟老板共事五年，业绩考核全部达标',
  '作为上司，我对下属的评价只看业绩数据',
  '他们俩虽然是世交，但这个项目招标按公开流程走',
];

// ── 3. 存量族回归（R1/R2 老腿族不因插入失效）──────────────────
const LEGACY = [
  '他朋友是骗子，他能好到哪去',
  '他前任坐过牢，这人也不是什么好人',
  'His brother is a criminal, so he must be one too.',
  'She hangs out with cheaters, so she cannot be trusted.',
];

console.log('\n=== r446 被动连坐族：模块层攻击承重 ===');
for (const t of ATTACKS) {
  check(`attack: ${t.slice(0, 24)}`, () => {
    const r = checkGuiltByAssociation(t);
    assert.ok(r.count > 0, `模块层零命中: ${JSON.stringify(r)}`);
    assert.ok(r.matches.some(m => m.route === 3), '未走 R3 被动连坐路由');
  });
}

console.log('\n=== r446 被动连坐族：良性负例注入 ===');
for (const t of BENIGNS) {
  check(`benign: ${t.slice(0, 24)}`, () => {
    const r = checkGuiltByAssociation(t);
    assert.strictEqual(r.count, 0, `良性被命中: ${JSON.stringify(r.matches)}`);
  });
}

console.log('\n=== r446 存量族回归（R1/R2）===');
for (const t of LEGACY) {
  check(`legacy: ${t.slice(0, 24)}`, () => {
    const r = checkGuiltByAssociation(t);
    assert.ok(r.count > 0, `存量族失效: ${JSON.stringify(r)}`);
  });
}

console.log('\n=== r446 gate 层端到端归因 ===');
// 攻击样本须被 gate 拦下且归因 guilt_by_association
const GATE_ATTACKS = ATTACKS.slice(0, 10);
for (const t of GATE_ATTACKS) {
  check(`gate attack: ${t.slice(0, 24)}`, () => {
    const g = gate(t);
    assert.notStrictEqual(g.gate.action, 'pass', `gate 未拦下: ${g.gate.action}`);
    const dims = (g.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('guilt_by_association'), `未归因 guilt_by_association: ${dims.join(',')}`);
  });
}

// 良性样本须 pass（允许存量维度基线行为，不做断言）
console.log('\n=== r446 gate 层良性抽样（记录性，不断言）===');
for (const t of BENIGNS.slice(0, 5)) {
  const g = gate(t);
  console.log(`  · ${g.gate.action.padEnd(7)} ${t.slice(0, 30)}`);
}

console.log('\n=== r446 裸名词自查（r161 教训：同族词去后缀是否命中）===');
// 「屁股不干净」单独在场不判（无关系词）——两腿判据的正确边界
check('裸「屁股不干净」无关系词不判', () => {
  const r = checkGuiltByAssociation('这人屁股不干净');
  assert.strictEqual(r.count, 0, '单污名断言不应判连坐');
});
// 「难辞其咎」单独在场不判（无关系词）
check('裸「难辞其咎」无关系词不判', () => {
  const r = checkGuiltByAssociation('她难辞其咎');
  assert.strictEqual(r.count, 0, '单咎责断言不应判连坐');
});
// 关系词 + 裸名词形（无连接词）须命中
check('关系词 + 裸名词形命中', () => {
  const r = checkGuiltByAssociation('他跟那伙人混过，屁股不干净');
  assert.ok(r.count > 0 && r.matches.some(m => m.route === 3), '裸名词形未命中 R3');
});

console.log('\n=== r446 豁免常量逐条承重 ===');
check('PASSIVE_REBUTTAL 豁免承重（按证据办）', () => {
  const r = checkGuiltByAssociation('他跟那伙人混过，屁股不干净，但调查要按证据办');
  assert.strictEqual(r.count, 0, '证据语境未豁免');
});
check('EVIDENCE_PRESENT 存量豁免承重', () => {
  const r = checkGuiltByAssociation('他跟那伙人混过，屁股不干净，这是不是证据');
  assert.strictEqual(r.count, 0, '存量证据豁免失效');
});
check('META_NOUN 概念词豁免承重', () => {
  const r = checkGuiltByAssociation('老师讲了连坐这种逻辑谬误，他跟那伙人混过也洗不清');
  assert.strictEqual(r.count, 0, '概念词豁免失效');
});

console.log('\n=== r446 常量导出完整性 ===');
check('__internals 导出新常量', () => {
  assert.ok(Array.isArray(__internals.PASSIVE_REL_EXTRA) && __internals.PASSIVE_REL_EXTRA.length >= 20, 'PASSIVE_REL_EXTRA 缺失');
  assert.ok(Array.isArray(__internals.PASSIVE_INFER_RE) && __internals.PASSIVE_INFER_RE.length >= 14, 'PASSIVE_INFER_RE 缺失');
  assert.ok(Array.isArray(__internals.PASSIVE_REBUTTAL) && __internals.PASSIVE_REBUTTAL.length >= 15, 'PASSIVE_REBUTTAL 缺失');
});

console.log(`\n=== 结果: ${passed} passed / ${failed} failed ===`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
