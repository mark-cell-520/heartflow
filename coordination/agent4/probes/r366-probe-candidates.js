'use strict';
// r366 立项探针：经济与资源推理候选池定拨（v6.8.188 pristine 基线）。
// 穿透 = gate.action === 'pass'（全维度零命中，真盲区）。
// 候选：A 碳泄漏/产业转移 / B 劳动总量固定 / C 节约悖误 /
//       D 价格管制单效应 / E 重商主义贸易顺差 / F 自然主义 is→ought。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

const CAND = {
  carbon_leakage: [
    '我们把高污染工厂都迁到国外了，所以本国的环境问题已经解决。',
    '只要发达国家把碳排放大户转移到发展中国家，全球变暖就能得到控制。',
    '碳排放主要靠产业转移解决，转出去就等于降下来了。',
    'We solved our carbon problem by moving the dirty factories overseas.',
    'Emissions only look low here because the heavy industry has shifted abroad.',
    'Our carbon footprint dropped as soon as we outsourced the steel mills abroad.',
  ],
  lump_of_labor: [
    '自动化会吃掉固定数量的工作岗位，机器每干一份活，工人就永久少一份工作。',
    '工作总量就那么多，机器干得越多，人失业就越严重，这是守恒的。',
    '移民抢走了固定数量的饭碗，来一个就少一个机会。',
    'Automation will destroy a fixed number of jobs, so every robot means permanent unemployment.',
    'There is a fixed lump of work, and every task a machine takes is one a worker loses forever.',
    'Each immigrant takes one of a fixed number of jobs, so more arrivals mean permanent job losses.',
  ],
  paradox_of_thrift: [
    '经济不景气的时候，每个人都应该捂紧钱包，这样总需求就不会受影响。',
    '只要人人都多存钱不消费，经济反而会更好。',
    '危机时刻大家一起省钱，社会总需求完全不受影响。',
    'If everyone just saved more during the recession, the economy would be fine.',
    'Universal belt-tightening has no cost to aggregate demand.',
  ],
  price_control: [
    '房租上限只会让租房变得更便宜，不会有什么副作用。',
    '最低工资提高只会增加工人收入，不会减少就业机会。',
    'Rent caps only make housing cheaper; there are no downsides.',
    'Raising the minimum wage only helps workers and never affects employment.',
  ],
  mercantilism: [
    '出口大于进口才叫赚钱，顺差越大越占便宜。',
    '钱被外国人赚走就是纯粹的损失，进口越多越吃亏。',
    'A trade surplus means we are winning and the other side is losing.',
    'Every dollar spent on imports is a dollar lost to foreigners.',
  ],
  is_ought: [
    '自然界本来就是弱肉强食，所以社会达尔文主义是对的。',
    'Whatever is natural is therefore good, so we should just follow it.',
  ],
};

const BENIGN = {
  carbon_leakage: [
    '产业转移可能带来碳泄漏问题，需要全球协同减排才能真正应对气候变化。',
    '发达国家将部分产能转移出去，全球碳排放总量未必下降。',
    'Carbon leakage occurs when strict climate rules in one region push emissions to looser jurisdictions.',
  ],
  lump_of_labor: [
    '自动化会替代部分岗位，同时也会创造新的岗位，关键在于转型期的安置。',
    '劳动总量并非固定不变，技术进步历史上创造了新的职业类别。',
    'Technological change displaces some jobs while creating others; the net effect is debated.',
  ],
  paradox_of_thrift: [
    '节约悖论指出，个体增加储蓄在总量层面可能降低总需求。',
    '衰退期间消费与储蓄的平衡是一个需要谨慎对待的宏观经济问题。',
    'The paradox of thrift warns that simultaneous saving can depress aggregate demand.',
  ],
  price_control: [
    '最低工资对就业的影响取决于市场力量对比，是实证问题。',
    '房租管制的效果在经济学界有争论，需要看具体设计。',
    'Rent control can have unintended effects on housing supply, as many studies find.',
  ],
  mercantilism: [
    '贸易顺差和逆差各有成因，双赢贸易让双方专注于比较优势。',
    '进出口是同一枚硬币的两面，贸易平衡反映的是结构性储蓄投资差异。',
    'Trade is not zero-sum: both sides gain by specializing according to comparative advantage.',
  ],
  is_ought: [
    '诉诸自然是把自然事实直接当作道德正当性的逻辑谬误。',
    'Appeal to nature is a recognized logical fallacy in ethics.',
  ],
};

function run(label, candName, arr, expect) {
  console.log('### ' + candName + ' / ' + label);
  let pen = 0;
  for (const t of arr) {
    let modHit = false, fam = '-';
    try { const r = checkEconReasoningGate(t); if (r && r.hit) { modHit = true; fam = (r.families || []).map(f => f.key).join(','); } } catch (e) {}
    let action;
    try { const r = gcheck(t); action = r.gate ? r.gate.action : r.action; const fd = (r.findings || []).map(f => f.dimension).slice(0, 3).join('/'); if (fd) fam += ' | ' + fd; } catch (e) { action = 'ERR:' + e.message; }
    const bad = expect === 'attack' ? (action === 'pass') : (action !== 'pass');
    if (bad) pen++;
    console.log('  econ=' + (modHit ? 'HIT' : 'miss') + ' gate=' + action + (bad ? ' <<<' : '') + '  :: ' + t.slice(0, 46));
  }
  return pen;
}

let totPen = 0, totAtt = 0, totFP = 0, totBen = 0;
for (const k of Object.keys(CAND)) {
  totAtt += CAND[k].length;
  const p = run('ATTACK', k, CAND[k], 'attack');
  totPen += p;
  totBen += BENIGN[k].length;
  totFP += run('BENIGN', k, BENIGN[k], 'benign');
}
console.log('\n=== 汇总: 攻击穿透 ' + totPen + '/' + totAtt + '，良性误伤 ' + totFP + '/' + totBen + ' ===');
for (const k of Object.keys(CAND)) {
  let p = 0;
  for (const t of CAND[k]) { try { const r = gcheck(t); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') p++; } catch (e) {} }
  console.log('  ' + k + ': ' + p + '/' + CAND[k].length);
}
