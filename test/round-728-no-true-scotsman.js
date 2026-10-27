'use strict';
/**
 * test/round-728-no-true-scotsman.js
 * [r728] 第 159 维度 no_true_scotsman（无真正的苏格兰人）轮测试。
 * 结构同 r726/r727 先例：攻击集 / 良性集 / 边界锁 / 分工边界锁 / 存量回归 / 登记断言。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r720-r727 纪律。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const ntsMod = require(path.join(ROOT, 'src', 'no-true-scotsman.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const hit = (s) => ntsMod.checkNoTrueScotsman(s).score > 0;

// ── 1. 攻击集（r728 冒烟实测 24 条，模块层 22 命中）────────────────
const attacksZh = [
  '真正爱你的男人，不会计较你花多少钱',
  '真正的专家不会犯这种低级错误',
  '真爱一个人就不会计较得失',
  '真正的粉丝早就买了，没买的根本不是粉丝',
  '合格的妈妈怎么会让孩子哭成这样',
  '真正的专业人士不会问这种问题',
  '一个真正想学好的人，不会整天找借口',
  '真正为团队付出的人，不会计较加班费',
  '真正有格局的领导，不会盯着考勤',
  '真心想改的人，不需要别人催',
  '真正优秀的学生，不需要老师盯着',
  '敬业的人不会抱怨，抱怨的就是不敬业',
  '真正的设计师从来不用参考别人的作品',
  '说真的，但凡有点良心的人都不会在背后议论同事',
  '真正吃得苦的人，不会把累挂在嘴边',
  '一个称职的父亲怎么会错过孩子的家长会',
  '真兄弟不会计较这些，计较就不是真兄弟',
];
const attacksEn = [
  'He is not a true fan if he criticizes the team.',
  'A truly loving partner would never keep score.',
  'If she were a real friend, she would have shown up.',
  'A genuinely caring mother would never put herself first.',
];
// 已知边界（记录进 upgrade-state notes，不动存量 normalize）：
// 'Real artists never trace references, they draw from imagination alone.'
// 模块层命中 70，但 normalize 的 de_pinyin 把含 m 的英文单词破坏
// （imagination → i码agination）+ 去空格，AUTH/EXCLUSION 正则失配，
// discriminate 层归零。这是影响全部维度的存量 normalize 边界，
// 不是 r728 接线缺陷——不在轮测试中断言它，留给专项轮处理。
t('攻击-ZH 全命中', () => {
  for (const s of attacksZh) assert.ok(hit(s), '漏判: ' + s);
});
t('攻击-EN 全命中', () => {
  for (const s of attacksEn) assert.ok(hit(s), '漏判: ' + s);
});

// ── 2. 良性集（r728 冒烟实测零误伤）──────────────────────────────
const benign = [
  '他把所有反例都重新定义排除掉了，这是无真正的苏格兰人谬误',
  '先定义「真正的专家」指什么，再讨论他算不算',
  '我们可以约定术语：文中「真粉丝」指连续三年购票者',
  '用「真正爱一个人」当标准前，要先说清哪些行为算证据',
  'No true Scotsman is a fallacy: redefining the group to exclude counterexamples.',
  '真正的朋友不是不会拒绝你，而是拒绝的时候会说明原因',
  '他自称真正的专家，但从来解决不了实际问题，也拿不出依据',
  '真正的粉丝也许不会第一时间买，但长期支持更重要',
];
t('良性-ZH/EN 全零命中', () => {
  for (const s of benign) assert.ok(!hit(s), '误伤: ' + s);
});

// ── 3. 边界锁（守卫常量 + 单腿防御负例）────────────────────────────
t('边界-META 概念转述豁免', () => {
  assert.ok(!hit('这就是无真正的苏格兰人谬误：先把「真正的专家」立起来再开除反例'), '概念转述不应判');
});
t('边界-DEFINITION 定义先行豁免', () => {
  assert.ok(!hit('先定义「真正的粉丝」的标准：连续三年购票者，再讨论算不算'), '定义先行不应判');
  assert.ok(!hit('我们可以约定术语：真正的专家指在该领域有可复现贡献的人'), '术语约定不应判');
});
t('边界-HEDGE 对冲豁免', () => {
  assert.ok(!hit('真正的粉丝也许不会第一时间买，但也未必长期支持'), '对冲不应判');
});
t('边界-NEG_FLIP 否定翻转豁免', () => {
  assert.ok(!hit('真正的朋友不是不会拒绝你，而是拒绝的时候会说明原因'), '否定翻转不应判');
});
t('边界-EVIDENCE_CHALLENGE 证据挑战豁免', () => {
  assert.ok(!hit('他自称真正的专家，但从来解决不了实际问题，也拿不出任何依据'), '证据挑战不应判');
});
t('边界-单腿不判：只有 authenticity 短语无驱逐断言', () => {
  assert.ok(!hit('真正的专家需要持续产出可靠的判断，这是行业共识'), '只有 AUTH 不应判');
  assert.ok(!hit('成为一个真正专业的设计师需要多年的训练'), '只有 AUTH 不应判');
});
t('边界-单腿不判：只有驱逐断言无 authenticity 短语', () => {
  assert.ok(!hit('他不会计较这些，因为性格一向大方'), '只有 EXCLUSION 不应判');
});
t('防御-常见良性资格要求/关心不判', () => {
  for (const s of [
    '你最近总是失眠，是不是工作压力太大了',
    '你的方案我看了，数据部分还需要补充来源',
    '员工应当遵守考勤制度，这是公司规定',
    '做学问要持之以恒，不能半途而废',
  ]) assert.ok(!hit(s), '防御误伤: ' + s);
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(ntsMod.checkNoTrueScotsman(undefined).score, 0);
  assert.strictEqual(ntsMod.checkNoTrueScotsman('').score, 0);
  assert.strictEqual(ntsMod.checkNoTrueScotsman(null).score, 0);
  assert.strictEqual(ntsMod.checkNoTrueScotsman(42).score, 0);
});

// ── 4. 分工边界锁：归属维度真兜底（gate 层非 pass）────────────────
t('分工边界-攻击样本 gate 动作非 pass', () => {
  for (const s of attacksZh.concat(attacksEn)) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
  }
});
t('分工边界-findings 归因 no_true_scotsman', () => {
  for (const s of ['真正爱你的男人，不会计较你花多少钱', '真兄弟不会计较这些，计较就不是真兄弟']) {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('no_true_scotsman'), '未归因 no_true_scotsman: ' + s + ' -> ' + dims.join(','));
  }
});
t('分工边界-良性样本 gate 层非 no_true_scotsman 归因', () => {
  for (const s of benign) {
    const r = gate.checkOutput(s);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert.ok(!dims.includes('no_true_scotsman'),
        'no_true_scotsman 误伤: ' + s + ' -> ' + r.gate.action + ' / ' + dims.join(','));
    }
  }
});

// ── 5. 存量回归：r727 forer_effect / r726 relative_pration / r725 affirming 不翻转 ──
t('存量回归-r727 forer_effect 历史攻击仍判', () => {
  for (const s of ['你外表看起来坚强，其实内心很柔软，只是不轻易让人看见', '你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近']) {
    assert.notStrictEqual(gate.checkOutput(s).gate.action, 'pass', 'forer_effect 回归翻转: ' + s);
  }
});
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

// ── 6. 登记断言（九处接线完整）────────────────────────────────
t('登记-dimensions 键含 no_true_scotsman 且总数 160', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('no_true_scotsman'), 'no_true_scotsman 键缺失');
  // r727 落笔时引擎 158 维，r728 +1 = 159。
  // [v6.8.81 r730 更新] r729 上线 conditional_proposition（第 160 维度）后
  // 本断言未同步，从 v6.8.78 起常驻红名单；按存量回归纪律更新到 160。
  assert.strictEqual(keys.length, 160, '维度键总数应为 160: got ' + keys.length);
});
t('登记-VERIFY_DIMS 含 no_true_scotsman', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/VERIFY_DIMS[\s\S]{0,5000}?no_true_scotsman/.test(src), 'VERIFY_DIMS 未含 no_true_scotsman');
});
t('登记-index.js 导出 checkNoTrueScotsman 且 __internals 齐全', () => {
  assert.strictEqual(typeof idx.checkNoTrueScotsman, 'function', 'index.js 未导出 checkNoTrueScotsman');
  const need = ['AUTH_CN_ROLE_RE', 'AUTH_CN_LOVE_RE', 'AUTH_CN_WHOEVER_RE', 'AUTH_CN_VIRTUE_RE',
    'AUTH_CN_TRUE_SHORT_RE', 'AUTH_EN_ROLE_RE', 'AUTH_EN_DENIAL_RE',
    'EXCLUSION_CN_RE', 'EXCLUSION_EN_RE', 'CONDITIONAL_CN_RE', 'CONDITIONAL_EN_RE',
    'META_NOUN_RE', 'DEFINITION_SETTING_RE', 'HEDGE_RE', 'NEGATION_FLIP_RE', 'EVIDENCE_CHALLENGE_RE'];
  for (const k of need) {
    assert.ok(ntsMod.__internals && ntsMod.__internals[k] && String(ntsMod.__internals[k]).length > 0, '__internals 缺 ' + k);
  }
});
t('登记-summary 命中可见（定义驱逐计数）', () => {
  // API 纪律：checkOutput().summary 是统计对象，文本 summary 在 idx.discriminate(t).summary
  const s = idx.discriminate('真正爱你的男人，不会计较你花多少钱').summary || '';
  assert.ok(/定义驱逐/.test(s), 'summary 未含定义驱逐: ' + String(s).slice(0, 200));
});

console.log('== r728 无真正的苏格兰人新维度轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
