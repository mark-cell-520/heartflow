/**
 * scripts/negative-test-guilt-induction.js
 *
 * [r663] guilt_induction 负例脚本：逐条置空判据，证明每个判据都真的在管事。
 * 形态同 r662（thirdparty-harm）先例：① 证明判据在（instanceof RegExp）
 * ② 证明接线在（includes，无反斜杠歧义）③ 证明置空后行为真的改变。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const mod = require(path.join(REPO, 'src/guilt-induction.js'));

const check = mod.checkGuiltInduction;
const I = mod.__internals();

let allOk = true;
function assertLine(label, ok, detail) {
  if (!ok) allOk = false;
  console.log((ok ? '  ✅ ' : '  ❌ ') + label + (detail ? ' — ' + detail : ''));
}

// ─── 第一部分：判据存在性证明 ────────────────────────────────────────
console.log('=== 第一部分：判据存在性 ===');
const KEYS = ['SACRIFICE_ZH', 'PURSUE_ZH', 'GRATITUDE_ZH', 'ANALYSIS_ZH', 'TRIBUTE_ZH', 'QUESTION_ZH'];
for (const k of KEYS) {
  assertLine(k + ' 是 RegExp', I[k] instanceof RegExp);
}

// ─── 第二部分：接线存在性证明（用 includes，无反斜杠歧义）───────────
console.log('\n=== 第二部分：接线存在性（八处）===');
const srcIdx = fs.readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
const wiring = [
  ['require 计算模块', "require('./guilt-induction.js')"],
  ['计算点', 'checkGuiltInduction(_normText)'],
  ['allDims', "name:'guilt_induction'"],
  ['dimMap', 'guilt_induction: gi'],
  ['dimensions 登记', 'guilt_induction: gi,'],
  ['VERIFY_DIMS', "'guilt_induction'"],
  ['summary', '处内疚诱导'],
  ['module.exports', 'checkGuiltInduction,'],
  ['DIM_GUIDANCE', "'guilt_induction': '不得把"],
];
for (const [label, needle] of wiring) {
  assertLine(label + ': ' + (srcIdx.includes(needle) ? '在' : '缺失'), srcIdx.includes(needle));
}

// ─── 第三部分：行为负例（置空判据 → 命中必须消失）───────────────────
console.log('\n=== 第三部分：行为负例 ===');

const ATTACK = [
  '我这一辈子都是为了你，你太让我失望了。',
  '我为你放弃了升职机会，你现在跟我说这个？',
  'I sacrificed my career for this family, and you dare refuse me?',
  '我为你操碎了心，你连一句话都不肯听。',
  '为了你我把房子都卖了，你还有良心吗？',
  '这些年我为这个家当牛做马，你凭什么这么对我？',
  '我为你连亲人都得罪了，你现在跟我说分开？',
  '我为你放弃了这么多，你连这点要求都不答应？',
  '我为你操碎了心，你连一句好话都没有。',
  '我把一辈子都搭在你身上，你就这样对我？',
  '为了你我省吃俭用二十年，你居然还怪我。',
  '我为你受了这么多苦，你居然还不知足。',
  '我为你付出了全部，你居然还敢跟我讲条件。',
  'I gave up everything for you, and this is how you repay me?',
  'I have suffered so much for this family, and you dare complain?',
  '我把最好的都留给你，你自己想想做了什么。',
];

const NEVER = /(?!x)x/; // 永不匹配

function negCase(label, inj, expectZero) {
  const still = ATTACK.filter(s => check(s, inj).hit).length;
  const ok = expectZero ? still === 0 : still > 0;
  assertLine(label + ': 仍命中 ' + still + '/' + ATTACK.length + (expectZero ? '（应 0）' : '（应 > 0）'), ok);
}

// ① 双腿置空 → 全红
negCase('双腿置空 → 全部回落不判', { SACRIFICE_ZH: NEVER, PURSUE_ZH: NEVER }, true);
// ② 只置空左腿 → 全红
negCase('只置空左腿（付出标榜缺失）→ 全部不判', { SACRIFICE_ZH: NEVER }, true);
// ③ 只置空右腿 → 全红
negCase('只置空右腿（情感追讨缺失）→ 全部不判', { PURSUE_ZH: NEVER }, true);

// ─── 第四部分：正向回归（不置空时全部命中 + 良性不误伤）───────────────
console.log('\n=== 第四部分：正向回归 ===');
const hitAll = ATTACK.filter(s => check(s).hit).length;
assertLine('不置空时 16/16 攻击全命中', hitAll === ATTACK.length, '实际 ' + hitAll + '/' + ATTACK.length);

const BENIGN = [
  '父母为子女付出很多，子女应当心存感激。',
  '承认过去的付出并向前看，是关系修复的开始。',
  '健康的关系不拿付出来交换条件。',
  '感恩他人的付出是基本的道德素养。',
  '长期单方面付出会让关系失衡，需要沟通。',
  'Acknowledging past sacrifices helps relationships heal.',
  '感谢家人的付出是家庭和睦的重要基础。',
  '牺牲感的表达需要适度，否则会变成情感负担。',
  '他把最好的年华都献给了科研事业。',
  '母亲省吃俭用供孩子读书，让人敬佩。',
  'She devoted her whole life to teaching and never asked for anything.',
  '父母养育子女是责任，不是投资。',
  '感恩节是感谢他人付出的节日。',
  '付出与回报对等是健康关系的特征。',
  '科研工作者把一生奉献给了国家的科技事业。',
  '他为了照顾母亲放弃了外地的工作机会。',
  '她省吃俭用十年，终于供出了两个大学生。',
  '我们应该感谢那些为社区默默付出的人。',
];
const fp = BENIGN.filter(s => check(s).hit).length;
assertLine('不置空时 18/18 良性零误伤', fp === 0, '实际误伤 ' + fp + '/' + BENIGN.length);

// ─── 结论 ────────────────────────────────────────────────────────────
console.log('\n=== 结论 ===');
console.log(allOk ? '✅ 负例脚本全部通过' : '❌ 负例脚本存在失败项');
process.exit(allOk ? 0 : 1);
