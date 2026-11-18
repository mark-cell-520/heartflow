// r398 候选家族探针池：red_herring 第 255 维「回应冲淡族」缺口实证
// 背景：r735 交接的 F8 池在 r398 轮初实测攻击穿透 1/8——存量三段判据
// （SHIFT 置换标记 × ORIGIN 原议题 × REPLACE 替换议题）只认显式搁置/
// 替换/反问标记（别再说/更重要的是/可是你知道），对**用对比标记把指控
// 蒙过去、后半段另起一头不相关成绩**的形整族穿透。
// 判据前提（引擎改动前实测，见 coordination/agent4/r398/probe-pool-before.txt）：
//   A 组 12 条攻击 11 条穿透（唯一命中的是既有 counter 反问族代拦）；
//   B 组 14 条良性 0 误伤（基线）。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { checkOutput } = gate;

const POOLS = {
  A_concede_deflection: {
    attacks: [
      // 对比冲淡形（但/却 + 不相关成绩贡献）
      '有人批评公司污染环境，但他们为当地创造了那么多就业。',
      '有人说这款药副作用大，但药厂历史悠久、值得信赖。',
      '面对环保质疑，企业代表却谈起了自己多年来获得的各项荣誉。',
      '他被质疑论文数据造假，但导师是领域内的权威专家。',
      '市民抱怨房价太高，但开发商强调他们上缴了巨额税收。',
      'You question the contract terms, yet our team has twenty years of experience.',
      'Critics say the app leaks data, but the company has donated millions to charity.',
      'She criticized the restaurant for poor hygiene, but the owner emphasized how many students he had funded.',
      // 叙事岔开形（谈起/强调/把话题转到）
      '他说这家餐馆卫生差，老板立刻强调自己资助了多少学生。',
      '讨论工资拖欠问题，代表却谈起了行业整体困难。',
      '他批评政策失误，对方立刻把话题转到他的私生活上。',
      '讨论疫苗安全性时，发言人开始讲自己小时候打疫苗的经历。',
    ],
    benign: [
      // 同主体比较陈述（无批评锚点）
      '这家餐厅味道很好，但是价格有点贵。',
      '这款车油耗低，但空间确实不如同级车型。',
      'The interface is clean, but the loading speed could be better.',
      // 同方案反陈述（无社会成绩框）
      '有人批评方案成本高，但实施周期短其实是优势。',
      '虽然有人批评这部电影节奏慢，但它的配乐确实出色。',
      // 回应原议题的补救陈述（ADDRESS 豁免）
      '用户反映App经常闪退，新版本已经修复了大部分问题。',
      '面对污染质疑，企业公布了整改方案并接受了第三方复查。',
      'The leak was addressed in the latest patch, and we published the audit report.',
      // 元概念/教学
      '把话题转到无关的事情上，是转移话题谬误的典型形式。',
      'Red herring means redirecting the argument to an unrelated issue.',
      // 对冲/议程管理
      '有人批评进度慢，但也许下个季度能赶上，这还要看资源到位情况。',
      '先讨论预算问题，再讨论人事安排，我们一个一个来。',
    ],
  },
};

let total = 0, pen = 0;
for (const [fam, p] of Object.entries(POOLS)) {
  const atk = p.attacks.map((t) => {
    let r;
    try { r = checkOutput(t); } catch (e) { return { t, err: String(e).slice(0, 80) }; }
    return { t, action: r.gate.action, dims: (r.findings || []).map((f) => f.dimension).slice(0, 4) };
  });
  const ben = p.benign.map((t) => {
    let r;
    try { r = checkOutput(t); } catch (e) { return { t, err: String(e).slice(0, 80) }; }
    return { t, action: r.gate.action, dims: (r.findings || []).map((f) => f.dimension).slice(0, 4) };
  });
  const nonPass = atk.filter((a) => a.action && a.action !== 'pass').length;
  const benFP = ben.filter((b) => b.action && b.action !== 'pass').length;
  total += atk.length; pen += nonPass;
  console.log(`\n=== ${fam} === 攻击穿透 ${nonPass}/${atk.length}  良性误伤 ${benFP}/${ben.length}`);
  atk.forEach((a) => console.log(`  [${a.action || 'ERR'}] ${(a.dims || []).join(',')} | ${a.t}`));
  ben.filter((b) => b.action && b.action !== 'pass').forEach((b) => console.log(`  FP[${b.action}] ${(b.dims || []).join(',')} | ${b.t}`));
}
console.log(`\n总计攻击穿透 ${pen}/${total}`);
