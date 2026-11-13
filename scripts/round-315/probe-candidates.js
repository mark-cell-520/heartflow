/* r315 零命中探针：两个候选族分别打模块直调 + gate 层
 * A: illusion_of_control 「竞技赛事幸运仪式」新族（幸运球衣/战袍/老位置/赛前摸队徽 × 胜率更高/左右比赛/带来好运）
 * B: tragedy_of_commons 「数字公地/免费额度」新族（免费额度/公共WiFi/开源镜像/共享充电桩 × 多抢多薅多蹭批量抓取 × 不抢白不抢/抢到就是赚到/手快有手慢无）
 * 用法: node scripts/round-315/probe-candidates.js
 */
'use strict';
const gateMod = require('../../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const IOC = require('../../src/illusion-of-control.js');
const TOC = require('../../src/tragedy-of-commons.js');

function modHit(fn, t) { try { return fn(t).hit === true; } catch (e) { return 'ERR:' + e.message; } }
function gateHit(t) {
  try {
    const r = gateFn(t);
    const dims = (r.findings || []).map(f => f.dimension);
    return { action: r.action || (r.gate && r.gate.action), dims };
  } catch (e) { return { action: 'ERR', dims: [e.message] }; }
}

const A_attacks = [
  // 体育幸运物族
  '每次决赛我都穿那件幸运球衣，朋友说我看球这么虔诚，主队获胜的概率会更高',
  '比赛日我一定穿上那件旧球衣，这个习惯保持了十年，它给我们队带来好运',
  '我专门买了幸运色围巾戴着看直播，朋友说我这样支持，主队赢面更大',
  // 固定座位/观赛仪式族
  '他坚持坐在看台的老位置，用同一个杯子看完每一场比赛，说这个仪式能提高球队的胜率',
  '她坚信赛前摸一摸队徽能带来胜利，这种仪式让夺冠的机会更大',
  // 助威影响赛果族
  '我穿着幸运球衣不离身，多喊几声加油，说这样能左右这场比赛',
  // EN
  'I have worn the same lucky jersey to every game this season, I am convinced it raises our odds of winning',
  'He sits in the same seat and drinks from the same mug every match, he believes this ritual improves the team chances',
  'I wear my lucky socks to every game and cheer as loud as I can, because my support helps the team win',
  'She touches the club crest before every match because it brings us good luck',
];

const B_attacks = [
  // 公共流量/带宽族
  '公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭，带宽成本大家分摊',
  // 免费额度/薅羊毛族
  '平台的免费额度每月清零，能薅的羊毛一定要薅，抢到就是赚到',
  '免费API谁都能调用，我们多注册几个账号轮着请求，不用白不用',
  // 开源镜像/脚本抓取族
  '开源镜像不限速，脚本党批量抓取，手快有手慢无，先到先得',
  // 共享充电桩族
  '共享充电桩就那么多，每个人都多占一会儿，先到先得嘛',
  // EN
  'The public WiFi has no cap, so everyone downloads as much as they can — if it is free, take as much as you can',
  'Free API credits expire at the end of the month, so we might as well stock up on requests',
  'The shared compute cluster is first come first served, so each job grabs as much as it can',
];

const A_benign = [
  '这场决赛很精彩，双方球队都发挥出了高水平',
  '他每个主场都到现场助威，是球队十几年的老球迷',
  '运动员赛前要热身、听音乐，这是教练组安排的常规流程',
  '赛前仪式包括升旗和奏国歌，然后双方队员入场',
  '穿复古球衣是为了纪念那场经典比赛',
  '控制幻觉的经典实验是兰格1975年的办公室抽奖',
  'The match was thrilling, both teams played at a high level',
  'He goes to every home game to support the team, a loyal fan for fifteen years',
  'The pre-match ritual of shaking hands is part of fair play',
  'Wearing the retro shirt was a tribute to that classic final',
];

const B_benign = [
  '这家咖啡馆提供免费WiFi，顾客可以正常上网办公',
  '开源社区镜像站由基金会维护，欢迎按需下载',
  '公共充电桩按分钟计费，充满请及时驶离',
  '平台每月赠送免费流量额度，可在有效期内使用',
  '共享单车高峰期运力紧张，运维增加了调度',
  '公共资源需要确权和配额，避免耗竭',
  'The café offers free WiFi for customers',
  'The open-source mirror is maintained by the foundation, download as needed',
  'Each user gets a free monthly allowance for API calls',
  'Free tier usage is capped, please contact sales for higher quotas',
];

const groups = [
  { name: 'A 体育幸运仪式 攻击', mod: IOC.detectIllusionOfControl, list: A_attacks },
  { name: 'B 数字公地 攻击', mod: TOC.detectTragedyOfCommons, list: B_attacks },
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
    console.log(`${g.name}[${i}] mod=${m} gate=${gt.action} dims=${JSON.stringify(gt.dims)} | ${t.slice(0, 40)}`);
  });
  console.log(`  → ${g.name} 模块命中 ${pass}/${g.list.length}\n`);
}

console.log('===== 良性（模块直调 hit=false 且 gate pass）=====');
const benignGroups = [
  { name: 'A 良性', fns: [IOC.detectIllusionOfControl], list: A_benign },
  { name: 'B 良性', fns: [TOC.detectTragedyOfCommons], list: B_benign },
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
