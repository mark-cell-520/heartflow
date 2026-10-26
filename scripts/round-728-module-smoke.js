/**
 * scripts/round-728-module-smoke.js
 * [r728] no_true_scotsman 模块层冒烟：攻击集（探测器 24 条）+ 良性集
 * （探测器 10 条 + 豁免承重样本 4 条）。判定腿/豁免常量逐项可注入。
 */
'use strict';

const path = require('path');
const mod = require(path.join(__dirname, '..', 'src', 'no-true-scotsman.js'));
const { checkNoTrueScotsman } = mod;

const attacks = [
  '真正爱你的男人，不会计较你花多少钱',
  '真正的专家不会犯这种低级错误',
  '真爱一个人就不会计较得失',
  '真正的粉丝早就买了，没买的根本不是粉丝',
  '合格的妈妈怎么会让孩子哭成这样',
  '真正的专业人士不会问这种问题',
  '一个真正想学好的人，不会整天找借口',
  '真正为团队付出的人，不会计较加班费',
  '真正有格局的领导，不会盯着考勤',
  '真心想改的人，不需要别人催',
  '真正优秀的学生，不需要老师盯着',
  '敬业的人不会抱怨，抱怨的就是不敬业',
  'He is not a true fan if he criticizes the team.',
  'No real expert would ever make that mistake.',
  'A truly loving partner would never keep score.',
  'If she were a real friend, she would have shown up.',
  '真正的设计师从来不用参考别人的作品',
  '说真的，但凡有点良心的人都不会在背后议论同事',
  '有点自尊的男人，不会接受女朋友接济',
  '真正吃得苦的人，不会把累挂在嘴边',
  '一个称职的父亲怎么会错过孩子的家长会',
  '真兄弟不会计较这些，计较就不是真兄弟',
  'Real artists never trace references, they draw from imagination alone.',
  'A genuinely caring mother would never put herself first.',
];

const benign = [
  // 探测器良性集（r728 实测存量零误伤）
  '他把所有反例都重新定义排除掉了，这是无真正的苏格兰人谬误',
  '先定义「真正的专家」指什么，再讨论他算不算',
  '我们可以约定术语：文中「真粉丝」指连续三年购票者',
  '用「真正爱一个人」当标准前，要先说清哪些行为算证据',
  'No true Scotsman is a fallacy: redefining the group to exclude counterexamples.',
  '说「不是真粉丝」之前，先给出可检验的粉丝定义',
  '排除样本要写明标准，不能把不符合预期的都排除掉',
  '「优秀」需要可操作的指标，不是反过来排除不符合的人',
  '他自称是专家，但既拿不出项目也说不清方法论，这个自称缺乏依据',
  '你自称爱这个团队，却从来不出席复盘会，这怎么解释',
  // 豁免承重样本（auth×exclusion 共现，仅豁免词救命——负例注入要翻转这些）
  '无真正的苏格兰人谬误就是这样：先把「真正的专家」定义为不会犯错的人',
  '先定义「真正的粉丝」的标准：连续三年购票者，不符合的就不是',
  '真正的朋友不是不会拒绝你，而是拒绝的时候会说明原因',
  '他自称真正的专家，但从来解决不了实际问题，也拿不出项目',
  '真正的粉丝也许不会第一时间买，但长期支持更重要',
  // 自然良性补充（无 auth×exclusion 共现）
  '真正的风险在于数据样本不够，需要扩大采集范围',
  'true statement requires evidence, so we should verify the source first',
  '他根本不是医生，这是执业资格系统里查得到的',
];

console.log('=== [r728] no_true_scotsman 模块层冒烟 ===');
let aHit = 0;
for (const t of attacks) {
  const r = checkNoTrueScotsman(t);
  if (r.hit) aHit++;
  console.log('  ' + (r.hit ? 'HIT ' : 'MISS') + ' [' + r.score + '] ' + t.slice(0, 50));
}
console.log('攻击命中: ' + aHit + '/' + attacks.length);

let fp = 0;
const fpList = [];
for (const t of benign) {
  const r = checkNoTrueScotsman(t);
  if (r.hit) { fp++; fpList.push(t.slice(0, 50)); }
  console.log('  ' + (r.hit ? 'FP  ' : 'ok  ') + ' [' + r.score + '] ' + t.slice(0, 50));
}
console.log('良性误伤: ' + fp + '/' + benign.length);
if (fpList.length) console.log('误伤样本: ' + fpList.join(' | '));

// 判据腿承重验证（置空后攻击必须停判）
const I = mod.__internals;
const NEVER = /(?!x)x/;
console.log('\n--- 判据腿置空验证（攻击集应全部停判）---');
for (const leg of ['AUTH_CN_ROLE_RE', 'AUTH_CN_LOVE_RE', 'AUTH_CN_WHOEVER_RE', 'AUTH_CN_VIRTUE_RE',
  'AUTH_CN_TRUE_SHORT_RE', 'AUTH_EN_ROLE_RE', 'AUTH_EN_DENIAL_RE',
  'EXCLUSION_CN_RE', 'EXCLUSION_EN_RE', 'CONDITIONAL_CN_RE', 'CONDITIONAL_EN_RE']) {
  const saved = I[leg];
  I[leg] = NEVER;
  let still = 0;
  for (const t of attacks) if (checkNoTrueScotsman(t).hit) still++;
  I[leg] = saved;
  console.log('  置空 ' + leg + ' → 攻击仍命中 ' + still + '/' + attacks.length + (still === 0 ? '（承重✓）' : '（不承重✗）'));
}

console.log('\n--- 豁免常量置空验证（豁免承重样本应翻成命中）---');
const exemptionSamples = [
  { k: 'META_NOUN_RE', t: '无真正的苏格兰人谬误就是这样：先把「真正的专家」定义为不会犯错的人' },
  { k: 'DEFINITION_SETTING_RE', t: '先定义「真正的粉丝」的标准：连续三年购票者，不符合的就不是' },
  { k: 'NEGATION_FLIP_RE', t: '真正的朋友不是不会拒绝你，而是拒绝的时候会说明原因' },
  { k: 'EVIDENCE_CHALLENGE_RE', t: '他自称真正的专家，但从来解决不了实际问题，也拿不出项目' },
  { k: 'HEDGE_RE', t: '真正的粉丝也许不会第一时间买，但长期支持更重要' },
];
for (const { k, t } of exemptionSamples) {
  const saved = I[k];
  I[k] = NEVER;
  const flipped = checkNoTrueScotsman(t).hit;
  I[k] = saved;
  const normal = checkNoTrueScotsman(t).hit;
  console.log('  置空 ' + k + ' → 样本「' + t.slice(0, 24) + '…」正常判=' + normal + ' 置空后判=' + flipped
    + (!normal && flipped ? '（承重✓）' : '（不承重✗）'));
}
