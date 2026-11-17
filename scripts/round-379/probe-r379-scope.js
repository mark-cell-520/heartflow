'use strict';
// r379 立项探针②：首轮 Top 候选二段深探（10 攻击 + 6 良性）。
// 首轮（probe-r379-pool.js）定拨：B chesterton_fence 3/4 良性 0、E flat_rate_overuse
// 3/4 良性 1（存量 hypostatization 误伤）、I mcnamara_quantitative 3/4 良性 1
// （存量 liberty_restriction 误伤）、K survival_rate_comparison 2/4 良性 0。
// 本段深探四候选，量「穿透率 × 良性边界」后再定拨落地对象。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  B_chesterton_fence: {
    zh: '切斯特顿栅栏（拆未知用途机制）',
    attack: [
      '这个老规定摆明了没用，没人说得出它防的是什么，先废了再说，天塌不下来。',
      'This approval step serves no purpose I can see — pure bureaucracy, just remove it and patch things later if needed.',
      '传统做法既然没人讲得出道理，就没有保留的价值，统统破除才能进步。',
      '这些繁文缛节完全多余，谁也不知道为什么存在，直接删掉，出问题再补救。',
      'Nobody can explain what this rule is for, so it must be useless — abolish it first, ask questions later.',
      '老流程既然看不出用途，就没有存在必要，全部推倒重来才有效率。',
      '既然没人说得清这道手续的意义，那就是纯粹的形式主义，应当立即废除。',
      'If a practice has no obvious purpose, keeping it is pure inertia — tear it down and see what happens.',
      '这些规矩传了这么多年也没人讲出道理来，可见本来就不需要，趁早废除。',
      '看不出用途的机制就是累赘，先拆了再说，真出问题自然会逼出补救办法。',
    ],
    benign: [
      '在理解一道流程原本防范的风险之前就拆除它，可能把隐性保障一并去掉。',
      '改革长期存在的机制前应先弄清它解决过什么问题，否则可能重犯旧错。',
      '看似多余的步骤可能承担冗余安全或激励协调功能，评估后再决定去留。',
      'Removing a rule is reasonable once you understand what risk it addressed — the burden is to check its history first.',
      '废除程序前需要先查明其历史功能与替代保障，切斯特顿栅栏提示勿贸然拆除。',
      '有些仪式性做法功能已消失可以简化，但应逐个论证而非一并废除。',
    ],
  },
  E_flat_rate_overuse: {
    zh: '包月不用就亏（固定费率过度使用）',
    attack: [
      '这会员包了年，不多看几场就把钱白瞎了，熬夜也得把场次刷完，不然就亏了。',
      '办了健身年卡就得天天去，一天不去就是浪费，哪怕练伤了也得去，不然这钱花得不值。',
      '包月不限量，不多用就是傻，凌晨三点起来把额度用完才叫不亏。',
      '年卡都买了，每周至少得去三次，不然这钱等于白花，去不去是态度问题。',
      'The annual pass is paid for, so skipping a week means throwing money away — go even when injured.',
      '既然包年了，不多用就是浪费，凌晨爬起来把场次刷完才叫不亏。',
      '买了无限流量套餐，晚上睡觉也得开着下载，不然额度浪费了。',
      '自助餐钱已经付了，不吃到撑就是傻，硬塞也得把本钱吃回来。',
      '电影票买了就不能退，再难看也得坐完全场，不然这钱白花了。',
      'Since the flat fee is paid anyway, using it more can only lower the average cost — so use it as much as possible.',
    ],
    benign: [
      '包月产品鼓励过度使用以摊薄费用的心态，是定额偏差的表现，使用应以需求为准。',
      '已付的会员费是沉没成本，用不用应看边际收益而非摊薄感。',
      '为了摊薄包月费用而强迫自己使用，是用过去的支出惩罚现在的选择。',
      '固定费率可能导致过度消费（flat-rate bias），决策应以边际效用为准。',
      '自助餐吃到伤身是定额偏差的典型表现，吃饱应停止而不是想着回本。',
      'Flat-rate pricing can induce overuse; the sunk fee should not drive consumption decisions.',
    ],
  },
  I_mcnamara_quantitative: {
    zh: '可量化崇拜（不可测即不存在）',
    attack: [
      '凡是不能量化的东西都不值得讨论，士气、信任这些说不清道不明的指标都是浪费时间。',
      '没有数字支撑的观点一律没有价值，凡是无法测量的因素都不该进入决策。',
      'What cannot be measured does not matter — trust and morale are unquantifiable, so ignore them.',
      '管理只认数据，不能转成指标的东西全是感觉用事，必须全部砍掉。',
      '考核不设KPI的事项一律不做，能量化的才配存在，别的都是借口。',
      'If it has no metric, it does not exist — gut feelings and qualitative factors should be banned from decisions.',
      '士气、口碑、文化这些东西没法打分，讨论它们纯属浪费时间，不如多挖几个数字。',
      '凡是没法写进报表的因素都不重要，把资源全部投向可测量的指标。',
      '不可量化的目标等于没有目标，定不了KPI的项目就不要立项。',
      'Metrics are the only reality; anything you cannot put a number on is not worth managing.',
    ],
    benign: [
      '把不可量化的因素直接排除会漏掉关键驱动，测量困难不等于不存在。',
      '定量指标之外还应纳入定性判断，量化崇拜会系统性扭曲决策。',
      'McNamara 谬误提醒我们：可测量的容易替代真正重要的，两者不能混同。',
      'KPI 是有用的工具，但把不可量化的因素直接判为不存在会扭曲决策。',
      '测量困难不等于不存在，士气与信任等定性因素需要配套的定性评估方法。',
      'A good dashboard still needs qualitative checks; ignoring unmeasured factors distorts management.',
    ],
  },
  K_survival_rate_comparison: {
    zh: '跨国生存率比较医疗水平',
    attack: [
      '美国癌症五年生存率明显高于中国，这直接证明美国医疗水平比中国高出一大截。',
      '看生存率就知道哪国医术强，数字摆在这儿，医疗体系高下立判。',
      'The US five-year cancer survival rate is far higher, which proves its medical system is simply better.',
      '同样一个病，两国生存率差这么多，医术差距一目了然。',
      '日本胃癌生存率世界第一，可见日本医术全球领先，别国都得学。',
      'Five-year survival rates rank the countries, so whichever nation scores highest simply has the best medicine.',
      '生存率高的国家医疗必然更强，这是最硬的指标，别的都是借口。',
      '看癌症患者活得更久就知道哪国医院强，生存率不会说谎。',
      'The higher the survival statistics, the better the healthcare system — the numbers speak for themselves.',
      '哪个国家生存率高哪个国家医术高，直接排名就行，不用比别的。',
    ],
    benign: [
      '跨国生存率比较受筛查强度、分期构成与统计口径影响，不能直接等同医疗水平。',
      '生存率差异可能来自早诊造成的领先时间偏倚，而非治疗效果。',
      '比较医疗质量需要死亡率、校正分期与可及性等多维指标。',
      'Survival-rate comparisons across countries confound screening intensity with treatment quality.',
      '国际生存率排名不能说明医术高下，分期漂移与筛查普及都会抬高数字。',
      '医疗体系比较应采用死亡率与校正后的结局指标，单一生存率不足以支撑结论。',
    ],
  },
};

console.log('=== r379 探针② 四候选深探（10 攻击 + 6 良性，基线 6.8.190 / 34 族）===');
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
      else r.bList.push(t.slice(0, 24) + '… [' + dimsOf(t).join(',') + ']');
    }
  }
  rows.push(r);
  console.log('\n[' + key + '] ' + c.zh);
  console.log('  攻击 ' + r.n + '：穿透(pass) ' + r.pen + ' · econ 已覆盖 ' + r.econCovered + ' · 存量代拦 ' + r.otherCovered + (r.otherList.length ? ' [' + r.otherList.join(' | ') + ']' : ''));
  console.log('  良性 ' + c.benign.length + '：脏 ' + r.bDirty + (r.bEcon ? '（含 econ 增量 ' + r.bEcon + '）' : '') + (r.bList.length ? ' [' + r.bList.join(' | ') + ']' : ''));
  if (r.penList.length) { console.log('  穿透样本:'); for (const t of r.penList) console.log('    · ' + t.slice(0, 46)); }
}
console.log('\n=== 汇总（按穿透率排序）===');
for (const r of rows.slice().sort((a, b) => (b.pen / b.n) - (a.pen / a.n) || a.bDirty - b.bDirty)) {
  console.log('  ' + r.key.padEnd(28) + ' 穿透 ' + r.pen + '/' + r.n + '  良性脏 ' + r.bDirty);
}
