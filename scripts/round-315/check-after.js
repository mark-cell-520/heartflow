/* r315 改后验证：两族攻击命中 + 良性零误伤（模块直调）
 * 用法: node scripts/round-315/check-after.js
 */
'use strict';
const IOC = require('../../src/illusion-of-control.js');
const TOC = require('../../src/tragedy-of-commons.js');

const A = [
  '每次决赛我都穿那件幸运球衣，朋友说我看球这么虔诚，主队获胜的概率会更高',
  '比赛日我一定穿上那件旧球衣，这个习惯保持了十年，它给我们队带来好运',
  '我专门买了幸运色围巾戴着看直播，朋友说我这样支持，主队赢面更大',
  '他坚持坐在看台的老位置，用同一个杯子看完每一场比赛，说这个仪式能提高球队的胜率',
  '她坚信赛前摸一摸队徽能带来胜利，这种仪式让夺冠的机会更大',
  '我穿着幸运球衣不离身，多喊几声加油，说这样能左右这场比赛',
  'I have worn the same lucky jersey to every game this season, I am convinced it raises our odds of winning',
  'He sits in the same seat and drinks from the same mug every match, he believes this ritual improves the team chances',
  'I wear my lucky socks to every game and cheer as loud as I can, because my support helps the team win',
  'She touches the club crest before every match because it brings us good luck',
];
const B = [
  '公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭，带宽成本大家分摊',
  '平台的免费额度每月清零，能薅的羊毛一定要薅，抢到就是赚到',
  '免费API谁都能调用，我们多注册几个账号轮着请求，不用白不用',
  '开源镜像不限速，脚本党批量抓取，手快有手慢无，先到先得',
  '共享充电桩就那么多，每个人都多占一会儿，先到先得嘛',
  'The public WiFi has no cap, so everyone downloads as much as they can — if it is free, take as much as you can',
  'Free API credits expire at the end of the month, so we might as well stock up on requests',
  'The shared compute cluster is first come first served, so each job grabs as much as it can',
];
const AB = [
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
const BB = [
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

let aOK = 0, bOK = 0, fp = 0;
for (const t of A) { const r = IOC.detectIllusionOfControl(t); if (r.hit) aOK++; else console.log('A MISS:', t); }
for (const t of B) { const r = TOC.detectTragedyOfCommons(t); if (r.hit) bOK++; else console.log('B MISS:', t); }
console.log('A 体育幸运仪式命中', aOK + '/' + A.length, '| B 数字公地命中', bOK + '/' + B.length);
for (const t of AB) if (IOC.detectIllusionOfControl(t).hit) { fp++; console.log('A FP:', t); }
for (const t of BB) if (TOC.detectTragedyOfCommons(t).hit) { fp++; console.log('B FP:', t); }
console.log('良性误伤', fp + '/' + (AB.length + BB.length));
