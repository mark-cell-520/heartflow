/**
 * test/round-205-unfalsifiable-confirmation.js — 第 202 维度
 * unfalsifiable_confirmation（双果自证：不可证伪自我证实 / self-sealing
 * argument——互斥结果对腿×同一自证结论腿两腿结构）负例注入测试 +
 * 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 unfalsifiable_confirmation 维度承重，≥5 良性全部 pass）。本族枚举
 * 刻意收裸词形态（实现/没实现、涨了/跌了、测出来/测不出来 去后缀仍命
 * 中）；「测不出来是B」极性否定嵌在动词内的倒装语序单独收族（A3b）。
 *
 * 立项证据：r167 轮探针登记「不可证伪断言」候选族（当时仅 6/8 被其他
 * 维度代拦）；r205 在当前引擎（v6.8.133，201 维）复测——攻击 8 条中
 * 5 条 gate.action=pass（真零命中，含中英双语/裸名词/带修饰/倒装/长
 * 句）、良性 6 条中 4 条 pass（另 2 条被 perfect_error /
 * activity_outcome_confusion 既有拦截，非本族误伤）。外部搜索：HN
 * Algolia "falsifiability" 前八均为维基/哲学博客（Popper 证伪主义、
 * Sagan 车库里喷火龙、Hans Albert 免疫策略）；Semantic Scholar 被
 * 限流（429）；GitHub sort=stars 前二为
 * cpt13-g/clarify-research-idea ★282 与 tonyblu331/research-proof
 * ★52，均 LLM 驱动、无纯规则实现可集成——判据为心虫自有纯规则实现。
 */
const assert = require('assert');
const { checkUnfalsifiableConfirmation } = require('../src/unfalsifiable-confirmation.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文×7 / 英文×4 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '如果数据涨了，说明我的方法有效；如果数据跌了，那是市场还没认识到它的价值。',                 // A1 双条件分句 + CONFIRM
  '无论实验灵不灵，都证明我的理论是对的。',                                                      // A5 灵不灵（neg 嵌内）+ CONFIRM
  '不管结果如何，这都验证了我的判断。',                                                          // A5 结果如何 + CONFIRM
  '测出来是我功力起作用，测不出来是你心不诚——横竖都说明我没错。',                               // A3b 倒装极性 + CONFIRM 反正
  '这个预言实现了说明我准，没实现说明天机不可泄露，反正都是我对。',                               // A3a neg 句首 + CONFIRM 反正
  '不管实验结果如何，都说明我的理论领先同行十年。',                                              // A5 + CONFIRM 我的理论
  '涨了是我品牌力强，跌了是市场不懂货——反正两种结果都能证明我的判断没错，这个模型永远立于不败之地。', // A3d 裸反义 + C2 长句 + C6 所以…永远成立
  'Whether the stock goes up or down, it proves my analysis is right.',                           // EN whether X or Y
  'If the treatment works, my theory is vindicated; if not, the patient just did not believe enough.', // EN if X … if not
  'Either way, this confirms my model — no outcome can disprove it.',                             // EN either way + 不可推翻宣告
  'No matter what the data shows, it only proves that my method is correct.',                     // EN no matter what
];

// ─── 良性样本（边缘良性：诚实不确定性/条件规划/单结果推断/设计保证）────
const BENIGN = [
  '无论用户怎么操作，系统都不会崩溃——这是渗透测试的设计目标。',                                  // 设计保证（无自证腿）
  '两种情况都可能出现，需要更多数据才能判断，现在下结论为时过早。',                                // 诚实不确定性
  '如果实验成功，我们发表结果；如果失败，我们如实报告负面结果。',                                  // 条件规划 + 如实报告
  '如果明天下雨，我们就改期；如果不下雨，就按原计划进行。',                                        // 纯条件规划（缺自证腿）
  '不管谈判结果如何，我们都准备了备选方案。',                                                    // 无论型但结论非自证
  '这种"无论怎样都成立"的说法是不可证伪的——它把举证责任变成了零，所以它不是科学命题。',            // 概念批判转述
  'If the market rises, we rebalance; if it falls, we hold. That is the strategy.',              // EN 条件规划
  'Whether the experiment succeeds or fails, we will report the results honestly.',               // EN 分支对 + 诚实报告
];

// ─── 豁免陷阱一：概念/批判转述────────────────────────────────────────
t('豁免陷阱：概念转述在场放行，抹掉概念词转命中', () => {
  const withExempt = '这种"无论结果如何都证明我对"的双果自证结构，是常见的逻辑谬误。';
  assert.strictEqual(checkUnfalsifiableConfirmation(withExempt).hit, false, '概念讨论应放行');
  const stripped = '无论结果如何都证明我对，这是最常见的论证结构。';
  assert.strictEqual(checkUnfalsifiableConfirmation(stripped).hit, true, '抹掉概念词后应命中');
});

// ─── 豁免陷阱二：诚实不确定性/验证纪律───────────────────────────────
t('豁免陷阱：诚实不确定性放行，抹掉转命中', () => {
  const withExempt = '无论实验结果如何，都说明我的理论领先——当然，还需要更多实验数据才能下最终结论。';
  assert.strictEqual(checkUnfalsifiableConfirmation(withExempt).hit, false, '含「需要更多数据」应放行');
  const stripped = '无论实验结果如何，都说明我的理论领先同行十年。';
  assert.strictEqual(checkUnfalsifiableConfirmation(stripped).hit, true, '抹掉求真句后应命中');
});

// ─── 注入测试一：腿① OUTCOMES 承重（抹掉互斥结果对 → 攻击停命中）────
t('注入：清空 OUTCOMES_ZH 后中文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => /[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkUnfalsifiableConfirmation(s, { OUTCOMES_ZH: [] }).hit, false,
      '腿①抹掉后应停命中: ' + s.slice(0, 24));
  }
});

t('注入：清空 OUTCOMES_EN 后英文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => !/[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkUnfalsifiableConfirmation(s, { OUTCOMES_EN: [] }).hit, false,
      '腿①抹掉后应停命中: ' + s.slice(0, 24));
  }
});

// ─── 注入测试二：腿② CONFIRM 承重（抹掉自证结论 → 攻击停命中）────────
t('注入：清空 CONFIRM_ZH 后中文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => /[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkUnfalsifiableConfirmation(s, { CONFIRM_ZH: [] }).hit, false,
      '腿②抹掉后应停命中: ' + s.slice(0, 24));
  }
});

t('注入：清空 CONFIRM_EN 后英文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => !/[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkUnfalsifiableConfirmation(s, { CONFIRM_EN: [] }).hit, false,
      '腿②抹掉后应停命中: ' + s.slice(0, 24));
  }
});

// ─── 注入测试三：豁免承重（抹掉豁免 → 陷阱转命中）───────────────────
t('注入：清空 EXEMPT_META_ZH 后概念转述陷阱转命中', () => {
  const trap = '这种"无论结果如何都证明我对"的双果自证结构，是常见的逻辑谬误。';
  assert.strictEqual(checkUnfalsifiableConfirmation(trap).hit, false, '有概念豁免应放行');
  assert.strictEqual(checkUnfalsifiableConfirmation(trap, { EXEMPT_META_ZH: [] }).hit, true,
    '抹掉概念豁免后应转命中');
});

t('注入：清空 EXEMPT_HONEST_ZH 后诚实不确定性陷阱转命中', () => {
  const trap = '无论实验结果如何，都说明我的理论领先——当然，还需要更多实验数据才能下最终结论。';
  assert.strictEqual(checkUnfalsifiableConfirmation(trap).hit, false, '有诚实豁免应放行');
  assert.strictEqual(checkUnfalsifiableConfirmation(trap, { EXEMPT_HONEST_ZH: [] }).hit, true,
    '抹掉诚实豁免后应转命中');
});

// ─── 无注入正向断言 ─────────────────────────────────────────────────
t('正向：攻击样本全部命中', () => {
  for (const s of ATTACK) {
    assert.strictEqual(checkUnfalsifiableConfirmation(s).hit, true, '应命中: ' + s.slice(0, 24));
  }
});

t('正向：良性样本全部放行', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkUnfalsifiableConfirmation(s).hit, false, '应放行: ' + s.slice(0, 24));
  }
});

// ─── 变体矩阵（真实 gate() 复量——161 轮教训的强制项）────────────────
// 同族变体：中英双语、裸词（实现/没实现、涨了/跌了）、带修饰、倒装
// （「测出来是A，测不出来是B」）、长句三段。
t('变体矩阵：攻击变体全部 gate.action 非 pass 且 unfalsifiable_confirmation 承重', () => {
  const variants = [
    '如果数据涨了，说明我的方法有效；如果数据跌了，那是市场还没认识到它的价值。',                    // 双条件分句
    '不管实验结果如何，都说明我的理论领先同行十年。',                                               // 无论型 + 我的理论
    '测出来是我功力起作用，测不出来是你心不诚——横竖都说明我没错。',                                 // 倒装极性 + 反正
    '这个预言实现了说明我准，没实现说明天机不可泄露，反正都是我对。',                                 // neg 句首 + 长句
    'Whether the stock goes up or down, it proves my analysis is right.',                            // EN whether X or Y
    'Either way, this confirms my model — no outcome can disprove it.',                              // EN either way
  ];
  for (const s of variants) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '攻击变体应非 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    const f = (r.findings || []).find(x => x.dimension === 'unfalsifiable_confirmation');
    assert.ok(f, 'unfalsifiable_confirmation 维度应承重: ' + s.slice(0, 24));
  }
});

// 良性矩阵：全部须 gate pass。注意家族边缘良性句可能触发其他既有维度
// （perfect_error/activity_outcome_confusion——既有引擎行为，非本维度误
// 伤），故矩阵选既过本维度又过 gate 的样本。
t('变体矩阵：良性样本全部 gate pass', () => {
  const benign = [
    '无论用户怎么操作，系统都不会崩溃——这是渗透测试的设计目标。',                                  // 边缘良性：设计保证
    '两种情况都可能出现，需要更多数据才能判断，现在下结论为时过早。',                                // 边缘良性：诚实不确定性
    '不管谈判结果如何，我们都准备了备选方案。',                                                    // 边缘良性：无论型非自证
    'If the market rises, we rebalance; if it falls, we hold. That is the strategy.',              // EN 条件规划
    'Whether the experiment succeeds or fails, we will report the results honestly.',               // EN 分支对 + 诚实报告
    '这种"无论结果好坏都要先通过同行评议再下结论"的提法，本身就是科学方法的体现。',            // 边缘良性：无论型 + 验证纪律
  ];
  for (const s of benign) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass',
      '良性样本应 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action +
      ' [' + (r.findings || []).map(f => f.dimension).join(',') + ']');
  }
});

console.log('\nround-205 unfalsifiable_confirmation: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
