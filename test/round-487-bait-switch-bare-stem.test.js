/**
 * test/round-487-bait-switch-bare-stem.test.js
 *
 * r487 — bait_switch（第299维 provisional）全新措辞家族：**裸诱饵短句族**
 * 已有维度（r486 已加载 + r486/r487 插件层已 dispatch）的新措辞家族补全（真升级②）。
 *
 * 家族定义：诱饵条件与事后变更**都退化为裸名词/裸动词短句**，无完整谓语句——
 *   · 裸诱饵：「说好的价格」「原来的报价」「免费把他吸引过来」「advertised as
 *     all-inclusive」——诱饵以名词短语/过去分词在场，不带「低价/承诺」等
 *     显式诱饵动词，也不带 ORIGINAL 族的「最初的/原来的 + 名词」完整形；
 *   · 裸变更：「付了钱就不算数了」「签了约之后就单方面改了」「the extras
 *     appeared after checkout」——变更以「动词+了/之后」或「名词+appeared」
 *     的紧缩形在场。
 * 双腿 AND 同窗共现才命中；单腿不判。
 *
 * 探针来源：coordination/agent4/probes/r487-takeover-verify.js（独立复验
 * 实测攻击 6/12 穿透、后缀剥离 0/3 命中——存量腿只认带修饰形，裸短句族整族漏）。
 * TDD：先写本测试（红），后补实现（绿）。
 */
'use strict';

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const modPath = path.join(HF, 'src', 'bait-switch.js');

module.exports = function ({ test }) {
  let mod = null;
  try { mod = require(modPath); } catch (_) { mod = null; }
  const check = mod && mod.checkBaitSwitch;

  // ── A：裸诱饵短句族攻击（ZH 6 + EN 4）──
  const attacksZH = [
    '说好的价格，付了钱就不算数了。',
    '原来谈好的分成比例，签了约之后就单方面改了。',
    '先把好处给足，等人上船了再改规则。',
    '谈的时候满口答应，等对方辞了职再变卦。',
    '一开始承诺全包，等项目进场后才说材料另算。',
    '免费把他吸引过来，等他上船了再告诉他还有后续费用。',
  ];
  const attacksEN = [
    'Advertised as all-inclusive; the extras appeared after checkout.',
    'Hook them with the free tier, then change the terms once they cannot migrate.',
    'The price was quoted low to win the deal, and the real cost surfaced only after they had signed.',
    'They are locked into the platform now; the new charges are introduced afterwards.',
  ];

  // ── B：良性（8，含该族边缘良性）──
  const benign = [
    '合同变更必须双方书面确认，任何口头调整都不作数。',
    '价格调整提前三十天通知，用户可随时退订。',
    'The listing said furnished, and the furnishing was indeed included.',
    'The platform charges a flat monthly fee, and every feature is included.',
    'Once users have invested in learning the tool, switching costs rise — a documented retention effect.',
    '登门槛效应与低球战术是两种不同的说服技术，前者先小后大，后者先优后改。',
    'Lowballing is a classic compliance tactic studied by Cialdini.',
    '我信任他们对报价的解释，所以按原条款签了约。',
  ];

  // ── C：裸形长句（诱饵/变更均以裸形出现在长句中）──
  const longForm = [
    '先用一份漂亮的条款把合作意向锁死，等对方按照这个版本备齐了团队和预算、真正启动之后，我们再以市场情况变化为由逐条修改，而对方考虑到前期已经投入的人力与资金，最终只能接受这个对自己明显不利的新版本。',
    '他之所以忍下这口气，是因为我们前期已经让他投入太多，这会儿改条件他也下不了船。',
    'The initial terms were generous; once he had resigned we revised the duties entirely.',
    'Initially we quoted a low price, and after the deposit was paid the real charges appeared.',
  ];

  // ── D：单腿不判 ──
  const oneLeg = [
    '落地阶段实际情况发生变化，我们按合同条款与对方重新协商了交付范围。',
    '我们给出了市场上最有竞争力的报价，全部费用明细已写明。',
    'I would rather not change the terms at all.',
  ];

  // ── E：后缀剥离自查（裸名词形剥离条件后缀后仍应命中）──
  // 后缀剥离自查：把「条件/条款」等名词后缀从原样本剥离后，诱饵与变更两段
  // 分别以裸形共现仍应命中（证明腿匹配不依赖名词后缀在场）。
  const bareStems = [
    '先用免费把他吸引过来，等他上船了再收费。',
    '先答应他提出的条件，等项目启动后再逐个加码。',
    '说好的价格，付了钱就不算数。',
    'Quote a low price, then the extras appeared after checkout.',
    'Advertised as all-inclusive, and the charges appeared afterwards.',
  ];

  test('A0 模块存在且导出 checkBaitSwitch', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在');
    if (typeof check !== 'function') throw new Error('checkBaitSwitch 未导出');
  });

  test('A1 裸诱饵短句族 ZH 6/6 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = attacksZH.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A2 裸诱饵短句族 EN 4/4 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = attacksEN.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('B1 良性 8/8 零误伤', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const fp = benign.filter(t => check(t).hit === true);
    if (fp.length) throw new Error('FP ' + fp.length + ': ' + fp[0]);
  });

  test('C1 裸形长句 4/4 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = longForm.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('D1 单腿不判 3/3', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const fp = oneLeg.filter(t => check(t).hit === true);
    if (fp.length) throw new Error('LEG-FP ' + fp.length + ': ' + fp[0]);
  });

  test('E1 后缀剥离 5/5 仍命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = bareStems.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('strip-miss ' + miss.length + ': ' + miss[0]);
  });

  // ── F：负例注入证明新腿承重（摘除新族常量后裸短句族全不命中）──
  test('F1 负例注入：新腿摘除后裸短句族不命中（承重证明）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const K = mod.__internals();
    // 摘除裸诱饵腿（BARE_BAIT_ZH/EN）与裸变更腿（BARE_SWITCH_ZH/EN）。
    // 各腿在源串中的位置不同：BAIT_ZH 的 BARE 支后还有 ORIGINAL_EN/BARE_BAIT_EN
    // 两支（摘除后须补回），BAIT_EN 的 BARE 支在末位且存量末支自带闭合（不补），
    // SWITCH_ZH/EN 的 BARE 支在末位但组未闭合（须补 ')'）。
    const inj = {
      BAIT_ZH: new RegExp(K.BAIT_ZH.source.split('|' + K.BARE_BAIT_ZH.source)[0]
        + '|' + K.ORIGINAL_EN.source + '|' + K.BARE_BAIT_EN.source),
      BAIT_EN: new RegExp(K.BAIT_EN.source.split('|' + K.BARE_BAIT_EN.source)[0], 'i'),
      SWITCH_ZH: new RegExp(K.SWITCH_ZH.source.split('|' + K.BARE_SWITCH_ZH.source)[0] + ')'),
      SWITCH_EN: new RegExp(K.SWITCH_EN.source.split('|' + K.BARE_SWITCH_EN.source)[0] + ')', 'i'),
    };
    // 只保留「新腿独有」样本（存量腿 A/B 实测不覆盖的裸短句形）
    const newLegOnly = [
      '说好的价格，付了钱就不算数了。',
      '原来谈好的分成比例，签了约之后就单方面改了。',
      'Advertised as all-inclusive; the extras appeared after checkout.',
      '先把好处给足，等人上船了再改规则。',
    ];
    const still = newLegOnly.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('新腿不承重 ' + still.length + ': ' + still[0]);
    // 反向：不摘除时全命中（排除假阴性）
    const base = newLegOnly.filter(t => check(t).hit !== true);
    if (base.length) throw new Error('baseline miss: ' + base[0]);
    // 存量能力不因摘除误伤（legacy 族仍全命中）
    const legacy = [
      '先用一个很低的报价把他吸引过来，等他上船了再告诉你还有后续费用。',
      'Promise the terms to get the signature, then change them once he has resigned.',
    ];
    const lg = legacy.filter(t => check(t, inj).hit !== true);
    if (lg.length) throw new Error('摘除误伤存量 ' + lg.length + ': ' + lg[0]);
  });
};
