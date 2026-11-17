'use strict';
// r381 立项探针②：四候选深探（phillips_permanent / surrogate_endpoint /
// lump_of_labor / diversification_misread）。首轮同池（probe-r381-pool.js）
// 汇总：E 穿透 3/4 良性脏 1 · B 2/4 良性 0 · A 2/4 良性 1 · K 2/3 良性 1。
// 本轮深探加宽攻击面（长句/修饰/同义替换/否定混入）+ 良性边界（纠正句/
// 概念句/相邻族攻击句），为定拨取证。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  E_phillips_permanent: {
    zh: '菲利普斯曲线长期权衡误读',
    attack: [
      '通胀和失业永远此消彼长，只要肯忍受更高的通胀，就能一直把失业压在低位。',
      '菲利普斯曲线摆在那儿，多发货币就能换就业，这个跷跷板可以无限玩下去。',
      '钞票印得越多，工厂雇的人就越多，这个交换永远成立，不用担心长期后果。',
      '央行想要降失业，加快印钞就行了，通胀高点无所谓，反正物价和就业是跷跷板。',
      '物价涨一点没关系，就业岗位就会多起来，这个取舍百试百灵，可以无限重复使用。',
      'Inflation buys lower unemployment forever — just print faster, the tradeoff never wears out.',
      'Central banks can always swap a bit more inflation for fewer unemployed; the Phillips tradeoff is permanent.',
      '稍微多印点钞票，失业率就下去了，这一招永远管用，印钞和就业是铁打的交换关系。',
      '长期来看通胀与失业的权衡也依然存在，只要愿意忍受物价上涨，就业就能持续改善。',
      '降息放水创造就业是天经地义的，通胀压力只是暂时的，就业收益却是长久不变的。',
    ],
    benign: [
      '长期菲利普斯曲线在自然失业率处垂直，持续通胀无法永久压低失业，预期调整会抵消短期权衡。',
      '通胀与失业的短期权衡在预期 anchored 后消失，用通胀换就业只是一次性效果。',
      '菲利普斯曲线是短期关系的经验描述，长期中货币中性使失业回到自然率。',
      '以通胀压制失业的做法会推高通胀预期，最终既保不住就业也压不住物价。',
      'The long-run Phillips curve is vertical at the natural rate; sustained inflation cannot permanently lower unemployment.',
      'Once inflation expectations adjust, the inflation-unemployment tradeoff disappears in the long run.',
      '货币在长期是中性的，超发只能制造物价上涨，对就业没有持久效果。',
    ],
  },
  B_surrogate_endpoint: {
    zh: '替代终点误读（指标改善≠患者获益）',
    attack: [
      '新药让患者的肿瘤明显缩小，生存期自然就延长了，肿瘤大小就是最硬的疗效证据。',
      '骨密度提高了，骨折风险当然随之下降，这个指标上去了骨质疏松就算治好了。',
      '疫苗只要能让人产生抗体，就等于不会感染，抗体滴度上去就可以放心了。',
      '血糖指标降下来了，并发症自然就少了，糖化血红蛋白达标等于病治好了。',
      '肿瘤标志物恢复正常，说明癌症已经控制住，病人可以放心了。',
      '血压计上的数字降了，中风心脏病就一定减少，数值正常就是健康。',
      'The drug shrinks tumors significantly, so patients clearly live longer — tumor size is the hardest evidence of benefit.',
      'Higher bone density means fewer fractures for sure — this number up and osteoporosis is cured.',
      'Once the antibody titer rises, infection is impossible; the surrogate marker is all the proof we need.',
      'CD4 计数上去了，艾滋病就算控制住了，病人和健康人没有区别。',
    ],
    benign: [
      '替代终点（如肿瘤缩小、骨密度、抗体滴度）的改善不必然转化为生存期或生活质量获益，需直接终点验证。',
      '替代终点与临床终点之间可能脱钩，疗效结论需要看硬终点而非中间指标。',
      'Surrogate endpoints such as tumor shrinkage do not guarantee longer survival; benefits must be confirmed on clinical endpoints.',
      '血压下降对中风风险的影响需要通过事件发生率验证，而不是只看血压计读数。',
      '中间指标可以加速研发筛选，但疗效结论必须回到发病率和生存期这样的硬终点。',
      '疫苗诱导的抗体水平与真实世界保护效力之间还有距离，需要用发病率数据确认。',
      '血糖控制改善是重要信号，但并发症减少仍需长期随访的直接终点支持。',
    ],
  },
  A_lump_of_labor: {
    zh: '劳动总量谬误（工作总量固定）',
    attack: [
      '机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的，自动化的尽头是大规模失业。',
      '移民抢走了本地人的饭碗，一个人占了坑，另一个人就只能失业，工作总量就那么多。',
      '女人出去工作会抢男人的岗位，工作就那么多，一个人干了另一个就没活干。',
      '机器干得快，就等于人没活干了，效率每提高一分，岗位就永久减少一分。',
      '年轻人就业挤压了老员工，位置一共就那么多，此消彼长是零和博弈。',
      'Robots replacing one worker permanently destroy one job — the total pool of jobs is fixed.',
      'Immigrants take jobs from locals: one person filling a post means another must be unemployed.',
      'Every automation gain permanently removes a workplace, because the amount of work never changes.',
      '生产效率越高失业越严重，产出总量有上限，干得快的人把慢的人的饭碗砸了。',
      '延迟退休就是占着岗位不让，位置不腾出来，年轻人就没工作可干。',
    ],
    benign: [
      '劳动总量谬误把就业看成固定份额的争夺，忽略了自动化在降低成本的同时会创造新的需求与岗位。',
      '认为工作总量固定、外来者必然直接挤占本地就业，忽略了互补岗位与总需求的扩张。',
      'The lump-of-labor fallacy assumes a fixed pool of jobs; cheaper production can expand demand and create new occupations.',
      '自动化对就业的影响取决于被释放的需求去向，历史上生产率提升伴随了就业结构转换而非总量消失。',
      '总需求随生产率提升而扩张，效率红利既降低价格也创造新的服务需求。',
      '就业是供需匹配的结果，新增劳动者既提供劳动也创造需求，并非纯挤占关系。',
      '生产自动化会消灭特定岗位，但把就业看成总量固定的零和争夺忽略了补偿机制。',
    ],
  },
  K_diversification_misread: {
    zh: '分散万能化（分散=无风险）',
    attack: [
      '只要把资金分散到足够多的标的，风险就彻底消失了，分散投资必然保本。',
      '买了十几种基金就等于没风险，东边不亮西边亮，篮子多了鸡蛋一个都不会碎。',
      'Spread your money across enough assets and risk disappears entirely — diversification guarantees no loss.',
      '配置几十只股票之后，组合的波动就完全对冲掉了，系统性下跌也与我没有关系。',
      '篮子够多就永远不可能亏钱，分散持有是零风险策略，闭着眼睛买都行。',
      'Diversify across a hundred names and market crashes cannot touch your portfolio at all.',
      '资产买得够杂，个股风险全部抵消，熊市来了我的组合照样旱涝保收。',
      '把仓位切成无数份，每份的风险被稀释到零，整体自然就没有任何风险。',
    ],
    benign: [
      '分散化只能消除非系统性风险，市场系统性风险无法通过增加标的数量消除。',
      '资产相关性在危机中趋同，分散化降低而非消除总体风险。',
      'Diversification removes only idiosyncratic risk; systematic market risk remains.',
      '增加标的数量对降低组合风险的边际效果递减，达到一定数量后再加意义有限。',
      '分散化是风险管理工具而非收益保证，组合层面仍暴露于宏观与系统性冲击。',
      '篮子理论降低的是单一资产的个体风险，不是市场整体的波动风险。',
      '相关性上升时分散化失效，危机中各类资产往往同向下跌。',
    ],
  },
};

console.log('=== r381 探针② 四候选深探（基线 6.8.190 / gate 桥 35 族 / 插件 40 族）===');
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
  if (r.penList.length) { console.log('  穿透样本:'); for (const t of r.penList) console.log('    · ' + t.slice(0, 60)); }
}
console.log('\n=== 深探汇总 ===');
for (const r of rows) {
  console.log('  ' + r.key.padEnd(26) + ' 穿透 ' + r.pen + '/' + r.n + '  良性脏 ' + r.bDirty + '/' + (r.n === r.pen ? '?' : ''));
}
