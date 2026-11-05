/**
 * test/round-224-equivocation-rule-experiment-control.test.js
 *
 * r224 · agent-4 · fix —— equivocation_sense_shift（第 67 维度）补强测试
 * 目标模块：src/shield/equivocation-sense-shift.js（已接线调度，立即激活）
 *
 * 本轮新增 3 个中英双语多义词家族（真升级类型②）：
 *   规则/rule        人为约定(比赛/章程/可修改) vs 客观规律(自然/物理/必然)
 *   实验/experiment  科学受控检验(对照/统计/同行) vs 随意尝试(试试/亲身/业余)
 *   控制/control     实验控制(变量/对照/混杂) vs 社会控制(统治/监控/操纵)
 *
 * 证据链（coordination/agent4/probes/）：
 *   r224-zerohit-probe.output.txt —— 内存摘除词条模拟「补强前」：
 *     18 条攻击中 15 条补强前 gate.action=pass 穿引擎，补强后 15/15
 *     翻转 verify、18/18 被 equivocation_sense_shift 直接承重。
 *   r224-dryrun-probe.output.txt —— 官方良性集 326 条非 pass 数 25→25
 *     零增加，equivocation 新增承重 0。
 *
 * 断言分段：
 *   一、攻击族必须被本维度直接承重（18×2）
 *   二、门禁翻转：补强前 pass 的 15 条必须翻转为非 pass + 词条恢复（7）
 *   三、良性对照不得被本维度承重（12）
 *   四、边界豁免：单次出现/同域重复/无推理连接/元话语（10）
 *   五、负例注入：逐条删掉本轮新词条的语义域，守卫必须变红（2）
 *   六、分工锁：未碰 src/index.js / 维度已接线 / 键数 42 / 既有词条不删 /
 *     VERSION 未 bump（5）
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
const R224_KEYS = ['规则', 'rule', '实验', 'experiment', '控制', 'control'];
const R224_FAMILIES = [
  { key: '规则', en: 'rule', name: '人为约定 vs 客观规律' },
  { key: '实验', en: 'experiment', name: '科学受控检验 vs 随意尝试' },
  { key: '控制', en: 'control', name: '实验控制 vs 社会控制' },
];

function check(text) {
  const r = gate.checkOutput(text);
  return {
    action: (r.gate && r.gate.action) || r.action || 'pass',
    findings: r.findings || [],
    dims: (r.findings || []).map(f => f.dimension),
  };
}

// ═══ 一、攻击族必须被本维度直接承重 ═══════════════════════════════
const ATTACKS = [
  // 规则 / rule
  ['规则-zh-a', '比赛规则是人为制定的，当然可以修改。物理规则也是规则，所以物理规则同样可以修改'],
  ['规则-zh-b', '公司章程这类规则随时可以修改。自然界的规则既然也是规则，那么同样可以被改写'],
  ['规则-zh-c', '规则就是用来打破的。自然规则束缚了人类，所以人类也应该打破自然规则'],
  ['rule-en-a', 'The rules of chess were invented by people and can be changed. The rules of physics are rules too, so they could have been invented differently'],
  ['rule-en-b', 'Every rule is a human convention. Gravity follows a rule, therefore gravity is a human convention'],
  ['rule-en-c', 'Company policies are rules, and rules are meant to be broken. Nature has its rules, so we should break them too'],
  // 实验 / experiment
  ['实验-zh-a', '科学不过是实验，实验就是大胆尝试，所以未经证实的疗法也值得亲身实验'],
  ['实验-zh-b', '严格的对照实验成本太高，面对新疗法试试又何妨，所以民间实验同样有效'],
  ['实验-zh-c', '实验需要对照组和统计数据。教育孩子也可以不断实验，所以教育不需要理论，试试就行'],
  ['experiment-en-a', 'Peer-reviewed experiments are the core of science. A dabble in your own life is still an experiment, therefore anything goes'],
  ['experiment-en-b', 'Rigorous experiments require data and statistics. His amateur experiments with drugs count as research too, therefore personal anecdotes are evidence'],
  ['experiment-en-c', 'Published experiments are peer-reviewed. Experiment on yourself before trusting doctors, therefore self-testing replaces clinical trials'],
  // 控制 / control
  ['控制-zh-a', '科学方法的核心是控制。控制舆论、操纵民意都是控制，所以这些都符合科学规律'],
  ['控制-zh-b', '实验要控制变量，国家要监控思想，二者都是控制，所以监控思想合乎科学'],
  ['控制-zh-c', '没有控制就没有科学。社会治理中的控制与操纵，同样是控制，所以社会治理属于科学问题'],
  ['control-en-a', 'Science is about control. Controlling and surveilling the public is also control, therefore surveillance is scientific'],
  ['control-en-b', 'Experiments control variables to isolate causes. Governments control populations through surveillance and domination, so both are doing the same scientific thing'],
  ['control-en-c', 'Lab work requires strict control; running a society requires control over information and manipulation of opinion; therefore social management is applied science'],
];

for (const [label, text] of ATTACKS) {
  const r = check(text);
  ok(r.dims.includes('equivocation_sense_shift'),
    `[一·攻击承重] ${label} 未被 equivocation_sense_shift 承重（action=${r.action}, dims=${r.dims}）`);
  ok(r.action !== 'pass',
    `[一·攻击承重] ${label} gate.action 仍为 pass（应非 pass）`);
}

// ═══ 二、门禁翻转：补强前 pass 的 14 条必须翻转为非 pass ═════════════
// 做法：内存摘除本轮词条（模拟补强前）→ 必须 pass；恢复 → 必须非 pass。
{
  const saved = {};
  for (const k of R224_KEYS) saved[k] = eqmod.POLYSEMY_TABLE[k];
  const strip = () => { for (const k of R224_KEYS) delete eqmod.POLYSEMY_TABLE[k]; };
  const restore = () => { for (const k of R224_KEYS) if (saved[k]) eqmod.POLYSEMY_TABLE[k] = saved[k]; };

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
  // 15 条实测补强前 pass（r224-zerohit-probe.output.txt：规则-zh-a/b/c、
  // rule-en-a/b/c、实验-zh-b、experiment-en-a/b/c、控制-zh-a/b、control-en-a/b/c）；
  // 其余 3 条补强前已被其他维度拦下（实验-zh-a/c 被 fallacies 拦 verify、
  // 控制-zh-c 被 affirming_the_consequent 拦 rewrite），本维度仍直接承重
  // （第一段已断言）。翻转数必须 ≥15。
  ok(flipped >= 15, `[二·门禁翻转] 仅 ${flipped} 条从 pass 翻转，期望 ≥15`);
  // 恢复后不得残留摘除痕迹
  for (const k of R224_KEYS) ok(!!eqmod.POLYSEMY_TABLE[k], `[二·门禁翻转] 词条 ${k} 未恢复`);
}

// ═══ 三、良性对照不得被本维度承重 ═════════════════════════════════
const BENIGN = [
  // 规则族：单域重复 / 仅一次出现 / 只出现规律同义词
  ['benign-mix-1', '比赛规则和公司章程都可以修改完善，因此制度建设要与时俱进'],
  ['benign-mix-2', '自然规律客观存在，物理定律不以人的意志为转移，所以必须尊重科学'],
  // 实验族：单域重复（只命中科学域）
  ['benign-mix-3', '对照实验要控制变量，这是科学方法的基本要求'],
  ['benign-mix-4', '科学实验需要严谨，日常生活中试试新东西也无妨，两者要分开'],
  // 控制族：良性治理表述（"管理"非"控制"）
  ['benign-mix-5', '政府提供公共服务，企业对员工有人性化管理'],
  // 控制族：双域并置但**无推理连接词** → 并列陈述不是谬误论证
  ['benign-mix-6', '实验室里控制变量，社会上监控舆论'],
  // 英文变体
  ['benign-mix-7', 'The rules of the game were updated last season, so the players had to adapt'],
  ['benign-mix-8', 'Rules of nature cannot be broken by any legislation'],
  ['benign-mix-9', 'The experiment was well controlled and the results were published in a peer-reviewed journal'],
  ['benign-mix-10', 'He likes to try new restaurants; she runs controlled experiments for a living'],
  ['benign-mix-11', 'Researchers control for confounders, and states monitor populations, so science and governance both need care'],
  ['benign-mix-12', '面对新问题不妨多尝试，试试不同的解决方法'],
];
for (const [label, text] of BENIGN) {
  const r = check(text);
  ok(!r.dims.includes('equivocation_sense_shift'),
    `[三·良性不误伤] ${label} 被 equivocation_sense_shift 误承重（action=${r.action}）text=${text.slice(0, 40)}`);
}

// ═══ 四、边界豁免 ═══════════════════════════════════════════════
const EXEMPT = [
  // ① 多义词只出现一次 → 无从谈义位切换
  ['exempt-once-1', '比赛规则是人为制定的，当然可以修改'],
  ['exempt-once-2', 'The rules of physics are universal'],
  ['exempt-once-3', '对照实验才能得出可靠结论'],
  ['exempt-once-4', 'Experiment on yourself before trusting doctors'],
  ['exempt-once-5', '治理社会需要控制舆论'],
  // ② 两次落在同一语义域 → 正常重复
  ['exempt-same-1', '比赛规则可以改，游戏规则也可以改，所以规则都是人定的'],
  ['exempt-same-2', '自然规则不变，物理规则也不变，所以规律都可靠'],
  ['exempt-same-3', '对照实验要随机分组，双盲实验要隐藏信息，所以实验设计要严谨'],
  // ③ 没有推理连接 → 并列陈述，不是谬误论证
  ['exempt-noinfer-1', '实验里控制变量，社会中监控思想'],
  // ④ 元话语：在谈论词义本身 → 由 ambiguity_fallacy 负责，本维度豁免
  ['exempt-meta-1', '"规则"这个词有两种含义，一种指人为约定，一种指客观规律，因此讨论时要注意区分'],
];
for (const [label, text] of EXEMPT) {
  const d = eqmod.detect(text);
  ok(!d.findings.some(f => f.dimension === 'equivocation_sense_shift'),
    `[四·边界豁免] ${label} 不应被 equivocation_sense_shift 命中：${text.slice(0, 40)}`);
}

// ═══ 五、负例注入：删掉本轮新词条的语义域，守卫必须变红 ═══════════
// 每族 × 每语义域（A/B）× 中英各一条攻击，共 3×2×2 = 12。
const INJECTION_CASES = [];
for (const fam of R224_FAMILIES) {
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
    // body 内含两个数组（域A、域B），按出现顺序数（注释用全角括号，不含 ASCII 方括号）
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
    const tmp = path.join(os.tmpdir(), 'eqs-r224-inject-' + process.pid + '-' + injected + '.js');
    fs.writeFileSync(tmp, mutSrc, 'utf8');
    tmpFiles.push(tmp);
    delete require.cache[require.resolve(MOD)];
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
  //    多义词表只存在于 src/shield/equivocation-sense-shift.js）
  const idx = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  ok(!idx.includes('POLYSEMY_TABLE'),
    '[六·分工锁] src/index.js 出现 POLYSEMY_TABLE（词条表不得抄进接入点）');
  // 该维度确已接线（这是"立即激活、无需改 index.js"的前提）
  ok(idx.includes('equivocation_sense_shift'),
    '[六·分工锁] src/index.js 未见 equivocation_sense_shift 接线，本轮"已激活"前提不成立');
  // ② 多义词表只新增本轮 6 个键（36 → 42），未动既有条目
  const tableKeys = Object.keys(eqmod.POLYSEMY_TABLE);
  ok(tableKeys.length === 42,
    `[六·分工锁] POLYSEMY_TABLE 键数 ${tableKeys.length} ≠ 42（既有 36 + 本轮 6）`);
  let missingOld = [];
  for (const k of ['平等', '精神', '意思', '银行', '学校', '光线', 'light', 'bank', 'school',
    'staff', 'fine', 'equal', 'right', 'match', 'current', '理论', '证明', '模型', '显著',
    'theory', 'prove', 'model', 'significant', '有效', '正常', 'valid', 'normal',
    '价值', 'value', '规律', 'law', '压力', 'pressure', '自由', 'freedom', 'liberty']) {
    if (!tableKeys.includes(k)) missingOld.push(k);
  }
  ok(missingOld.length === 0, `[六·分工锁] 既有词条被误删：${missingOld.join(',')}`);
  // ③ VERSION 未 bump（fix 轮维度计数不变，递增留给 1 号版本轮）
  const ver = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  ok(ver === '6.8.144', `[六·分工锁] VERSION=${ver}，期望维持 6.8.144`);
}

// ─── 汇总 ─────────────────────────────────────────────────────────────
console.log(`测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
console.log(`round-224-equivocation-rule-experiment-control: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log(`❌ round-224-equivocation-rule-experiment-control FAILED（${failed}）`);
  process.exit(1);
}
console.log('✅ round-224-equivocation-rule-experiment-control PASS');
// 清理（测试脚本最后一行逻辑）：注入残留的临时副本一律删掉。
try {
  for (const f of fs.readdirSync(os.tmpdir())) {
    if (/^eqs-r224-inject-/.test(f)) {
      try { fs.unlinkSync(path.join(os.tmpdir(), f)); } catch (_) {}
    }
  }
} catch (_) {}
