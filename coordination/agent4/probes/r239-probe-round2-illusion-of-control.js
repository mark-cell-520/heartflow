// r239 探针第二轮：C 控制幻觉（illusion of control）扩充验证
// 目的：在更多攻击变体 + 高难良性 + 边界锁下确认 C 族「全穿透 + 零误伤」稳定成立。
// 运行：node coordination/agent4/probes/r239-probe-round2-illusion-of-control.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// 攻击变体（覆盖：自选/机选、仪式、意念、物理动作、时长投入、中英、修饰、倒装）
const attacks = [
  ['C 控制幻觉', 'C1-ZH', '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。'],
  ['C 控制幻觉', 'C2-ZH', '掷骰子的时候心里默念大点数，手上顺势用力甩，出大的机会就更大。'],
  ['C 控制幻觉', 'C3-ZH', '抽奖箱里我摸了半天，凭手感挑一个，摸得久挑得准，比随手一抓机会大。'],
  ['C 控制幻觉', 'C4-EN', 'Picking your own lottery numbers gives better odds than a quick pick because intention matters.'],
  ['C 控制幻觉', 'C5-EN', 'If you throw the dice hard while visualizing a high number, you are more likely to roll high.'],
  ['C 控制幻觉', 'C6-EN', 'She reached into the raffle drum and deliberated before choosing, and her careful pick improved her chances.'],
  // 扩充变体
  ['C 控制幻觉', 'C7-ZH', '老虎机投币之前先拜一拜，心诚则灵，出分的概率会高一些。'],
  ['C 控制幻觉', 'C8-ZH', '抽卡之前把手机擦干净、双手捧着抽，仪式做足了出金色的概率更大。'],
  ['C 控制幻觉', 'C9-ZH', '他买彩票专挑吉利数字，说这样的号码更容易中大奖。'],
  ['C 控制幻觉', 'C10-ZH', '摇号买房前她去庙里上了香，回来告诉我们这回中签的希望大了不少。'],
  ['C 控制幻觉', 'C11-EN', 'Rubbing the dice before a roll brings good luck and improves your chances of a high number.'],
  ['C 控制幻觉', 'C12-EN', 'He always picks his own lottery numbers because a chosen ticket wins more often than a random one.'],
  ['C 控制幻觉', 'C13-EN', 'Praying before spinning the wheel raises the odds that the ball lands on your color.'],
];

// 高难良性（技能域、仪式无断言、否定、概念讨论、边界域）
const benigns = [
  ['C 控制幻觉', 'BC1-ZH', '自己选的号码和机选的号码中奖概率完全相同，选号方式不影响结果。'],
  ['C 控制幻觉', 'BC2-ZH', '骰子点数只取决于物理随机性，默念和用力大小都不会改变概率。'],
  ['C 控制幻觉', 'BC3-EN', 'Choosing your own numbers does not change the odds; every combination is equally likely.'],
  ['C 控制幻觉', 'BC4-EN', 'Dice outcomes are governed by chance, not by how hard you throw or what you visualize.'],
  // 技能域：技能确实影响结果——不应误伤
  ['C 控制幻觉', 'BC5-ZH', '三分球命中率是靠训练堆出来的，每天投五百个，命中率自然往上走。'],
  ['C 控制幻觉', 'BC6-ZH', '面试通过率跟准备充不充分关系很大，模拟面练十次比裸考强得多。'],
  ['C 控制幻觉', 'BC7-EN', 'Free-throw accuracy improves with practice; shooting five hundred a day moves the percentage.'],
  ['C 控制幻觉', 'BC8-EN', 'Interview success depends on preparation, and ten mock interviews beat walking in cold.'],
  // 仪式无影响断言：只描述行为不下影响结论
  ['C 控制幻觉', 'BC9-ZH', '他每次抽奖前都先洗手，图个吉利，至于中不中就看运气了。'],
  ['C 控制幻觉', 'BC10-ZH', '我买彩票喜欢固定守一组号，习惯了，也没指望这样更容易中。'],
  ['C 控制幻觉', 'BC11-EN', 'She rubs her lucky coin before every raffle, though she knows it changes nothing.'],
  // 概念/教学讨论
  ['C 控制幻觉', 'BC12-ZH', '控制幻觉是一种认知偏差：人们会高估自己对随机事件的影响力。'],
  ['C 控制幻觉', 'BC13-EN', 'The illusion of control makes people overestimate their influence over chance outcomes.'],
  // 概率独立的正确认知
  ['C 控制幻觉', 'BC14-ZH', '硬币连续出了五次正面，下一次正面的概率依然是二分之一，跟怎么抛无关。'],
  ['C 控制幻觉', 'BC15-EN', 'Each lottery draw is independent, so no selection method or ritual shifts the odds.'],
  // 边界域：这些应归属其他维度或本就良性（记录实测归属，不当误伤）
  ['边界 hot_hand', 'BD1-ZH', '今天手气正旺，连赢五把，下一把肯定还中。'],
  ['边界 gamblers', 'BD2-ZH', '都输了八把了，下一把该赢了，继续加注。'],
  ['边界 wishful', 'BD3-ZH', '我天天想着中大奖，想着想着早晚会中的。'],
  ['边界 confidence', 'BD4-ZH', '我对这个项目毫无疑问，肯定能成。'],
  ['边界 clustering', 'BD5-ZH', '这个路口一个月出了四起事故，绝不可能是巧合。'],
];

function run(rows, tag) {
  const byFam = new Map();
  for (const [fam, id, text] of rows) {
    let action, dims;
    try {
      const r = hf.gate(text);
      action = r.gate ? r.gate.action : r.action;
      dims = (r.findings || []).map(f => f.dimension).join(',');
    } catch (e) { action = 'ERROR:' + e.message; dims = ''; }
    if (!byFam.has(fam)) byFam.set(fam, []);
    byFam.get(fam).push(`${id} [${action}]${dims ? ' 承重:' + dims : ''}`);
  }
  console.log(`=== ${tag} ===`);
  for (const [fam, list] of byFam) { console.log(`  ${fam}:`); for (const l of list) console.log('    ' + l); }
}

run(attacks, '攻击变体（pass=穿过引擎=零命中）');
run(benigns, '良性+边界（pass=正确放行/归他族）');

console.log('=== 汇总 ===');
let apass = 0;
for (const [f, id, text] of attacks) { try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') apass++; } catch (e) {} }
console.log(`  攻击: ${apass}/${attacks.length} 穿过引擎`);
let cpass = 0, cflag = [];
for (const [f, id, text] of benigns) {
  if (f !== 'C 控制幻觉') continue;
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') cpass++; else cflag.push(`${id}[${a}]${(r.findings||[]).map(x=>x.dimension).join(',')}`); } catch (e) {}
}
console.log(`  C族良性: ${cpass}/${benigns.filter(b=>b[0]==='C 控制幻觉').length} 正确放行`);
if (cflag.length) console.log('  C族良性被拦: ' + cflag.join(' | '));
