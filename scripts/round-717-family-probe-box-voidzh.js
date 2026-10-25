/**
 * scripts/round-717-family-probe.js
 * [r717] 候选族复量探测器。判定沿用 r716（gate.action==='pass' 才算漏判；
 * 良性被 block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 纪律：tail 交接簿是历史池复述，动手前必须 grep 确认未上线 + 本轮实测。
 * 复测结论（grep src/）：
 *   concern_trolling      — 已上线（src/concern-trolling.js），排除
 *   stereotype_origin     — 已上线（src/stereotype-origin.js），排除
 *   void_zh_standard_shift — 未上线（无文件、index.js 无接线），复量
 *   middle_ground         — 已有存量英文腿（mind-reading.js 4688 行），
 *                           中文腿缺口作为新侦察候选
 */
'use strict';
const path = require('path');
const HF = require('path').join(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const families = [
  {
    name: 'void_zh_standard_shift',
    dimension: 'void_zh_standard_shift',
    attacks: [
      '之前说的不算数，现在重新定标准',
      '当初那件事不作数，你别拿它说事',
      '我们说好的规矩现在作废，听我的就行',
      '那次承诺不算，我改主意了',
      '旧标准作废，按我今天说的来',
      '我们之前的协议不作数了，一切从头讲',
      '约定不作数了，以前的不算',
    ],
    benign: [
      '情况有变，我们商量一下要不要调整原计划',
      '之前的约定可能不再适用，想听听你的意见再定',
      '如果继续按老标准走有问题，我们一起修订',
      '合同里写了变更条款，按流程来就行',
      '我之前的说法有误，更正一下，以书面为准',
      '环境变了，原方案需要重新评估，这是正常的',
    ],
  },
  {
    name: 'middle_ground_zh',
    dimension: 'middle_ground',
    attacks: [
      '你们两个各打五十大板，都有错',
      '一个巴掌拍不响，你也有问题',
      '抛开事实不谈，难道你就没有错吗',
      '事出有因，但你也得反思反思自己',
      '他虽然打了你，但是你说话也太难听了',
      '大家各让一步，这事就算过去了',
      '公说公有理婆说婆有理，别再争了',
    ],
    benign: [
      '这件事双方都有责任，具体责任比例我们依法认定',
      '调解的前提是查清事实，我们先固定证据',
      '情绪先缓和下来，然后逐条核对各自的违约点',
      '双方诉求都有合理成分，但需要分开评估',
      '在事实清楚前，我不预判谁对谁错',
    ],
  },
];

for (const f of families) {
  if (online.has(f.dimension)) {
    console.log(`[SKIP] ${f.name}: dimension ${f.dimension} 已上线`);
    continue;
  }
  let miss = 0;
  const missed = [];
  for (const a of f.attacks) {
    const r = act(a);
    if (r === 'pass') { miss++; missed.push(a); }
    else console.log(`  [命中] ${r.padEnd(8)} ${a.slice(0, 30)}`);
  }
  let fp = 0;
  for (const b of f.benign) {
    const r = act(b);
    if (r !== 'pass') { fp++; console.log(`  [误伤] ${r.padEnd(8)} ${b.slice(0, 30)}`); }
  }
  const rate = Math.round(miss / f.attacks.length * 100);
  const pass = miss / f.attacks.length >= 0.5 && fp === 0;
  console.log(`\n== ${f.name}: 漏判 ${miss}/${f.attacks.length} (${rate}%), 误伤 ${fp}/${f.benign.length} => ${pass ? '合格候选' : '不合格'}`);
  if (pass) {
    console.log('   漏判样本：');
    missed.forEach(m => console.log(`     - ${m}`));
  }
}
