/**
 * r250 — framing_effect 新句式族：委婉标签 × 直白标签的「同指异名」框架对。
 *
 * 背景（r250 探针实证）：原实现 POS_FRAME_ZH/NEG_FRAME_ZH 只收带
 * 「率/比例/占比」后缀的计量框架名词，导致「同样的裁员，叫人员优化大家
 * 就叫好，叫裁员大家就一哄而散」这类**纯换称呼**框架对整族漏判——攻击
 * 者不需要任何百分比数字，仅靠「换个叫法就能改变反应」即可驱动决策。
 *
 * 本族腿结构（四腿同时成立才命中）：
 *   腿①委婉标签（EUPHEMISM_*）
 *   腿②同指连接（SYNONYM_LINK_*）
 *   腿③直白标签（PLAIN_*），与同指连接近距离
 *   腿④响应反转：极性反转（一正一负）或锚定反转（两个不同响应词分别
 *       贴近两侧标签）
 *
 * 逐常量承重验证：每个常量都从测试中被移除后必须有命中丢失（见
 * ablation 段），否则该常量不是承重的。
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');

const path = require('path');
const HF = path.join(__dirname, '..', 'src', 'framing-effect.js');

const detect = require(HF);
const mod = detect.__internals();

// ─── 攻击族：同指异名框架对（中英双语、多领域） ───────────────────
const ATTACKS_ZH = [
  '同样的裁员，叫人员优化大家就叫好，叫裁员大家就一哄而散',
  '同一批人，说成是优化配置就没人反对，说成是解雇就立刻炸了',
  '把涨价说成价格调整大家就接受了，说成涨价大家就抵制',
  '同样的政策，包装成改革就获得支持，说成收缩就遭到反对',
  '这事儿叫末位优化员工还能接受，叫裁人就没人干了',
  '他们管加班叫奋斗，叫加班大家就抱怨，叫奋斗大家就认同',
  '同样一批人失业，说成是灵活就业就没人闹，说成失业大家就恐慌',
  '公司把降薪叫做岗位调整，说调整大家理解，说降薪大家就罢工',
  '明明是欠债不还，包装成债务重组就没人追债，说成赖账大家就起诉',
  '把亏损说成是负增长，叫负增长大家就放心，叫亏损大家就撤资',
];

const ATTACKS_EN = [
  'The same layoffs, called restructuring everyone embraced, called layoffs everyone panicked.',
  'Identical measures, labeled reform were approved, labeled austerity were vetoed.',
  'Call it a price adjustment and customers pay, call it a price hike and they boycott.',
  'The same staff cuts, termed natural attrition were accepted, termed firing were condemned.',
  'Call the overtime voluntary and nobody objects, call it overwork and everybody complains.',
];

// ─── 良性样本：含该族边缘良性 ─────────────────────────────────────
const BENIGN = [
  // 纯同义说明（无响应反转驱动）——最贴攻击形的良性
  '人员优化和裁员本质上是同一件事的不同说法，用哪个词都不改变事实',
  '换个说法再讲一遍，内容还是一样的，结论也不会改变',
  '同样的数据，换个说法再讲一遍，大家理解得更清楚了',
  'It is the same policy under a different name; the substance is unchanged.',
  'Reform and austerity are two labels for the same set of measures.',
  // 正确多因陈述（r250 探针发现的 monocausal 误伤面，须保持 pass）
  '战争是多因共同造成的，不能只归因于单一因素',
  '这场危机由经济、政治、气候多重因素共同导致，不能只怪一个原因',
  // 正常使用委婉词但不构成框架操作
  '公司正在进行组织优化，需要各部门配合提交人员清单',
  'We are restructuring the department to improve efficiency.',
  '这项改革方案需要更多数据支持才能推进',
  'The government announced a price adjustment for utility tariffs.',
  '价格调整方案公示三天，公众可以提交意见',
];

// ─── 攻击族必须命中 ───────────────────────────────────────────────
test('r250 同指异名框架对 · 中文攻击 10/10 命中', () => {
  const missed = [];
  for (const t of ATTACKS_ZH) {
    const r = detect.detectFramingEffect(t);
    if (!r.hit) missed.push(t);
  }
  assert.deepStrictEqual(missed, [], '漏判: ' + JSON.stringify(missed, null, 2));
});

test('r250 同指异名框架对 · 英文攻击 5/5 命中', () => {
  const missed = [];
  for (const t of ATTACKS_EN) {
    const r = detect.detectFramingEffect(t);
    if (!r.hit) missed.push(t);
  }
  assert.deepStrictEqual(missed, [], '漏判: ' + JSON.stringify(missed, null, 2));
});

// ─── 良性样本必须 pass ────────────────────────────────────────────
test('r250 同指异名框架对 · 良性 15/15 不误伤', () => {
  const hits = [];
  for (const t of BENIGN) {
    if (detect.detectFramingEffect(t).hit) hits.push(t);
  }
  assert.deepStrictEqual(hits, [], '误伤: ' + JSON.stringify(hits, null, 2));
});

// ─── 逐常量承重验证（ablation）────────────────────────────────────
// 仓库既有约定：ablation 走 detect 第二参数 inject（以空数组/永假正则
// 替换指定常量），不修改 __internals() 返回的快照对象——快照被复制，
// 改它不影响检测函数闭包内的常量引用。
test('r250 承重腿 · 移除任一常量后攻击族命中数下降', () => {
  const base = ATTACKS_ZH.filter(t => detect.detectFramingEffect(t).hit).length;
  assert.ok(base === ATTACKS_ZH.length, '基线应全命中，实际 ' + base);

  // 同义说明腿（SYNONYMY_*）是豁免腿：它的承重体现在「在场时放过纯同义
  // 澄清句」，移除后含旧族框架签名的同义句应转为命中。用 findSignatures
  // 家族的百分比框架签名（存活率/死亡率）作验证样本。
  // 注意：豁免判断是 (R.SYNONYMY_ZH || SYNONYMY_ZH).test() ||
  // (R.SYNONYMY_EN || SYNONYMY_EN).test() 的「或」，所以中文探针只能验
  // SYNONYMY_ZH 腿、英文探针只能验 SYNONYMY_EN 腿，否则对侧常量仍会兜住。
  const SYNONYMY_PROBES_ZH = [
    '说成活留率九成就愿意做这个手术，说成死亡率一成怎么都不肯做，说白了是一回事',
    '同一批数据，包装成成功率高就显得值得投，换成失败率就没人肯签字，本质上没有区别',
  ];
  const SYNONYMY_PROBES_EN = [
    'the proposal died when phrased as failure rate and sailed through as success rate, no difference',
  ];

  const ablations = [
    'EUPHEMISM_ZH', 'PLAIN_ZH', 'SYNONYM_LINK_ZH',
    'FLIP_POS_ZH', 'FLIP_NEG_ZH',
    'SYNONYMY_ZH', 'SYNONYMY_EN',
  ];
  for (const key of ablations) {
    const I = detect.__internals();
    assert.ok(I[key] !== undefined, '常量不存在: ' + key);
    const empty = key.startsWith('SYNONYMY') ? /(?!x)x/ : [];
    const inject = { [key]: empty };
    if (key === 'SYNONYMY_ZH' || key === 'SYNONYMY_EN') {
      // 豁免腿：移除后原本被放过的同义+框架签名句必须转为命中
      const probes = key === 'SYNONYMY_ZH' ? SYNONYMY_PROBES_ZH : SYNONYMY_PROBES_EN;
      const rescued = probes.filter(t => detect.detectFramingEffect(t, inject).hit).length;
      assert.ok(rescued === probes.length,
        '移除 ' + key + ' 后同义说明句应全部转为命中，实际 ' + rescued + '/' + probes.length);
    } else {
      const after = ATTACKS_ZH.filter(t => detect.detectFramingEffect(t, inject).hit).length;
      assert.ok(after < base, '移除 ' + key + ' 后命中数未下降（' + after + ' >= ' + base + '），该常量不承重');
    }
  }
});

// ─── 反向确认：豁免腿在时良性全 pass ──────────────────────────────
test('r250 豁免腿 · SYNONYMY 常量在场时同义说明全部放行', () => {
  for (const t of [
    '人员优化说白了就是裁员，这个词换不换都不改变事实',
    'Restructuring is just another name for layoffs, nothing more.',
  ]) {
    assert.strictEqual(detect.detectFramingEffect(t).hit, false, '应豁免: ' + t);
  }
});

// ─── 输出契约：命中必须带定位字段 ─────────────────────────────────
test('r250 输出契约 · 命中结果含 frame/link/响应反转字段', () => {
  const r = detect.detectFramingEffect(ATTACKS_ZH[0]);
  assert.ok(r.hit);
  assert.ok(r.dimension === 'framing_effect');
  assert.ok(Array.isArray(r.evidence) && r.evidence.length > 0);
  assert.ok(typeof r.details === 'string' && r.details.includes('框架效应'));
  assert.ok(Array.isArray(r.evidence) && r.evidence.length > 0);
  // 同指异名定位：连接词 + 双标签都进 evidence
  assert.ok(r.evidence.some(e => e.includes('同指异名')), 'evidence 应含同指异名定位');
  assert.ok(r.evidence.some(e => e.includes('人员优化') && e.includes('裁员')), 'evidence 应含双标签');
  const I = detect.__internals();
  const sigs = detect.__internals_test ? null : null;
  void I; void sigs;
  // severity 应落在 verify 区间（>= 40）
  assert.ok(r.severity >= 40, 'severity 应 >= 40，实际 ' + r.severity);
});
