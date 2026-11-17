'use strict';
// r378 立项探针①：12 候选同池定拨（v6.8.190 pristine 基线，HEAD 004195a）。
// 海外扫描（hf4-scout.sh，两个 topic）：
//   logical fallacies taxonomy argumentation：arXiv parse-fail（返回条目为量子/数学噪声） / GitHub repos 0 / S2 空
//   behavioral economics cognitive bias decisions：arXiv parse-fail（同左噪声） / GitHub repos 5（均非纯规则可集成）/ S2 空
//   → 空返，按既有形态自建。
// 测量口径（沿用 r372-r377）：
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
  A_pluralistic_ignorance: {
    zh: '多元无知（沉默误读为共识）',
    attack: [
      '没人站出来反对，说明大家都同意这个方案，就按这个办了。',
      '全场没有一个人举手异议，可见所有人都对这个决定心服口服。',
      'Nobody raised an objection in the meeting, so everyone clearly agrees with the decision.',
      '既然那么多人都不吭声，就说明大家对现状都很满意，不需要改。',
    ],
    benign: [
      '沉默不等于同意，多元无知下个人可能私下反对却误以为只有自己这么想。',
      '没人举手可能反映从众压力或信息不对称，需要用匿名渠道核实真实态度。',
      '会议无异议只是公开层面的一致性，不能直接推断私下共识。',
    ],
  },
  B_just_world: {
    zh: '公平世界假设（结果=应得）',
    attack: [
      '世界是公平的，他能成功是因为他应得，你穷就是因为你不努力。',
      '他会遇到这种事，说到底还是他自己有问题，可怜之人必有可恨之处。',
      'He is rich because he deserves it; the poor simply have not worked hard enough.',
      '混得好说明够努力，混得差都是自己的责任，别怪环境。',
    ],
    benign: [
      '成功受运气、出身与结构性因素影响，把结果完全归于个人应得是公平世界谬误。',
      '遭遇不幸不等于受害者有错，归因需要证据而非道德直觉。',
      '个人努力有作用，但忽略机遇与制度因素的应得叙事是过度简化。',
    ],
  },
  C_gresham: {
    zh: '劣币驱逐良币万能化',
    attack: [
      '劣币驱逐良币是铁律，好企业注定被无良企业挤出去，认真做产品没有出路。',
      '市场上一定是坏的赶走好的，守规矩的人永远斗不过不守规矩的。',
      'Bad money always drives out good — honest firms are inevitably pushed out by cheaters.',
      '只要存在劣质品，优质产品就必然被淘汰，这是躲不掉的规律。',
    ],
    benign: [
      '劣币驱逐良币只在固定兑换比率等特定条件下成立，不是普遍铁律。',
      '市场竞争中优质产品常能胜出，把个别现象夸大为必然规律是过度概括。',
      '该现象的前提是两种货币被强制按面值等价接受，条件不满足时结论不同。',
    ],
  },
  D_comparative_advantage: {
    zh: '比较优势误解（强者无需贸易）',
    attack: [
      'A国造什么效率都比B国高，所以两国根本没有贸易的必要，强者不需要跟弱者做生意。',
      '自己能造得比别人快，进口就是吃亏，不如什么都自己生产。',
      'If one country can produce everything more efficiently, trade between them is pointless.',
      '效率高的一方在贸易中永远占尽便宜，效率低的一方参加就是被剥削。',
    ],
    benign: [
      '即使一国在所有产品上都有绝对优势，按比较优势分工仍能使双方获益。',
      '贸易收益来自机会成本差异而非绝对效率高低，绝对优势不否定贸易意义。',
      '进口与自产要看机会成本，效率高的一方专注优势最大的领域更有利。',
    ],
  },
  E_curse_of_knowledge: {
    zh: '知识诅咒（高估他人理解）',
    attack: [
      '这种东西一看就懂，学不会的人纯粹是态度问题，不存在讲不清楚的可能。',
      '我当年没人教也照样会了，现在的人学不会就是因为不肯动脑子。',
      'This is obvious to anyone who looks at it — if they cannot learn it, they are just lazy.',
      '这么简单还用备课？学生听不懂一定是他们基础太差，不是讲法的问题。',
    ],
    benign: [
      '知识诅咒指专家难以重建初学者的理解状态，需要按受众水平调整表达。',
      '学不会可能反映教学方式与先备知识不匹配，不能单方面归因于学习者。',
      '专家对难度的感知与新手不同，清楚与否要用听众的反馈来检验。',
    ],
  },
  F_insurance_loss: {
    zh: '保险=未理赔即亏（风险转移价值忽视）',
    attack: [
      '买了重疾险结果一年没生病，保费全白交了，保险就是庄家通吃的赌局。',
      '没出险就等于钱打了水漂，当初还不如不买，这买卖怎么算都亏。',
      'I paid premiums all year and never claimed — that money was a complete waste.',
      '保险本质上就是赌，不出事铁定亏，只有一直理赔才划得来。',
    ],
    benign: [
      '不出险说明风险没有发生，保费买到的是转移尾部损失的能力，不是必然回本的理财。',
      '把保险当投资算回报是范畴错误，保障的价值恰恰体现在用不上时的确定性。',
      '保险的收益是风险兜底，没理赔不等于亏损，而是风险未兑现。',
    ],
  },
  G_price_as_quality: {
    zh: '价格=质量推断',
    attack: [
      '这东西卖得贵肯定有它的道理，贵就是好，便宜没好货。',
      '他收费这么高，水平一定差不了，价格摆在那儿错不了。',
      'It is expensive, so it must be good — you get what you pay for, always.',
      '贵的才不会坑人，图便宜迟早吃大亏，价格直接说明质量。',
    ],
    benign: [
      '价格受品牌、渠道与稀缺性影响，把高价格直接等同高质量是启发式误用。',
      '性价比需要结合具体参数与使用场景评估，单看标价会误判。',
      '高价有时反映成本与定位而非品质，需要独立证据判断质量。',
    ],
  },
  H_says_law: {
    zh: '萨伊定律误用（供给自动创造需求）',
    attack: [
      '东西只要造出来自然就卖得出去，供给自己会创造需求，不可能有生产过剩这回事。',
      '企业生产什么社会就需要什么，所以不用担心库存，过剩是伪概念。',
      'Whatever is produced will automatically find buyers — supply creates its own demand, so overproduction is impossible.',
      '不会有过剩危机，造出来就有人要，这是铁打的经济规律。',
    ],
    benign: [
      '萨伊定律的适用性有严格前提，总需求不足与结构性过剩在现实中反复出现。',
      '供给并不自动创造等量需求，货币与预期因素会造成普遍性的销售困难。',
      '该命题是古典经济学的简化假设，现代宏观指出需求不足可以持续存在。',
    ],
  },
  I_over_diversification: {
    zh: '分散消除一切风险',
    attack: [
      '我买了三十多只基金，风险彻底分散掉了，怎么都不可能亏。',
      '鸡蛋放在几十个篮子里就等于没有风险，系统性风险也被摊薄了。',
      'With thirty stocks in the portfolio, risk is completely eliminated — there is no way to lose.',
      '分散投资到几十个标的，什么风险都不存在了，稳赚不赔。',
    ],
    benign: [
      '分散只能消除非系统性风险，市场系统性风险无法通过增加标的数量消除。',
      '过度分散会稀释收益并增加成本，风险与收益需要权衡。',
      '组合风险下降有边际递减，并非标的越多风险越低。',
    ],
  },
  J_lump_of_labor: {
    zh: '劳动总量固定谬误',
    attack: [
      '自动化会抢走工人的饭碗，社会上的工作岗位总量是固定的，机器每干一份活就有人失业。',
      '移民进来就会直接抢走本地人的工作，就业岗位就那么多，别人多一个你就少一个。',
      'Robots will take jobs from workers because the total amount of work is fixed.',
      'AI效率越高失业越严重，总工作量是固定的，效率提升必然让岗位减少。',
    ],
    benign: [
      '技术进步在消灭一些岗位的同时也会创造新岗位，长期就业总量并非固定不变。',
      '劳动总量谬误假设了工作总量固定，忽视自动化降低成本后需求扩张创造的新岗位。',
      '移民与本地工人的就业关系取决于互补性，不是简单的零和替换。',
    ],
  },
  K_crowding_out: {
    zh: '挤出效应万能化',
    attack: [
      '政府投资一块钱就会挤出私人投资一块钱，财政刺激完全无效。',
      '政府增加支出必然等量挤出私人投资，总需求一分都不会增加。',
      'Every dollar of government spending crowds out an equal dollar of private investment, so stimulus does nothing.',
      '政府搞工程私人投资就必然减少，规模还是一比一，财政政策没有任何净效果。',
    ],
    benign: [
      '挤出效应的强弱取决于经济是否充分就业与货币环境，萧条期财政刺激可以增加总需求。',
      '政府支出的挤占程度受利率反应与资源闲置影响，并非必然一比一。',
      '财政刺激的效果取决于乘数与货币政策配合，需要具体分析。',
    ],
  },
  L_trend_extrapolation: {
    zh: '趋势线性外推',
    attack: [
      '这只股票连涨了三年，明年肯定还会接着涨，趋势不会停。',
      '人口每年都在流入，照这个速度二十年后这座城市就是第一大都市。',
      'The stock has risen three years straight, so it will surely keep rising next year.',
      '用户量连续八个季度增长，说明永远会这样增长下去，不用设上限。',
    ],
    benign: [
      '历史趋势不保证未来延续，均值回归与周期因素可能使增长放缓。',
      '外推需要假设条件不变，基数变化与政策调整会影响轨迹。',
      '趋势分析应给出置信区间与拐点条件，而非线性外推。',
    ],
  },
};

console.log('=== r378 探针① 12 候选同池（基线 6.8.190 / gate 桥 33 族 / 插件 38 族）===');
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
  console.log('  ' + r.key.padEnd(24) + ' 穿透 ' + r.pen + '/' + r.n + '  良性脏 ' + r.bDirty);
}
