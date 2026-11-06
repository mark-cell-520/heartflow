// r232 模块干跑：攻击命中 + 良性零误报 + 边界互不触发
const { detectPHacking: chk } = require('/data/home/heartflow/src/p-hacking.js');

// ─── 攻击（探针零命中族，期望全部 hit）──
const ATTACK_ZH = [
  ['A1', '我们试了20种用户分组，终于发现95后用户的付费率显著更高。'],
  ['A2', '测试了30个参数组合，有一组p值终于小于0.05，说明策略有效。'],
  ['A3', '换了5种统计方法，其中一种显示结果显著，假设成立。'],
  ['A4', '调研了40个城市，挑出那个销售额大涨的城市作为证据。'],
  ['A5', '我们分析了上百个变量，终于找到与股价相关的那个指标。'],
  ['A6', '把数据按不同年龄段切了十几刀，有一组呈现出强相关。'],
  ['A7', '反复调整实验条件，第12次运行终于出现了我们预期的效应。'],
  ['A8', '在几十种配色方案中，有一种的转化率明显高，就用它。'],
  ['A9', '我们扫描了全部 subgroup，找到了那个支持结论的细分人群。'],
  ['A10', '试遍了各种统计口径，终于有一个能证明产品有效。'],
];
const ATTACK_EN = [
  ['E1', 'We tested twenty subgroups and finally found one with a significant effect.'],
  ['E2', 'After trying thirty parameter combinations, one set finally gave p < 0.05.'],
  ['E3', 'We reran the experiment twelve times until the expected effect appeared.'],
  ['E4', 'Out of forty cities surveyed, one showed a big sales jump, proving the strategy works.'],
];

// ─── 良性（期望全部不判）──
const BENIGN = [
  ['B1-基线同报', '该药将风险从4%降到2%，相对降低50%，绝对下降2个百分点。'],
  ['B2-绝对值低', '感染率从万分之一上升到万分之二，绝对值仍然很低。'],
  ['B3-预注册', '我们预设了主要终点，只报告预设的那一个，不做事后挑选。'],
  ['B4-校正', '我们对多重比较做了Bonferroni校正，显著性阈值调整为0.005。'],
  ['B5-独立重复', '这个结论是在独立样本中重复验证过的，不是一次实验的偶然显著。'],
  ['B6-小样本保留', '样本只有30人，结论需更大规模研究确认。'],
  ['B7-定性保留', '虽然只访谈了5位用户，但这是定性研究，只用于提出假设。'],
  ['B8-EN基线', 'The drug reduces risk from 4% to 2%, a 50% relative reduction.'],
  ['B9-EN校正', 'We corrected for multiple comparisons before reporting the result.'],
  ['B10-EN复现', 'The finding replicated in an independent sample.'],
  ['B11-无显著', '我们试了20种分组，没有一种显示显著相关。'],
  ['B12-未发现', '分析了上百个变量，未发现任何显著效应。'],
  ['B13-一次实验', '我们做了一次实验，结果显著，论文已投稿。'],
  ['B14-正常迭代工程', '代码改了十几遍，终于跑通了全部测试。'],
];

// ─── 边界锁（既有维度领地，期望本模块不判）──
const LOCK = [
  ['L1-cherry领地', '我们只引用了那些支持我们假设的研究，这证明理论是正确的。'],
  ['L2-cherry领地EN', 'We only cited the studies that supported our hypothesis, which proves the theory is correct.'],
  ['L3-cluster领地', '随机数据里也能看出规律，这不是巧合。'],
  ['L4-hasty领地', '采访了3个用户，100%都说好用，产品肯定没问题。'],
];

let bad = 0;
const D = r => (r.detail || r.details || '');
console.log('=== 攻击（期望 hit）===');
for (const [id, s] of ATTACK_ZH.concat(ATTACK_EN)) {
  const r = chk(s);
  if (!r.hit) bad++;
  console.log(`${id.padEnd(4)} hit=${r.hit}${r.hit ? '' : ' <<< 漏判'} ${D(r).slice(0, 46)}`);
}
console.log('=== 良性（期望不判）===');
for (const [id, s] of BENIGN) {
  const r = chk(s);
  if (r.hit) bad++;
  console.log(`${id.padEnd(16)} hit=${r.hit}${r.hit ? ' <<< 误判 ' + D(r).slice(0, 40) : ''}`);
}
console.log('=== 边界锁（期望不判）===');
for (const [id, s] of LOCK) {
  const r = chk(s);
  if (r.hit) bad++;
  console.log(`${id.padEnd(16)} hit=${r.hit}${r.hit ? ' <<< 越界 ' + D(r).slice(0, 40) : ''}`);
}

// ─── 官方良性语料全量干跑（期望零误报）──
console.log('=== 官方良性语料 ===');
const B = '/data/home/heartflow/test/';
let total = 0, fp = 0;
const corpora = [
  ['gate-benchmark.js', 'SAMPLES', ['benign', 'technical', 'borderline', 'pedagogical']],
  ['gate-benchmark-extended.js', 'SAMPLES', ['multilingual', 'longtext', 'mixed']],
  ['benign-mixed-benchmark.js', 'SAMPLES_FLAT', null],
];
for (const [file, shape, cats] of corpora) {
  let mod;
  try { mod = require(B + file); } catch (e) { console.log(`${file}: 加载失败 ${e.message.slice(0, 40)}`); continue; }
  let items = [];
  if (shape === 'SAMPLES_FLAT') {
    items = mod.SAMPLES || [];
  } else if (shape === 'SAMPLES') {
    for (const cat of Object.keys(mod.SAMPLES || {})) {
      if (cats && !cats.includes(cat)) continue;
      const arr = mod.SAMPLES[cat];
      items = items.concat(Array.isArray(arr) ? arr : Object.values(arr || {}));
    }
  }
  for (const s of items) {
    const t = typeof s === 'string' ? s : (s && (s.text || s.sample || s.content)) || '';
    if (!t || t.length < 4) continue;
    total++;
    const r = chk(t);
    if (r.hit) { fp++; console.log('  误报[' + file + ']: ' + t.slice(0, 40) + ' → ' + (r.detail || r.details || '').slice(0, 40)); }
  }
  console.log(`${file}: 累计 ${total} 条, 误报 ${fp}`);
}
console.log(`官方语料: ${total} 条, 误报 ${fp}`);
console.log(`异常合计: ${bad}`);
