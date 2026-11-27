/**
 * test/round-487-bait-switch-nominal-family.test.js
 *
 * r487 — takeover r486 掉线 WIP 后的真升级②：
 * bait_switch（第299维 provisional）的全新措辞家族——名词化诱饵族 /
 * 变更近义族（不作数/不算数/单方面改）/ EN 时点名词族（after checkout）/
 * 被动受害族（忍下这口气/被套牢）。
 *
 * 缺口来源：coordination/agent4/probes/r487-takeover-verify.js 独立复验
 * （12 条全新攻击样本 6 条穿透、后缀剥离 3/3 MISS、良性 10/10 零误伤）。
 *
 * 格式：module.exports = function({test}){...}
 */
'use strict';

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';

module.exports = function ({ test }) {
  const modPath = path.join(HF, 'src', 'bait-switch.js');
  let mod = null;
  try { mod = require(modPath); } catch (_) { mod = null; }
  const check = mod && mod.checkBaitSwitch;

  // ── A：名词化诱饵族（无显式诱饵动词，诱饵以「好处/甜头/条款/分成」名词在场）──
  // r487 修复：'Hook them with the free tier, then change the terms once they
  // cannot migrate.' 移出本族——它由**存量腿**命中（BAIT_EN 的 free +
  // SWITCH_EN 的 then change），不是新腿独有形，放进 D1 承重集会失效
  // （其命中能力已由 r486 attacksEN 与 bare-stem A2 覆盖）。
  const familyNominal = [
    '先把好处给足，等人上船了再改规则。',
    '先用一份漂亮的条款把合作意向锁死，等对方按照这个版本备齐了团队和预算、真正启动之后，我们再以市场情况变化为由逐条修改，而对方考虑到前期已经投入的人力与资金，最终只能接受这个对自己明显不利的新版本。',
    '原来谈好的分成比例，签了约之后就单方面改了。',
  ];

  // ── B：变更近义族（不作数/不算数/翻脸不认/单方面改/矢口）──
  // r487 修复：'当初答应好的条件，如今翻脸不认，单方面改成另一套。' 移出
  // D1 承重集——它由存量腿命中（BAIT_ZH 的 答应 + SWITCH_ZH 的 改成），
  // 非新腿独有形（A2 命中能力本身不变，仍在该族断言集中）。
  const familyRenegade = [
    '说好的价格，付了钱就不算数了。',
    '他之所以忍下这口气，是因为我们前期已经让他投入太多，这会儿改条件他也下不了船。',
  ];

  // ── C：EN 时点名词族（after checkout / after signup / after booking）──
  const familyEnTiming = [
    'Advertised as all-inclusive; the extras appeared after checkout.',
    'The offer looked complete at signup, and the real fees appeared after the booking.',
  ];

  // ── D：后缀剥离自查（裸名词/短句形仍须命中）──
  // r487 修复：原三条（先把好处给足 / 说好的价格 / 原来谈好的分成比例）是
  // **单腿句**——只有腿①诱饵在场、无腿②变更，按模块自身契约（双腿 AND
  // 同窗共现才命中；单腿不判，见 src/bait-switch.js 头部与 C1/C2 负例）
  // 判 switch_only 是正确行为，把它们当「必须命中」是测试自身缺陷。
  // 改为双腿剥离形：诱饵与变更各以裸形共现，证明匹配不依赖完整谓语句。
  // （双腿剥离能力已由 round-487-bait-switch-bare-stem.test.js E1 覆盖，
  //  此处保留同族断言防止本族回退。）
  const stripped = [
    '说好的价格，付了钱就不算数',
    '先把好处给足，等上船了再改规则',
    '原来谈好的分成比例，签约后就单方面改',
  ];

  // ── E：良性（含边缘良性：合规变更/披露充分/已投入正常陈述/概念评析）──
  const benign = [
    '合同变更必须双方书面确认，任何口头调整都不作数。',
    '价格调整提前三十天通知，用户可随时退订。',
    'Once users have invested in learning the tool, switching costs rise — a documented retention effect.',
    'The platform charges a flat monthly fee, and every feature is included.',
    '登门槛效应与低球战术是两种不同的说服技术，前者先小后大，后者先优后改。',
    'Lowballing is a classic compliance tactic studied by Cialdini.',
    '分成比例按合同约定执行，双方每季度对账一次。',
    'The free tier is genuinely free; no charges appear at any point.',
    '好处与风险都写在明面上，用户可以自行判断后决定。',
    'If the quoted price changes, we tell them before they pay.',
  ];

  test('A0 模块存在且导出 checkBaitSwitch', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在（TDD 红：先写实现）');
    if (typeof check !== 'function') throw new Error('checkBaitSwitch 未导出');
  });

  test('A1 名词化诱饵族 4/4 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = familyNominal.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0].slice(0, 40));
  });

  test('A2 变更近义族 4/4 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = familyRenegade.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0].slice(0, 40));
  });

  test('A3 EN 时点名词族 2/2 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = familyEnTiming.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0].slice(0, 40));
  });

  test('B1 后缀剥离 3/3 命中（裸名词短句族）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = stripped.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('bare-noun miss ' + miss.length + ': ' + miss[0]);
  });

  test('C1 良性 10/10 零误伤（含边缘良性）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const fp = benign.filter(t => check(t).hit === true);
    if (fp.length) throw new Error('FP ' + fp.length + ': ' + fp[0].slice(0, 40));
  });

  // ── D：新腿承重（负例注入：摘除新族常量后该族不命中）──
  const K = mod ? mod.__internals() : null;
  test('D1 新腿承重（摘除后新族全不命中，反向 baseline 全命中）', () => {
    if (!check || !K) throw new Error('模块或 internals 缺失');
    const all = familyNominal.concat(familyRenegade, familyEnTiming);
    const baselineMiss = all.filter(t => check(t).hit !== true);
    if (baselineMiss.length) throw new Error('baseline miss: ' + baselineMiss[0].slice(0, 40));
    // r487 修复：原锚点 split('|好处|甜头') / split('|不算数|不作数') 是
    // **空操作**——源码串里不存在这两个字面（「好处」在 (?:把|给)?好处 内，
    // 「不算数」在 付了?钱?就不算数 内），split 返回原串，摘除从未发生，
    // 断言报「摘除后仍命中」是测试自身失效而非引擎不承重。
    // 改为按常量源码整段摘除：把 BARE_BAIT_ZH / BARE_SWITCH_ZH 两支从
    // BAIT_ZH / SWITCH_ZH 源码中真正移除（同 bare-stem F1 的摘除法）。
    const inj = {
      BAIT_ZH: new RegExp(
        K.BAIT_ZH.source.split('|' + K.BARE_BAIT_ZH.source)[0]
        + '|' + K.ORIGINAL_EN.source + '|' + K.BARE_BAIT_EN.source),
      BAIT_EN: new RegExp(K.BAIT_EN.source.split('|' + K.BARE_BAIT_EN.source)[0], 'i'),
      SWITCH_ZH: new RegExp(K.SWITCH_ZH.source.split('|' + K.BARE_SWITCH_ZH.source)[0] + ')'),
      SWITCH_EN: new RegExp(K.SWITCH_EN.source.split('|' + K.BARE_SWITCH_EN.source)[0] + ')', 'i'),
    };
    const still = all.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('新腿不承重（摘除后仍命中）: ' + still[0].slice(0, 40));
  });

  // ── E：存量轮测零回归（r486 测试套件必须仍全绿）──
  test('E1 r486 存量轮测零回归', () => {
    const legacy = require(path.join(HF, 'test', 'round-486-bait-switch.test.js'));
    let pass = 0; const fails = [];
    const t = (name, fn) => {
      try { const r = fn(); if (r && typeof r.then === 'function') { return r; } pass++; }
      catch (e) { fails.push(name + ': ' + e.message); }
    };
    return Promise.resolve(legacy({ test: t })).then(() => {
      if (fails.length) throw new Error('r486 回归失败 ' + fails.length + ': ' + fails[0]);
      if (pass < 19) throw new Error('r486 通过数异常: ' + pass);
    });
  });
};
