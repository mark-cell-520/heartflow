// 逐支诊断：分开测每个正则，看哪一支没命中
'use strict';
const gate = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');

const CROWD_ZH = /(?:大家|别人|其他人|所有人|人人|全?公司|同行(?:们)?|周围的人|身边的人|众人|同事们|同学们|大多数人|不少人|很多人|全场|全国|同志(?:们)?|兄弟们|姐妹们)(?:都|全都|也|一向|向来|历来|从来|一直|一个个|各自)?(?:是)?(?:这么|这样|那样)?|别人|其他人/;
const CROWD_EN = /\b(?:everyone(?: else)?|everybody(?: else)?|all(?: the)? (?:other|rest)(?: \w+)?|nobody else|no one else|the other \w+|most (?:people|others|users|teams|reviewers)|others)\b/i;
const SINGLE_OUT_ZH = /(?:就|只有|唯独|偏偏|只好|惟有)(?:你|你们)(?:一个(?:人)?)?(?:在)?(?:特殊|另类|搞特殊|与众不同|意见|反对|质疑|提意见|挑刺|不同意|受不了|有疑问|有意见|事儿多|毛病|挑剔|唱反调|唱对台戏|不合群|难搞|不好相处|做不了|办不到|完成不了)|(?:为何|为什么)(?:又)?(?:只有|就|偏偏)(?:你|你们)(?:在)?(?:反对|质疑|提意见|挑刺|不同意|受不了|有疑问|有意见|事儿多|毛病|挑剔|唱反调|不合群|难搞|不好相处|问题多|做不了|办不到|完成不了)|(?:怎么|为何|为什么)(?:就|偏|偏偏)?(?:你|你们)(?:受不了|特殊|另类|与众不同|事儿多|毛病|挑剔|难搞|不好相处|问题多|意见多|有意见|做不了|办不到|完成不了|有疑问)|(?:你|你们)(?:凭什么|凭什么敢)(?:例外|特殊|与众不同|反对|质疑|不一样|有意见|不同意)/;
const SINGLE_OUT_EN = /\b(?:why|how come)\s+(?:is|are|do|does)?\s*(?:only\s+)?(?:you|your \w+)\s+(?:the only one\s+)?(?:complaining|objecting|arguing|struggling|having (?:a )?problem|making a fuss|causing trouble|questioning|disagreeing|unhappy|dissatisfied|upset)|(?:only|just)\s+(?:you|your \w+|your team)\s+(?:is|are|has|have|seems? to have|thinks?|objected?|complained?|raised)\b/i;

const CASES = [
  '同行们都顺利交付了，偏偏你说做不了。',
  '周围人都说没问题，就你一个人有疑问。',
  'All the other teams shipped on time, only your team objects.',
];
for (const t of CASES) {
  console.log(`cz=${CROWD_ZH.test(t)} ce=${CROWD_EN.test(t)} sz=${SINGLE_OUT_ZH.test(t)} se=${SINGLE_OUT_EN.test(t)}`);
}
console.log('done');
