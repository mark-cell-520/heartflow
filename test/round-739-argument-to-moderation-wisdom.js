/**
 * test/round-739-argument-to-moderation-wisdom.js — 第 739 轮
 * dim 194 argument_to_moderation 智慧族/明明族修复 + 误伤边界收窄。
 *
 * 立项证据（r739 探针复测，scripts/tmp-probe-r739-pool.js 23 断言 +
 * tmp-probe-r739-variants.js 34 断言全绿后落正式测试）：
 *   A. leg2「智慧」谓词族 5/5 漏判——「折中才是智慧」「中间立场是智慧的
 *      做法」「中庸才是大智慧」「各打五十大板才是最智慧的处理」「和稀泥
 *      是处世智慧」全 PASS。智慧=把取中动作当作明智性依据，与正确/合理/
 *      稳妥/明智同族。
 *   B. leg1/leg2 副词表缺「明明」——「结论明明在两者之间」漏判（MIDDLE_ZH
 *      与 TRUTH_ZH 174 双腿副词表须同源补词，r726 同源模式）。
 *   C. ZH 俗语腿缺「骑墙」「一碗水端平」——两族裸俗语漏判。
 *   D. EN 智慧族缺主语/谓词——「A middle position is always the wisest
 *      approach」缺 a middle 冠词形腿①；「The middle path is the wise
 *      option」缺 path/road 名词；「Compromise is the wise choice」缺
 *      compromise 主语腿②。
 *   E. 误伤收窄——「这个中间方案最稳妥，因为成本最低」（个案推荐，有具体
 *      成本理由、无全称量化）被 leg1 裸名词「中间方案」× leg2「最稳妥」
 *      双腿误伤。移除裸名词表「选项|方案」，显式断言形（143/153）不受影响。
 *
 * 守三件事：
 *   一、正向：本轮 5 族攻击变体全部命中、良性/豁免样本全部放行。
 *   二、承重：注入变异（清空 TRUTH_ZH/MIDDLE_ZH 谓词与副词）后攻击停判。
 *   三、回归：r196 存量攻击锚点 + round-196 测试口径不击穿。
 */
'use strict';
const assert = require('assert');
const { checkArgumentToModeration, __internals } = require('../src/argument-to-moderation.js');
const { gate } = require('../src/gate.js');
const { HeartFlow } = require('../src/core/heartflow.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const hit = (s) => checkArgumentToModeration(s).hit;
const noHit = (s) => !checkArgumentToModeration(s).hit;
const I = __internals();

// ═══ A 腿：leg2 智慧谓词族（ZH 12 变体）═════════════════════════════════
const WISDOM_ZH = [
  '折中才是智慧',                                        // 裸才是+智慧
  '折中才是大智慧',                                      // 副词间隙（大）
  '折中是最智慧的选择',                                  // 最高级+尾部名词
  '中间立场是智慧的做法',                                // 是+智慧断言
  '中庸才是大智慧',                                      // 中庸主语
  '各打五十大板才是最智慧的处理',                        // 俗语主语+最智慧+尾部
  '各打五十大板是智慧的处理方式',                        // 俗语主语+是智慧+方式
  '和稀泥是处世智慧',                                    // 和稀泥主语+间隙谓词
  '和稀泥才是生存智慧',                                  // 才是+生存智慧
  '骑墙是最智慧的处世之道',                              // 骑墙俗语（r739 新补腿①）
  '一碗水端平才是智慧',                                  // 一碗水端平俗语（新补腿①）
  '走中间路线是一种智慧',                                // 走中间路线
];

// ═══ B 腿：明明族（leg1+leg2 副词表同源补词）4 变体 ═══════════════════════
const MINGMING = [
  '结论明明在两者之间',
  '真相明明就在两极中间',
  '对错明明在双方之间',
  '答案明明在两者之间',
];

// ═══ C 腿：EN 智慧族 5 变体 ════════════════════════════════════════════════
const WISDOM_EN = [
  'The middle ground is the wisest course of action here.',
  'Compromise is the wise choice when both sides are extreme.',
  'Splitting the difference is the sensible thing to do.',
  'A middle position is always the wisest approach.',
  'The middle path is the wise option in this dispute.',
];

// ═══ D 腿：良性/豁免边界（误伤防护 + 豁免优先）16 变体 ════════════════════
const BENIGN = [
  // 智慧的非谬误用法（无 leg1 中间俗语命中）
  '他用智慧化解了这场冲突',
  '这是一个很智慧的决策',
  '她为人处世很有智慧',
  '老祖宗的智慧值得我们学习',
  '这个算法很明智地选择了中间值',
  'The wise thing to do is check the logs first.',
  'A wise engineer validates assumptions before shipping.',
  'She is the wisest person on the team.',
  // 明明非强度限定用法
  '明明是中间那个人传的话',
  '明显的中间层设计降低了耦合',
  // 中间/折中的非断言语境
  '走中间路线可以避开两边的雷区',
  '两边各让一步，谈判才算完成',
  '调解员建议双方各退一步',
  '取中间值可以平滑异常数据',
  '这家公司的中间件架构很稳定',
  'The middle value of the dataset is 42.',
  'A middle manager reported the issue to the director.',
  // 豁免优先（设计内行为）
  '取中间值才是最智慧的选择',   // AVG 豁免：算术语境优先
  '折中主义才是智慧的结晶',     // meta 豁免：主义概念转述优先
];

// ═══ E 腿：误伤收窄（r739 前误伤，修复后放行）4 变体 ════════════════════
const FIXED_FALSE_POSITIVE = [
  '这个中间方案最稳妥，因为成本最低',                  // 个案推荐（具体理由）
  '这个中间方案最合理，可以兼顾双方诉求',              // 个案推荐
  '中间选项是稳妥的做法，但还要看数据',                // 条件性推荐
  '这个中间方案才是对双方都公平的，因为证据对称',      // 显式断言形？——不，含「这个」个案限定
];

// ═══ F 腿：存量攻击锚点回归（r196/r726 承重样本不可击穿）6 变体 ══════════
const LEGACY_ATTACK = [
  '甲方乙方各有过错，真相在中间，各打五十大板才是最公道的处理。',
  '这两种观点都太极端了，正确的答案在它们中间。',
  '公说公有理婆说婆有理，其实折中才是对的。',
  '关于这项政策该不该继续，支持和反对的人都走了极端，中间立场才是理性的。',
  '真相永远在两者之间，立场越极端越有问题。',
  '双方各打五十大板，各退一步，这事就算了',
];

// ─── 正向断言 ────────────────────────────────────────────────────────────
for (const s of WISDOM_ZH) t(`智慧族命中: ${s}`, () => assert.ok(hit(s), '应命中'));
for (const s of MINGMING) t(`明明族命中: ${s}`, () => assert.ok(hit(s), '应命中'));
for (const s of WISDOM_EN) t(`EN智慧族命中: ${s}`, () => assert.ok(hit(s), '应命中'));
for (const s of BENIGN) t(`良性放行: ${s}`, () => assert.ok(noHit(s), '应放行'));
for (const s of FIXED_FALSE_POSITIVE) t(`误伤修复: ${s}`, () => assert.ok(noHit(s), '应放行'));
for (const s of LEGACY_ATTACK) t(`存量锚点: ${s.slice(0, 18)}…`, () => assert.ok(hit(s), '应继续命中'));

// ─── gate() 层复量（≥5 攻击变体 action 非 pass 且维度承重）────────────────
t('gate层: 智慧族攻击全部 verify+', () => {
  for (const s of WISDOM_ZH.slice(0, 6)) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', s + ' gate.action=pass');
    assert.ok(r.findings.some(f => f.dimension === 'argument_to_moderation'), s + ' 维度未承重');
  }
});
t('gate层: 误伤修复样本 atm 维度不承重', () => {
  for (const s of FIXED_FALSE_POSITIVE) {
    const r = gate(s);
    assert.ok(!r.findings.some(f => f.dimension === 'argument_to_moderation'),
      s + ' atm 维度误承重');
    // 注：gate.action 可能因 confidence 维度（最高级表述提示）为 verify，
    // 那是 confidence 维度职责（见 r738 confidence 元话语修复），非本维度误伤。
  }
});
t('gate层: EN 智慧族攻击非 pass', () => {
  const r = gate('Compromise is the wise choice when both sides are extreme.');
  assert.notStrictEqual(r.gate.action, 'pass');
  assert.ok(r.findings.some(f => f.dimension === 'argument_to_moderation'));
});

// ─── 承重注入（负例语义：变异后攻击必须停判）────────────────────────────
t('承重: TRUTH_ZH 清空后智慧族停判', () => {
  const inj = checkArgumentToModeration('折中才是智慧', { TRUTH_ZH: [] });
  assert.ok(!inj.hit, 'TRUTH_ZH 置空后仍命中——谓词腿不承重');
});
t('承重: MIDDLE_ZH 清空后智慧族停判', () => {
  const inj = checkArgumentToModeration('折中才是智慧', { MIDDLE_ZH: [] });
  assert.ok(!inj.hit, 'MIDDLE_ZH 置空后仍命中——俗语腿不承重');
});
t('承重: TRUTH_ZH 清空后明明族停判', () => {
  const inj = checkArgumentToModeration('结论明明在两者之间', { TRUTH_ZH: [] });
  assert.ok(!inj.hit, 'TRUTH_ZH 置空后明明族仍命中');
});
t('承重: MIDDLE_ZH 清空后明明族停判', () => {
  const inj = checkArgumentToModeration('结论明明在两者之间', { MIDDLE_ZH: [] });
  assert.ok(!inj.hit, 'MIDDLE_ZH 置空后明明族仍命中');
});
t('承重: TRUTH_EN 清空后 EN 智慧族停判', () => {
  const inj = checkArgumentToModeration('Compromise is the wise choice when both sides are extreme.', { TRUTH_EN: [] });
  assert.ok(!inj.hit, 'TRUTH_EN 置空后 EN 智慧族仍命中');
});
t('承重: MIDDLE_EN 清空后 EN 智慧族停判', () => {
  const inj = checkArgumentToModeration('A middle position is always the wisest approach.', { MIDDLE_EN: [] });
  assert.ok(!inj.hit, 'MIDDLE_EN 置空后 EN 智慧族仍命中');
});

// ─── 词表同源断言（防未来补词只补一条腿）────────────────────────────────
t('同源: MIDDLE_ZH 与 TRUTH_ZH 副词表均含「明明」', () => {
  const mid = I.MIDDLE_ZH.map(String).join('\n');
  const tru = I.TRUTH_ZH.map(String).join('\n');
  assert.ok(/明明/.test(mid), 'MIDDLE_ZH 缺明明');
  assert.ok(/明明/.test(tru), 'TRUTH_ZH 缺明明');
});
t('同源: 智慧谓词在 TRUTH_ZH 四条腿均在场', () => {
  const tru = I.TRUTH_ZH.map(String).join('\n');
  const count = (tru.match(/智慧/g) || []).length;
  assert.ok(count >= 4, 'TRUTH_ZH 智慧谓词腿数不足: ' + count);
});
t('同源: MIDDLE_ZH 含骑墙/一碗水端平', () => {
  const mid = I.MIDDLE_ZH.map(String).join('\n');
  assert.ok(/骑墙/.test(mid), 'MIDDLE_ZH 缺骑墙');
  assert.ok(/一碗水端平/.test(mid), 'MIDDLE_ZH 缺一碗水端平');
});
t('同源: MIDDLE_EN 含 a middle 冠词形', () => {
  const mid = I.MIDDLE_EN.map(String).join('\n');
  assert.ok(/a middle/.test(mid), 'MIDDLE_EN 缺 a middle 形');
});
t('边界: MIDDLE_ZH 裸名词表已移除「方案|选项」', () => {
  const first = String(I.MIDDLE_ZH[0]);
  assert.ok(!/方案|选项/.test(first), '裸名词表仍含方案/选项——误伤回归');
});

// ─── 接线断言（src/index.js 九处接入点抽查）─────────────────────────────
const idxSrc = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'index.js'), 'utf8');
t('接线: index.js 调用 checkArgumentToModeration', () => {
  assert.ok(/checkArgumentToModeration\(/.test(idxSrc), 'index.js 未调用');
});
t('接线: index.js 维度名 argument_to_moderation 参与判定', () => {
  assert.ok(/name:'argument_to_moderation'/.test(idxSrc), '维度名未接线');
  assert.ok(/argument_to_moderation: atm/.test(idxSrc), 'atm 未挂判定');
});

console.log(`\nround-739 智慧族修复: ${pass} passed / ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
