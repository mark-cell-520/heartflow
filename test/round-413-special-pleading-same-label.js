/**
 * test/round-413-special-pleading-same-label.js — 第 150 维度
 * special_pleading（特殊辩护）r413「同行为不同命名」双标族路由⑤轮测。
 *
 * 背景（r413 立项）：四候选家族同池探针定拨
 * （coordination/agent4/probes/r413-probe-pool.js），F2「同行为不同
 * 命名」以 10/10 穿透 + 模块层攻击 0/10 真零命中 + 模块层良性 0/10
 * 定选（F1 genetic_fallacy 考证式 7/10、F4 false_dilemma
 * ultimatum 9/10 留库；F3 straw_man 模块层 4/10 非零命中淘汰）。
 * 存量路由④「同行为不同定性」靠极性词表（伤身/有害 × 热爱/奉献），
 * 「别人迟到叫纪律涣散，我迟到叫时间灵活」「同事加班叫本分，我加
 * 班叫奉献」这类**同一行为两个名字**的双标（命名标签而非极性定性）
 * 整族射程外，句中无任何既有标记。
 *
 * 本文件守七件事：
 *   一、gate 层正向：攻击全部非 pass 且 special_pleading 在场。
 *   二、模块层直查：攻击命中（detail 归因路由⑤ same-behavior×different-label）、良性不命中。
 *   三、良性零误伤：探针 10 条 + 边界扩样（同名同标/单腿/伪双标/
 *      对称要求/META/EVIDENCE/STRICTER 豁免）模块层全不命中。
 *   四、承重注入：OTHERS_LABEL_ZH/SELF_LABEL_ZH/OTHERS_LABEL_EN/
 *      SELF_LABEL_EN 四组常量逐组抹掉后攻击停命中。
 *   五、存量路由不回归：路由①/②/③/④ 与顶层三豁免行为不变。
 *   六、边界锁：单腿不判 / 行为词不同不判（伪双标）/ 同名同标豁免 /
 *      一视同仁在场豁免。
 *   七、全角折叠不逃：全角标点分隔的双腿攻击句仍命中。
 */
const assert = require('assert');
const { checkSpecialPleading, __internals } = require('../src/special-pleading.js');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ── 一、gate 层正向：攻击全部非 pass 且 special_pleading 在场 ──────
const ATTACK = [
  '别人迟到叫纪律涣散，我迟到叫时间灵活',
  '人家犯错叫态度问题，我犯错就叫疏忽',
  '别人冒险叫鲁莽，我冒险叫勇敢',
  '同事加班叫本分，我加班叫奉献',
  '别人拒绝叫不负责任，我拒绝叫原则性强',
  '别人直言叫冒犯，我直言叫坦率',
  'When others arrive late it is called indiscipline; when I arrive late it is called flexibility.',
  'When they cut corners it is called sloppy; when I cut corners it is called efficiency.',
  '别人妥协叫软弱，我妥协叫顾全大局',
  '人家辞职叫冲动，我辞职叫追求自我',
];
t('gate 层攻击 10/10 非 pass 且 special_pleading 在场', () => {
  for (const s of ATTACK) {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', `攻击句 pass: ${s}`);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('special_pleading'), `special_pleading 不在场: ${s} → ${dims.join(',')}`);
  }
});

// ── 二、模块层直查：攻击命中、归因路由⑤ ─────────────────────────
t('模块层攻击 10/10 命中且 detail 归因 different-label', () => {
  for (const s of ATTACK) {
    const r = checkSpecialPleading(s);
    assert.strictEqual(r.hit, true, `未命中: ${s}`);
    assert.ok(/different-label/.test(r.detail), `归因不含 different-label: ${s} → ${r.detail}`);
  }
});

// ── 三、良性零误伤（模块层全不命中）─────────────────────────────
const BENIGN = [
  '我承认我迟到了，按制度该扣就扣',
  '制度应当一视同仁，不该因人而异',
  '别人加班叫奉献，我加班也叫奉献，标准一致',
  '这两种叫法其实是一回事，换个名字不改变性质',
  'The policy applies equally to everyone on the team.',
  '同一个行为就该用同一个名字，不能搞双标',
  '新人犯错和老员工犯错，处理标准要一致',
  '我拒绝是因为原则，别人拒绝也一样看待',
  'When others cut corners it is called sloppy; when I cut corners it is also called sloppy.',
  '别人犯错叫疏忽，我犯错也叫疏忽，都按制度复盘',
];
t('模块层良性 10/10 不命中', () => {
  for (const s of BENIGN) {
    const r = checkSpecialPleading(s);
    assert.strictEqual(r.hit, false, `良性误判: ${s} → ${r.detail}`);
  }
});
t('存量代拦样本（no_fallback/false_balance）findings 不含 special_pleading', () => {
  for (const s of ['同一个行为就该用同一个名字，不能搞双标', '我拒绝是因为原则，别人拒绝也一样看待']) {
    const dims = (checkOutput(s).findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('special_pleading'), `代拦样本含 special_pleading: ${s} → ${dims.join(',')}`);
  }
});

// ── 四、承重注入：四组路由⑤常量逐组抹掉后攻击停命中 ─────────────
{
  const I = __internals();
  t('internals 导出路由⑤四组常量可达', () => {
    assert.ok(I.OTHERS_LABEL_ZH instanceof RegExp && I.SELF_LABEL_ZH instanceof RegExp
      && I.OTHERS_LABEL_EN instanceof RegExp && I.SELF_LABEL_EN instanceof RegExp);
    assert.ok(I.OTHERS_LABEL_ZH.test('别人迟到叫纪律涣散，我迟到叫时间灵活'));
    assert.ok(I.SELF_LABEL_ZH.source.includes('%W%'));
    assert.ok(I.OTHERS_LABEL_EN.test('When others arrive late it is called indiscipline; when I arrive late it is called flexibility.'));
    assert.ok(I.SELF_LABEL_EN.source.includes('%W%'));
  });
  t('OTHERS_LABEL_ZH 置空 → 中文攻击停命中（腿①承重）', () => {
    const s = '别人迟到叫纪律涣散，我迟到叫时间灵活';
    assert.strictEqual(checkSpecialPleading(s).hit, true, '基线应命中');
    assert.strictEqual(checkSpecialPleading(s, { OTHERS_LABEL_ZH: /(?!x)x/ }).hit, false, '置空后应停命中');
  });
  t('SELF_LABEL_ZH 置空 → 中文攻击停命中（腿②承重）', () => {
    const s = '人家犯错叫态度问题，我犯错就叫疏忽';
    assert.strictEqual(checkSpecialPleading(s).hit, true, '基线应命中');
    assert.strictEqual(checkSpecialPleading(s, { SELF_LABEL_ZH: /(?!x)x/ }).hit, false, '置空后应停命中');
  });
  t('OTHERS_LABEL_EN 置空 → 英文攻击停命中（腿①承重）', () => {
    const s = 'When others arrive late it is called indiscipline; when I arrive late it is called flexibility.';
    assert.strictEqual(checkSpecialPleading(s).hit, true, '基线应命中');
    assert.strictEqual(checkSpecialPleading(s, { OTHERS_LABEL_EN: /(?!x)x/ }).hit, false, '置空后应停命中');
  });
  t('SELF_LABEL_EN 置空 → 英文攻击停命中（腿②承重）', () => {
    const s = 'When they cut corners it is called sloppy; when I cut corners it is called efficiency.';
    assert.strictEqual(checkSpecialPleading(s).hit, true, '基线应命中');
    assert.strictEqual(checkSpecialPleading(s, { SELF_LABEL_EN: /(?!x)x/ }).hit, false, '置空后应停命中');
  });
}

// ── 五、存量路由不回归 ─────────────────────────────────────────
t('存量路由①规则他指×自我例外 仍命中', () => {
  assert.strictEqual(checkSpecialPleading('规则是给普通人定的，我不一样').hit, true);
});
t('存量路由②他人受管×自我豁免 仍命中', () => {
  assert.strictEqual(checkSpecialPleading('别人迟到要扣钱，我迟到是有原因的').hit, true);
});
t('存量路由③特殊身份×例外许可 仍命中', () => {
  assert.strictEqual(checkSpecialPleading('我情况特殊，所以可以例外').hit, true);
});
t('存量路由④同行为不同定性 仍命中', () => {
  assert.strictEqual(checkSpecialPleading('别人熬夜伤身，我熬夜是热爱工作').hit, true);
});
t('顶层三豁免不回归（EVIDENCE/META/STRICTER）', () => {
  assert.strictEqual(checkSpecialPleading('别人迟到叫纪律涣散，我迟到叫时间灵活，但特殊情况需要特批，要走正规流程').hit, false);
  assert.strictEqual(checkSpecialPleading('别人迟到叫纪律涣散，我迟到叫时间灵活，这就是典型的双重标准').hit, false);
  assert.strictEqual(checkSpecialPleading('对新人别人叫培养，我叫更严要求，这是更严的审查安排').hit, false);
});

// ── 六、边界锁 ────────────────────────────────────────────────
t('单腿不判：只有他人标签（无自我腿）', () => {
  assert.strictEqual(checkSpecialPleading('别人迟到叫纪律涣散，影响很坏').hit, false);
});
t('单腿不判：只有自我标签（无他人腿）', () => {
  assert.strictEqual(checkSpecialPleading('我迟到叫时间灵活，这是我的节奏').hit, false);
});
t('伪双标不判：两腿行为词不同', () => {
  assert.strictEqual(checkSpecialPleading('别人迟到叫纪律涣散，我十点就睡').hit, false);
});
t('同名同标豁免：别人加班叫奉献，我加班也叫奉献', () => {
  assert.strictEqual(checkSpecialPleading('别人加班叫奉献，我加班也叫奉献，标准一致').hit, false);
});
t('一视同仁在场豁免：不同标签 + 一个标准', () => {
  assert.strictEqual(checkSpecialPleading('别人迟到叫纪律涣散，我迟到叫时间灵活，但咱们要一个标准').hit, false);
});
t('英文同名同标豁免', () => {
  assert.strictEqual(checkSpecialPleading('When others cut corners it is called sloppy; when I cut corners it is also called sloppy.').hit, false);
});

// ── 七、全角折叠不逃 ──────────────────────────────────────────
t('全角标点分隔的双腿攻击句仍命中', () => {
  const s = '别人冒险叫鲁莽；我冒险叫勇敢。';
  const r = checkSpecialPleading(s);
  assert.strictEqual(r.hit, true, `全角句读未逃逸: ${s}`);
});

console.log(`\nr413 special-pleading-same-label: ${pass} passed / ${fail} failed`);
if (fail > 0) process.exit(1);
