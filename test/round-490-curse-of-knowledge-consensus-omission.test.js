/**
 * test/round-490-curse-of-knowledge-consensus-omission.test.js
 *
 * r490 — curse_of_knowledge（第294维 provisional）四个全新措辞家族
 * 真升级类型②：已有维度的全新措辞家族（不是旧族更多样本）。
 *
 * 家族定义（r490 探针实测缺口，探针文件 /tmp/hf-r490-probe-cok.js）：
 *   存量 CONSENSUS_ZH / COLLAPSE_ZH / CONSENSUS_EN / COLLAPSE_EN
 *   （r479/r480 六轮补形）只覆盖「受众同专业认定 + 术语在场」形
 *   （学过…的人都懂/做这行的都熟悉/anyone familiar with/every
 *   econometrics student knows）与「显式坍缩动词」形（不用展开/
 *   不赘述/skip the derivation/no explanation needed）。r490 探针
 *   用 32 条全新独立样本实测：攻击 32/32 穿透（gate.action 全
 *   pass、模块 hit 全 false）、良性 0/10 误伤。四族：
 *
 *   A 专业共识断言族（腿①新形）——共识以**学界裁定/同行认可**断言，
 *     不带任何「学过/做过/圈内」受众认定形，也不带术语宾语：
 *     「学界早有定论」「同行评议早就认可」「内行看门道」「干过这行
 *     的都门儿清」。
 *   B 内部共识省略族（腿①新形）——共识以**组织内部共享**断言：
 *     「我们内部都懂」「团队里心知肚明」「不言而喻」「省掉铺垫」。
 *   C 听众无需知悉族（腿①新形）——共识以**受众素养足够**断言：
 *     「以对方的水平」「读者都是专家」「科普段落纯属多余」「入门
 *     介绍是浪费时间」。
 *   D EN consensus-omission（双腿新形）——established consensus in
 *     the field / common knowledge among peers / the audience is
 *     expert enough / the readership is specialist，配 skip the
 *     background entirely / the primer is unnecessary / I omitted
 *     the recap 等坍缩腿。
 *
 * 双腿 AND 契约不变：新共识腿 × 坍缩腿同在场才判，缺一不判。
 * TDD：先写本测试（红：新族常量未导出、样本穿透），后补实现（绿）。
 */
'use strict';

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const modPath = path.join(HF, 'src', 'curse-of-knowledge.js');

module.exports = function ({ test }) {
  let mod = null;
  try { mod = require(modPath); } catch (_) { mod = null; }
  const check = mod && mod.checkCurseOfKnowledge;

  // ── A：专业共识断言族（学界裁定/同行认可形）ZH 8 + EN 3 ──
  const A_ZH = [
    '这是专业共识，行内人一看就明白，我不用从头讲起。',
    '圈内人都知道这个结论，不需要我再科普一遍。',
    '做这行的都清楚这个原理，我解释起来反而显得啰嗦。',
    '懂行的自然懂，这份报告写给同行看，背景部分全部略过。',
    '这个结论在学界早有定论，懂的人不需要论证过程。',
    '内行看门道，这个数据背后的逻辑不用我多说什么。',
    '同行评议早就认可了，我把推导过程整段删掉了。',
    '干过这行的都门儿清，细节我就不展开了。',
  ];
  const A_EN = [
    'This is established consensus in the field, so I will skip the background entirely.',
    'It is common knowledge among peers, so no elaboration is required.',
    'The finding is settled science in the discipline, so the recap is omitted.',
  ];

  // ── B：内部共识省略族 ZH 8 + EN 2 ──
  const B_ZH = [
    '我们内部都懂这个流程，客户那边就不用展开讲了。',
    '团队里大家都心知肚明，这块背景交代就免了。',
    '我们自己人清楚这套规则，对外说明书写得极简。',
    '组内共识已经形成，方案说明里不再重复理由。',
    '老员工都门儿清，培训材料砍掉了基础章节。',
    '内部沟通过程高度默契，很多前提默认大家都知道。',
    '这层意思在我们团队是不言而喻的，写出来反而见外。',
    '部门内人人都熟悉这个口径，汇报时我省掉了铺垫。',
  ];
  const B_EN = [
    'Our team shares this understanding implicitly, so the memo leaves it unstated.',
    'The committee already knows the method, so I left the recap out.',
  ];

  // ── C：听众无需知悉族 ZH 8 + EN 3 ──
  const C_ZH = [
    '以对方的水平，这个问题根本不需要解释。',
    '读者都是专家，基础概念我一个字都不写。',
    '目标受众本就熟悉这套理论，科普段落纯属多余。',
    '给同行评审看的，行业常识部分全部删除。',
    '听众的素养足够高，入门介绍是浪费时间。',
    '他们圈子的常识，我要是再讲一遍就是侮辱智商。',
    '专业读者不需要铺垫，我直接从公式开始讲。',
    '评审专家对这套方法了如指掌，背景回顾全省。',
  ];
  const C_EN = [
    'The audience is expert enough that the introductory chapter adds nothing.',
    'The readership is specialist, so the basic primer would be redundant.',
    'Practitioners take this for granted, so I removed the derivation.',
  ];

  // ── D：良性（10，含该族边缘良性）──
  const BENIGN = [
    // 边缘良性：正确多因陈述（非本族）
    '战争的起因是多因共同造成的，把责任推给单一方并不符合史实。',
    // 边缘良性：正确受众适配（承诺展开/补定义，非坍缩）
    '教学上我会先讲背景再讲公式，因为学生的基础参差不齐。',
    '面向公众的科普文章需要从基本概念讲起，不能假设读者有专业背景。',
    '这份材料同时供内部与外部使用，所以保留了一章通用背景介绍。',
    '受众不同确实需要调整详略，但我们仍保留了核心概念的定义。',
    '科普写作的底线是不跳过前提，否则读者无法验证结论。',
    '报告附了术语表，方便非专业读者对照查阅。',
    // 良性 EN：显式保留入门章节
    'I keep the introductory section because part of the audience is non-specialist.',
    'For a general readership the derivation is included in an appendix.',
  ];

  // ── E：单腿不判（新共识腿在场但无坍缩腿）──
  const ONE_LEG = [
    '这是专业共识，我先把公式从头推导一遍再谈应用。',
    '我们内部都懂这个流程，但对外说明书写的是完整版。',
    '读者都是专家，不过我还是把基础概念列在附录里。',
    'This is established consensus in the field, and the appendix derives it from scratch.',
    'The audience is expert enough, yet we keep the primer for completeness.',
  ];

  test('A0 模块存在且导出 checkCurseOfKnowledge', () => {
    if (!mod) throw new Error('src/curse-of-knowledge.js 不存在');
    if (typeof check !== 'function') throw new Error('checkCurseOfKnowledge 未导出');
  });

  test('A1 专业共识断言族 ZH 8/8 命中', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const miss = A_ZH.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A2 专业共识断言族 EN 3/3 命中', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const miss = A_EN.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A3 内部共识省略族 ZH 8/8 命中', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const miss = B_ZH.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A4 内部共识省略族 EN 2/2 命中', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const miss = B_EN.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A5 听众无需知悉族 ZH 8/8 命中', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const miss = C_ZH.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A6 听众无需知悉族 EN 3/3 命中', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const miss = C_EN.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('B1 良性 10/10 零误伤', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const fp = BENIGN.filter(t => check(t).hit === true);
    if (fp.length) throw new Error('FP ' + fp.length + ': ' + fp[0]);
  });

  test('C1 单腿不判 5/5（新共识腿无坍缩腿不命中）', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const fp = ONE_LEG.filter(t => check(t).hit === true);
    if (fp.length) throw new Error('LEG-FP ' + fp.length + ': ' + fp[0]);
  });

  test('D1 负例注入：新共识腿常量未导出即 TDD 红', () => {
    if (!mod || typeof mod.__internals !== 'function') {
      throw new Error('__internals 未导出（实现未落）');
    }
    const K = mod.__internals();
    // r490 四族新常量：A 专业共识断言 / B 内部共识省略 / C 听众无需知悉 / D EN 共识省略
    const need = ['CONSENSUS_ZH3', 'CONSENSUS_ZH4', 'CONSENSUS_ZH5', 'CONSENSUS_EN3'];
    const missing = need.filter(k => !K[k]);
    if (missing.length) throw new Error('新族常量未导出: ' + missing.join(','));
  });

  test('D2 负例注入：A 族共识腿摘除后 A 族样本失配（承重证明）', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const K = mod.__internals();
    if (!K.CONSENSUS_ZH3) throw new Error('CONSENSUS_ZH3 未导出（实现未落）');
    const never = '(?!x)x';
    // [r491 修 harness bug] CONSENSUS_ZH 与 CONSENSUS_ZH3 都是 RegExp **数组**，
    // 且 collect() 要求注入是数组（传单条 RegExp 会 'list is not iterable'）。
    // 原写法 K.CONSENSUS_ZH.source / K.CONSENSUS_ZH3.source 双双 undefined，
    // split(undefined) 崩溃。正确做法：数组过滤剔除 A 族同源条。
    const stripLegs = (base, drops) => {
      const dropSrc = new Set(drops.map(l => l.source));
      return base.filter(l => !dropSrc.has(l.source));
    };
    const inj = {
      CONSENSUS_ZH: stripLegs(K.CONSENSUS_ZH, K.CONSENSUS_ZH3),
    };
    // 只断言「共识只由 A 族新腿供给」的样本（存量学过/做过/圈内形不覆盖）
    const exclusiveA = [
      '这是专业共识，行内人一看就明白，我不用从头讲起。',
      '这个结论在学界早有定论，懂的人不需要论证过程。',
      '同行评议早就认可了，我把推导过程整段删掉了。',
      '干过这行的都门儿清，细节我就不展开了。',
    ];
    const lost = exclusiveA.filter(t => check(t, inj).hit !== true);
    if (lost.length !== exclusiveA.length) {
      throw new Error('A 族共识腿不承重 ' + (exclusiveA.length - lost.length) + '/' + exclusiveA.length);
    }
    // 反向 baseline
    const base = exclusiveA.filter(t => check(t).hit !== true);
    if (base.length) throw new Error('baseline miss: ' + base[0]);
  });

  test('D3 负例注入：存量能力不因摘除误伤', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const K = mod.__internals();
    if (!K.CONSENSUS_ZH3 || !K.CONSENSUS_ZH4 || !K.CONSENSUS_ZH5) {
      throw new Error('新族常量未导出');
    }
    const never = '(?!x)x';
    // [r491 修 harness bug] 同 D2：collect() 要数组注入，strip 改数组过滤
    const stripLegs = (base, drops) => {
      const dropSrc = new Set(drops.map(l => l.source));
      return base.filter(l => !dropSrc.has(l.source));
    };
    const inj = {
      CONSENSUS_ZH: stripLegs(K.CONSENSUS_ZH, [].concat(K.CONSENSUS_ZH3, K.CONSENSUS_ZH4, K.CONSENSUS_ZH5)),
    };
    // r479/r480 存量族（学过…的人都懂 / 做这行的都熟悉 / 一听就明白）必须仍命中
    const legacy = [
      '这个结论但凡学过随机过程的人都懂，不用展开。',
      '细节见规范第 3.2 节，做这行的都熟悉，不赘述。',
      '这属于常识性问题，圈内人不需要我再解释一遍。',
      '简单说就是贝叶斯后验被先验带跑了，你肯定一听就明白。',
    ];
    const lg = legacy.filter(t => check(t, inj).hit !== true);
    if (lg.length) throw new Error('摘除误伤存量 ' + lg.length + ': ' + lg[0]);
  });

  test('D4 负例注入：EN 共识腿摘除后 EN 新族失配（承重证明）', () => {
    if (!check) throw new Error('checkCurseOfKnowledge 未实现');
    const K = mod.__internals();
    if (!K.CONSENSUS_EN3) throw new Error('CONSENSUS_EN3 未导出（实现未落）');
    const never = '(?!x)x';
    // [r491 修 harness bug] 同 D2：collect() 要数组注入，strip 改数组过滤
    const stripLegs = (base, drops) => {
      const dropSrc = new Set(drops.map(l => l.source));
      return base.filter(l => !dropSrc.has(l.source));
    };
    const inj = {
      CONSENSUS_EN: stripLegs(K.CONSENSUS_EN, K.CONSENSUS_EN3),
    };
    // EN 新族中「共识只由新腿供给」的样本（存量 anyone familiar with /
    // everyone in this field 形不覆盖）。
    // [r491 修订] 原 D4-1 样本 'This is established consensus in the field' 的
    // 共识腿被存量 EN[15]（\bin (this|our|the) (circle|field|community|…)）覆盖，
    // 摘除 EN3 后仍命中——不是新腿独有。换为 settled science within our
    // discipline（存量腿不覆盖），保持 4/4 断言的严格度。
    const exclusiveEN = [
      'This is settled science within our discipline, so the derivation is omitted.',
      'It is common knowledge among peers, so no elaboration is required.',
      'The audience is expert enough that the introductory chapter adds nothing.',
      'The readership is specialist, so the basic primer would be redundant.',
    ];
    const lost = exclusiveEN.filter(t => check(t, inj).hit !== true);
    if (lost.length !== exclusiveEN.length) {
      throw new Error('EN 共识腿不承重 ' + (exclusiveEN.length - lost.length) + '/' + exclusiveEN.length);
    }
    const base = exclusiveEN.filter(t => check(t).hit !== true);
    if (base.length) throw new Error('baseline miss: ' + base[0]);
  });
};
