/**
 * test/round-223-equivocation-value-law-pressure-freedom.test.js
 *
 * r223 · agent-4 · fix —— equivocation_sense_shift（第 67 维度）补强测试
 * 目标模块：src/shield/equivocation-sense-shift.js（已接线调度，立即激活）
 *
 * 本轮新增 4 个中英双语多义词家族（真升级类型②）：
 *   价值/value   交换价值(价格/报酬/市场) vs 效用与伦理价值(福利/公益/尊严)
 *   规律/law     自然法则(进化/重力/必然) vs 社会规则(法律/制度/立法)
 *   压力/pressure 物理压强(液体/帕斯卡/深度) vs 心理压力(情绪/焦虑/职场)
 *   自由/freedom 消极自由(免于强制/干涉) vs 积极自由(能力/资源/实质)
 *   （另加 liberty：与 freedom 同义位结构的 EN 高频替换词）
 *
 * 证据链（coordination/agent4/probes/）：
 *   r223-zerohit-probe.output.txt —— 内存摘除词条模拟「补强前」：
 *     17 条攻击中 9 条 gate.action=pass 完全穿引擎；补强后 17/17 被
 *     equivocation_sense_shift 直接承重、9 条翻转为 verify。
 *   r223-dryrun-probe.output.txt —— 官方良性集 326 条非 pass 数 25→25 零增加。
 *
 * 断言分段：
 *   一、攻击族必须被本维度直接承重（17）
 *   二、门禁翻转：补强前 pass 的 9 条必须翻转为非 pass（9）
 *   三、良性对照不得被本维度承重（含易误伤形）（12）
 *   四、边界豁免：单义位重复/仅一次出现/无推理连接/元话语（10）
 *   五、负例注入：逐条删掉本轮新词条的语义域，守卫必须变红（18）
 *   六、分工锁：未碰 src/index.js / 未 bump VERSION / 维度计数不变（3）
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const eqmod = require(path.join(ROOT, 'src', 'shield', 'equivocation-sense-shift.js'));

// ─── 断言计数器（对齐 run-all.js 可解析的汇总格式）──────────────────
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('  ❌ ' + msg); }
}

// ─── 本轮新增词条键（负例注入与分工锁用）────────────────────────────
const R223_KEYS = ['价值', 'value', '规律', 'law', '压力', 'pressure', '自由', 'freedom', 'liberty'];
const R223_FAMILIES = [
  { key: '价值', en: 'value', name: '交换价值 vs 效用/伦理价值' },
  { key: '规律', en: 'law', name: '自然法则 vs 社会规则' },
  { key: '压力', en: 'pressure', name: '物理压强 vs 心理压力' },
  { key: '自由', en: 'freedom', name: '消极自由 vs 积极自由' },
];

function check(text) {
  const r = gate.checkOutput(text);
  return {
    action: (r.gate && r.gate.action) || r.action || 'pass',
    findings: r.findings || [],
    dims: (r.findings || []).map(f => f.dimension),
  };
}
function eqCarries(text) {
  return check(text).dims.includes('equivocation_sense_shift');
}

// ═══ 一、攻击族必须被本维度直接承重 ═══════════════════════════════
const ATTACKS = [
  // 价值 / value
  ['价值-zh-a', '商品的交换价值由市场供需和定价决定。志愿劳动没有市场报酬，因此志愿劳动没有价值'],
  ['价值-zh-b', '薪酬水平反映一个人创造的价值。社区义工不拿薪酬，所以义工没有创造价值'],
  ['价值-zh-c', '一样东西的价值就是它的价格。亲情和尊严都不标价，所以它们没有价值'],
  ['value-en-a', 'Market value is set by supply and demand. Volunteer work has no market price, so volunteer work has no value'],
  ['value-en-b', 'Salary reflects the value a person creates. Volunteering pays nothing, so volunteering creates no value'],
  // 规律 / law
  ['规律-zh-a', '自然选择是生物进化的客观规律。社会中的法律也是一种规律，因此法律也应当优胜劣汰'],
  ['规律-zh-b', '优胜劣汰是自然界的规律。市场竞争也遵循同一条规律，所以不需要法律对弱者施加保护'],
  ['law-en-a', 'Natural selection is a law of biology. Laws in human society are laws too, so society should let the weak perish'],
  ['law-en-b', 'Gravity is a law of nature that nobody can break. The criminal law is also a law, so nobody can break that either'],
  // 压力 / pressure
  ['压力-zh-a', '液体的压强随深度增加，遵循帕斯卡定律。员工的心理压力也随层级深化而增加，所以心理压力遵循同一条定律'],
  ['压力-zh-b', '气体压力可以用仪表直接测量。职场压力也可以用问卷测量，所以职场压力同样是一个物理量'],
  ['pressure-en-a', 'Pressure in a liquid rises with depth in pascals. Pressure on employees also rises with hierarchy, so workplace pressure follows the same law'],
  ['pressure-en-b', 'Gas pressure is measured with a gauge. Workplace pressure is measured with a questionnaire, so workplace pressure is a physical quantity too'],
  // 自由 / freedom / liberty
  ['自由-zh-a', '自由就是免于外部强制。他因为贫穷无法出国，所以他不自由'],
  ['自由-zh-b', '消极自由意味着没有人干涉你。他没有资源创业，因此他毫无自由'],
  ['freedom-en-a', 'Freedom means absence of coercion. He cannot afford to travel abroad, so he has no freedom at all'],
  ['freedom-en-b', 'Negative liberty means nobody interferes with you. He has no resources to start a business, therefore he has no liberty'],
];

for (const [label, text] of ATTACKS) {
  const r = check(text);
  ok(r.dims.includes('equivocation_sense_shift'),
    `[一·攻击承重] ${label} 未被 equivocation_sense_shift 承重（action=${r.action}, dims=${r.dims}）`);
  ok(r.action !== 'pass',
    `[一·攻击承重] ${label} gate.action 仍为 pass（应非 pass）`);
}

// ═══ 二、门禁翻转：补强前 pass 的 9 条必须翻转为非 pass ═════════════
// 做法：内存摘除本轮词条（模拟补强前）→ 必须 pass；恢复 → 必须非 pass。
{
  const saved = {};
  for (const k of R223_KEYS) saved[k] = eqmod.POLYSEMY_TABLE[k];
  const strip = () => { for (const k of R223_KEYS) delete eqmod.POLYSEMY_TABLE[k]; };
  const restore = () => { for (const k of R223_KEYS) if (saved[k]) eqmod.POLYSEMY_TABLE[k] = saved[k]; };

  let flipped = 0;
  for (const [label, text] of ATTACKS) {
    strip();
    const before = check(text);
    restore();
    const after = check(text);
    if (before.action === 'pass' && after.action !== 'pass' && after.dims.includes('equivocation_sense_shift')) {
      flipped++;
    }
  }
  // 9 条实测补强前 pass（规律-zh-b / 压力-zh-a / 自由-zh-a/b / value-en-b /
  // law-en-a/b / freedom-en-a/b）；其余 8 条补强前已被其他维度拦下（verify/rewrite），
  // 本维度仍直接承重（第一段已断言）。翻转数必须 ≥9。
  ok(flipped >= 9, `[二·门禁翻转] 仅 ${flipped} 条从 pass 翻转，期望 ≥9`);
  // 恢复后不得残留摘除痕迹
  for (const k of R223_KEYS) ok(!!eqmod.POLYSEMY_TABLE[k], `[二·门禁翻转] 词条 ${k} 未恢复`);
}

// ═══ 三、良性对照不得被本维度承重 ═════════════════════════════════
const BENIGN = [
  // 合法双义共现（明确说"不能混为一谈"）——不是谬误论证
  ['benign-mix-1', '这件商品的价格由市场决定，它的艺术价值则需要另作评估，两者不能混为一谈'],
  ['benign-mix-2', 'Salary is one thing, the social value of the work is another; we evaluate both separately'],
  // 两类概念并置讨论（学科/课程语境，无推理连接或仅单义）
  ['benign-mix-3', '法律面前人人平等，自然规律则不以人的意志为转移，这是两个不同的概念'],
  ['benign-mix-4', '他既关注员工的心理压力，也关心管道的物理压强，两方面都做了检测'],
  ['benign-mix-5', '物理课上学过压强公式，心理咨询师关心的是人的情绪压力，两者不能互相替代'],
  // 概念区分本身（哲学讨论）——元话语豁免或单义重复
  ['benign-mix-6', '我们要区分消极自由与积极自由，这是伯林提出的经典区分'],
  // 风险/不确定性讨论（本轮未收 risk 族，应保持 pass）
  ['benign-mix-7', '投资有风险，入市需谨慎；而创业的不确定性更高，需要不同的评估方法'],
  // 价值一词单义重复（只命中单一域）
  ['benign-single-1', '他高度重视人的生命价值和尊严，因此反对任何形式的金钱交易'],
  ['benign-single-2', '市场价格由供需决定，价格围绕价值波动，这是经济学的基本原理'],
  ['benign-single-3', '压力管理是现代职场的重要课题，学会缓解压力有助于心理健康'],
  ['benign-single-4', ' freedom of speech is a fundamental right, and protecting freedom of the press matters just as much'],
  // 中英混排、修饰、倒装变体（不得误伤）
  ['benign-zh-mixed', '企业在市场中交换商品、赚取报酬；同时它也承担公益责任，这两件事并不矛盾'],
];
for (const [label, text] of BENIGN) {
  const r = check(text);
  ok(!r.dims.includes('equivocation_sense_shift'),
    `[三·良性不误伤] ${label} 被 equivocation_sense_shift 误承重（action=${r.action}）text=${text.slice(0, 40)}`);
}

// ═══ 四、边界豁免 ═══════════════════════════════════════════════
const EXEMPT = [
  // ① 多义词只出现一次 → 无从谈义位切换
  ['exempt-once-1', '志愿劳动没有市场报酬，因此它不产生任何价值'],
  ['exempt-once-2', 'He cannot afford to travel abroad, so he lacks freedom'],
  ['exempt-once-3', '自然选择是生物进化的客观规律'],
  ['exempt-once-4', '员工的心理压力随层级深化而增加'],
  // ② 两次落在同一语义域 → 正常重复
  ['exempt-same-1', '商品的价格反映它的价值，售价围绕价值波动，因此定价要参考市场行情'],
  ['exempt-same-2', 'He values market price and salary, so exchange value is all that matters to him'],
  ['exempt-same-3', '液体内部的压强随深度增加，气体压强也随之变化，因此压强都遵循帕斯卡定律'],
  ['exempt-same-4', '消极自由就是免于强制，没有人干涉你就是自由的，所以自由意味着外部约束不存在'],
  // ③ 没有推理连接 → 并列陈述，不是谬误论证
  ['exempt-noinfer-1', '市场决定价格，伦理关乎尊严，物理研究压强，心理咨询处理情绪'],
  // ④ 元话语：在谈论词义本身 → 由 ambiguity_fallacy 负责，本维度豁免
  ['exempt-meta-1', '"价值"这个词有多种含义，既有价格层面的也有伦理层面的，因此讨论时要注意'],
  ['exempt-meta-2', 'The term freedom has multiple meanings, negative and positive liberty, therefore we must be careful'],
];
for (const [label, text] of EXEMPT) {
  const d = eqmod.detect(text);
  ok(!d.findings.some(f => f.dimension === 'equivocation_sense_shift'),
    `[四·边界豁免] ${label} 不应被 equivocation_sense_shift 命中：${text.slice(0, 40)}`);
}

// ═══ 五、负例注入：删掉本轮新词条的语义域，守卫必须变红 ═══════════
// 每族 × 每语义域（A/B）× 中英各一条攻击，共 4×2×2 = 16，加 liberty 一条 = 17。
const INJECTION_CASES = [];
for (const fam of R223_FAMILIES) {
  for (const domain of ['A', 'B']) {
    for (const lang of ['zh', 'en']) {
      const key = lang === 'zh' ? fam.key : fam.en;
      const atk = ATTACKS.find(([l]) =>
        (lang === 'zh' && l.startsWith(fam.key)) || (lang === 'en' && l.startsWith(fam.en)));
      if (!atk) continue;
      INJECTION_CASES.push({ key, domain, label: atk[0], text: atk[1] });
    }
  }
}
// liberty 单独一条（与 freedom 同结构）
INJECTION_CASES.push({ key: 'liberty', domain: 'A', label: 'freedom-en-b', text: ATTACKS.find(([l]) => l === 'freedom-en-b')[1] });
INJECTION_CASES.push({ key: 'liberty', domain: 'B', label: 'freedom-en-b', text: ATTACKS.find(([l]) => l === 'freedom-en-b')[1] });

{
  const MOD = path.join(ROOT, 'src', 'shield', 'equivocation-sense-shift.js');
  const SRC = fs.readFileSync(MOD, 'utf8');

  // 在临时副本上删除指定词条的指定语义域数组（整块替换为空数组）
  function mutatedSource(key, domain) {
    // 定位 'key': [ ... ], 块，再把第 domain 个数组清空
    const re = new RegExp("('" + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "':\\s*\\[)([\\s\\S]*?)(\\n  \\],)", 'm');
    const m = SRC.match(re);
    if (!m) return null;
    const body = m[2];
    // body 内含两个数组（域A、域B），按出现顺序数
    const arrs = [...body.matchAll(/\[[^\]]*\]/g)];
    if (arrs.length < 2) return null;
    const target = arrs[domain === 'A' ? 0 : 1];
    const emptied = body.slice(0, target.index) + '[]' + body.slice(target.index + target[0].length);
    return SRC.slice(0, m.index) + m[1] + emptied + m[3] + SRC.slice(m.index + m[0].length);
  }

  let injected = 0, reddened = 0;
  const notRed = [];
  const tmpFiles = [];
  for (const c of INJECTION_CASES) {
    const mutSrc = mutatedSource(c.key, c.domain);
    if (mutSrc === null) { notRed.push(c.label + '/' + c.key + '/' + c.domain + '(源码定位失败)'); continue; }
    // 写临时副本、清缓存、重新 require
    const tmp = path.join(os.tmpdir(), 'eqs-r223-inject-' + process.pid + '-' + injected + '.js');
    fs.writeFileSync(tmp, mutSrc, 'utf8');
    tmpFiles.push(tmp);
    delete require.cache[require.resolve(MOD)];
    // 用临时副本路径 require（gate 内部按固定路径加载，故直接测模块 detect）
    const mutmod = require(tmp);
    const d = mutmod.detect(c.text);
    injected++;
    const stillHits = d.findings.some(f => f.dimension === 'equivocation_sense_shift');
    if (!stillHits) reddened++;
    else notRed.push(c.label + '/' + c.key + '/' + c.domain);
    fs.unlinkSync(tmp);
    delete require.cache[require.resolve(MOD)];
    // 恢复真实模块缓存
    require(MOD);
  }
  ok(injected === INJECTION_CASES.length, `[五·注入] 注入计数 ${injected} ≠ ${INJECTION_CASES.length}`);
  ok(reddened === injected,
    `[五·注入] 注入 ${injected} 个，仅 ${reddened} 个变红；未变红：${notRed.join(', ')}`);
  // 清理残留临时副本
  for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch (_) {} }
}

// ═══ 六、分工锁 ═════════════════════════════════════════════════
{
  // ① 未在 src/index.js 硬编码多义词表（本轮为已激活维度的词条补强，
  //    多义词表只存在于 src/shield/equivocation-sense-shift.js，
  //    若有人把词条抄进接入点即视为越界改引擎）
  const idx = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  ok(!idx.includes('POLYSEMY_TABLE'),
    '[六·分工锁] src/index.js 出现 POLYSEMY_TABLE（词条表不得抄进接入点）');
  // 该维度确已接线（这是"立即激活、无需改 index.js"的前提）
  ok(idx.includes('equivocation_sense_shift'),
    '[六·分工锁] src/index.js 未见 equivocation_sense_shift 接线，本轮"已激活"前提不成立');
  // ② 多义词表只新增本轮 9 个键（27 → 36），未动既有条目
  const tableKeys = Object.keys(eqmod.POLYSEMY_TABLE);
  ok(tableKeys.length === 36,
    `[六·分工锁] POLYSEMY_TABLE 键数 ${tableKeys.length} ≠ 36（既有 27 + 本轮 9）`);
  let missingOld = [];
  for (const k of ['平等', '精神', '意思', '银行', '学校', '光线', 'light', 'bank', 'school',
    'staff', 'fine', 'equal', 'right', 'match', 'current', '理论', '证明', '模型', '显著',
    'theory', 'prove', 'model', 'significant', '有效', '正常', 'valid', 'normal']) {
    if (!tableKeys.includes(k)) missingOld.push(k);
  }
  ok(missingOld.length === 0, `[六·分工锁] 既有词条被误删：${missingOld.join(',')}`);
  // ③ VERSION 未 bump（fix 轮维度计数不变，递增留给 1 号版本轮）
  const ver = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  ok(ver === '6.8.144', `[六·分工锁] VERSION=${ver}，期望维持 6.8.144`);
}

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log(`测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
console.log(`round-223-equivocation-value-law-pressure-freedom: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log(`❌ round-223-equivocation-value-law-pressure-freedom FAILED（${failed}）`);
  process.exit(1);
}
console.log('✅ round-223-equivocation-value-law-pressure-freedom PASS');
// 清理（测试脚本最后一行逻辑）：注入残留的临时副本一律删掉。
try {
  for (const f of fs.readdirSync(os.tmpdir())) {
    if (/^eqs-r223-inject-/.test(f)) {
      try { fs.unlinkSync(path.join(os.tmpdir(), f)); } catch (_) {}
    }
  }
} catch (_) {}
