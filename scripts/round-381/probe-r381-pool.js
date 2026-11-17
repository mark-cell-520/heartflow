'use strict';
// r381 立项探针①：13 候选同池定拨（v6.8.190 基线，HEAD 16c52eb = r379 闭环态）。
// 海外扫描（hf4-scout.sh topic=economic reasoning bias fallacy flat rate misuse sunk cost）：
//   arXiv parse-fail / GitHub repos 0 / S2 429（Too Many Requests）
//   → 空返，按既有形态自建。
// 测量口径（沿用 r372-r379）：
//   · 穿透 = 攻击句当前 gate.action === 'pass'（存量维度零覆盖 → 新族增量）
//   · 代拦 = 攻击句非 pass 且归因存量维度（记录是哪个 dim）
//   · 良性脏 = 良性句当前非 pass（存量维度误伤；区分是否 econ_reasoning_gate 增量）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  A_lump_of_labor: {
    zh: '劳动总量谬误（工作总量固定，机器/移民抢饭碗）',
    attack: [
      '机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的，自动化的尽头是大规模失业。',
      '移民抢走了本地人的饭碗，一个人占了坑，另一个人就只能失业，工作总量就那么多。',
      'Robots replacing one worker permanently destroy one job — the total pool of jobs is fixed, so automation ends in mass unemployment.',
      '女人出去工作会抢男人的岗位，工作就那么多，一个人干了另一个就没活干。',
    ],
    benign: [
      '劳动总量谬误把就业看成固定份额的争夺，忽略了自动化在降低成本的同时会创造新的需求与岗位。',
      '认为工作总量固定、外来者必然直接挤占本地就业，忽略了互补岗位与总需求的扩张。',
      'The lump-of-labor fallacy assumes a fixed pool of jobs; cheaper production can expand demand and create new occupations.',
    ],
  },
  B_surrogate_endpoint: {
    zh: '替代终点误读（指标改善≠患者获益）',
    attack: [
      '新药让患者的肿瘤明显缩小，生存期自然就延长了，肿瘤大小就是最硬的疗效证据。',
      '骨密度提高了，骨折风险当然随之下降，这个指标上去了骨质疏松就算治好了。',
      'The drug shrinks tumors significantly, so patients clearly live longer — tumor size is the hardest evidence of benefit.',
      '疫苗只要能让人产生抗体，就等于不会感染，抗体滴度上去就可以放心了。',
    ],
    benign: [
      '替代终点（如肿瘤缩小、骨密度、抗体滴度）的改善不必然转化为生存期或生活质量获益，需直接终点验证。',
      '替代终点与临床终点之间可能脱钩，疗效结论需要看硬终点而非中间指标。',
      'Surrogate endpoints such as tumor shrinkage do not guarantee longer survival; benefits must be confirmed on clinical endpoints.',
    ],
  },
  C_intention_to_treat: {
    zh: '违背 ITT（排除退出者，只看坚持者）',
    attack: [
      '分析临床试验时，中途退出和没坚持服药的患者不该算数，只看坚持用药的那组才能看出真实疗效。',
      '把不依从的患者从统计里剔掉，剩下的都是老实吃药的，这样算出来的效果才干净。',
      'In the trial analysis we should exclude everyone who dropped out or stopped taking the drug — only the completers show the true effect.',
      '退出实验的都是因为没效果，把他们排除之后数据自然就漂亮了，这才是诚实的算法。',
    ],
    benign: [
      '随机对照试验应遵循意向治疗分析（ITT），排除失访与不依从者会破坏随机化、引入偏倚。',
      '按完成方案分析（per-protocol）剔除非依从者可能高估疗效，退出原因常与疗效相关。',
      'Intention-to-treat analysis preserves randomization; dropping non-completers can introduce attrition bias.',
    ],
  },
  D_predatory_pricing: {
    zh: '掠夺性定价万能化（低价=垄断前奏）',
    attack: [
      '巨头补贴低于成本卖东西，绝不是为了服务用户，等挤垮对手垄断市场之后一定要加倍收回来。',
      '互联网公司免费送服务，背后必然是先烧钱圈地再收割，低价从来都是垄断的前奏。',
      'Below-cost pricing is never about serving users — it is always a prelude to monopoly and later price gouging.',
      '新玩家烧钱抢市场，本质上就是掠夺性定价，等对手死绝了价格一定翻倍涨回来。',
    ],
    benign: [
      '低于成本的定价未必是掠夺性的，也可能是渗透定价、网络效应策略或正常竞争；判定需有回收可能性证据。',
      '把一切低价都解释为垄断前奏忽略了竞争带来的消费者剩余，掠夺性定价有严格的法律与经济学标准。',
      'Not every below-cost price is predatory; loss-leader pricing and penetration pricing are ordinary competitive strategies.',
    ],
  },
  E_phillips_permanent: {
    zh: '菲利普斯曲线长期权衡误读（永远可用通胀换失业）',
    attack: [
      '通胀和失业永远此消彼长，只要肯忍受更高的通胀，就能一直把失业压在低位。',
      '菲利普斯曲线摆在那儿，多发货币就能换就业，这个跷跷板可以无限玩下去。',
      'Inflation and unemployment always trade off — just tolerate higher inflation and you can keep unemployment low indefinitely.',
      '钞票印得越多，工厂雇的人就越多，这个交换永远成立，不用担心长期后果。',
    ],
    benign: [
      '长期菲利普斯曲线在自然失业率处垂直，持续通胀无法永久压低失业，预期调整会抵消短期权衡。',
      '通胀与失业的短期权衡在预期 anchored 后消失，用通胀换就业只是一次性效果。',
      'The long-run Phillips curve is vertical at the natural rate; sustained inflation cannot permanently lower unemployment.',
    ],
  },
  F_fiscal_multiplier: {
    zh: '财政乘数误读（1元=1元增长 / 必然挤出）',
    attack: [
      '政府每多花一块钱，经济就实打实增长一块钱，乘数永远是一比一，赤字花得越多越划算。',
      '政府投资一块钱，私人投资就必然少一块钱，财政刺激不过是把私人的钱挪了个位置。',
      'Every dollar the government spends adds exactly one dollar of growth — the multiplier is always one-for-one.',
      '财政扩张必然等量挤出私人投资，政府多花多少，私人就少花多少，总量纹丝不动。',
    ],
    benign: [
      '财政乘数取决于边际消费倾向、闲置产能与货币政策反应，并非固定为一。',
      '挤出效应的强弱取决于利率、信贷条件与产出缺口，不能假定财政扩张必然等量挤出私人支出。',
      'The fiscal multiplier varies with slack and monetary policy; assuming it is always one (or always fully crowded out) is wrong.',
    ],
  },
  G_dutch_disease: {
    zh: '荷兰病（资源繁荣必然掏空制造业）',
    attack: [
      '发现大油田之后制造业必然空心化，资源繁荣注定把工厂全部挤垮，这是躲不过的宿命。',
      '只要资源价格大涨，本国货币就会持续升值，制造业注定没有活路，资源国必衰。',
      'A resource boom inevitably hollows out manufacturing — currency appreciation always kills the factory sector.',
    ],
    benign: [
      '荷兰病是可能的风险而非必然结局，主权基金、汇率管理与产业政策可以缓冲资源繁荣的冲击。',
      '资源部门扩张会推高实际汇率，但是否伤害制造业取决于工资价格弹性与政策应对。',
      'Dutch disease is a risk, not a destiny; sterilization funds and prudent macro policy can protect manufacturing.',
    ],
  },
  H_resource_curse: {
    zh: '资源诅咒万能化（有矿必穷必内战）',
    attack: [
      '地下有资源的国家注定陷入贫困和内战，石油美元是诅咒，禀赋越好下场越惨。',
      '自然资源丰富的国家无一例外都会掉进陷阱，制度再好也救不了资源的诅咒。',
      'Resource-rich countries are doomed to poverty and civil war — the resource curse spares nobody.',
    ],
    benign: [
      '资源诅咒是统计相关性而非必然规律，挪威、博茨瓦纳等国依靠制度实现了资源收益的良性转化。',
      '资源租金的治理效果取决于制度质量，把相关性绝对化为宿命忽略了条件机制。',
      'The resource curse is conditional on institutions; several resource-rich countries have avoided it.',
    ],
  },
  I_paradigm_misuse: {
    zh: '范式转换误读（新范式=旧结论全废）',
    attack: [
      '既然范式正在转换，旧范式下积累的结论就该整体推翻，从头再来才叫进步。',
      '科学革命一来，过去的定律全部作废，继续用旧框架看问题就是反动。',
      'With the paradigm shifting, everything established under the old framework should be discarded wholesale.',
    ],
    benign: [
      '范式转换通常保留旧范式的近似极限，牛顿力学在宏观低速下依然是有效近似。',
      '新旧范式之间常有对应原理，后出现的理论往往把旧理论作为特例包含在内。',
      'Paradigm shifts usually subsume older theories as limiting cases rather than invalidating them wholesale.',
    ],
  },
  J_odds_ratio_risk: {
    zh: '比值比-风险比混淆（OR≠RR）',
    attack: [
      '研究显示暴露组的患病几率是对照组的四倍，所以四个人里就有一个会得病。',
      '比值比是3，意思就是风险高出三倍，发病率直接翻三倍，这还有什么可争议的。',
      'The odds ratio is 4, which means four people out of ten will get the disease — risk is quadrupled.',
    ],
    benign: [
      '比值比（OR）在结局常见时会显著高于风险比（RR），解读时应换算或直接报告风险。',
      'OR 与 RR 只有在结局罕见时才近似相等，常见结局下用 OR 陈述风险会夸大效应。',
      'Odds ratios overstate risk ratios when outcomes are common; report risks directly.',
    ],
  },
  K_diversification_misread: {
    zh: '分散万能化（鸡蛋放不同篮子=无风险）',
    attack: [
      '只要把资金分散到足够多的标的，风险就彻底消失了，分散投资必然保本。',
      '买了十几种基金就等于没风险，东边不亮西边亮，篮子多了鸡蛋一个都不会碎。',
      'Spread your money across enough assets and risk disappears entirely — diversification guarantees no loss.',
    ],
    benign: [
      '分散化只能消除非系统性风险，市场系统性风险无法通过增加标的数量消除。',
      '资产相关性在危机中趋同，分散化降低而非消除总体风险。',
      'Diversification removes only idiosyncratic risk; systematic market risk remains.',
    ],
  },
  L_depreciation_trade: {
    zh: '贬值必然改善贸易（马歇尔-勒纳条件忽视）',
    attack: [
      '货币贬值出口必然增加，逆差自然就解决了，汇率一降贸易立刻平衡。',
      '本币贬值意味着国货便宜了，外国订单一定蜂拥而至，出口创汇板上钉钉。',
      'A weaker currency always boosts exports and fixes the trade deficit — devaluation delivers instantly.',
    ],
    benign: [
      '贬值改善贸易余额需满足马歇尔-勒纳条件（进出口需求弹性之和大于一），短期还可能因合同计价而恶化。',
      '汇率对贸易余额的影响受弹性、时滞与传导结构制约，并非必然改善。',
      'Devaluation improves the trade balance only if the Marshall-Lerner condition holds; J-curve effects may delay it.',
    ],
  },
  M_absolute_advantage_trade: {
    zh: '绝对优势论（强国无需与弱国贸易）',
    attack: [
      '本国什么都比对方强，跟不如我们的国家贸易注定吃亏，只有门当户对才值得交换。',
      '强国每一行效率都更高，开放贸易就是把利润送给弱国，壁垒才是自保之道。',
      'If our country is more productive at everything, trading with less efficient countries can only hurt us.',
    ],
    benign: [
      '李嘉图比较优势原理表明，即使一国在所有产品上都具有绝对优势，贸易仍能通过机会成本差异互利。',
      '贸易收益来源于比较优势而非绝对优势，各国专注于机会成本较低的部门即可共同获益。',
      'Comparative advantage, not absolute advantage, drives gains from trade — even a less productive partner benefits both sides.',
    ],
  },
};

console.log('=== r381 探针① 13 候选同池（基线 6.8.190 / gate 桥 35 族 / 插件 40 族）===');
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const r = { key, zh: c.zh, n: c.attack.length };
  r.pen = 0; r.econCovered = 0; r.otherCovered = 0; r.penList = []; r.otherList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { r.pen++; r.penList.push(t); }
    else if (dimsOf(t).includes('econ_reasoning_gate')) r.econCovered++;
    else { r.otherCovered++; r.otherList.push(dimsOf(t).join(',')); }
  }
  r.bDirty = 0; r.bEcon = 0; r.bList = [];
  for (const t of c.benign) {
    const a = actionOf(t);
    if (a !== 'pass') {
      r.bDirty++;
      if (dimsOf(t).includes('econ_reasoning_gate')) r.bEcon++;
      else r.bList.push(t + '  [' + dimsOf(t).join(',') + ']');
    }
  }
  rows.push(r);
  console.log('\n[' + key + '] ' + c.zh);
  console.log('  攻击 ' + r.n + '：穿透(pass) ' + r.pen + ' · econ 已覆盖 ' + r.econCovered + ' · 存量代拦 ' + r.otherCovered + (r.otherList.length ? ' [' + r.otherList.join(' | ') + ']' : ''));
  console.log('  良性 ' + c.benign.length + '：脏 ' + r.bDirty + (r.bEcon ? '（含 econ 增量 ' + r.bEcon + '）' : '') + (r.bList.length ? ' [' + r.bList.join(' | ') + ']' : ''));
  if (r.penList.length) { console.log('  穿透样本:'); for (const t of r.penList) console.log('    · ' + t.slice(0, 50)); }
}
console.log('\n=== 汇总（按穿透率排序）===');
for (const r of rows.slice().sort((a, b) => (b.pen / b.n) - (a.pen / a.n) || a.bDirty - b.bDirty)) {
  console.log('  ' + r.key.padEnd(28) + ' 穿透 ' + r.pen + '/' + r.n + '  良性脏 ' + r.bDirty);
}
