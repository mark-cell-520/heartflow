/* r314 零命中探针：三个候选族分别打模块直调 + gate 层
 * A: present_bias 「拖延许可×即时满足」新族（下次一定/先X了再说/今朝有酒/车到桥头自然直 + YOLO/starting Monday）
 * B: endowment_effect 「情义无价×我的就是更好的」新族（不是钱的事/千金不换/什么都替代不了 + not for all the money）
 * C: average_marginal_conflation 平均概率→边际概率新族（平均成功率80%下一次也成）
 * 用法: node scripts/round-314/probe-candidates.js
 */
'use strict';
const path = require('path');
const gateMod = require('../../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const PB = require('../../src/present-bias.js');
const EE = require('../../src/endowment-effect.js');
const AMC = require('../../src/average-marginal-conflation.js');

function modHit(fn, t) { try { return fn(t).hit === true; } catch (e) { return 'ERR:' + e.message; } }
function gateHit(t) {
  try {
    const r = gateFn(t);
    const dims = (r.findings || []).map(f => f.dimension);
    return { action: r.action || (r.gate && r.gate.action), dims };
  } catch (e) { return { action: 'ERR', dims: [e.message] }; }
}

const A_attacks = [
  // 拖延许可腿（下次一定/过几天/年后/改天/忙完这阵/等X过后/发工资再）
  '减肥下次一定，今晚这顿火锅先痛快吃了',
  '戒烟从下个月再开始，今天这根先抽完',
  '学习改天再说，现在先开黑玩两把',
  '存款等双十一买完再开始，现在先刷卡住进想要的房子',
  '锻炼说过几天再说，今晚先躺平摆烂',
  '体检年后再说，今晚先痛快吃了',
  '存钱等发工资再存，现在先犒劳自己',
  '理财过完这阵再说，现在先享受了再说',
  '运动等忙完这阵，现在先刷会儿视频',
  // 即时满足新腿（今朝有酒/能玩一天是一天/趁现在及时行乐/开心一天是一天）
  '今朝有酒今朝醉，体检以后再说',
  '能玩一天是一天，作业明天再说',
  '开心一天是一天，还款是以后的事',
  '趁还年轻及时行乐，养老是以后的问题',
  '趁现在活得痛快，谁管明天怎么样',
  // 未来自我料理族（车到桥头/后人智慧/儿孙福）
  '车到桥头自然直，未来的债未来再说',
  '相信后人的智慧，现在先舒服了',
  '儿孙自有儿孙福，现在先自己快活',
  '儿孙自有儿孙福，房贷慢慢还',
  // EN
  "I'll start tomorrow, tonight I want to enjoy what I can actually feel",
  'Saving can wait until next month, right now I need to treat myself',
  "I'll deal with it later, YOLO — be happy today",
  'Starting Monday for sure, this weekend I am going to party',
  'Exercise can wait, live for today and let future me handle it',
  "I'll save after this purchase, might as well enjoy it now",
  'You only live once, who cares what happens tomorrow',
];

const B_attacks = [
  '这把吉他是我的，陪了我十年，这不是钱的事',
  '老房子是父亲留给我的，情义无价，给多少都不卖',
  '这幅画是我亲手画的，感情无价，出多少都不换',
  '我的旧车开了二十年，千金不换，低于这个价免谈',
  '这块表是我戴了半辈子的，什么都替代不了，买不走',
  '咱家的老作坊是我一手经营起来的，万金不换，说什么都不卖',
  '这只猫是我看着长大的，拿什么我都换不来',
  '自己家的宅基地，祖祖辈辈传下来的，不是钱能衡量的',
  'This watch is mine, I have had it for thirty years, it is not for all the money in the world',
  'You cannot put a price on my grandfather\'s desk, I would not trade it for anything',
  'My first guitar is irreplaceable to me, no price could ever be enough',
  'The old shop is ours, we built it from nothing, money cannot buy what it means to us',
];

const C_attacks = [
  '平均成功率有百分之八十，所以下一次尝试也一定成功',
  '平均每十个客户能成一单，下一个客户也肯定能成',
  '平均转化率百分之五，再多一个用户也能转化',
  '平均命中率六成，下一发也照样能中',
  'The average success rate is eighty percent, so the next attempt will also succeed',
  'Average conversion is five percent, so one more user will also convert',
];

const A_benign = [
  '把大目标拆成今天就能完成的小步，从本周开始执行',
  '每月固定存钱，截止日期前提前动手完成',
  '先完成论文再玩游戏，今日事今日毕',
  '双曲贴现是行为经济学的经典概念，Laibson 1997 年有系统研究',
  '他知道熬夜的代价，所以设了闹钟提醒自己早睡',
  '他知道未来要还房贷，所以现在开始每月记账',
  'Breaking the goal into small steps and starting early is the standard advice',
  'I will start tomorrow because I have already planned the whole week',
];
const B_benign = [
  '按市场价挂牌，专业估价作依据，该卖就卖',
  '虽然陪了我很多年，但情感估值不能作为定价依据',
  '留着自住，短期内不打算交易',
  '禀赋效应是 Thaler 提出的经典现象，教学中常用马克杯实验说明',
  'It is worth exactly what the appraiser said, sell at market value',
  'Keeping it for personal use, no plan to sell anytime soon',
];
const C_benign = [
  '平均成功率百分之八十，但不意味着下一次也一定成功',
  '教材上说，平均转化率不能直接推断单个用户的转化概率',
  '平均命中率六成，下一发可能中也可能不中',
  'The average rate does not tell you the probability of the next single event',
];

const groups = [
  { name: 'A present_bias 攻击', mod: PB.detectPresentBias, modName: 'present-bias', list: A_attacks },
  { name: 'B endowment 攻击', mod: EE.detectEndowmentEffect, modName: 'endowment-effect', list: B_attacks },
  { name: 'C amc 攻击', mod: AMC.checkAverageMarginalConflation, modName: 'average-marginal-conflation', list: C_attacks },
];
console.log('===== 攻击族穿透（模块直调 hit / gate action+dims）=====');
for (const g of groups) {
  let pass = 0;
  g.list.forEach((t, i) => {
    const m = modHit(g.mod, t);
    const gt = gateHit(t);
    const modOk = m === true;
    const gateOk = gt.action && gt.action !== 'pass';
    if (modOk) pass++;
    console.log(`${g.name}[${i}] mod=${m} gate=${gt.action} dims=${JSON.stringify(gt.dims)} | ${t.slice(0, 42)}`);
  });
  console.log(`  → ${g.name} 模块命中 ${pass}/${g.list.length}\n`);
}

console.log('===== 良性（模块直调 hit=false 且 gate pass）=====');
const benignGroups = [
  { name: 'A 良性', fns: [PB.detectPresentBias], list: A_benign },
  { name: 'B 良性', fns: [EE.detectEndowmentEffect], list: B_benign },
  { name: 'C 良性', fns: [AMC.checkAverageMarginalConflation], list: C_benign },
];
for (const g of benignGroups) {
  let clean = 0;
  g.list.forEach((t, i) => {
    const modHits = g.fns.map(f => modHit(f, t));
    const gt = gateHit(t);
    const ok = modHits.every(h => h === false) && gt.action === 'pass';
    if (ok) clean++;
    console.log(`${g.name}[${i}] mod=${JSON.stringify(modHits)} gate=${gt.action} dims=${JSON.stringify(gt.dims)} | ${t.slice(0, 40)}`);
  });
  console.log(`  → ${g.name} 零误伤 ${clean}/${g.list.length}\n`);
}
