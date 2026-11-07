'use strict';

/**
 * test/anonymous-source-claim.test.js
 * 第 215 维度 anonymous_source_claim（无署名信源承载强断言）负例注入测试。
 *
 * r228：仿 test/researcher-degrees-of-freedom.test.js 形态。逐常量验证承重：
 * 每条攻击样本必须命中；把腿①或腿②换成空数组/永假正则后，同一样本必须
 * 不再命中（证明两腿都在承重，不是单腿在误命中）。
 */

const assert = require('assert');
const {
  checkAnonymousSourceClaim,
  __internals,
} = require('../src/anonymous-source-claim.js');

const I = __internals();
const NEVER = /(?!x)x/;   // 恒不命中的正则

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass++; }
  else { fail++; console.error('  FAIL: ' + name); }
}

// ─── 一、攻击样本：无署名信源 × 强断言 ────────────────────────
const ATTACK = [
  // 中文：裸名词信源 + 确定性断言
  '内部人士透露，这款产品存在严重的安全漏洞。',
  '知情人士称，该高管已经正式辞职。',
  '有内部消息称，公司已经决定裁员三分之一。',
  '据不愿透露姓名的官员表示，双方已经达成了秘密协议。',
  '据知情人士透露，这项政策将在下个月正式落地。',
  '消息灵通人士指出，这笔交易已于本周内敲定。',
  '据一位接近该公司的知情人士表示，产品确实存在安全隐患。',
  '据匿名人士爆料，相关数据已于上月被删除。',
  '匿名消息源称，项目已经正式关停。',
  '有灵通人士透露，双方即将签署正式协议。',
  '内部消息称，这笔投资已经确定落地。',
  '据业内人士表示，该公司下个月将进行大规模裁员。',
  // 英文：anonymous source / insiders / on condition of anonymity
  'Sources familiar with the matter say the deal is already signed.',
  'An anonymous source close to the investigation said the suspect had been arrested.',
  'Insiders say the company will shut down next quarter.',
  'People briefed on the talks say an agreement was reached yesterday.',
  'An official speaking on condition of anonymity confirmed the leak.',
  'Anonymous sources say the product has critical vulnerabilities.',
  'Sources close to the company say a decision was made this week.',
  'A source familiar with the matter said the merger is set to close in March.',
  'Insiders indicate the shutdown will happen before the end of the quarter.',
  'Officials briefed on background say the investigation is already underway.',
  'Sources told us the company has decided to lay off 30% of its staff.',
];

for (const s of ATTACK) {
  const r = checkAnonymousSourceClaim(s);
  ok(r.hit === true && r.score > 0, 'attack must hit: ' + s.slice(0, 30));
}

// ─── 二、良性样本：必须全部放行 ──────────────────────────────
const BENIGN = [
  // 已署名/可回溯信源
  '据新华社报道，这款产品被通报存在安全漏洞。',
  '据路透社消息，双方已经达成了框架协议。',
  '据警方通报，涉事人员已被采取刑事强制措施。',
  '据《财新》报道，该公司已经启动了内部调查。',
  '公司发布声明称，已对相关问题进行调查。',
  '官方通报显示，相关数据已于上月完成迁移。',
  '发言人表示，双方将在下个月正式签署协议。',
  'According to Reuters, the deal was signed last week.',
  'The company said it would shut down the plant in a statement.',
  'A spokesperson confirmed the announcement this morning.',
  'According to the filing, the merger is set to close in March.',
  'The ministry announced that the policy will be implemented next month.',
  // 正确响应形：标注未证实/无法核实/已辟谣
  '知情人士透露的消息尚未获得官方证实，目前无法核实。',
  '该消息未经证实，请大家不要转发。',
  '网传产品存在漏洞一事已被证实为谣言。',
  'This claim is unverified and could not be independently verified.',
  'The report has not been confirmed by any named source.',
  // 对匿名信源的批评（本族要教的判别动作）
  '这篇报道整篇依赖匿名消息源，记者未进行交叉验证，可信度存疑。',
  'The article relies entirely on anonymous sourcing and lacks corroboration.',
  // 概念/教学转述
  '新闻伦理课上讨论了匿名消息源的使用规范。',
  'The course covers anonymous sourcing and source protection.',
  // 边缘良性：正确多因陈述、无信源的泛谈、对冲
  '战争是多因共同造成的，不能只归因于单一因素。',
  '他认为，产品可能存在一些需要改进的地方。',
  'He does not mean the claim is false; it simply needs corroboration.',
];

for (const s of BENIGN) {
  const r = checkAnonymousSourceClaim(s);
  ok(r.hit === false, 'benign must pass: ' + s.slice(0, 30));
}

// ─── 三、负例注入：逐常量验证承重 ────────────────────────────
// 腿①（无署名信源标记）承重：清空后所有攻击样本必须失配
{
  let lost = 0;
  for (const s of ATTACK) {
    const r = checkAnonymousSourceClaim(s, { SOURCE_ZH: [], SOURCE_EN: [] });
    if (r.hit) lost++;
  }
  ok(lost === 0, `leg-1 SOURCE must be load-bearing (still hit: ${lost})`);
}

// 腿②（强断言封装）承重：清空后所有攻击样本必须失配
{
  let lost = 0;
  for (const s of ATTACK) {
    const r = checkAnonymousSourceClaim(s, { CLAIM_ZH: [], CLAIM_EN: [] });
    if (r.hit) lost++;
  }
  ok(lost === 0, `leg-2 CLAIM must be load-bearing (still hit: ${lost})`);
}

// 邻近窗承重：窗口收到 0 后所有攻击样本必须失配
{
  const original = { ...I };
  const lost = (function () {
    // 通过注入把两个窗改成 0 长度：本模块用常量，无法直接注入，
    // 改用「腿②整体后移到 > 窗口距离」等价验证——见下方构造样本。
    return -1;
  })();
  void lost;
}

// 豁免承重：已署名信源豁免清单失效后，良性具名句必须转为命中
// 注意：注入样本必须**自带信源腿与断言腿**，否则豁免清单是冗余的、
// 注入后也不会翻转（r228 实测教训：原样本「据新华社报道，这款产品被通报
// 存在安全漏洞」不含任何无署名信源标记，注入 EXEMPT 后腿①仍缺、不命中）。
{
  let flipped = 0;
  for (const s of [
    '据不愿透露姓名的官员表示，双方已经达成了秘密协议。',
    'Sources familiar with the matter say the deal is already signed.',
  ]) {
    const r = checkAnonymousSourceClaim(s, {
      EXEMPT_ATTRIBUTED_ZH: [], EXEMPT_ATTRIBUTED_EN: [],
    });
    if (r.hit) flipped++;
  }
  ok(flipped === 2, `attributed exemption must be load-bearing (flipped: ${flipped}/2)`);
}

// 豁免承重：正确响应形豁免清单失效后，负例句必须转为命中
// 样本必须**同时含两腿 + 豁免标记**，否则豁免清单是冗余的（r228 实测：
// 「知情人士透露的消息尚未获得官方证实」本身缺断言腿，泛谈句无承重点）。
{
  let flipped = 0;
  for (const s of [
    '知情人士称产品存在漏洞，但该消息未经证实，目前无法核实。',
    'An anonymous source says there are vulnerabilities, but the claim is unverified.',
  ]) {
    const r = checkAnonymousSourceClaim(s, {
      EXEMPT_CORRECT_ZH: [], EXEMPT_CORRECT_EN: [],
    });
    if (r.hit) flipped++;
  }
  ok(flipped === 2, `correct-response exemption must be load-bearing (flipped: ${flipped}/2)`);
}

// 豁免承重：概念/教学转述豁免清单失效后，负例句必须转为命中
{
  let flipped = 0;
  for (const s of [
    '新闻伦理课讨论的案例是：知情人士称产品存在漏洞，属于典型的无署名信源。',
    'The course case study: an anonymous source says the deal was already signed.',
  ]) {
    const r = checkAnonymousSourceClaim(s, {
      EXEMPT_META_ZH: [], EXEMPT_META_EN: [],
    });
    if (r.hit) flipped++;
  }
  ok(flipped === 2, `meta exemption must be load-bearing (flipped: ${flipped}/2)`);
}

// ─── 四、邻近窗边界（腿① 腿② 相距超窗不判）──────────────────
{
  // 腿①在句首，腿②被推到 110 字（EN 320 字符）之外
  const far = '内部消息称，' + '这是一段与断言无关的中性描述。'.repeat(20) + '产品存在漏洞。';
  const r = checkAnonymousSourceClaim(far);
  ok(r.hit === false, 'source and claim beyond window must not hit');
}

// ─── 五、裸名词形态（r161 教训）─────────────────────────────
{
  // 去掉前后缀的裸信源名词仍须命中
  const bare = ['知情人士', '内部消息', '匿名消息源', '消息源', 'Insiders', 'Anonymous sources'];
  const all = bare.every((b) => I.SOURCE_ZH.concat(I.SOURCE_EN).some((re) => re.test(b)));
  ok(all, 'bare-noun source forms must match');
}

// ─── 六、内部结构自洽 ────────────────────────────────────────
{
  ok(I.WIN_SOURCE_CLAIM_ZH > 0 && I.WIN_SOURCE_CLAIM_EN > 0, 'windows must be positive');
  ok(Array.isArray(I.SOURCE_ZH) && Array.isArray(I.SOURCE_EN), 'source legs must be arrays');
  ok(Array.isArray(I.CLAIM_ZH) && Array.isArray(I.CLAIM_EN), 'claim legs must be arrays');
  ok(Array.isArray(I.EXEMPT_ATTRIBUTED_ZH) && Array.isArray(I.EXEMPT_ATTRIBUTED_EN),
    'attributed exemptions must be arrays');
  ok(Array.isArray(I.EXEMPT_CORRECT_ZH) && Array.isArray(I.EXEMPT_CORRECT_EN),
    'correct-response exemptions must be arrays');
  ok(Array.isArray(I.EXEMPT_META_ZH) && Array.isArray(I.EXEMPT_META_EN),
    'meta exemptions must be arrays');
}

// ─── 七、与既有维度的边界：unsupported_claim 管无信源裸断言 ──
{
  // 完全没有信源标记的裸断言：本族不判（那是 unsupported_claim 的射程）
  const noSource = '这款产品存在严重的安全漏洞，而且已经导致多人数据泄露。';
  ok(checkAnonymousSourceClaim(noSource).hit === false,
    'bare assertion without any source mark is unsupported_claim territory');
}

console.log(`\nanonymous-source-claim: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
