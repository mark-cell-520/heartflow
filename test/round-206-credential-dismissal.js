/**
 * test/round-206-credential-dismissal.js — 第 203 维度
 * credential_dismissal（诉诸资历/资历驳回：credential dismissal /
 * courtier's reply / credential gatekeeping——资历缺口腿×发言资格剥
 * 夺腿两腿结构 + 自足祈使分支）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/反问/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 credential_dismissal 维度承重，≥5 良性全部 pass）。本族枚举刻意收裸
 * 词形态（没读过/没做过/外行/amateur 去后缀仍命中）；「先+资历动作+再+发
 * 言动作」单式自足（祈使本身同时宣告缺口与禁言）。
 *
 * 立项证据：r206 族探针（/tmp/hf-probe-families.js）在当前引擎（v6.8.134，
 * 202 维）复测——攻击 4 条 gate.action 全 pass（真零命中，含中英双语/裸
 * 名词/带修饰/反问/长句变体）、良性 2/2 pass（零误伤）。与 genetic_fallacy
 * （第 131 维，起源谬误：来源×质量贬损，落点是内容价值）边界实测：本族腿
 * ②是发言资格剥夺（没资格/先读书再说话/闭嘴），4/4 攻击样本它零命中。
 * 外部搜索：HN Algolia "courtier's reply" 前五无相关命中（courier 同形词
 * 干扰）；Semantic Scholar 两次检索空返（限流）；GitHub "ad hominem
 * fallacy" sort=stars 前五——UKPLab/naacl2018-before-name-calling ★13、
 * jghibiki/NeuralAdHominem ★2、utkarsh512/logical-fallacy ★1，"courtier
 * reply fallacy" 零仓库，全部 LLM/统计学习路线，与心虫零 LLM 依赖铁律冲
 * 突，无纯规则实现可集成——判据为心虫自有纯规则实现。
 */
const assert = require('assert');
const { checkCredentialDismissal } = require('../src/credential-dismissal.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（中文×8 / 英文×4 / 含裸名词、带修饰、反问、长句）────────
const ATTACK = [
  '你连这本专著都没读过，有什么资格批评我的理论？先去读书再说话。',                              // A2 连…都没 + B1 有什么资格 + 祈使
  '你不是经济学博士，讨论货币政策就是班门弄斧，先拿个学位再说。',                                // A4 身份否定 + B2 不配族 + 祈使
  '没在行业里干过十年的人，没资格评论这套打法。',                                               // A3 裸名词缺口（隔定语）+ B1 没资格
  '你又不是家长，凭什么对学校教学指手画脚？',                                                   // A4 角色否定 + B1b 凭什么+动作
  '先考上编制再来跟我谈教育，你一个校外的人插什么嘴。',                                         // 祈使分支 + A5 外行 + B3 插什么嘴
  '没结过婚的人少来讨论婚姻，先把自己的人生过明白。',                                            // A3 裸名词缺口 + B3 少来
  '一个连代码都没写过的人，也配评价我们的技术方案？',                                            // A2 连…都没 + B2 也配
  '你又没当过父母，凭什么对别人的家庭教育指指点点？',                                            // A1 没当过 + B1b 凭什么+指指点点
  'You have not read the original 800-page treatise, so you are not qualified to critique my position.', // EN gap + not qualified to critique
  'He has never run a business, so his criticism of the company means nothing — who is he to lecture us?', // EN never run + means nothing + who is he to
  'Stay in your lane — you have never managed a team, so your opinion on our process is worthless.',      // EN stay in your lane + worthless
  '先把这本书读完再跟我讨论，这是基本门槛。',                                                     // 纯祈使分支（无显式缺口腿/剥夺腿）
];

// ─── 良性样本（边缘良性：资源指引/教学邀请/执业许可/概念批判）────────
const BENIGN = [
  '这个结论需要专业知识才能充分评估，我建议参考该领域的三篇综述后再讨论。',                        // 边缘良性：资源指引（给路径）
  '如果你不熟悉该方法，我可以先介绍它的基本假设，再展开讨论。',                                    // 边缘良性：教学邀请（先介绍再展开）
  '没执照不能行医，这是法律规定，与能不能讨论医疗政策是两回事。',                                  // 边缘良性：执业许可（发言动作不收行医）
  '非专业人士当然可以讨论医学，只是结论要接受同行评议。',                                          // 边缘良性：明确许可讨论
  '你可以先看看背景材料，有疑问我们再一起查证。',                                                // 边缘良性：建议而非禁言
  '外行提问往往一针见血，我们定期整理用户反馈来改进设计。',                                        // 边缘良性：正面看待外行
  'You do not need a degree to have an opinion on public transport; ridership data is open to everyone.', // EN 明确许可
  '「你没读过原著就没资格批评」是典型的诉诸资历谬误。',                                            // 边缘良性：概念批判转述
  '他虽然资历深，但合规要求对所有人一致，我们按流程处理。',                                        // 中性事实陈述（无剥夺腿）
  '先把流程熟悉了再谈优化，新人先看操作手册。',                                                    // 边缘良性：工作流祈使（熟悉非资格动作）
  '少来这套苦情戏，我们还是看数据吧。',                                                            // 边缘良性：禁言口语但无缺口腿
  'If you are new to the codebase, I can walk you through the architecture before you review the PR.',   // EN 教学邀请
];

// ─── 豁免陷阱一：概念/批判转述────────────────────────────────────────
t('豁免陷阱：概念转述在场放行，抹掉概念词转命中', () => {
  const withExempt = '这种"没读过原著就没资格批评"的说法，是典型的诉诸资历谬误。';
  assert.strictEqual(checkCredentialDismissal(withExempt).hit, false, '概念讨论应放行');
  const stripped = '这种"没读过原著就没资格批评"的说法，是最常见的论证策略。';
  assert.strictEqual(checkCredentialDismissal(stripped).hit, true, '抹掉概念词后应命中');
});

// ─── 豁免陷阱二：资源指引/教学邀请（给路径不是关通道）────────────────
t('豁免陷阱：资源指引在场放行，抹掉转命中', () => {
  const withExempt = '你没读过这本专著，我建议先看看原著，不过你的批评说明不了任何问题。';
  assert.strictEqual(checkCredentialDismissal(withExempt).hit, false, '含「我建议」应放行');
  const stripped = '你没读过这本专著，你的批评说明不了任何问题。';
  assert.strictEqual(checkCredentialDismissal(stripped).hit, true, '抹掉指引句后应命中');
});

// ─── 豁免陷阱三：执业许可/任职要求（法定准入不是批评压制）────────────
t('豁免陷阱：执业许可在场放行，抹掉转命中', () => {
  const withExempt = '没学过医的人没资格评判病人的治疗方案，这是执业资格的要求。';
  assert.strictEqual(checkCredentialDismissal(withExempt).hit, false, '含执业资格要求应放行');
  const stripped = '没学过医的人没资格评判病人的治疗方案。';
  assert.strictEqual(checkCredentialDismissal(stripped).hit, true, '抹掉许可语境后应命中');
});

// ─── 注入测试一：腿① GAP_ZH 承重（缺口腿 + 祈使分支齐抹 → 停命中）───
t('注入：清空 GAP_ZH 与 IMPERATIVE_ZH 后中文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => /[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkCredentialDismissal(s, { GAP_ZH: [], IMPERATIVE_ZH: [] }).hit, false,
      '腿①抹掉后应停命中: ' + s.slice(0, 24));
  }
});

t('注入：清空 GAP_EN 与 IMPERATIVE_EN 后英文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => !/[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkCredentialDismissal(s, { GAP_EN: [], IMPERATIVE_EN: [] }).hit, false,
      '腿①抹掉后应停命中: ' + s.slice(0, 24));
  }
});

// ─── 注入测试二：腿② STANDING 承重（剥夺腿 + 祈使分支齐抹 → 停命中）─
t('注入：清空 STANDING_ZH 与 IMPERATIVE_ZH 后中文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => /[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkCredentialDismissal(s, { STANDING_ZH: [], IMPERATIVE_ZH: [] }).hit, false,
      '腿②抹掉后应停命中: ' + s.slice(0, 24));
  }
});

t('注入：清空 STANDING_EN 与 IMPERATIVE_EN 后英文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => !/[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkCredentialDismissal(s, { STANDING_EN: [], IMPERATIVE_EN: [] }).hit, false,
      '腿②抹掉后应停命中: ' + s.slice(0, 24));
  }
});

// ─── 注入测试三：自足祈使分支承重（抹掉 → 纯祈使攻击停命中）──────────
t('注入：清空 IMPERATIVE_ZH 后纯祈使中文攻击停命中', () => {
  const s = '先把这本书读完再跟我讨论，这是基本门槛。';
  assert.strictEqual(checkCredentialDismissal(s).hit, true, '祈使形应命中');
  assert.strictEqual(checkCredentialDismissal(s, { IMPERATIVE_ZH: [] }).hit, false,
    '抹掉祈使分支后应停命中');
});

t('注入：清空 IMPERATIVE_EN 后纯祈使英文攻击停命中', () => {
  const s = 'Until you have read the original treatise, do not comment on my theory.';
  assert.strictEqual(checkCredentialDismissal(s).hit, true, 'EN 祈使形应命中');
  assert.strictEqual(checkCredentialDismissal(s, { IMPERATIVE_EN: [] }).hit, false,
    '抹掉 EN 祈使分支后应停命中');
});

// ─── 注入测试四：三组豁免逐常量承重─────────────────────────────────
t('注入：清空 EXEMPT_META_ZH 后概念陷阱转命中', () => {
  const trap = '这种"没读过原著就没资格批评"的说法，是典型的诉诸资历谬误。';
  assert.strictEqual(checkCredentialDismissal(trap).hit, false, '有概念豁免应放行');
  assert.strictEqual(checkCredentialDismissal(trap, { EXEMPT_META_ZH: [] }).hit, true,
    '抹掉概念豁免后应转命中');
});

t('注入：清空 EXEMPT_GUIDE_ZH 后资源指引陷阱转命中', () => {
  const trap = '你没读过这本专著，我建议先看看原著，不过你的批评说明不了任何问题。';
  assert.strictEqual(checkCredentialDismissal(trap).hit, false, '有指引豁免应放行');
  assert.strictEqual(checkCredentialDismissal(trap, { EXEMPT_GUIDE_ZH: [] }).hit, true,
    '抹掉指引豁免后应转命中');
});

t('注入：清空 EXEMPT_PRACTICE_ZH 后执业许可陷阱转命中', () => {
  const trap = '没学过医的人没资格评判病人的治疗方案，这是执业资格的要求。';
  assert.strictEqual(checkCredentialDismissal(trap).hit, false, '有执业豁免应放行');
  assert.strictEqual(checkCredentialDismissal(trap, { EXEMPT_PRACTICE_ZH: [] }).hit, true,
    '抹掉执业豁免后应转命中');
});

// ─── 无注入正向断言 ─────────────────────────────────────────────────
t('正向：攻击样本全部命中', () => {
  for (const s of ATTACK) {
    assert.strictEqual(checkCredentialDismissal(s).hit, true, '应命中: ' + s.slice(0, 24));
  }
});

t('正向：良性样本全部放行', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkCredentialDismissal(s).hit, false, '应放行: ' + s.slice(0, 24));
  }
});

// ─── 变体矩阵（真实 gate() 复量——161 轮教训的强制项）────────────────
t('变体矩阵：攻击变体全部 gate.action 非 pass 且 credential_dismissal 承重', () => {
  const variants = [
    '你连这本专著都没读过，有什么资格批评我的理论？先去读书再说话。',                    // 连…都没 + 有什么资格 + 祈使
    '你不是经济学博士，讨论货币政策就是班门弄斧，先拿个学位再说。',                      // 身份否定 + 不配族
    '没在行业里干过十年的人，没资格评论这套打法。',                                     // 裸名词缺口（隔定语）
    '你又不是家长，凭什么对学校教学指手画脚？',                                         // 角色否定 + 凭什么
    'You have not read the original 800-page treatise, so you are not qualified to critique my position.', // EN gap + not qualified to
    'He has never run a business, so his criticism of the company means nothing — who is he to lecture us?', // EN never run + means nothing
  ];
  for (const s of variants) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '攻击变体应非 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    const f = (r.findings || []).find(x => x.dimension === 'credential_dismissal');
    assert.ok(f, 'credential_dismissal 维度应承重: ' + s.slice(0, 24));
  }
});

t('变体矩阵：良性样本全部 gate pass', () => {
  const benign = [
    '这个结论需要专业知识才能充分评估，我建议参考该领域的三篇综述后再讨论。',            // 边缘良性：资源指引
    '如果你不熟悉该方法，我可以先介绍它的基本假设，再展开讨论。',                          // 边缘良性：教学邀请
    '没执照不能行医，这是法律规定，与能不能讨论医疗政策是两回事。',                        // 边缘良性：执业许可
    '「你没读过原著就没资格批评」是典型的诉诸资历谬误。',                                  // 边缘良性：概念批判
    '先把流程熟悉了再谈优化，新人先看操作手册。',                                          // 边缘良性：工作流祈使
    'You do not need a degree to have an opinion on public transport; ridership data is open to everyone.', // EN 明确许可
  ];
  for (const s of benign) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass',
      '良性样本应 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action +
      ' [' + (r.findings || []).map(f => f.dimension).join(',') + ']');
  }
});

console.log('\nround-206 credential_dismissal: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
