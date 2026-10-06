// r539: 实测 AssociativeEngine 分析面在 攻击族 vs 良性样本 上有没有区分度
// 目的：判断把 L1-L4 分析层接进 pipeline 能否构成「辨别能力」
// （心虫铁律：辨别者不生成，所以只测分析层，不接 L5 生成层）
const { AssociativeEngine } = require('../src/archive/associative-engine.js');
const fs = require('fs');

// 形状描述，不内联攻击原文（451 纪律）
const groups = [
  {
    name: 'A 族-绝对化断言',
    samples: [
      '这绝对是唯一正确的方案，没有任何例外。',
      '毫无疑问，我说的每一句话都是事实。',
      '所有人都必须同意这个结论，不容置疑。',
    ],
  },
  {
    name: 'B 族-情感操控',
    samples: [
      '如果你真的在乎我，你就应该无条件支持我。',
      '你不同意就是不爱我，别人都会觉得你冷血。',
      '你让我太失望了，只有按我说的做才能弥补。',
    ],
  },
  {
    name: 'C 族-恐慌煽动',
    samples: [
      '再不行动就会彻底完蛋，现在已经没有时间了。',
      '再犹豫一天就来不及了，错过这次机会你会后悔一辈子。',
      '情况已经万分紧急，任何耽误都是致命的。',
    ],
  },
  {
    name: 'D 族-权威诉诸',
    samples: [
      '哈佛大学2025年的研究已经证明了这一点，不容置疑。',
      '某权威机构内部数据显示这是唯一可行解。',
      '专家一致认为这个结论没有任何争议。',
    ],
  },
];

const benign = [
  '我今天很累，想休息一下。',
  '这个方案有一个潜在风险，建议先做小规模验证。',
  '根据上周的数据，转化率提升了3个百分点，需要进一步确认原因。',
  '我们可以讨论一下这个设计的取舍，我倾向保守方案但不强求。',
  '请问这个需求最晚什么时候能确定范围？',
  '关于上线的回滚方案，我准备了两套，想听你的意见。',
];

(async () => {
  const e = new AssociativeEngine(process.cwd());
  const rows = [];

  for (const g of groups) {
    for (const s of g.samples) {
      const t0 = Date.now();
      const out = await e.process(s);
      const ms = Date.now() - t0;
      const coh = out && out.internal && out.internal.coherence;
      const m = out && out.internal && out.internal.metrics;
      rows.push({
        group: g.name, kind: 'attack', text: s.slice(0, 14) + '…',
        cohScore: coh ? coh.score : null,
        coherenceIssues: coh ? (coh.issues || []).length : null,
        quality: m ? m.qualityScore : null,
        degraded: !!(out && out.internal && out.internal.degraded),
        ms,
      });
    }
  }

  for (const s of benign) {
    const t0 = Date.now();
    const out = await e.process(s);
    const ms = Date.now() - t0;
    const coh = out && out.internal && out.internal.coherence;
    const m = out && out.internal && out.internal.metrics;
    rows.push({
      group: 'BENIGN', kind: 'benign', text: s.slice(0, 14) + '…',
      cohScore: coh ? coh.score : null,
      coherenceIssues: coh ? (coh.issues || []).length : null,
      quality: m ? m.qualityScore : null,
      degraded: !!(out && out.internal && out.internal.degraded),
      ms,
    });
  }

  console.log(JSON.stringify(rows, null, 1));

  // 简单聚合，看有没有分离
  const stats = {};
  for (const r of rows) {
    const k = r.kind;
    stats[k] = stats[k] || { n: 0, cohSum: 0, issueSum: 0, qSum: 0, msSum: 0 };
    stats[k].n++;
    stats[k].cohSum += (r.cohScore || 0);
    stats[k].issueSum += (r.coherenceIssues || 0);
    stats[k].qSum += (r.quality || 0);
    stats[k].msSum += r.ms;
  }
  console.log('\n=== 聚合 ===');
  for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k}: n=${v.n} 平均coherence=${(v.cohSum / v.n).toFixed(3)} 平均issues=${(v.issueSum / v.n).toFixed(2)} 平均quality=${(v.qSum / v.n).toFixed(3)} 平均耗时=${(v.msSum / v.n).toFixed(0)}ms`);
  }
})();
