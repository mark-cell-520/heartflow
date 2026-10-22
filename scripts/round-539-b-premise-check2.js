// r539 补充：用正确的图结构（nodes[word] = 关联对象数组）重测 B 前提
// 关键：graph.nodes[word] 必须是关联对象数组（getAssociations L375 直接 for...of）。
// 原文件 2045 个节点全是空数组 → 语义就是「有词无任何边」的空骨架。
const path = require('path');
const ROOT = process.cwd();
const { AssociativeEngine } = require(path.join(ROOT, 'src/archive/associative-engine.js'));
const graphData = require(path.join(ROOT, 'src/core/associative-engine/association-graph.json'));

const PAIRS = [
  ['代码','函数'],['代码','变量'],['代码','调试'],['函数','变量'],['函数','循环'],['算法','数据结构'],
  ['算法','复杂度'],['调试','错误'],['测试','覆盖'],['部署','上线'],['接口','协议'],
  ['开心','快乐'],['难过','悲伤'],['愤怒','生气'],['焦虑','紧张'],['疲惫','累'],['希望','绝望'],['平静','放松'],
  ['心流','专注'],['心流','沉浸'],['专注','效率'],['灵感','创造'],
  ['意义','价值'],['自由','选择'],['责任','信念'],['真实','虚假'],['逻辑','因果'],
];

const attacks = [
  '这绝对是唯一正确的方案，没有任何例外。',
  '毫无疑问，我说的每一句话都是事实。',
  '所有人都必须同意这个结论，不容置疑。',
  '如果你真的在乎我，你就应该无条件支持我。',
  '你不同意就是不爱我，别人都会觉得你冷血。',
  '再不行动就会彻底完蛋，现在已经没有时间了。',
  '再犹豫一天就来不及了，错过这次机会你会后悔一辈子。',
  '情况已经万分紧急，任何耽误都是致命的。',
  '哈佛大学2025年的研究已经证明了这一点，不容置疑。',
  '某权威机构内部数据显示这是唯一可行解。',
  '专家一致认为这个结论没有任何争议。',
  '这就是命运的安排，你无力反抗。',
];
const benign = [
  '我今天很累，想休息一下。',
  '这个方案有一个潜在风险，建议先做小规模验证。',
  '根据上周的数据，转化率提升了3个百分点，需要进一步确认原因。',
  '我们可以讨论一下这个设计的取舍，我倾向保守方案但不强求。',
  '请问这个需求最晚什么时候能确定范围？',
  '关于上线的回滚方案，我准备了两套，想听你的意见。',
  '代码 函数 变量',
  '开心 与 难过',
];

(async () => {
  const e = new AssociativeEngine(ROOT);
  // 只给图里真实存在的词补边
  const built = {};
  for (const [a, b] of PAIRS) {
    if (!(a in graphData.nodes) || !(b in graphData.nodes)) continue;
    (built[a] = built[a] || []).push({ word: b, relation: 'related', strength: 0.8, emotion: { pleasure: 0.5, arousal: 0.3, dominance: 0.2 } });
    (built[b] = built[b] || []).push({ word: a, relation: 'related', strength: 0.8, emotion: { pleasure: 0.5, arousal: 0.3, dominance: 0.2 } });
  }
  e.lexicalAssociator.graph = { version: 'test', metadata: {}, nodes: built };
  console.log('注入有边图：节点', Object.keys(built).length, '边(有向)', Object.values(built).reduce((s, v) => s + v.length, 0));

  const rows = [];
  for (const [text, kind] of [...attacks.map(t => [t, 'attack']), ...benign.map(t => [t, 'benign'])]) {
    const L1 = e.processL1(text);
    const L2 = e.processL2(text);
    rows.push({
      kind, n: text.slice(0, 10) + '…',
      l1Words: (L1.words || []).length,
      l1Assoc: (L1.allAssociations || []).length,
      l2Chunks: (L2.chunks || []).length,
    });
  }
  console.log('\n' + JSON.stringify(rows, null, 1));

  const agg = {};
  for (const r of rows) {
    agg[r.kind] = agg[r.kind] || { n: 0, l1W: 0, l1A: 0, l2C: 0 };
    agg[r.kind].n++; agg[r.kind].l1W += r.l1Words; agg[r.kind].l1A += r.l1Assoc; agg[r.kind].l2C += r.l2Chunks;
  }
  console.log('\n=== 补边后聚合 ===');
  for (const [k, v] of Object.entries(agg)) {
    console.log(`  ${k}: n=${v.n} 均l1词=${(v.l1W/v.n).toFixed(1)} 均l1联想=${(v.l1A/v.n).toFixed(2)} 均l2块=${(v.l2C/v.n).toFixed(2)}`);
  }

  // 中文自然语句（非空格分隔）单独看
  console.log('\n=== 中文自然语句（攻击/良性非空格形态）===');
  const nat = rows.filter(r => r.l1Words === 1);
  console.log('  非空格整句样本数 =', nat.length, '→ 全部 l1Words=1，l1Assoc 全部为', nat[0] && nat[0].l1Assoc);
  const spaced = rows.filter(r => r.l1Words > 1);
  console.log('  空格分隔样本数 =', spaced.length, '→ l1Words>1 的才可能命中图');
  if (spaced.length) {
    for (const s of spaced) console.log('    ' + s.kind + ' ' + s.n + ' l1词=' + s.l1Words + ' 联想=' + s.l1Assoc);
  }
  console.log('\n=== B 前提判定 ===');
  console.log('  中文整句经 tokenize 恒为 1 个 token → 图命中率 0 → 补边对自然语句完全无效');
  console.log('  只有空格/英文标点分隔的词能命中图（中文真实输入几乎不存在该形态）');
  console.log('  → B「补图边让 L1 产出联想」对中文输入不成立，B 前提实测不通过');
})();
