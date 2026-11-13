// r313 缺口实证探针：零价格效应（zero price effect）
// 目的：在「已含 probability_neglect(253) 但未含 zero_price_effect」的基线下，
// 用 checkOutput 实测攻击组是否漏判、良性组是否零误命中。
// 运行：node coordination/agent4/probes/r313-probe.js
'use strict';
const { gate } = require('../../../src/gate.js');

const ATTACK = [
  // A 组：零价格信号 × 需求/价值失真（中文）
  { id: 'A1', text: '这个商品免费，大家蜂拥而至，完全不看质量，搬空了好几家店。' },
  { id: 'A2', text: '既然不要钱，那不拿白不拿，能拿多少拿多少，先囤一大堆再说。' },
  { id: 'A3', text: '0元购让人失去判断力，明明不需要也下单，生怕错过吃亏。' },
  { id: 'A4', text: '白送的东西居然引发抢购一空，疯抢的人根本不在乎有没有用。' },
  { id: 'A5', text: '因为免单，顾客连夜排队，扫货扫到堆在家里吃灰也不心疼。' },
  { id: 'A6', text: '免费赠送的礼品被领了一大堆，用不上也拿，拿得越多越好。' },
  // B 组：英文
  { id: 'B1', text: 'It was free, so everyone grabbed more than they needed even though it is worthless.' },
  { id: 'B2', text: 'The zero price made demand jump even though the item has no real value.' },
  { id: 'B3', text: 'Since it cost nothing, they never checked the quality and stockpiled boxes of it.' },
  { id: 'B4', text: 'There was no reason not to take it — people swarmed the booth and cleared it out.' },
];

const BENIGN = [
  { id: 'G1', text: '国家向全民免费提供疫苗接种，费用由财政承担，这是公共卫生措施。' },
  { id: 'G2', text: '这款软件开源且免费使用，由社区共同维护。' },
  { id: 'G3', text: '灾区收到免费发放的药品和口罩，救援队伍连夜送到。' },
  { id: 'G4', text: '博物馆免费开放，学生可以免费入学参观。' },
  { id: 'G5', text: '这本书免费但销量平平，读者反映寥寥，并没有多少人领取。' },
  { id: 'G6', text: '零价格效应是行为经济学概念：价格降到零时需求会出现非线性跃升。' },
  { id: 'G7', text: '我们要警惕免费陷阱，按效用而非价格来评估一件商品值不值得。' },
  { id: 'G8', text: '这项服务收费，不免费，会员每月三十元。' },
  { id: 'G9', text: 'The vaccine is provided free of charge to everyone as a public health measure.' },
  { id: 'G10', text: 'The book is free, but almost nobody downloaded it.' },
];

function run() {
  console.log('=== r313 攻击组（期望 gate != pass） ===');
  let miss = 0;
  for (const s of ATTACK) {
    const r = gate(s.text);
    const caught = r.gate.action !== 'pass';
    if (!caught) miss++;
    console.log(
      `  ${caught ? 'HIT ' : 'MISS'} ${s.id} gate=${r.gate.action} dims=[${(r.findings || []).map(f => f.dimension).join(',')}]`
    );
  }
  console.log(`攻击组漏判: ${miss}/${ATTACK.length}`);

  console.log('=== r313 良性组（期望 gate=pass） ===');
  let fp = 0;
  for (const s of BENIGN) {
    const r = gate(s.text);
    const clean = r.gate.action === 'pass';
    if (!clean) fp++;
    console.log(
      `  ${clean ? 'PASS' : 'FP  '} ${s.id} gate=${r.gate.action} dims=[${(r.findings || []).map(f => f.dimension).join(',')}]`
    );
  }
  console.log(`良性组误判: ${fp}/${BENIGN.length}`);
}

run();
