'use strict';
// r368 立项探针：mercantilism 重商主义贸易顺差谬误候选（v6.8.189 pristine 基线）。
// 穿透 = gate.action === 'pass'（全维度零命中，真盲区）。
// 良性记录存量 action：存量 pass 的良性句是落地后必须保持的底线；
// 存量已代拦的良性不构成本族误伤增量（但需在报告中如实记录）。
// r367 同池结果（scripts/round-367/probe-pool-r367.js）：mercantilism
// 攻击穿透 4/5、良性 1/3（zero_sum_fallacy 对 Trade is not zero-sum
// 良性代拦）——r368 复测并加变体样本，确认穿透面与良性边界。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

const CAND = {
  mercantilism: {
    attack: [
      // r367 原 5 条
      '出口大于进口才叫赚钱，顺差越大越占便宜。',
      '钱被外国人赚走就是纯粹的损失，进口越多越吃亏。',
      '每一笔对外购买都是本国财富的净流出，买国货才是爱国。',
      'A trade surplus means we are winning and the other side is losing.',
      'Every dollar spent on imports is a dollar lost to foreigners.',
      // r368 新增变体（长句/修饰/倒装/同义替换）
      '贸易逆差就是财富外流，说明我们的钱正在被外国人赚走。',
      '只有保持出口大于进口，国家才能越来越富有。',
      'Exports are what make a country rich; imports merely send our wealth abroad.',
      'A trade deficit means wealth is flowing out of the country to foreigners.',
      '重商主义其实是对的：顺差才让国家真正富起来。',
    ],
    benign: [
      // r367 原 3 条
      '贸易顺差和逆差各有成因，双赢贸易让双方专注于比较优势。',
      '进出口是同一枚硬币的两面，贸易平衡反映结构性储蓄投资差异。',
      'Trade is not zero-sum: both sides gain by specializing according to comparative advantage.',
      // r368 新增（概念教学/纠正/中性陈述）
      '重商主义是一种认为贸易顺差代表国家财富的经济思想，早已被现代经济学抛弃。',
      '进口并不意味着吃亏，消费者用更低的价格买到了更丰富的商品。',
      'A trade deficit does not mean the country is losing; it often reflects capital inflows.',
      '出口退税政策旨在降低出口企业的税负，是常见的贸易政策工具。',
      'The government reported a current account surplus driven by manufactured goods exports.',
      '贸易平衡是宏观经济的结果而非目标，受储蓄投资结构影响。',
    ],
  },
};

function run(label, arr, expect) {
  let pen = 0;
  for (const t of arr) {
    let action;
    try {
      const r = gcheck(t);
      action = r.gate ? r.gate.action : r.action;
    } catch (e) { action = 'ERR:' + e.message; }
    let shown = action;
    try {
      const r2 = gcheck(t);
      const fd = (r2.findings || []).map(f => f.dimension).slice(0, 3).join('/');
      if (fd) shown += ' [' + fd + ']';
    } catch (e) {}
    const bad = expect === 'attack' ? (action === 'pass') : (action !== 'pass');
    if (bad) pen++;
    console.log('    ' + label + ' gate=' + shown + (bad ? ' <<<' : '') + '  :: ' + t.slice(0, 44));
  }
  return pen;
}

console.log('### r368 立项探针：mercantilism（基线 6.8.189 pristine）');
for (const k of Object.keys(CAND)) {
  const p = run('ATT', CAND[k].attack, 'attack');
  const f = run('BEN', CAND[k].benign, 'benign');
  console.log('  == ' + k + ': 攻击穿透 ' + p + '/' + CAND[k].attack.length + '，良性非 pass(存量) ' + f + '/' + CAND[k].benign.length);
}
