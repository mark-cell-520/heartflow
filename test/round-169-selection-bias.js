'use strict';
/**
 * test/round-169-selection-bias.js
 * [r169] 第 168 维度 selection_bias（取样偏差：只从受限样本取证却推广到全体）。
 *
 * 覆盖：攻击变体矩阵（ZH 10 / EN 4，含裸名词、带修饰、倒装、长句、跨句）/
 * 良性矩阵（ZH 11 / EN 4，含边缘良性：明示局限、充分取样、只描述样本自身、
 * 幸存者措辞、概念转述）/ 分工边界锁（survivorship_bias 射程）/ 区分锁 /
 * 存量回归 / 登记断言 / 负例注入承重 / gate 层实测。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同 r161/r163/
 * r164/r165/r166/r167/r168 纪律。
 *
 * 注入机制：模块导出的 __internals 各常量与引擎内读取的是同一数组引用，
 * 承重测试通过临时置空该数组（arr.length=0）验证「承重」——置空后攻击必须
 * 停判（腿承重）、豁免样本必须翻转为命中（豁免承重），完成后还原。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const { checkSelectionBias, __internals } = require(path.join(ROOT, 'src', 'selection-bias.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const fired = (s) => checkSelectionBias(s).score > 0;
const dimCount = (s, k) => {
  const d = (idx.discriminate(s).dimensions || {})[k];
  if (!d || typeof d !== 'object') return 0;
  return d.count !== undefined ? d.count : (Array.isArray(d.hits) ? d.hits.length : 0);
};
const gateAct = (s) => { try { return gate.checkOutput(s).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
function withEmptied(key, fn) {
  const arr = __internals[key];
  const saved = arr.slice();
  arr.length = 0;
  try { return fn(); } finally { arr.length = 0; for (const v of saved) arr.push(v); }
}

// ── 1. 攻击变体矩阵（ZH 10：核心形/裸名词/带修饰/倒装/长句/跨句/仅标记/跨段）──
const ATTACK_ZH = [
  '问卷只发给了注册会员，所以调查结果代表全体用户的满意度。',
  '研究只统计了坚持下来的学员，因此这门课程对所有人都有效。',
  '数据只来自一线城市的活跃用户，足以说明全国用户的偏好。',
  '我们只采访了愿意配合回答的居民，可见整个社区都支持这个方案。',
  '样本全部来自自愿报名的志愿者，因此这个结论具有普遍性。',
  '公司只收集了投诉客户的意见，这说明客户整体都很不满意。',
  '由于经费限制，这项调研只回收了愿意配合的老年人的问卷，但研究者认为这完全可以代表全市老年人的健康状况。',
  '所以全体员工都认可这项新制度——毕竟问卷只发给了管理层。',
  '他只问了几位铁杆粉丝，这说明所有观众都爱看这部剧。',
  '我们仅统计了愿意公开评分的人，因此这部电影的评分代表大众口味。',
];
ATTACK_ZH.forEach((v, i) => t('攻击ZH#' + (i + 1) + ' 命中', () => {
  assert.ok(fired(v), '未命中: ' + v);
  assert.ok(dimCount(v, 'selection_bias') > 0, 'dimensions 无登记: ' + v);
}));

// ── 2. 攻击变体矩阵（EN 4）────────────────────────────────────
const ATTACK_EN = [
  'We only surveyed volunteers, so the results are representative of everyone.',
  'The sample was drawn solely from our premium users, which means all customers prefer this feature.',
  'We only asked our most active players, so this proves every player enjoys the new mode.',
  'Feedback came only from subscribers, which shows the whole audience wants this change.',
];
ATTACK_EN.forEach((v, i) => t('攻击EN#' + (i + 1) + ' 命中', () => {
  assert.ok(fired(v), '未命中: ' + v);
}));

// ── 3. 良性矩阵（ZH 11：明示局限/充分取样/样本自身/幸存者/概念/教学/疑问…）──
const BENIGN_ZH = [
  '问卷只发给了会员，结果只能反映会员的意见，不能代表全体用户。',
  '研究只纳入了男性参与者，这是该研究的局限，结论对女性不一定成立。',
  '随机抽样调查了全国三千名各年龄段观众，因此结果具有代表性。',
  '只采访愿意配合的人，结果会存在偏差，需要再补充匿名调查。',
  '该调查由自愿报名参加，样本可能存在自选择偏差，解读需谨慎。',
  '问卷只发给了会员，因此会员的满意度更高。',
  '只统计了首批样本，所有样本都合格。',
  '只看到成功创业者的经验，所以创业很容易。',
  '这种取样偏差在问卷调查中很常见，教材里有专门章节。',
  '样本能否代表全体，还需要看抽样方法是否科学。',
  '战争是多因共同造成的，既有资源争夺也有信仰冲突。',
];
BENIGN_ZH.forEach((v, i) => t('良性ZH#' + (i + 1) + ' 零误判', () => {
  assert.ok(!fired(v), '误判: ' + v);
}));

// ── 4. 良性矩阵（EN 4）────────────────────────────────────────
const BENIGN_EN = [
  'All participants were asked the same question, and most said yes.',
  'We surveyed a random sample of 2000 adults, so the results are representative.',
  'The study only included men, which is a limitation of the research.',
  'Only the survivors were interviewed, so the results reflect survivorship bias.',
];
BENIGN_EN.forEach((v, i) => t('良性EN#' + (i + 1) + ' 零误判', () => {
  assert.ok(!fired(v), '误判: ' + v);
}));

// ── 5. 分工边界锁：幸存者措辞不越界（survivorship_bias 射程）──
t('分工锁：幸存者措辞样本本维度不判（射程不越界）', () => {
  const s = '只采访了事故的幸存者，所以这反映了全体乘客的体验。';
  assert.ok(!fired(s), '本维度越界: ' + s);
  // 已知边界（实测）：survivorship_bias 当前中文侧对上述样本零命中，
  // 幸存者族中文句式是下一轮候选缺口，本维度按射程切割主动让出。
});
t('区分锁：无取样受限信号的推广不判', () => {
  assert.ok(!fired('调查了三千名观众，结果代表全体观众的意见。'));
});

// ── 6. 存量回归：姊妹维度不受影响 ────────────────────────────
t('存量回归：illicit_conversion 族仍判', () => {
  assert.ok(dimCount('所有猫都是动物，所以动物都是猫。', 'illicit_conversion') > 0);
});
t('存量回归：affirming_the_consequent 族仍判', () => {
  assert.ok(dimCount('如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的。', 'affirming_the_consequent') > 0);
});

// ── 7. 登记断言 ──────────────────────────────────────────────
t('登记断言：dimensions 键数 168 且含 selection_bias', () => {
  const dims = Object.keys(idx.discriminate('测试文本').dimensions || {});
  assert.strictEqual(dims.length, 168, '维度数 ' + dims.length);
  assert.ok(dims.includes('selection_bias'), 'dimMap 未登记');
});
t('登记断言：DIM_GUIDANCE 指引含 selection_bias 概念条文', () => {
  const r = idx.discriminate('问卷只发给了注册会员，所以调查结果代表全体用户的满意度。');
  const f = (r.findings || []).find(x => x.dimension === 'selection_bias');
  assert.ok(f, 'findings 无 selection_bias');
  assert.ok(f.guidance && f.guidance.length > 50, 'guidance 缺失或过短');
  assert.ok(/取样/.test(f.guidance), 'guidance 未说明取样纪律');
});
t('登记断言：index.js 导出 checkSelectionBias', () => {
  assert.strictEqual(typeof idx.checkSelectionBias, 'function');
});
t('登记断言：gate 层攻击非 pass 且 findings 含 selection_bias', () => {
  const r = gate.checkOutput('问卷只发给了注册会员，所以调查结果代表全体用户的满意度。');
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 为 pass');
  assert.ok((r.findings || []).some(f => f.dimension === 'selection_bias'), 'findings 无 selection_bias');
});

// ── 8. 负例注入承重（逐常量置空验证）─────────────────────────
t('负例注入：RESTRICT_ZH 置空后限定形攻击停判（腿①路由 a 承重）', () => {
  withEmptied('RESTRICT_ZH', () => {
    assert.ok(!fired('问卷只发给了注册会员，所以调查结果代表全体用户的满意度。'), '腿①未承重');
  });
});
t('负例注入：SAMPLING_VERBS_ZH 置空后攻击停判（腿①动词承重）', () => {
  withEmptied('SAMPLING_VERBS_ZH', () => {
    assert.ok(!fired('问卷只发给了注册会员，所以调查结果代表全体用户的满意度。'), '腿①未承重');
  });
});
t('负例注入：SOURCE_FROM_ZH 置空后来源路由攻击停判（腿①路由 b 承重）', () => {
  withEmptied('SOURCE_FROM_ZH', () => {
    assert.ok(!fired('样本源于自愿报名的志愿者，因此这个结论具有普遍性。'), '腿①路由 b 未承重');
  });
});
t('负例注入：RESTRICTED_SOURCE_ZH 置空后来源路由攻击停判（受限来源词承重）', () => {
  withEmptied('RESTRICTED_SOURCE_ZH', () => {
    assert.ok(!fired('样本源于自愿报名的志愿者，因此这个结论具有普遍性。'), '受限来源词未承重');
  });
});
t('负例注入：GEN_SCOPE_ZH 置空后攻击停判（腿②范围词承重）', () => {
  withEmptied('GEN_SCOPE_ZH', () => {
    assert.ok(!fired('问卷只发给了注册会员，所以调查结果代表全体用户的满意度。'), '腿②未承重');
  });
});
t('负例注入：GEN_VERB_ZH 置空后推广动词形攻击停判（腿②动词承重）', () => {
  withEmptied('GEN_VERB_ZH', () => {
    assert.ok(!fired('数据只来自一线城市的活跃用户，足以说明全国用户的偏好。'), '腿②动词未承重');
  });
});
t('负例注入：RESTRICT_EN 置空后英文攻击停判（EN 腿①承重）', () => {
  withEmptied('RESTRICT_EN', () => {
    assert.ok(!fired('We only surveyed volunteers, so the results are representative of everyone.'), 'EN 腿①未承重');
  });
});
t('负例注入：GEN_SCOPE_EN 置空后英文攻击停判（EN 腿②承重）', () => {
  withEmptied('GEN_SCOPE_EN', () => {
    assert.ok(!fired('We only surveyed volunteers, so the results are representative of everyone.'), 'EN 腿②未承重');
  });
});
t('负例注入：ACK_FULL_ZH 置空后明示局限良性翻命中（豁免承重）', () => {
  withEmptied('ACK_FULL_ZH', () => {
    assert.ok(fired('问卷只发给了会员，因此只能反映会员情况，不足以推广到全体。'), 'ACK_FULL 未承重');
  });
});
t('负例注入：ACK_CLAUSE_ZH 置空后存疑良性翻命中（豁免承重）', () => {
  withEmptied('ACK_CLAUSE_ZH', () => {
    assert.ok(fired('问卷只发给了会员，所以能否代表全体还有待验证。'), 'ACK_CLAUSE 未承重');
  });
});
t('负例注入：ADEQUATE_ZH 置空后随机抽样良性翻命中（豁免承重）', () => {
  withEmptied('ADEQUATE_ZH', () => {
    assert.ok(fired('虽然只调查了本店顾客，但属于随机抽样，结果具有普遍性。'), 'ADEQUATE 未承重');
  });
});
t('负例注入：SURVIVOR_ZH 置空后幸存者良性翻命中（豁免承重）', () => {
  withEmptied('SURVIVOR_ZH', () => {
    assert.ok(fired('只采访了事故的幸存者，所以这反映了全体乘客的体验。'), 'SURVIVOR 未承重');
  });
});
t('负例注入：META_CONCEPT 置空后概念转述良性翻命中（豁免承重）', () => {
  withEmptied('META_CONCEPT', () => {
    assert.ok(fired('只调查会员就断言代表全体，这是典型的取样偏差。'), 'META_CONCEPT 未承重');
  });
});
t('负例注入：HEDGE_ZH 置空后概率化良性翻命中（豁免承重）', () => {
  withEmptied('HEDGE_ZH', () => {
    assert.ok(fired('只采访了愿意配合的人，结果可能代表全体居民的意见。'), 'HEDGE 未承重');
  });
});

// ── 9. gate 层实测 ───────────────────────────────────────────
t('gate 层：攻击 action 非 pass 且 findings 含 selection_bias', () => {
  const r = gate.checkOutput('样本全部来自自愿报名的志愿者，因此这个结论具有普遍性。');
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 为 pass');
  assert.ok((r.findings || []).some(f => f.dimension === 'selection_bias'), 'findings 无 selection_bias');
});
t('gate 层：良性 action=pass', () => {
  assert.strictEqual(gateAct('随机抽样调查了全国三千名各年龄段观众，因此结果具有代表性。'), 'pass');
});

// ── 汇总 ─────────────────────────────────────────────────────
console.log('round-169 selection_bias: ' + pass + ' passed, ' + fails.length + ' failed');
if (fails.length) { fails.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
