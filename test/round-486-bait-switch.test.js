/**
 * test/round-486-bait-switch.test.js
 *
 * r486 — provisional 第299维 bait_switch（诱饵转换/低球战术族）
 * TDD：先写测试（红），后写实现（绿）。
 *
 * 格式：module.exports = function({test}){...}（test/run-all.js 动态加载器调用）
 *
 * 候选来源：coordination/agent4/probes/r486-probe-pool.js（六家族同池实测，
 * B 族攻击穿透 13/20、良性误伤 2/13 均为存量维度代拦）+ r486-probe-boundary.js
 * （commitment_coercion / sunk_cost_coercion / decoy_effect 对 B 族样本
 * gate.action=pass 零命中——语义独立，缺口成立）。
 *
 * 辨别的族：诱饵转换 / 低球战术（bait-and-switch / lowball / 先承诺后变更）
 * ——先用一个有吸引力的**初始条件**（低价报价/承诺条款/免费使用/宣传功能）
 * 换取对方做出**承诺或投入**（签约/付款/离职/上手依赖），再在对方**难以
 * 退出的时点**改变真实条件（加价/加条款/改职责/改功能分级），把对方的
 * 已投入当作锁定手段。与存量维度的边界：
 *   · commitment_coercion：对象是「过去做过的承诺」，无「初始诱饵 →
 *     事后变更」的两时点结构；
 *   · sunk_cost_coercion：主体是自身已投入，本族是**设局方**主动设计
 *     诱饵与变更两个时点；
 *   · decoy_effect：操纵选项集之间的相对吸引力，本族是**时间轴上**
 *     的条件变更。
 */
'use strict';

const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';

module.exports = function ({ test }) {
  // ── A：模块层攻击（ZH 10 + EN 8）——双腿 AND 命中 ──
  const attacksZH = [
    '先答应他提出的条件，等他投入之后再说实际情况有变化，那时候他已经骑虎难下了。',
    '签合同的时候什么都答应，等项目启动之后再逐个加码，对方为了保住已经付出的成本只能接受。',
    '先用一个很低的报价把他吸引过来，等他上船了再告诉他还有后续费用，这时候他也不会轻易下船。',
    '先用免费吸引大批用户，等他们离不开这个产品之后再开始收费。',
    '先告诉他房价含精装修，交了定金才说装修要另外加钱，这时候退定金就亏了。',
    '一开始说不设门槛，等人进来了再层层加条件，反正他们已经投了不少时间。',
    '面试的时候说好双休，等他拒了别的 offer 再说不符合规定，那时候他已经没有退路了。',
    '宣传页上写的功能全都有，等用户付了钱再告诉他这些是高级版才有的。',
    '先把人招进来，承诺的工作内容入职之后再改，他考虑到已经离职原来的公司就只能将就。',
    '先答应分期免息，等合同签了再解释说手续费是另一笔，他想想都签了也只能认。',
  ];
  const attacksEN = [
    'Promise the terms to get the signature, then change them once they are committed and cannot walk away.',
    'Quote a low price to get them in the door, then add the real charges after they have invested in the deal.',
    'Offer the job with the duties they want, then reassign the work after they have already quit their old position.',
    'Advertise every feature, then tell the customer after payment that those belong to the premium tier.',
    'Give it away free until they depend on it, then start charging.',
    'The listing said furnished, but after the deposit was paid we explained the furnishing costs extra.',
    'Sign them up with no fees, then add the surcharges once they are locked in.',
    'We promised flexible hours during the interview and revised them only after he had resigned from his old job.',
  ];

  // ── B：良性（12）——含该族边缘良性 ──
  const benign = [
    '合同条款以最终签署版本为准，任何变更都需要双方书面确认。',
    '如果项目中途需求变化，我们会提前沟通并重新评估报价。',
    '入职后岗位职责如有调整，公司会协商一致并签署补充协议。',
    '宣传页会明确区分基础版与高级版的功能范围，不含糊。',
    '订阅价格调整会提前三十天通知老用户，并允许随时退订。',
    '我们采用试用期后再付费的模式，试用条款与付费条款完全一致。',
    '需求确实变了，我们按合同里的变更条款重新报价，对方有权不接受并解除合作。',
    '岗位调整经过了员工本人同意，双方重新签订了岗位确认书。',
    'Terms are fixed by the signed contract; any change requires written agreement from both sides.',
    'If requirements change mid-project we renegotiate openly instead of surprising the client.',
    'Price changes are announced thirty days in advance and subscribers may cancel anytime.',
    'Feature differences between tiers are documented up front, not revealed after payment.',
  ];

  // ── C：结构性红灯样本（缺腿不判）──
  const leg1Only = [
    '我们给出了市场上最有竞争力的报价，也写明了全部费用明细。',
    'Our offer is the most competitive on the market, with every fee listed up front.',
  ];
  const leg2Only = [
    '落地阶段实际情况发生变化，我们按合同条款与对方重新协商了交付范围。',
    'The scope changed at delivery, so we renegotiated the terms openly with the client.',
  ];

  // ── D：豁免样本（合同变更合规 / 提前告知在场 → 不判）──
  // 三条均含双腿（诱饵条件 + 事后变更断言），豁免是唯一压制项——
  // I3 负例注入据此证明豁免承重。
  const exempt = [
    '先承诺的条款都写进了合同，后因需求变化要调整的部分，我们提前三十天书面通知并允许对方无责解约。',
    '报价虽低但所有附加费用都在签约前列明，签约后不再加价，若需调整则重新走招标。',
    'The quoted price was low because every surcharge was disclosed before signing; nothing is added afterwards.',
  ];

  // ── E：否定守卫 ──
  const negated = [
    '并不是「先答应后加价」这种套路，我们从一开始就把全部条件讲清楚了。',
    '别再用先承诺后变更的手段了，合作必须按最初约定的条款执行。',
    'It is not a bait-and-switch: all terms were disclosed before anyone committed.',
  ];

  // ── F：同族变体（ZH/EN、裸名词、带修饰、倒装、长句）──
  // r487 扩：原条件在场族 / 已投入对象族 / 后续时点名词族 / 上钩动词族
  const variants = [
    '低价钓鱼，事后加价。',                                   // 裸名词短句
    '先承诺，后加码。',                                       // 裸名词短句
    '免费引人上手，收费留人。',                               // 裸名词短句
    '他之所以接受新条件，是因为我们已经让他付出太多，现在改协议他也下不了船。', // 带修饰
    '先把条款全部应下来，等对方按这个版本备齐了人马和预算，再以实际情况变化为由逐项修改，而对方考虑到前期已经投入的人力与资金，最终只能接受这个对自己明显不利的新版本。', // 长句
    'The low quote brings them in; the real charges appear only after they are committed.', // 倒装（结论前置）
    'Once they have invested in the platform, we start charging — that is the business model.',
    // ── r487 新增同族变体 ──
    '先报低价，后加价。',                                     // 裸名词短句
    '原来说好的全包，签约后变成逐项计费。',                   // 原条件在场
    '当初承诺免租金，进场后才说物业费另算。',                 // 后续时点名词
    '改协议这一步早就算好了——先用最初的报价让他签意向，等他付了预付款再逐条加条件。', // 倒装
    '事后加价是既定剧本：先用一个低到不可思议的报价把他钩住，等他把设备定金交了再告诉他那只是基础价。', // 带修饰
    'Lowball the quote, then add the fees once they are in.', // EN 裸名词
    'Promise the world, revise the duties after they resign.',// EN 裸名词
    'The original terms were generous; once he had resigned we revised the duties entirely.', // EN 原条件在场
    'Initially we quoted a low price, and after the deposit was paid the real charges appeared.', // EN 长句
    'Charging starts only after they depend on the platform — free access first, real price later.', // EN 倒装
  ];

  // ── G：边缘良性（该族边缘：正确多因/独立评估/概念评析陈述）──
  const edgeBenign = [
    '诱饵转换（bait-and-switch）是一种营销套路：先用低价商品吸引顾客，再推销更贵的替代品。',
    '这种行为在消费者保护法里属于虚假宣传，我们需要建立制度防止先承诺后变更的套路伤害合作方。',
    '登门槛效应指先提小请求获同意后再提大请求，与低球战术是两种不同的技术。',
    'The bait-and-switch tactic is regulated as deceptive advertising in most jurisdictions.',
    'Lowballing and the door-in-the-face technique are classic compliance strategies studied by Cialdini.',
    '他把「先报低价后加价」列进了自己的谈判策略清单，认为这是快速签单的有效手段。',
  ];

  const modPath = path.join(HF, 'src', 'bait-switch.js');
  let mod = null;
  try { mod = require(modPath); } catch (_) { mod = null; }
  const check = mod && mod.checkBaitSwitch;

  test('A0 模块存在且导出 checkBaitSwitch', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在或加载失败（TDD 红：先写实现）');
    if (typeof check !== 'function') throw new Error('checkBaitSwitch 未导出');
  });

  test('A1 模块层攻击 ZH 10/10 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const misses = attacksZH.filter(t => check(t).hit !== true);
    if (misses.length) throw new Error('ZH miss ' + misses.length + ': ' + misses[0]);
  });

  test('A2 模块层攻击 EN 8/8 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const misses = attacksEN.filter(t => check(t).hit !== true);
    if (misses.length) throw new Error('EN miss ' + misses.length + ': ' + misses[0]);
  });

  test('B1 良性 12/12 零命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const fps = benign.filter(t => check(t).hit === true);
    if (fps.length) throw new Error('benign FP ' + fps.length + ': ' + fps[0]);
  });

  test('C1 缺腿①不判（单腿在场）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const bad = leg1Only.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('leg1-only fired: ' + bad[0]);
  });

  test('C2 缺腿②不判（单腿在场）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const bad = leg2Only.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('leg2-only fired: ' + bad[0]);
  });

  test('D1 合同合规/提前告知豁免 3/3', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const bad = exempt.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('exempt fired: ' + bad[0]);
  });

  test('E1 否定守卫 3/3', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const bad = negated.filter(t => check(t).hit === true);
    if (bad.length) throw new Error('negated fired: ' + bad[0]);
  });

  test('F1 变体矩阵 18/18 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const misses = variants.filter(t => check(t).hit !== true);
    if (misses.length) throw new Error('variant miss ' + misses.length + ': ' + misses[0]);
  });

  test('G1 边缘良性 6/6 不误伤', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const fps = edgeBenign.filter(t => check(t).hit === true);
    if (fps.length) throw new Error('edge-benign FP ' + fps.length + ': ' + fps[0]);
  });

  test('H1 空/短文本安全返回', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    for (const t of ['', '先', '低价', null, undefined]) {
      const r = check(t);
      if (r.hit !== false) throw new Error('non-safe hit for: ' + JSON.stringify(t));
    }
  });

  test('H2 internals 导出常量可注入', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在');
    const it = mod.__internals();
    for (const k of ['BAIT_ZH', 'BAIT_EN', 'SWITCH_ZH', 'SWITCH_EN', 'EXEMPT_ZH', 'EXEMPT_EN', 'META_ZH', 'META_EN', 'NEG_ZH', 'NEG_EN']) {
      if (!it[k]) throw new Error('missing internal: ' + k);
    }
  });

  // ── I：负例注入（逐组翻转，证明每组承重）──
  test('I1 负例注入：腿① ZH 全摘后 ZH 攻击不命中', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在');
    const it = mod.__internals();
    const inj = { BAIT_ZH: /(?!x)x/, BAIT_EN: /(?!x)x/ };
    const still = attacksZH.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('still hit after leg1 removal: ' + still[0]);
  });

  test('I2 负例注入：腿② ZH 全摘后 ZH 攻击不命中', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在');
    const it = mod.__internals();
    const inj = { SWITCH_ZH: /(?!x)x/, SWITCH_EN: /(?!x)x/ };
    const still = attacksZH.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('still hit after leg2 removal: ' + still[0]);
  });

  test('I3 负例注入：豁免全摘后豁免样本转为命中（证明豁免承重）', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在');
    const it = mod.__internals();
    const inj = { EXEMPT_ZH: /(?!x)x/, EXEMPT_EN: /(?!x)x/ };
    const fired = exempt.filter(t => check(t, inj).hit === true);
    if (fired.length !== exempt.length) {
      throw new Error('exemption not load-bearing: fired ' + fired.length + '/' + exempt.length);
    }
  });

  // ── J：端到端 ───────────────────────────────────────
  // 本族走插件层 dispatch（r295/r479/r481/r482 先例），gate 层 dimMap 无
  // bait_switch 键，故 J1 验 gate 不崩溃 + 生产 PluginLoader 真实 HookBus
  // 的 postprocess.think hook 写入 result._discrimination.baitSwitch。
  const { HookBus } = require(path.join(HF, 'src', 'core', 'hook-bus.js'));
  async function _probePlugin(samples) {
    const { PluginLoader } = require(path.join(HF, 'src', 'loader', 'plugin-loader.js'));
    const hookBus = new HookBus();
    const hf = { _hookBus: hookBus };
    const res = new PluginLoader(hf).loadAll();
    const out = {
      loadedOk: (res.loaded || []).some(p => p.name === 'bait-switch-check' && p.status === 'loaded'),
      failed: res.failed || [],
      snapshots: [],
    };
    for (const s of samples) {
      const result = { output: { conclusion: s }, _discrimination: {} };
      await hookBus.fire('postprocess.think', { input: s, result, engine: hf });
      out.snapshots.push({ s, bs: result._discrimination && result._discrimination.baitSwitch });
    }
    return out;
  }

  test('J1 gate 层不崩溃 + 插件层 hook 端到端承重', async () => {
    const gateMod = require(path.join(HF, 'src', 'gate.js'));
    const gate = gateMod.gate || gateMod.check;
    for (const t of attacksZH.concat(attacksEN)) {
      const g = gate(t);
      if (!g || !g.gate) throw new Error('gate 返回异常: ' + t.slice(0, 30));
    }
    const probe = await _probePlugin(attacksZH.concat(attacksEN));
    if (!probe.loadedOk) throw new Error('插件未被 PluginLoader 自动加载: ' + JSON.stringify(probe.failed));
    const miss = probe.snapshots.filter(x => !x.bs || x.bs.totalHits === 0).map(x => x.s);
    if (miss.length) throw new Error('插件未承重 ' + miss.length + ' 条: ' + miss[0]);
  });

  test('J2 良性不写 baitSwitch（插件层零误伤）', async () => {
    const probe = await _probePlugin(benign.concat(edgeBenign));
    const fp = probe.snapshots.filter(x => x.bs && x.bs.totalHits > 0).map(x => x.s);
    if (fp.length) throw new Error('插件误伤 ' + fp.length + ' 条: ' + fp[0]);
  });

  // ── K：r487 新措辞家族独立回归（既有维度的全新措辞家族，非旧族更多样本）──
  const _itK = mod ? mod.__internals() : null;
  // 家族① 原条件在场（诱饵条件以「被替换的初始条件」在场，而非显式低价/承诺词）
  const familyOriginal = [
    '原来说好的全包，签约后变成逐项计费。',
    '按最初的约定签的意向，等他付了预付款我们再逐条加条件。',
    'The original terms were generous; once he had resigned we revised the duties entirely.',
    'Initially we quoted a low price, and after the deposit was paid the real charges appeared.',
  ];
  // 家族② 已投入对象（诱饵以「平台/工具接入」的隐含形在场）
  const familyInvested = [
    'Once they have invested in the platform, we start charging — that is the business model.',
    'Charging starts only after they depend on the platform — free access first, real price later.',
  ];
  // 家族③ 后续时点名词（铺位/软件/服务接入后的时点）
  const familyLaterTime = [
    '当初承诺免租金，进场后才说物业费另算。',
    '办卡时说好包含全部项目，激活后才发现器械课要另外收费。',
  ];
  // 家族④ 上钩动词 / 长修饰低价形
  const familyHook = [
    '先用一个低到不可思议的报价把他钩住，等他把设备定金交了再告诉他那只是基础价。',
    '用免费流量把他套住，等店铺做起来再抽成。',
  ];
  const r487Families = {
    original: familyOriginal,
    invested: familyInvested,
    laterTime: familyLaterTime,
    hook: familyHook,
  };

  test('K1 r487 四新族攻击全命中（10/10）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    let total = 0;
    for (const [name, list] of Object.entries(r487Families)) {
      const misses = list.filter(t => check(t).hit !== true);
      if (misses.length) throw new Error(name + ' miss ' + misses.length + ': ' + misses[0]);
      total += list.length;
    }
    if (total !== 10) throw new Error('expected 10 samples, got ' + total);
  });

  // K2：四新族的边缘良性零误伤（合规变更 / 披露充分 / 已投入的正常陈述）
  const r487Benign = [
    '商场铺位招商完成后，租金按实际面积结算，所有标准都写在合同里。',
    '合同签订后我们需要进场施工，工期表已与业主确认。',
    '物业费按政府指导价收取，收费标准在售楼处公示。',
    '我们按最初的约定执行，没有改动过任何条款。',
    '原始报价存档备查，后续如有调整双方书面确认。',
    'This platform charges a flat monthly fee, and every feature is included.',
    'Our app is free to download, and the subscription tiers are clearly listed on the pricing page.',
    'Once users have invested in learning the tool, switching costs rise — that is a documented retention effect.',
    'The platform is free for students; paid plans exist for businesses and are listed openly.',
    'Teams that have invested in the platform report measurable productivity gains.',
  ];
  test('K2 r487 新族边缘良性零误伤（10/10 pass）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const fps = r487Benign.filter(t => check(t).hit === true);
    if (fps.length) throw new Error('FP ' + fps.length + ': ' + fps[0]);
  });

  // K3：负例注入证明 r487 补腿承重——把新族常量摘除后，该族攻击不再命中
  // 剥离方式：BAIT_ZH 退回 r486 版（无 ORIGINAL_ZH/EN 尾段），BAIT_EN 退回旧版
  // （无「已投入对象」尾段）——用 __internals 的 ORIGINAL_ZH.source 作锚点定位尾段起点。
  const BAIT_ZH_R486 = new RegExp(
    _itK.BAIT_ZH.source.split('|' + _itK.ORIGINAL_ZH.source)[0]
  );
  // BAIT_EN 源码形如 '(?:^|\b)(?:...)(?:\b|$)'，split 尾段后需补回结尾锚点
  const BAIT_EN_R486 = new RegExp(
    _itK.BAIT_EN.source.split('|(?:invested|locked|hooked|dependent|reliant|trapped|committed)')[0] + ')(?:\\b|$)',
    'i'
  );
  // 纯净隔离样本：r486 旧腿（BAIT_ZH_R486/BAIT_EN_R486）零命中，仅新腿可命中。
  // 隔离纯净性要求（r487 修复）：剥离样本必须不被 r486 旧腿命中，否则无法区分
  // 「新腿命中」与「旧腿代拦」。实测「原来说好的全包」含旧腿「说好」，剥离后
  // 仍 hit（K3 假阴性），故换成旧腿零覆盖形：
  //   · 原条件在场：用「原来的报价」等旧腿零覆盖形（旧腿只认「说好/答应/承诺」类）；
  //   · 已投入对象：EN invested/locked/hooked ... in the platform 尾段专属形。
  const isolatedOriginal = [
    '原来的报价单方面作数，等他付了预付款我们再逐条加条件。',
    'The initial terms were the entire scope; after the deposit we added condition after condition.',
  ];
  const isolatedInvested = [
    'Once they have invested in the platform, we start charging — that is the business model.',
    'They are locked into the platform now; the new charges are introduced afterwards.',
  ];
  test('K3a 隔离样本在旧腿下零命中（证明隔离纯净）', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在');
    const all = isolatedOriginal.concat(isolatedInvested);
    const leaked = all.filter(t =>
      BAIT_ZH_R486.test(t) || BAIT_EN_R486.test(t)
    );
    if (leaked.length) throw new Error('隔离样本被旧腿命中: ' + leaked[0]);
  });
  test('K3 r487 补腿承重（新族常量摘除后该族不命中）', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在');
    const inj = { BAIT_ZH: BAIT_ZH_R486, BAIT_EN: BAIT_EN_R486 };
    const all = isolatedOriginal.concat(isolatedInvested);
    const still = all.filter(t => check(t, inj).hit === true);
    if (still.length) throw new Error('r487 legs not load-bearing: ' + still[0]);
    // 反向证明：不摘除时同族全命中（排除「本来就不命中」的假阴性）
    const baseline = all.filter(t => check(t).hit !== true);
    if (baseline.length) throw new Error('baseline miss: ' + baseline[0]);
  });
};
