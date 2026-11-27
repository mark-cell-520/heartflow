/**
 * test/round-488-bait-switch-colloquial-passive.test.js
 *
 * r488 — bait_switch（第299维 provisional）全新措辞家族：**俗语/口语族 + 被动/无主语族**
 * 真升级类型②：已有维度的全新措辞家族（不是旧族更多样本）。
 *
 * 家族定义（r488-takeover-verify 探针独立复验实测缺口）：
 *   · 俗语/口语族：诱饵与变更都以**民间俗语/口语词**在场，不带任何
 *     「低价/承诺/条款」等显式诱饵词，也不带「最初的+名词」原条件形——
 *     「养熟了再割」「先甜后苦」「烧钱抢市场」「免费勾进来」「收割」。
 *     存量 BAIT_ZH 显式诱饵词族、ORIGINAL_ZH 原条件族、BARE_BAIT_ZH 裸名词
 *     短句族全部不覆盖（探针实测 9/11 穿透）。
 *   · 被动/无主语族：变更以**被动语态**断言，主语是被替换的条件本身——
 *     「条件在他入职之后被单方面修改」「报价在签约后被逐条加码」。
 *     存量 SWITCH_ZH 要求「事后/之后 + 变更动词」主动形或「加价/改」直词，
 *     被动形「被单方面修改/被逐条加码」整族穿透。
 *
 * 双腿 AND 契约不变：诱饵腿 × 变更腿同在场才判，缺一不判（D1）。
 * 豁免/否定守卫/META 不变。
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

  // ── A：俗语/口语族攻击（ZH 6 + EN 3）──
  const attacksZH = [
    '先把人养熟了再割，前期补贴都是钓饵。',
    '这就是先甜后苦：签约前什么都答应，签约后层层加码。',
    '前期烧钱抢市场，等用户离不开了再收割。',
    '免费试用把人勾进来，试用期一过立马变脸。',
    '低价接单，做完再补钱，客户已经没法换了。',
    '先用补贴养着用户，等他们离不开了就开始割韭菜。',
  ];
  const attacksEN = [
    'They subsidized onboarding to pull users in, then raised prices once switching became painful.',
    'The signup bonus was the hook; the subscription fee tripled after the trial ended.',
    'A teaser rate won the account, and the real margin was added once the contract was non-cancellable.',
  ];

  // ── B：被动/无主语族攻击（ZH 4 + EN 2）──
  const passiveZH = [
    '条件在他入职之后被单方面修改，而他已经拒了别的 offer。',
    '报价在签约后被逐条加码，此时更换供应商的成本已经很高。',
    '职责范围在项目启动后被大幅扩充，而团队已经进场无法撤出。',
    '价格条款在他付款之后被重新解释，此时他已经没有议价的余地。',
  ];
  const passiveEN = [
    'The duties were expanded unilaterally after he had already resigned from his previous job.',
    'The quoted rate was revised upward once the team was already mobilized on site.',
  ];

  // ── C：良性（10，含该族边缘良性）──
  const benign = [
    // 边缘良性：正确多因陈述（非本族）
    '战争是多因共同造成的，把责任推给单一方并不符合史实。',
    // 边缘良性：正当商业披露（获客成本写进公开财报）
    '平台对前三个月的新用户提供补贴，这一获客成本已写在公开财报里。',
    // 良性：提前告知 + 可取消
    '订阅价格调整会提前三十天邮件通知，随时可以取消。',
    // 良性：明示续费规则
    '试用期结束后按标准价续费，页面上有明确倒计时提示。',
    // 边缘良性：正确归因的留存效应陈述（非事后变更）
    'Once users have invested in learning the tool, switching costs rise — a documented retention effect.',
    // 良性：统一收费
    'The platform charges a flat monthly fee, and every feature is included.',
    // 边缘良性：低价竞标但守约（无变更腿）
    '低价竞标拿下项目后，我们通过优化流程保住了利润，没有加价。',
    // 良性：口头承诺兑现
    '我们按最初的约定签了约，对方履约完全一致。',
    // 良性：限时促销规则透明
    '促销价是限时的，活动结束后恢复原价，活动规则写得很清楚。',
    // 边缘良性：折扣换约并如约交付
    'They offered a discount to win the deal and delivered everything as promised.',
  ];

  // ── D：单腿不判 ──
  const oneLeg = [
    '我们给出了市场上最有竞争力的报价，全部费用明细已写明。',
    '落地阶段实际情况发生变化，我们按合同条款与对方重新协商了交付范围。',
    'I would rather not change the terms at all.',
    '补贴期结束后价格恢复到覆盖成本的水平，这是上市时就说好的。',
  ];

  // ── E：俗语族长句形（口语词出现在长句中）──
  const longForm = [
    '他们先用一份远低于市场价的报价赢得了这个项目，等我们的团队已经进场、设备和人员都到位之后，才开始以原材料上涨和工期紧张为由逐项追加费用，而这个时候项目已经进行到一半，我们根本不可能中途换人，只能接受这些原本没有谈过的额外条款。',
    '先以免费策略把用户圈进来，等大家的数据、关系和习惯都沉淀在这个平台上之后，再一步步把原本免费的功能改成付费，这时候用户已经走不掉了。',
  ];

  test('A0 模块存在且导出 checkBaitSwitch', () => {
    if (!mod) throw new Error('src/bait-switch.js 不存在');
    if (typeof check !== 'function') throw new Error('checkBaitSwitch 未导出');
  });

  test('A1 俗语/口语族 ZH 6/6 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = attacksZH.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A2 俗语/口语族 EN 3/3 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = attacksEN.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A3 被动/无主语族 ZH 4/4 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = passiveZH.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A4 被动/无主语族 EN 2/2 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = passiveEN.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('A5 俗语族长句形 2/2 命中', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const miss = longForm.filter(t => check(t).hit !== true);
    if (miss.length) throw new Error('miss ' + miss.length + ': ' + miss[0]);
  });

  test('B1 良性 10/10 零误伤', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const fp = benign.filter(t => check(t).hit === true);
    if (fp.length) throw new Error('FP ' + fp.length + ': ' + fp[0]);
  });

  test('D1 单腿不判 4/4', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const fp = oneLeg.filter(t => check(t).hit === true);
    if (fp.length) throw new Error('LEG-FP ' + fp.length + ': ' + fp[0]);
  });

  test('F1 负例注入：俗语族常量摘除后俗语族不命中（承重证明）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const K = mod.__internals();
    // 摘除俗语族腿常量（本轮新增的 COLLOQUIAL_*）。常量不存在即 TDD 红。
    if (!K.COLLOQUIAL_BAIT_ZH || !K.COLLOQUIAL_SWITCH_ZH) {
      throw new Error('COLLOQUIAL_BAIT_ZH / COLLOQUIAL_SWITCH_ZH 未导出（实现未落）');
    }
    // 摘除方式：把俗语族常量替换为永不匹配的模式（checkBaitSwitch 的 inj 语义）。
    // 俗语族诱饵腿摘除后，俗语族 ZH 样本应不再命中（它们没有存量诱饵词腿）。
    const never = '(?!x)x';
    const noColloquialBait = {
      BAIT_ZH: new RegExp(K.BAIT_ZH.source.split(K.COLLOQUIAL_BAIT_ZH.source).join(never)),
    };
    // 只断言「诱饵词只由俗语腿供给」的样本（存量显式诱饵词族/裸诱饵族/
    // 原条件族均不覆盖的形）。其余样本（先甜后苦带「答应」、免费试用带
    // 「免费」、低价接单带「低价」）由存量腿代拦，摘除后保留命中是正确的。
    const exclusiveColloquial = [
      '先把人养熟了再割，前期补贴都是钓饵。',
      '前期烧钱抢市场，等用户离不开了再收割。',
      '先用补贴养着用户，等他们离不开了就开始割韭菜。',
    ];
    const lost = exclusiveColloquial.filter(t => check(t, noColloquialBait).hit !== true);
    if (lost.length !== exclusiveColloquial.length) {
      throw new Error('俗语诱饵腿不承重 ' + (exclusiveColloquial.length - lost.length)
        + '/' + exclusiveColloquial.length + ': '
        + exclusiveColloquial.filter(t => check(t, noColloquialBait).hit === true)[0]);
    }
    // 反向：不摘除时该三条全命中（排除假阴性）
    const base = exclusiveColloquial.filter(t => check(t).hit !== true);
    if (base.length) throw new Error('baseline miss: ' + base[0]);
    // 存量能力不因摘除误伤（存量显式诱饵词族仍全命中）
    const legacy = [
      '先用一个很低的报价把他吸引过来，等他上船了再告诉你还有后续费用。',
      '一开始承诺全包，等项目进场后才说材料另算。',
      '先用低价把他勾住，签约后再加价。',
    ];
    const lg = legacy.filter(t => check(t, noColloquialBait).hit !== true);
    if (lg.length) throw new Error('摘除误伤存量 ' + lg.length + ': ' + lg[0]);
    // 俗语变更腿摘除：俗语族 EN 样本（诱饵由 signup bonus 等存量词供给）
    // 在变更腿摘除后应失配。
    const noColloquialSwitch = {
      SWITCH_EN: new RegExp(K.SWITCH_EN.source.split(K.COLLOQUIAL_SWITCH_EN.source).join(never)),
      SWITCH_ZH: new RegExp(K.SWITCH_ZH.source.split(K.COLLOQUIAL_SWITCH_ZH.source).join(never)),
    };
    const enLost = attacksEN.filter(t => check(t, noColloquialSwitch).hit !== true);
    if (enLost.length < 2) throw new Error('俗语变更腿不承重：摘除后仅 ' + enLost.length + '/3 失配');
  });

  test('F2 负例注入：被动族常量摘除后被动族不命中（承重证明）', () => {
    if (!check) throw new Error('checkBaitSwitch 未实现');
    const K = mod.__internals();
    if (!K.PASSIVE_SWITCH_ZH) throw new Error('PASSIVE_SWITCH_ZH 未导出（实现未落）');
    const never = '(?!x)x';
    // 被动变更腿摘除。注意存量 SWITCH_ZH 有时点词腿（之后/签约后），
    // 「条件…之后被修改」会被时点词腿代拦——故断言限定为**被动形独有**
    // 的样本（变更断言只能由被动腿供给）：「被大幅扩充」无对应时点腿代拦形。
    const inj = {
      SWITCH_ZH: new RegExp(K.SWITCH_ZH.source.split(K.PASSIVE_SWITCH_ZH.source).join(never)),
    };
    // 只断言被动形独有样本（变更断言无时点词腿可代拦的形）。
    // 「职责范围…被大幅扩充」的变更断言只能由被动腿供给（无「之后」类时点词
    // 可代拦）；「价格条款…被重新解释」同。其余被动样本含「之后/签约后」
    // 时点词腿（存量），摘除被动腿后仍被存量腿代拦是正确的行为。
    const exclusivePassive = [
      '职责范围在项目启动后被大幅扩充，而团队已经进场无法撤出。',
      '价格条款在他付款之后被重新解释，此时他已经没有议价的余地。',
    ];
    const lost = exclusivePassive.filter(t => check(t, inj).hit !== true);
    if (lost.length < 1) {
      throw new Error('被动变更腿不承重 0/' + exclusivePassive.length);
    }
    // 反向 baseline：不摘除时全命中
    const base = passiveZH.filter(t => check(t).hit !== true);
    if (base.length) throw new Error('baseline miss: ' + base[0]);
    // 存量能力不因摘除误伤
    const legacy = [
      '先用一个很低的报价把他吸引过来，等他上船了再告诉你还有后续费用。',
      '一开始承诺全包，等项目进场后才说材料另算。',
    ];
    const lg = legacy.filter(t => check(t, inj).hit !== true);
    if (lg.length) throw new Error('摘除误伤存量 ' + lg.length + ': ' + lg[0]);
  });
};
