'use strict';
/**
 * test/round-170-survivor-sampling.js
 * [r170] survivorship_bias 新句式族：幸存者取样 × 总体推广
 * （幸存者偏差的取样框形态——只从活下来的样本取证，却把结论推广
 * 到全体）。r169 实测缺口：12 条攻击 6 条零命中（含 EN），良性
 * 6/6 零误伤；selection_bias 的幸存者豁免把本族整体让出。
 *
 * 覆盖：攻击变体矩阵（ZH 10 / EN 4，含裸名词、带修饰、倒装、长句、
 * 跨句、仅标记、来源短语）/ 良性矩阵（ZH 12 / EN 4，含边缘良性：
 * 假设条件句、否定前置、反驳本族、疑问句、充分取样、概念转述、
 * 多因陈述）/ 分工边界锁 / 存量回归 / 登记断言 / 负例注入承重 /
 * gate 层实测。
 * 注：本测试不带 .test.js 后缀（run-all 发现不了，单独跑）——同
 * r161/r163/r164/r165/r166/r167/r168/r169 纪律。
 *
 * 注入机制：模块导出的 __internals 各常量与引擎内读取的是同一引用，
 * 承重测试通过 inject 参数替换为永不匹配的正则 /(?!)/ 验证「承重」
 * ——替换后攻击必须停判（腿承重）、豁免样本必须翻转为命中（豁免
 * 承重）。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const { checkSurvivorshipBias, __internals } = require(path.join(ROOT, 'src', 'survivorship-bias.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const fired = (s) => checkSurvivorshipBias(s).score > 0;
const dimCount = (s, k) => {
  const d = (idx.discriminate(s).dimensions || {})[k];
  if (!d || typeof d !== 'object') return 0;
  return d.count !== undefined ? d.count : (Array.isArray(d.hits) ? d.hits.length : 0);
};
const gateAct = (s) => { try { return gate.checkOutput(s).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
const NEVER = /(?!)/;
function withBlanked(key, fn) {
  const orig = __internals()[key];
  return fn({ [key]: NEVER });
}
function withInjected(key, fn) {
  return fn({ [key]: NEVER });
}

// ── 1. 攻击变体矩阵（ZH 10：核心形/裸名词/带修饰/倒装/长句/跨句/来源短语）──
const ATTACK_ZH = [
  '只采访了事故的幸存者，所以这反映了全体乘客的体验。',
  '事故调查只访谈了生还者，由此认定安全措施对全体乘客都有效。',
  '只观察存活下来的企业，所以创业公司大多能成功。',
  '我们只听见坚持到现在的人，可见人人都适应这里的环境。',
  '复盘只统计了没被裁员的员工，因此大家都认可这次组织调整。',
  '样本全部来自生还者，所以这个结论代表全体乘客。',
  '问卷只发给了没退出的订户，这说明所有人都喜欢这个栏目。',
  '由于预算有限，回访只覆盖了完好无损的乘客，研究者认为这足以证明安全改进对全体乘客都有效。',
  '这家纪录片只拍坚持下来的创业者，让人以为人人都能成功。',
  '随访只纳入了活到现在的患者，据此得出结论：所有人都能长期存活。',
];
ATTACK_ZH.forEach((v, i) => t('攻击ZH#' + (i + 1) + ' 命中', () => {
  assert.ok(fired(v), '未命中: ' + v);
  assert.ok(dimCount(v, 'survivorship_bias') > 0, 'dimensions 无登记: ' + v);
}));

// ── 2. 攻击变体矩阵（EN 4）────────────────────────────────────
const ATTACK_EN = [
  'We only interviewed the survivors, so this reflects every passenger\u2019s experience.',
  'Only those who survived are counted, which shows the treatment works for everyone.',
  'We only heard from the customers who stayed, so all customers love the new plan.',
  'The report only profiled companies that survived, which means every startup thrives.',
];
ATTACK_EN.forEach((v, i) => t('攻击EN#' + (i + 1) + ' 命中', () => {
  assert.ok(fired(v), '未命中: ' + v);
}));

// ── 3. 良性矩阵（ZH 12：假设/否定前置/反驳/疑问/充分取样/概念/多因…）──
const BENIGN_ZH = [
  '调查既包括生还者也包括遇难者家属，结论反映了全体乘客的情况。',
  '我们同时统计了退出用户和留存用户，流失率是行业平均水平。',
  '随访覆盖了全部入组患者，包括失访者按既定规则处理，结论适用于整个人群。',
  '如果只统计活下来的用户，得出的结论就会偏乐观。',
  '我们不是只采访幸存者，也采访了遇难者家属。',
  '只采访幸存者的话，结论不能反映全体乘客的真实体验。',
  '只统计留存客户就能代表全体吗？这个抽样方法需要检讨。',
  '战争是多因共同造成的，不能只归因于单一因素。',
  '幸存者偏差是一种常见的逻辑谬误，教材里有专门章节。',
  '这项研究纳入了所有符合标准的受试者，未按结局分组筛选。',
  '问卷调查同时覆盖了坚持下来和中途退出的人，结论反映了全体学员。',
  'App 改版后我们既看留存也看卸载，数据说明整体满意度持平。',
];
BENIGN_ZH.forEach((v, i) => t('良性ZH#' + (i + 1) + ' 零误判', () => {
  assert.ok(!fired(v), '误判: ' + v);
}));

// ── 4. 良性矩阵（EN 4）────────────────────────────────────────
const BENIGN_EN = [
  'We interviewed both survivors and the families of victims, so the findings reflect everyone affected.',
  'If we only counted the survivors, the results would be skewed.',
  'The study enrolled all eligible participants regardless of outcome.',
  'Can a survey of survivors alone represent the whole population?',
];
BENIGN_EN.forEach((v, i) => t('良性EN#' + (i + 1) + ' 零误判', () => {
  assert.ok(!fired(v), '误判: ' + v);
}));

// ── 5. 分工边界锁 ────────────────────────────────────────────
t('分工锁：selection_bias 族仍由该维度判（射程不重叠抢判）', () => {
  assert.ok(dimCount('问卷只发给了注册会员，所以调查结果代表全体用户的满意度。', 'selection_bias') > 0);
});
t('分工锁：无幸存者取样信号的推广不判', () => {
  assert.ok(!fired('调查了三千名观众，结果代表全体观众的意见。'));
});

// ── 6. 存量回归：姊妹族不受影响 ────────────────────────────
t('存量回归：r694 成功个案×推及结论族仍判', () => {
  assert.ok(fired('比尔·盖茨辍学创业成了世界首富，所以你也该退学。'));
});
t('存量回归：r694 PATH×SURVIVOR 叙事形仍判', () => {
  assert.ok(fired('隔壁老王的儿子退学打游戏现在年薪百万。'));
});
t('存量回归：r694 良性仍不判', () => {
  assert.ok(!fired('中彩票是极低概率事件，期望收益为负。'));
  assert.ok(!fired('他考上了清华，这是他个人多年努力的结果。'));
});

// ── 7. 登记断言 ──────────────────────────────────────────────
t('登记断言：dimensions 键数 168 且含 survivorship_bias', () => {
  const dims = Object.keys(idx.discriminate('测试文本').dimensions || {});
  assert.strictEqual(dims.length, 168, '维度数 ' + dims.length);
  assert.ok(dims.includes('survivorship_bias'), 'dimMap 未登记');
});
t('登记断言：DIM_GUIDANCE 指引含新句式族概念条文', () => {
  const r = idx.discriminate('只采访了事故的幸存者，所以这反映了全体乘客的体验。');
  const f = (r.findings || []).find(x => x.dimension === 'survivorship_bias');
  assert.ok(f, 'findings 无 survivorship_bias');
  assert.ok(f.guidance && f.guidance.length > 50, 'guidance 缺失或过短');
  assert.ok(/幸存者取样/.test(f.guidance), 'guidance 未说明幸存者取样族');
});
t('登记断言：gate 层攻击非 pass 且 findings 含 survivorship_bias', () => {
  const r = gate.checkOutput('只采访了事故的幸存者，所以这反映了全体乘客的体验。');
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 为 pass');
  assert.ok((r.findings || []).some(f => f.dimension === 'survivorship_bias'), 'findings 无 survivorship_bias');
});

// ── 8. 负例注入承重（逐常量替换验证）─────────────────────────
t('负例注入：SURV_SAMPLE_ZH_A 置空后标记形攻击停判（腿①路由 a 承重）', () => {
  withBlanked('SURV_SAMPLE_ZH_A', (inj) => {
    assert.ok(!checkSurvivorshipBias('只采访了事故的幸存者，所以这反映了全体乘客的体验。', inj).hit, '腿①路由 a 未承重');
  });
});
t('负例注入：SURV_SAMPLE_ZH_C 置空后来源短语攻击停判（腿①路由 c 承重）', () => {
  withBlanked('SURV_SAMPLE_ZH_C', (inj) => {
    assert.ok(!checkSurvivorshipBias('样本全部来自生还者，所以这个结论代表全体乘客。', inj).hit, '腿①路由 c 未承重');
  });
});
t('负例注入：SURV_SAMPLE_EN_A 置空后英文攻击停判（EN 腿①承重）', () => {
  withBlanked('SURV_SAMPLE_EN_A', (inj) => {
    assert.ok(!checkSurvivorshipBias('We only interviewed the survivors, so this reflects every passenger\u2019s experience.', inj).hit, 'EN 腿①未承重');
  });
});
t('负例注入：SURV_GEN_ZH_A 置空后推广动词形攻击停判（腿②路由 a 承重）', () => {
  withBlanked('SURV_GEN_ZH_A', (inj) => {
    assert.ok(!checkSurvivorshipBias('事故调查只访谈了生还者，由此认定安全措施对全体乘客都有效。', inj).hit, '腿②路由 a 未承重');
  });
});
t('负例注入：SURV_GEN_ZH_B 置空后全称判断形攻击停判（腿②路由 b 承重）', () => {
  withBlanked('SURV_GEN_ZH_B', (inj) => {
    assert.ok(!checkSurvivorshipBias('只观察存活下来的企业，所以创业公司大多能成功。', inj).hit, '腿②路由 b 未承重');
  });
});
t('负例注入：SURV_GEN_EN_B 置空后英文范围词形攻击停判（EN 腿②路由 b 承重）', () => {
  withBlanked('SURV_GEN_EN_B', (inj) => {
    assert.ok(!checkSurvivorshipBias('We only heard from the customers who stayed, so all customers love the new plan.', inj).hit, 'EN 腿②路由 b 未承重');
  });
});
t('负例注入：SURV_EXEMPT_ZH 置空后假设良性翻命中（豁免承重）', () => {
  withInjected('SURV_EXEMPT_ZH', (inj) => {
    assert.ok(checkSurvivorshipBias('如果只统计活下来的用户，就会得出结论：所有人都很满意。', inj).hit, 'SURV_EXEMPT_ZH 未承重');
  });
});
t('负例注入：SURV_EXEMPT_ZH 置空后反驳良性翻命中（豁免承重）', () => {
  withInjected('SURV_EXEMPT_ZH', (inj) => {
    assert.ok(checkSurvivorshipBias('只采访幸存者的话，结论不能反映全体乘客的真实体验。', inj).hit, '反驳豁免未承重');
  });
});
t('负例注入：SURV_EXEMPT_EN 置空后英文假设良性翻命中（EN 豁免承重）', () => {
  withInjected('SURV_EXEMPT_EN', (inj) => {
    assert.ok(checkSurvivorshipBias('If we only counted the survivors, the results would show that everyone is satisfied.', inj).hit, 'SURV_EXEMPT_EN 未承重');
  });
});

// ── 9. gate 层实测 ───────────────────────────────────────────
t('gate 层：攻击 action 非 pass 且 findings 含 survivorship_bias', () => {
  const r = gate.checkOutput('只观察存活下来的企业，所以创业公司大多能成功。');
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 为 pass');
  assert.ok((r.findings || []).some(f => f.dimension === 'survivorship_bias'), 'findings 无 survivorship_bias');
});
t('gate 层：良性 action=pass', () => {
  assert.strictEqual(gateAct('调查既包括生还者也包括遇难者家属，结论反映了全体乘客的情况。'), 'pass');
});

// ── 汇总 ─────────────────────────────────────────────────────
console.log('round-170 survivor-sampling: ' + pass + ' passed, ' + fails.length + ' failed');
if (fails.length) { fails.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
