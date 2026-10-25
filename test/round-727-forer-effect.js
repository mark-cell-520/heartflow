'use strict';
/**
 * test/round-727-forer-effect.js
 * [r727] 第 157 维度 forer_effect（巴纳姆效应）轮测试。
 * 结构同 r726 先例：攻击集 / 良性集 / 边界锁 / 分工边界锁 / 存量回归 / 登记断言。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r726 纪律。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const feMod = require(path.join(ROOT, 'src', 'forer-effect.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const hit = (s) => feMod.checkForerEffect(s).score > 0;

// ── 1. 攻击集（r727 探测器实测 20 条，模块层应全命中）────────────
const attacksZh = [
  '你外表看起来坚强，其实内心很柔软，只是不轻易让人看见',
  '你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近',
  '你有时候会很外向，和朋友聊个不停；有时候又想一个人待着',
  '你内心渴望被认可，但又不太愿意主动表现出来',
  '你骨子里是个追求完美的人，只是对自己要求太高了',
  '你有很敏锐的直觉，能看穿别人的心思',
  '你命中注定要经历一次重大转变，然后才会真正觉醒',
  '从测试结果看，你属于既理性又感性的类型，这很少见',
  '你是一个有能力但还没完全发挥出来的人',
  '你害怕被抛弃，所以会先用不在乎保护自己',
  '你内心深处其实很不自信，只是用自信的外表掩盖',
  '你看起来随和，其实对认定的标准很坚持',
  '你是一个外表冷漠、内心火热的人，很少人真正读懂你',
  '你最大的问题是想得太多，做得太少',
  '你表面大大咧咧，其实心思比谁都细',
  '别嘴硬了，你就是太在乎才会装作不在意',
  '你这个人就是嘴硬心软，嘴上说没事，其实什么都记在心里',
  '你渴望被理解，但又害怕受伤',
  '你时而外向热闹，时而沉默寡言',
  '你其实什么都懂，只是很少有人真正读懂你',
];
const attacksEn = [
  'You appear confident on the outside but often doubt yourself inside.',
  'You are the kind of person who values loyalty deeply but rarely shows it.',
  'Deep down, you want someone to truly understand you.',
];
t('攻击-ZH 全命中', () => {
  for (const s of attacksZh) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-EN 全命中', () => {
  for (const s of attacksEn) assert.ok(hit(s), '漏判: ' + s);
});

// ── 2. 良性集（r727 探测器实测 8 条，模块层零命中）──────────────
const benign = [
  '根据你填写的人格量表得分，你的外向性维度高于常模 1.2 个标准差',
  '从你的描述看，你在类似情境中反复出现回避行为，这与回避型依恋的描述一致',
  '星座描述通常使用模糊的通用语言，容易让人产生"很准"的错觉',
  '这是巴纳姆效应：人们容易接受笼统的人格描述并认为是在说自己',
  '根据量表结果，你在神经质维度得分偏高，但自评量表有局限',
  'Personality tests like the MBTI have limited reliability, so treat the result as a rough guide.',
  '你的依恋类型测试结果需要结合临床访谈确认',
  '这种"表面X其实Y"的句式几乎适用于任何人，不能作为精准判断',
];
t('良性-ZH/EN 全零命中', () => {
  for (const s of benign) assert.ok(!hit(s), '误伤: ' + s);
});

// ── 3. 边界锁（守卫常量 + 单腿防御负例）────────────────────────────
t('边界-MEASUREMENT 有依据测量陈述让位', () => {
  assert.ok(!hit('你外表看起来坚强，其实内心很柔软——这是人格量表的维度得分解读'), '测量陈述不应判');
  assert.ok(!hit('根据你填写的人格量表得分，你的外向性维度高于常模 1.2 个标准差'), '测量陈述不应判');
});
t('边界-META 概念转述豁免', () => {
  assert.ok(!hit('所谓巴纳姆效应，就是「你外表看起来坚强，其实内心很柔软」这种话术'), '概念转述不应判');
});
t('边界-TEACH 教学转述豁免', () => {
  assert.ok(!hit('课堂讨论：你外表看起来坚强，其实内心很柔软，这句话问题在哪'), '教学转述不应判');
});
t('边界-NEG_FLIP 否定翻转豁免', () => {
  assert.ok(!hit('你外表看起来坚强，其实内心很柔软，但这不能作为判断你的依据'), '否定翻转不应判');
});
t('边界-HEDGE 对冲豁免', () => {
  assert.ok(!hit('你外表看起来坚强，其实内心很柔软，也许事实并非如此'), '对冲不应判');
});
t('边界-CAVEAT 数据边界自陈豁免', () => {
  assert.ok(!hit('你外表看起来坚强，其实内心很柔软——测试解读仅供参考，样本有限'), '边界自陈不应判');
});
t('边界-REPORT 第三人称转述报告豁免', () => {
  assert.ok(!hit('你外表看起来坚强，其实内心很柔软，这种描述对大多数人都适用'), '转述报告不应判');
});
t('边界-单腿不判：只有人格描述无第二人称指向（第三人称）', () => {
  assert.ok(!hit('他外表看起来很坚强，其实内心很柔软'), '第三人称无指向不应判');
  assert.ok(!hit('Confident on the outside but doubtful on the inside applies to everyone.'), 'EN 无第二人称断言形不应判');
});
t('边界-单腿不判：只有第二人称指向无人格描述句式', () => {
  assert.ok(!hit('你很矛盾'), '只有指向不应判');
  assert.ok(!hit('你其实是个好人，大家都很认可你'), '普通评价不应判');
});
t('防御-常见良性第二人称关心/询问不判', () => {
  for (const s of [
    '你最近总是失眠，是不是工作压力太大了',
    '你吃饭了吗，别熬太晚',
    '你的方案我看了，数据部分还需要补充来源',
    '你的反馈我已经记录，会转给对应负责人',
    '你提交的报告整体结构清晰，结论部分建议再核对',
  ]) assert.ok(!hit(s), '防御误伤: ' + s);
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(feMod.checkForerEffect(undefined).score, 0);
  assert.strictEqual(feMod.checkForerEffect('').score, 0);
  assert.strictEqual(feMod.checkForerEffect(null).score, 0);
  assert.strictEqual(feMod.checkForerEffect(42).score, 0);
});

// ── 4. 分工边界锁：归属维度真兜底（gate 层非 pass）────────────────
t('分工边界-攻击样本 gate 动作非 pass', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
  }
});
t('分工边界-findings 归因 forer_effect', () => {
  for (const s of ['你外表看起来坚强，其实内心很柔软，只是不轻易让人看见', '你属于讨好型的人，总是先满足别人']) {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('forer_effect'), '未归因 forer_effect: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-良性样本 gate 层非 forer_effect 归因', () => {
  for (const s of benign) {
    const r = gate.checkOutput(s);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert.ok(!dims.includes('forer_effect'),
        'forer_effect 误伤: ' + s + ' -> ' + r.gate.action + ' / ' + dims.join(','));
    }
  }
});
t('分工边界-mind_reading 断言想法形归存量（不被本族抢占）', () => {
  for (const s of ['你其实就是这么想的，别不承认', '你嘴上说没事，其实心里早就翻江倒海了吧']) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', '存量边界样本被放行: ' + s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('forer_effect'),
      '断言想法形被 forer_effect 抢占: ' + s + ' -> ' + dims.join(','));
  }
});

// ── 5. 存量回归：r726 relative_pration / r725 affirming_the_consequent 不翻转 ──
t('存量回归-r726 relative_pration 历史攻击仍判', () => {
  for (const s of ['别喊累了，有人连饭都吃不上', '知足吧，还有人工资比你低一半呢']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'relative_pration 回归翻转: ' + s);
  }
});
t('存量回归-r725 affirming_the_consequent 历史攻击仍判', () => {
  for (const s of ['如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的', 'Good code has tests. This module has tests, so the code is good.']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'affirming_the_consequent 回归翻转: ' + s);
  }
});
t('存量回归-r724 guilt_by_association 历史攻击仍判', () => {
  for (const s of ['他爸是人贩子，他能好到哪去', 'She is friends with a scammer, so she cannot be trusted.']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'guilt_by_association 回归翻转: ' + s);
  }
});

// ── 6. 登记断言（九处接线完整）────────────────────────────────
t('登记-dimensions 键含 forer_effect 且总数 157', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('forer_effect'), 'forer_effect 键缺失');
  // r726 落笔时引擎 156 维，r727 +1 = 157（多轮累积预期过期，非回归）
  assert.strictEqual(keys.length, 157, '维度键总数应为 157: got ' + keys.length);
});
t('登记-VERIFY_DIMS 含 forer_effect', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,5000}?forer_effect/.test(src), 'VERIFY_DIMS 未含 forer_effect');
});
t('登记-index.js 导出 checkForerEffect 且 CONSTANTS 齐全', () => {
  assert.strictEqual(typeof idx.checkForerEffect, 'function', 'index.js 未导出 checkForerEffect');
  const need = ['FE_SURFACE_DEPTH_ZH', 'FE_BOTH_SIDES_ZH', 'FE_UNIVERSAL_NEED_ZH', 'FE_TYPE_LABEL_ZH',
    'FE_RARE_UNDERSTAND_ZH', 'FE_FATE_ZH', 'FE_DEFENSE_ZH', 'FE_UNIVERSAL_EN',
    'FE_PERSON_TARGET_ZH', 'FE_PERSON_TARGET_EN',
    'FE_ACCURACY_ZH', 'FE_ACCURACY_EN',
    'FE_MEASUREMENT', 'FE_META', 'FE_TEACH', 'FE_NEG_FLIP', 'FE_HEDGE', 'FE_CAVEAT', 'FE_REPORT'];
  for (const k of need) {
    assert.ok(feMod.CONSTANTS && feMod.CONSTANTS[k] && feMod.CONSTANTS[k].length > 0, 'CONSTANTS 缺 ' + k);
  }
});
t('登记-summary 命中可见（巴纳姆话术计数）', () => {
  // API 纪律：checkOutput().summary 是统计对象，文本 summary 在 idx.discriminate(t).summary
  const s = idx.discriminate('你外表看起来坚强，其实内心很柔软，只是不轻易让人看见').summary || '';
  assert.ok(/巴纳姆话术/.test(s), 'summary 未含巴纳姆话术: ' + String(s).slice(0, 200));
});

console.log('== r727 巴纳姆效应新维度轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
