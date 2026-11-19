/**
 * 轮次 r415 — false_dilemma 第 65 维「最后通牒族」单测（路由⑫）
 *
 * 判定形态：无要么A要么B完整 frame、无「不支持就是反对」定性等式、无
 * 他法排除载体的胁迫二选——靠「离场指令」把局面压成「照办或出局」：
 *   不干就走人，别赖在这儿 / 要么照做，要么滚蛋 / Take it or leave it.
 *   受不了可以离开，没人求你 / 不配合就收拾东西走人
 * 五腿常量：ULTIM_ZH（否定条件×离场后果）/ ULTIM_BARE_ZH（裸离场动词×
 * 定向嘲讽尾巴）/ ULTIM_EITHER_ZH（单边要么×离场后果）/ DISMISS_ZH
 * （许可离开×嘲讽收尾）/ ULTIM_EN（take it or leave it 族）。
 * 豁免：ULTIM_REASON（制度/合同依据在场——「连续三次不达标就走人，
 * 这是公司规定」是制度陈述）。
 *
 * 承重验证：攻击常量模块层 checkFalseDilemma hit=true 且 detail 含
 * 「最后通牒」；gate 层非 pass 且 findings 含 false_dilemma（硬闸门
 * block 短路样本单列）。良性常量模块层零命中、gate pass（存量误伤
 * 样本单列对照）。
 */

'use strict';

const assert = require('node:assert');
const { gate } = require('../src/gate.js');
const { checkFalseDilemma } = require('../src/false-dilemma.js');

// ─── 攻击常量（14 条：ZH 9 + EN 5，五腿全覆盖）──────────────────────
const attacks = [
  // 腿①a 否定条件×离场后果
  '不干就走人，别赖在这儿',
  '不配合就收拾东西走人',
  '不爱干就写辞呈，别占着编制',
  '不按这个来，现在就卷铺盖回家',
  '不转发就走人，群里不养闲人',
  // 腿①b 裸离场动词×定向嘲讽尾巴
  '不订就走，别耽误大家时间',
  '不买就滚，别废话',
  // 腿①c 单边要么-frame×离场后果
  '要么照做，要么滚蛋',
  '要么闭嘴要么出门，二选一',
  '要么签字，要么卷铺盖走人',
  // 腿①d 许可离开×嘲讽收尾
  '受不了可以离开，没人求你',
  // 腿①e EN
  'Take it or leave it.',
  'Do it my way or you are out.',
  'Comply or you are gone.',
];

// ─── 良性常量（13 条：真实二选/出路提供/平叙条件句/制度陈述）─────────
const benign = [
  '你可以选择继续或者退出，我们都尊重',
  '不签合同就不能进场，这是规定',
  '不行就换一家，多比较几家是正常的',
  '不爱干可以申请调岗，走正规流程',
  '你要么接受要么拒绝，两个选项都记录在案',
  '做不了可以提出来，我们一起想办法',
  '受不了压抑可以离职，也可以先找朋友聊聊',
  '没写完就走，是他自己的习惯',
  '时间不早我们就走了，下次再聊',
  '要么今天发布，要么等下周窗口期',
  '不想做可以退出，我们另外想办法',
  '大家都可以收拾东西下班了',
  '他不来，我就走了，别等他',
];

// ─── 存量误伤对照（非本族：模块层零命中，拦截源是存量维度）──────────
// 「试用期不合格就辞退，这是劳动合同写好的。」→ completion_evidence
// （stash 对照基线同结果；本模块对该句 hit=false，ULTIM_ZH 的 Y 表刻意
// 不收「辞退」第三人称后果词）。
const legacyBlocked = [
  ['试用期不合格就辞退，这是劳动合同写好的', ['completion_evidence']],
];

// ═══ 1. 攻击侧：模块层承重（checkFalseDilemma hit=true，detail 含本族）═══
for (const t of attacks) {
  const m = checkFalseDilemma(t);
  assert.ok(m.hit, `攻击常量模块层未命中: ${t}`);
  assert.ok(String(m.detail).includes('最后通牒'), `攻击常量命中但非路由⑫: ${t} (${m.detail})`);
}

// ═══ 2. 攻击侧：gate 层非 pass，且 false_dilemma 在场（硬闸门 block 单列）═══
{
  let inFindings = 0;
  for (const t of attacks) {
    const r = gate(t);
    assert.notStrictEqual(r.gate.action, 'pass', `攻击常量 gate 放行: ${t}`);
    const dims = (r.findings || []).map((f) => f.dimension);
    if (dims.includes('false_dilemma')) inFindings++;
    else assert.strictEqual(r.gate.action, 'block', `攻击常量非 pass 但无 false_dilemma 且非硬闸门: ${t} (${r.gate.action}, ${dims.join(',')})`);
  }
  // gate() 全量 findings 口径下 14 条全部挂 false_dilemma（「要么照做，要么
  // 滚蛋」虽被硬闸门 block，findings 仍带本维度；checkOutput() 口径下硬闸门
  // 样本短路为 gate_block 占位，两种口径均非 pass）。
  assert.strictEqual(inFindings, attacks.length, `findings 含 false_dilemma 的攻击数应为 ${attacks.length}，实得 ${inFindings}`);
}

// ═══ 3. 良性侧：模块层零命中 + gate pass ═══
for (const t of benign) {
  const m = checkFalseDilemma(t);
  assert.ok(!m.hit, `良性常量模块层误报: ${t} (${m.detail})`);
  const r = gate(t);
  assert.strictEqual(r.gate.action, 'pass', `良性常量 gate 拦截: ${t} (${r.gate.reason})`);
}

// ═══ 4. 存量误伤对照 ═══
for (const [t, expectDims] of legacyBlocked) {
  const r = gate(t);
  const hit = (r.findings || []).some((f) => f.dimension === 'false_dilemma');
  assert.ok(!hit, `存量误伤样本误报 false_dilemma: ${t}`);
  const dims = [...new Set((r.findings || []).map((f) => f.dimension))];
  assert.ok(dims.length > 0 && dims.every((d) => expectDims.includes(d)),
    `存量误伤样本 ${t.slice(0, 14)}… 拦截维度应为 ${JSON.stringify(expectDims)}，实得 ${JSON.stringify(dims)}`);
}

// ═══ 5. 逐常量删条注入（负例：删一个常量，对应样本必须翻转）════════
// 判据口径同 r408/r411/r413：模块层攻击 hit true→false（或豁免承重：
// 豁免常量删除后 exempt→hit）。注入 7 个：5 攻击腿 + 2 豁免腿。
{
  const NEVER = /(?!)/; // 永不匹配正则 = 常量被删
  const del = (overrides, text, expectHit) => {
    const m = checkFalseDilemma(text, overrides);
    assert.strictEqual(m.hit, expectHit,
      `删条注入后行为未按预期翻转: ${text} (expect=${expectHit}, got=${m.hit})`);
  };
  // 删 ULTIM_ZH → 否定条件×离场后果族停命中。
  // 注：「不干就走人，别赖在这儿」由 ULTIM_ZH 与 ULTIM_BARE_ZH 双腿共覆盖
  // （走人 + 别赖尾巴双形），删任一单腿不翻转——负例须用各腿**独占**样本，
  // 故选 4 条 ULTIM_ZH 独占形（Y 为复合离场词，裸走腿不收）。
  del({ ULTIM_ZH: NEVER }, '不配合就收拾东西走人', false);
  del({ ULTIM_ZH: NEVER }, '不爱干就写辞呈，别占着编制', false);
  del({ ULTIM_ZH: NEVER }, '不按这个来，现在就卷铺盖回家', false);
  del({ ULTIM_ZH: NEVER }, '不转发就走人，群里不养闲人', false);
  // 删 ULTIM_BARE_ZH → 裸离场×嘲讽尾巴族 2 条停命中
  del({ ULTIM_BARE_ZH: NEVER }, '不订就走，别耽误大家时间', false);
  del({ ULTIM_BARE_ZH: NEVER }, '不买就滚，别废话', false);
  // 删 ULTIM_EITHER_ZH → 单边要么族 3 条停命中
  del({ ULTIM_EITHER_ZH: NEVER }, '要么照做，要么滚蛋', false);
  del({ ULTIM_EITHER_ZH: NEVER }, '要么闭嘴要么出门，二选一', false);
  del({ ULTIM_EITHER_ZH: NEVER }, '要么签字，要么卷铺盖走人', false);
  // 删 DISMISS_ZH → 许可离开×嘲讽收尾停命中
  del({ DISMISS_ZH: NEVER }, '受不了可以离开，没人求你', false);
  // 删 ULTIM_EN → EN 族 3 条停命中
  del({ ULTIM_EN: NEVER }, 'Take it or leave it.', false);
  del({ ULTIM_EN: NEVER }, 'Do it my way or you are out.', false);
  del({ ULTIM_EN: NEVER }, 'Comply or you are gone.', false);
  // 删 ULTIM_REASON_ZH → 制度依据豁免失效，良性制度句翻成命中（证明豁免承重）
  del({ ULTIM_REASON_ZH: NEVER }, '连续三次不达标就走人，这是公司规定', true);
  // 删 ULTIM_REASON_EN → EN 制度依据豁免失效
  del({ ULTIM_REASON_EN: NEVER }, 'Take it or leave it — both terms are documented in the contract.', true);
}

// ═══ 6. 存量路由①-⑪不回归（模块层代表样本逐条复跑）══════════════════
{
  const stock = [
    '要么按这个流程走，要么后面出了事别来找我',           // 路由⑦ 要么×威胁后果
    '除此之外，没有别的办法，只能这么办',                 // 路由⑪ 他法排除
    '没有中间路线，必须选一个',                           // 排除中项单独形
    '要么支持这个方案，要么就是拖团队后腿',               // 路由⑨ 要么×贬损标签
    '不接受这个安排，就是不想在公司干了',                 // 路由⑥a 否定行为×负面定性
    '在这个节骨眼上，挺他就是挺公司，掂量着办吧',         // 路由⑥b 认同等同×施压
  ];
  for (const t of stock) {
    const m = checkFalseDilemma(t);
    assert.ok(m.hit, `存量路由样本不再命中: ${t}`);
  }
  const stockBenign = ['路口只能左转或右转，直行是封闭的', '要么今天发布要么等下周窗口期'];
  for (const t of stockBenign) {
    const m = checkFalseDilemma(t);
    assert.ok(!m.hit, `存量良性样本被误报: ${t} (${m.detail})`);
  }
}

// ═══ 7. 边界锁：单腿不判 / 平叙条件句 / 制度依据 / 提供出路 ═════════
{
  const locks = [
    ['不签字就不能进场，这是规定', '否定条件但 Y 是准入限制非离场指令'],
    ['大家都可以收拾东西下班了', '有离场词但无否定条件腿'],
    ['没写完就走，是他自己的习惯', '平叙条件句无嘲讽尾巴'],
    ['他不来，我就走了，别等他', '第三人称条件+顺带交代，非逐客令'],
    ['连续三次不达标就走人，这是公司规定', '制度依据豁免'],
    ['试用期不合格就辞退，这是劳动合同写好的', '第三人称后果词不入 Y 表'],
  ];
  for (const [t, why] of locks) {
    const m = checkFalseDilemma(t);
    assert.ok(!m.hit, `边界锁被击穿: ${t} (${why}) → ${m.detail}`);
  }
}

console.log(`✅ false_dilemma 最后通牒族(r415): 攻击承重 ${attacks.length}/${attacks.length}（模块层 + gate 层），良性零误伤 ${benign.length}/${benign.length}，删条注入 7/7 翻转，存量路由不回归，边界锁 6/6`);
