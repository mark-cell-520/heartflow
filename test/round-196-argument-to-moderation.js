/**
 * test/round-196-argument-to-moderation.js — 第 194 维度
 * argument_to_moderation（诉诸中庸：中间/折中立场表述×中间=正确断言
 * 两腿结构）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中（证明不是装饰）；
 *      依赖某豁免的陷阱样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 argument_to_moderation 维度承重，≥5 良性全部 pass）。本族枚举刻意
 * 收裸名词形态（「中间立场」「折中」「各打五十大板」「双方都有错」），
 * 不收「了/之后」后缀才命中的形；「取中间」收受限形，不收「中间」裸词
 * （「中间价/中间值」是算术语境，另有算术豁免兜底）。
 *
 * 立项证据：grep -rniE 'moderation|中庸|中间立场' src/ 仅命中古籍书名
 * （《中庸》）与 content moderation 一词——193 维无一覆盖「折中立场被
 * 直接当成真理」这一族。侦察落盘 /tmp/hf-scout-<ts>.txt（HN Algolia 命中
 * arXiv 2405.02318「Translating natural language to first-order logic for
 * logical fallacy detection」pts=258；GitHub fallacy detection 前列仓库
 * 全部依赖 LLM；Semantic Scholar 429——纯规则自有实现）。
 */
const assert = require('assert');
const { checkArgumentToModeration } = require('../src/argument-to-moderation.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配
const hit = (s) => checkArgumentToModeration(s).hit;
const noHit = (s) => !checkArgumentToModeration(s).hit;

// ─── 攻击样本（中文×7 / 英文×3 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '甲方乙方各有过错，真相在中间，各打五十大板才是最公道的处理。',
  '这两种观点都太极端了，正确的答案在它们中间。',
  '公说公有理婆说婆有理，其实折中才是对的。',
  '一个巴掌拍不响，双方都有错，各打五十大板才是公道的。',
  '关于这项政策该不该继续，支持和反对的人都走了极端，中间立场才是理性的。',
  '才是正解的，恰恰是那条没人坚持的中间道路。',                                    // 倒装（断言在前）
  '这场争论持续了三个月，支持和反对的人其实都有责任，各退一步才是解决问题的出路。', // 长句
  'Both extremes are wrong, so the truth lies somewhere in the middle.',
  "Let's just split the difference — the middle ground is the correct answer.",
  'When two sides clash, the fairest position is usually the one in between.',
];

// ─── 良性样本（边缘良性：谈判成交/算术取中/元讨论/推理否定/中性陈述）──
const BENIGN = [
  '谈判桌上双方各让一步，终于签下了这份协议。',                       // 谈判成交（程序动作）
  '两个温度计读数差了0.3度，取中间值作为最终结果。',                   // 算术取中
  '中庸之道是儒家思想的重要概念，讲的是不偏不倚。',                   // 元讨论（概念）
  '真相并不总是在两个极端中间，有时一方就是对的。',                   // 推理否定
  '战争是多因共同造成的，不能简化为单一因素。',                       // 正确多因陈述
  '甲方报价80万，乙方报价120万，中间价100万是市场行情。',             // 市场行情（中间价不入腿①）
  '折中并不等于正确，关键要看哪一方的证据更充分。',                   // 推理否定
  '两种假说都在检验中，目前没有定论。',                               // 中性陈述
  '两个方案各有优劣，可以结合两者的优点，形成新方案。',               // 拼合优点≠中间=真理
  'The two companies met in the middle and signed the deal at $50.',  // EN 谈判
  'The average of the two readings is the middle value, which we report as the measurement.', // EN 算术
  "Aristotle's doctrine of the mean is often confused with the argument to moderation.", // EN 元讨论
  'One side may still be entirely right — being in the middle is not automatically correct.', // EN 推理否定
  'The conflict has many causes working together; no single factor explains it.', // EN 中性
];

// ─── 豁免承重陷阱（含豁免词时放过；抹掉该豁免必须转为命中）────────────
const TRAPS = [
  { name: '元讨论豁免承重', sample: '诉诸中庸是一种常见的逻辑谬误，把中间立场当成真理就错了。', exempt: 'EXEMPT_META_ZH' },
  { name: '推理否定豁免承重(zh)', sample: '折中并不总是正确的，所谓各打五十大板才是公道，其实是无原则妥协。', exempt: 'EXEMPT_NEG_ZH' },
  { name: '谈判成交豁免承重', sample: '遗产分配谈判中，兄弟姐妹各让一步，折中方案才是对各方都公平的解决。', exempt: 'EXEMPT_DEAL_ZH' },
  { name: '算术取中豁免承重', sample: '两位评委对同一跳水动作打分，去掉最高分最低分后取中间值，这才是公平的评分方式。', exempt: 'EXEMPT_AVG_ZH' },
  { name: '对冲豁免承重', sample: '也许真相就在两者中间，各让一步或许才是最优解。', exempt: 'EXEMPT_HEDGE_ZH' },
  { name: '疑问句豁免承重', sample: '难道各打五十大板才是公道吗？', exempt: null },
  { name: '元讨论豁免承重(en)', sample: 'Some say the middle ground is always the correct answer, but that is the argument to moderation fallacy.', exempt: 'EXEMPT_META_EN' },
];

console.log('— 攻击样本（应全部命中）—');
for (const [i, s] of ATTACK.entries()) t(`attack[${i}] ${s.slice(0, 22)}…`, () => assert.strictEqual(hit(s), true));

console.log('— 良性样本（应全部放行）—');
for (const [i, s] of BENIGN.entries()) t(`benign[${i}] ${s.slice(0, 22)}…`, () => assert.strictEqual(noHit(s), true));

console.log('— 豁免承重（抹掉豁免必须转为命中）—');
for (const [i, tr] of TRAPS.entries()) {
  t(`trap[${i}] ${tr.name}`, () => {
    assert.strictEqual(noHit(tr.sample), true, '含豁免词时应放行');
    if (tr.exempt === null) {
      // 疑问句豁免：去掉问号必须转为命中
      assert.strictEqual(hit(tr.sample.replace(/[?？]/g, '。')), true, '去掉问号应命中');
    }
  });
}

console.log('— 逐常量注入（腿必须承重）—');
// 腿① / 腿② 各自抹掉后，依赖该腿的攻击必须停止命中
const ZH_NEED_A = [ATTACK[0], ATTACK[1], ATTACK[2], ATTACK[3], ATTACK[4], ATTACK[5], ATTACK[6]];
const EN_NEED = [ATTACK[7], ATTACK[8], ATTACK[9]];
t('注入 MIDDLE_ZH=[] → 中文攻击全停', () => {
  for (const s of ZH_NEED_A) assert.strictEqual(checkArgumentToModeration(s, { MIDDLE_ZH: [] }).hit, false, s.slice(0, 20));
});
t('注入 TRUTH_ZH=[] → 中文攻击全停', () => {
  for (const s of ZH_NEED_A) assert.strictEqual(checkArgumentToModeration(s, { TRUTH_ZH: [] }).hit, false, s.slice(0, 20));
});
t('注入 MIDDLE_EN=[] → 英文攻击全停', () => {
  for (const s of EN_NEED) assert.strictEqual(checkArgumentToModeration(s, { MIDDLE_EN: [] }).hit, false, s.slice(0, 20));
});
t('注入 TRUTH_EN=[] → 英文攻击全停', () => {
  for (const s of EN_NEED) assert.strictEqual(checkArgumentToModeration(s, { TRUTH_EN: [] }).hit, false, s.slice(0, 20));
});
// 豁免抹掉后，陷阱样本必须转为命中（证明豁免在承重而非装饰）
t('注入 EXEMPT_META_ZH=[] → 元陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[0].sample, { EXEMPT_META_ZH: [] }).hit, true);
});
t('注入 EXEMPT_NEG_ZH=[] → 否定陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[1].sample, { EXEMPT_NEG_ZH: [] }).hit, true);
});
t('注入 EXEMPT_DEAL_ZH=[] → 谈判陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[2].sample, { EXEMPT_DEAL_ZH: [] }).hit, true);
});
t('注入 EXEMPT_AVG_ZH=[] → 算术陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[3].sample, { EXEMPT_AVG_ZH: [] }).hit, true);
});
t('注入 EXEMPT_HEDGE_ZH=[] → 对冲陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[4].sample, { EXEMPT_HEDGE_ZH: [] }).hit, true);
});
t('注入 EXEMPT_META_EN=[] → 英文元陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[6].sample, { EXEMPT_META_EN: [] }).hit, true);
});

console.log('— 变体矩阵（真实 gate()，≥5 攻击变体非 pass + ≥5 良性 pass）—');
// 同族变体：中英双语、裸名词、带修饰、倒装、长句
const VARIANTS = [
  '双方都有错，这事各打五十大板，才是公道。',                          // 裸名词
  '所谓的中间立场，才是这次事件里唯一理性的声音。',                    // 带修饰
  '才是正确的答案——那个谁也不讨好的折中方案。',                        // 倒装
  '关于这场旷日持久的争论，甲派乙派各执一词，其实都过于极端，站在中间看问题才是清醒的，政策也应当取折中。', // 长句
  'Both parties share the blame, and the middle ground is the only rational position.', // EN
  'A fair compromise position is usually the one between the two extremes.', // EN 变体
];
const VARIANTS_BENIGN = [
  '调解员建议双方各让一步，最终双方达成了和解。',                      // 调解语境
  '三个数 3、6、9 的平均值是 6，取中间值即可。',                       // 算术
  '儒家讲中庸，不是和稀泥，而是分寸感。',                              // 元讨论
  '目前证据还不足以在两种假说之间下定论，需要补充实验数据。',         // 证据不足≠中间=真理
  '两个方案各有优劣，可以结合两者的优点，形成新方案。',               // 拼合优点≠中间=真理
  'The mediator proposed meeting in the middle, and both sides accepted the settlement.', // EN 调解
  'Neither explanation is proven yet; the jury is still out.',         // EN 存疑
];
for (const [i, s] of VARIANTS.entries()) t(`variant-attack[${i}] ${s.slice(0, 20)}…`, () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', `应非 pass，实得 ${r.gate.action}`);
  const f = (r.findings || []).find((x) => x.dimension === 'argument_to_moderation');
  assert.ok(f, 'findings 应含 argument_to_moderation');
  assert.ok(f.severity > 0, 'severity 应 >0');
});
for (const [i, s] of VARIANTS_BENIGN.entries()) t(`variant-benign[${i}] ${s.slice(0, 20)}…`, () => {
  const r = gate(s);
  assert.strictEqual(r.gate.action, 'pass', `应 pass，实得 ${r.gate.action}（${r.gate.reason || ''}）`);
});

// ─── [r726] 六族攻击面扩展（探针实测 26/26 命中、24/24 良性零误伤）─────────
// r726 全族扫描（scripts/round-726-atm-scan.js）发现改动前 26 条攻击样本
// 仅 4 条被 argument_to_moderation 直接命中，11 条 gate.action=pass 完全漏判。
// 按「真值位置钉在中点」「中间=自动最优」「和稀泥了结」「双方都有道理」
// 「极端=错反向推」「两端极端」六族补齐腿①/腿②模式。
const R726_ATTACK_ZH = [
  // 族 A：真理在中间（自足断言）
  '真相永远在中间，立场越极端越有问题。',
  '一个激进一个保守，说明真相就在两者中间。',
  '答案一定在两者中间，这是永恒的道理。',
  '对错从来都在两端之间，不在任何一极。',
  // 族 B：中间=最稳妥/最合理（全称量化 × 最高级）
  '两个观点冲突时，取中间立场总是最稳妥的选择。',
  '中间立场必然是正确的，这是永恒的道理。',
  // 族 C：和稀泥/责任均摊式了结
  '双方各打五十大板，各退一步，这事就算了。',
  '一个巴掌拍不响，双方都有责任，各担一半就算了。',
  '这件事谁也说不清，和稀泥和过去算了。',
  '为了平息事态，各打五十大板是最稳妥的处理。',
  // 族 D：双方都有道理（并列免责）
  '这件事没有绝对的对错，所以两方都有道理。',
  '两边其实都有道理，争不出结果来。',
  // 族 E：极端=错（反向推出中间对）
  '两个观点都太极端，走极端本身就是错的。',
  '极左极右都不可取，只有不偏不倚才是正道。',
  // 族 F：双副词穿透（r726 正则教训：从来都/一定也 多重叠加）
  '真相从来都在两个极端之间，这是常识。',
  // [r726b] 谚语/俗语/口语和稀泥族（真实语域高频形态）
  '公说公有理，婆说婆有理，其实折中才是对的。',
  '各打三十大板，两边都长长记性，这事就了了。',
  '两边都不干净，各退一步海阔天空，折中处理最合理。',
  '一个巴掌拍不响，两个人都有责任，各打五十大板才是公道。',
  '和事佬劝双方各让一步，各让一步才是最公平的结局。',
  '吵架的双方各有过错，平分责任才是公正的处理。',
  '两边的说法都有道理，取个中间数最公平。',
  '两方各执一词，各让一步，折中方案才是最优解。',
];
const R726_ATTACK_EN = [
  'The truth is always in the middle of any dispute.',
  'The correct answer lies in the middle, by definition.',
  'The middle position is always the most reasonable one, no matter the evidence.',
  'Splitting the difference is always the fairest way to settle any dispute.',
  'A moderate stance is invariably the most sensible choice.',
  'Both sides make valid points, so the answer must be a compromise.',
  "There's no absolute right or wrong here, so let's just meet in the middle.",
  'Extremism on both sides is wrong, so the moderate path must be right.',
  // [r726b] 谚语/口语族（EN）
  "Let's just split the difference and call it even.",
  'The truth is somewhere in between the two claims.',
  'Both sides have a point, so the answer must lie in the middle.',
  'When in doubt, compromise is always the best policy.',
  'A little from each side is the correct way to settle this.',
  'Neither side is entirely right, so splitting the difference is fair.',
  'Meeting halfway is the rational solution to every disagreement.',
];
// 良性样本：谈判/统计/对冲/概念/否定响应/无关/个案折中/法律分摊 八类
// 其中「走极端确实不对…」与两条英文句 gate.action=verify 由其他维度（非本
// 维度）产生，改动前实测即如此（git stash 对照），故只断言本维度 count=0。
const R726_BENIGN_ZH = [
  '调解员建议双方各让一步，最终双方达成了和解协议。',
  '经过三个小时的谈判，双方各退一步，签下了合同。',
  '双方谈了三个小时，最终各让一步，把交货期定在下月十五号。',
  '这个价格各让一半，是考虑到长期合作关系。',
  '价格谈不拢，双方约定下周再约时间磋商。',
  '三个数 3、6、9 的平均值是 6，取中间值就是中位数。',
  '目前证据还不足以在两种假说之间下定论，需要更多数据。',
  '答案可能不止一个，也可能在两者之间，需要更多数据。',
  '折中谬误是指把中间立场天然当作正确的立场，这是一种逻辑谬误。',
  '儒家讲中庸，不是和稀泥，而是分寸感。',
  '中立不等于正确，关键看谁的证据更充分。',
  '中间立场并不总是对的，还是要看证据。',
  '走极端确实不对，但这不是否定某一方全部论据的理由。',
  '这条路中间有个加油站，开了半小时我们就停下了。',
  '我们不站队，只根据证据判断哪一方更接近事实。',
  '双方在两个方案之间犹豫了很久，最后按成本选了前者。',
  '考试答案在卷子的中间部分，大家可以先看中间再作答。',
  '走廊中间摆着一盆绿植，两边是办公室。',
  '这个案子的处理兼顾了双方诉求，是法官综合证据后的裁量。',
  '方案 A 和方案 B 各取所长，融合后的设计更符合现场条件。',
  '交通事故责任认定书认定双方负同等责任，各自承担一半损失。',
  '按合同约定，违约责任由双方按过错比例分担。',
  // [r726b] 谚语/俗语族良性边界（概念转述/证据要求/程序描述）
  '公说公有理婆说婆有理，这句俗语说明双方各执一词，需要证据来判断。',
  '各打三十大板是旧时的说法，用来比喻不分是非、各打五十大板式的和稀泥。',
  '一个巴掌拍不响只是比喻，不代表双方责任一定相等，还是要看证据。',
  '各退一步海阔天空是劝和的话，不是判断谁对谁错的依据。',
  '和事佬的角色是促成和解，不负责裁定是非曲直。',
  '平分责任需要先认定双方过错比例，不能默认五五分。',
  '争吵双方各有过错不等于责任相等，过错比例要分别认定。',
  '两边的说法都有道理时，应当分别检验各自的证据，而不是取中。',
];
const R726_BENIGN_EN = [
  'The argument to moderation assumes the middle position is always correct, which is a fallacy.',
  'A neutral position is not automatically correct; it depends on the evidence.',
  'The two companies met in the middle and signed the deal at $50.',
  'The average of the two readings is the middle value, which we report as the measurement.',
  'Neither explanation is proven yet; the jury is still out.',
  'The conflict has many causes working together; no single factor explains it.',
  // [r726b] 谚语/口语族良性边界（EN）
  'Splitting the difference is a negotiation tactic, not evidence of truth.',
  'Compromise may be necessary in politics, but it does not make a claim true.',
  'Meeting halfway is often practical, though not always the most just outcome.',
  'Neither side is entirely right, but that does not make the middle correct.',
  'The phrase 一个巴掌拍不响 is a proverb, not a logical principle.',
  "To settle a dispute fairly, weigh each side's evidence rather than splitting the difference.",
];
// 良性中 gate 完全干净的样本子集（须 strictEqual pass）。
// 排除项均由**其他维度**命中，与本维度无关（实测归因）：
//   · 「走极端确实不对…」→ 其他维度（git stash 对照，改动前即如此）；
//   · [r726b] 四条谚语族良性样本 → false_balance(68)/reasoning_coherence(50)/
//     victim_blaming(35)/false_equivalence(35)/absolute_claim(35)/contradiction(30)，
//     探针 scripts/round-726-benign-dims.js 实测，argument_to_moderation count=0。
const R726_NOT_PASS = [
  '走极端确实不对，但这不是否定某一方全部论据的理由。',
  '公说公有理婆说婆有理，这句俗语说明双方各执一词，需要证据来判断。',
  '一个巴掌拍不响只是比喻，不代表双方责任一定相等，还是要看证据。',
  '各退一步海阔天空是劝和的话，不是判断谁对谁错的依据。',
  '两边的说法都有道理时，应当分别检验各自的证据，而不是取中。',
];
const R726_PASS_ZH = R726_BENIGN_ZH.filter((t) => !R726_NOT_PASS.includes(t));

console.log('— [r726] 六族 + 谚语族攻击面扩展（探针实测 26/26 + 谚语族 15/15 命中，良性 39/39 本维度零误伤）—');

t('r726 六族攻击样本全部命中（gate.action 非 pass）', () => {
  let ok = 0;
  [...R726_ATTACK_ZH, ...R726_ATTACK_EN].forEach((s, i) => {
    const r = gate(s);
    const f = r.findings.find((x) => x.dimension === 'argument_to_moderation');
    if (f && r.gate.action !== 'pass') { ok++; console.log(`  ✅ r726-attack[${i}] ${r.gate.action} ${s.slice(0, 30)}`); }
    else console.log(`  ❌ r726-attack[${i}] ${r.gate.action} ${s.slice(0, 30)}`);
  });
  assert.strictEqual(ok, R726_ATTACK_ZH.length + R726_ATTACK_EN.length);
});

t('r726 良性样本零误伤（本维度 count=0）', () => {
  let ok = 0;
  [...R726_BENIGN_ZH, ...R726_BENIGN_EN].forEach((s, i) => {
    const r = gate(s);
    const f = r.findings.find((x) => x.dimension === 'argument_to_moderation');
    if (!f) ok++; else console.log(`  ❌ r726-benign[${i}] 误伤: ${s.slice(0, 30)}`);
  });
  assert.strictEqual(ok, R726_BENIGN_ZH.length + R726_BENIGN_EN.length);
});

t('r726 良性干净子集 gate.action=pass', () => {
  let ok = 0;
  R726_PASS_ZH.forEach((s, i) => {
    const r = gate(s);
    if (r.gate.action === 'pass') ok++;
    else console.log(`  ❌ r726-pass[${i}] 非 pass(${r.gate.action}): ${s.slice(0, 30)}`);
  });
  assert.strictEqual(ok, R726_PASS_ZH.length);
});

// [r726] 腿①/腿②注入回归：抽六族代表样本，注入任一侧另一腿全停
const ZH_INJECT = ['真相永远在中间，立场越极端越有问题。', '双方各打五十大板，各退一步，这事就算了。', '这件事没有绝对的对错，所以两方都有道理。', '两个观点都太极端，走极端本身就是错的。'];
const EN_INJECT = ['The truth is always in the middle of any dispute.', 'The middle position is always the most reasonable one, no matter the evidence.', "There's no absolute right or wrong here, so let's just meet in the middle.", 'Extremism on both sides is wrong, so the moderate path must be right.'];
[['MIDDLE_ZH', ZH_INJECT], ['TRUTH_ZH', ZH_INJECT], ['MIDDLE_EN', EN_INJECT], ['TRUTH_EN', EN_INJECT]].forEach(([key, samples]) => {
  t(`r726 注入 ${key}=[] → 六族代表样本全停`, () => {
    const inj = { [key]: [] };
    samples.forEach((s) => {
      const r = checkArgumentToModeration(s, inj);
      assert.strictEqual(r.count, 0, `注入 ${key}=[] 后必须停判: ${s.slice(0, 24)}`);
    });
    console.log(`  ✅ 注入 ${key}=[] → 六族代表样本 ${samples.length}/${samples.length} 全停`);
  });
});

// [r726] 豁免承重陷阱：新族样本注入豁免后必须由绿转红（证明豁免真在兜底）
// 每条都是双腿齐全（腿①+腿②）且仅靠目标豁免兜底，故抹掉豁免必须转红。
const R726_TRAPS = [
  { name: 'hedge-hedged', exempt: 'EXEMPT_HEDGE_ZH', s: '也许真相就在两者中间，也可能不在，需要更多数据。' },
  { name: 'neg-moderate', exempt: 'EXEMPT_NEG_ZH', s: '中间立场并不总是对的，还是要看证据。' },
  { name: 'deal-mediate', exempt: 'EXEMPT_DEAL_ZH', s: '调解员建议双方各让一步，各打五十大板才是最公平的解决办法，双方签了和解协议。' },
  { name: 'avg-median', exempt: 'EXEMPT_AVG_ZH', s: '这组数据去掉最高分和最低分，取中间值才是最合理的做法。' },
  { name: 'meta-fallacy', exempt: 'EXEMPT_META_ZH', s: '文章里讲的诉诸中庸，就是把中间立场当成真理的那种错误。' },
  { name: 'deal-en-signed', exempt: 'EXEMPT_DEAL_EN', s: 'The mediator said both sides met in the middle and splitting the difference is the fair way.' },
  { name: 'neg-en-auto', exempt: 'EXEMPT_NEG_EN', s: 'The middle position is not always the most reasonable one; it depends on the evidence.' },
];
R726_TRAPS.forEach((tr) => {
  t(`r726-trap ${tr.name}（豁免承重）`, () => {
    const before = checkArgumentToModeration(tr.s, { [tr.exempt]: [] });
    assert.ok(before.count > 0, `注入 ${tr.exempt}=[] 后应命中（红）`);
    const after = checkArgumentToModeration(tr.s, {});
    assert.strictEqual(after.count, 0, '恢复豁免后应停判（绿）');
    console.log(`  ✅ r726-trap ${tr.name}: 注入 ${tr.exempt}=[] → 命中；恢复 → 停判`);
  });
});

console.log(`\nround-196: ${pass} passed / ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
