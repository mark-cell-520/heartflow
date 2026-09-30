// round-298 probe-1：复测「无『而是』形态被旧伪辩证族吞」的历史误伤缺口
// 纪律：样本只在本文件出现；跑完只报数字，不 cat 输出。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

// 工程/商业真句（无「而是」）——期望 action != verify 或至少不带 pseudo_profundity
const NEG = [
  '这不是某个人的错，是系统设计本身有缺陷',
  '问题不在预算，是资源分配规则需要调整',
  '这次故障不是硬件的故障，是配置项的版本不匹配',
  '延迟不是网络造成的，是序列化方式的开销',
  '这个 bug 不是编译器的问题，是代码里的类型标注错了',
  '失败不是产品的问题，是渠道策略失效',
  '错误不是用户造成的，是接口文档写得不清楚',
  '损坏不是运输造成的，是包装材料的强度不够',
  '落后不是技术问题，是组织流程的节奏',
  '崩溃不是内存的问题，是连接池上限设得太低',
  '这个差异不是算法的，是数据采集口径本身不同',
  '事故不是单点造成的，是多重配置叠加的结果',
];

// 伪哲理真阳样本（无「而是」，正常应被抓）——用于确认修完后不把真阳一起放掉
const POS = [
  '成熟不是终于抵达，是学会与不确定共处',
  '孤独不是缺陷，是灵魂的底色',
  '真正的强大不是无畏，是承认脆弱之后的继续',
  '成长不是变得世故，是对世界依然保持好奇',
  '自由不是想做什么就做什么，是能承担每个选择的后果',
  '幸福不是拥有很多，是计较得很少',
];

function run(list, label) {
  const out = [];
  for (const t of list) {
    let r = null, err = null;
    try { r = checkOutput(t); } catch (e) { err = String(e && e.message); }
    const ppf = r && r.findings ? r.findings.filter(f => String(f.dimension || '').includes('pseudo_profundity')) : [];
    out.push({
      sample: t,
      action: r ? r.gate.action : 'ERR',
      ppf: ppf.length,
      err,
    });
  }
  console.log('=== ' + label + ' ===');
  for (const o of out) console.log([o.action, 'ppf=' + o.ppf, o.err || ''].join(' | ') + ' | ' + o.sample);
  console.log('命中数: ' + out.filter(o => o.ppf > 0).length + '/' + out.length);
  return out;
}

const neg = run(NEG, 'NEG 工程真句（误伤即 = 每条都算 FAIL）');
const pos = run(POS, 'POS 伪哲理真阳（漏检 = 每条都算 FAIL）');

const negFalse = neg.filter(o => o.ppf > 0).length;
const posMiss = pos.filter(o => o.ppf === 0).length;
console.log('\n--- SUMMARY ---');
console.log('NEG_FALSE_POSITIVE=' + negFalse + '/' + neg.length);
console.log('POS_RECALL=' + (pos.length - posMiss) + '/' + pos.length);
