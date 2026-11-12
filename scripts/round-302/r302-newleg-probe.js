'use strict';
// r302 变体矩阵素材生成 + 新腿词表候选承重验证
// 目的：在写死进 src/regression-to-the-mean.js 之前，先用正则候选逐条
//   验证「新族变体命中」与「边缘良性不误伤」，避免盲目入库。
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

// ── 候选新腿 ────────────────────────────────────────────────
// 族 I：REG_DOWN_ZH 普通比较级落差形（不是暴跌/崩盘的极端词，而是
//   「与上一期相比变差了」的普通落差陈述）
const REG_DOWN_CMP_ZH = [
  /(?:成绩|分数|业绩|绩效|排名|名次|状态|水平|数据|指标|销量|产量|收入|得分|反响|口碑)[^。；，]{0,6}(?:差了|降了|低了|下去了|不如|下滑|倒退|退步|缩水|走低|变差|不如前|不及|逊于|弱了)/,
  /考差了|考砸了|考坏了|没考好|考得差|发挥失常|失常|失手|失利|栽了|翻车|掉链子|走了下坡|走下坡/,
  /(?:这次|这回|本期|这个月|今年|随后|之后|接着|后来)[^。；，]{0,12}(?:差|低|弱|糟|惨|缩|跌|降|退|不如|不及|下滑|倒退|缩水|滑坡)/,
  /(?:不如|不及|逊于)(?:上|前|从)/,
  /(?:反响|口碑|评价|表现|发挥)[^。；，]{0,4}(?:不如|不及|逊于)/,
  // 高位→普通（双向）：极端词与「只是/仅是普通/中游」互为邻居，
  //   允许中间穿过「，上个月」这类时间短语；两个方向都收
  /(?:冠军|第一|榜首|头名|销冠|巅峰|最好|最强|最佳)[^。；]{0,16}(?:只是|仅是|仅为|不过是|仅仅是|只|仅)[^。；]{0,6}(?:普通|中游|一般|平平|寻常|平凡|平均|平常|中等)/,
  /(?:只是|仅是|仅为|不过是|仅仅是|只|仅)[^。；]{0,6}(?:普通|中游|一般|平平|寻常|平凡|平常|中等)[^。；]{0,16}(?:冠军|第一|榜首|头名|销冠|巅峰|最好|最强|最佳)/,
];
// 族 II：REG_DOWN_EN 普通比较级落差形
const REG_DOWN_CMP_EN = [
  /\b(?:fell|dropped|declined|dipped|slipped|sank|slid|weakened|worsened|softened|slowed)\b(?:[^.!?]{0,24}\b(?:from|after|following|versus|vs\.?|compared|relative|against|off)\b|[^.!?]{0,18}\b(?:this|that|last|next)\s+(?:quarter|year|season|month|time|period)\b)/i,
  /\b(?:fell|dropped|declined|dipped|slipped|sank|slid|weakened|worsened|softened)\s+(?:back|off|down|away)\b/i,
  /\b(?:much|far|considerably|significantly|markedly|substantially|well|even)?\s*(?:worse|weaker|lower|poorer|softer|slower)\b(?:[^.!?]{0,10}\bthan\b|[^a-z])/i,
  /\b(?:off|below|past)\s+(?:his|her|their|the)\s+(?:best|peak|high|form)\b/i,
  /\b(?:this|that)\s+(?:quarter|year|season|month|time|period)\s+(?:was|has\s+been)\s+(?:worse|weaker|lower|poorer|softer|slower|disappointing)\b/i,
  /\b(?:declined|faded|dropped|fell|slipped|weakened)\s+(?:afterwards|afterward|after\s+that|since|in\s+the\s+(?:months?|years?|weeks?)\s+since)\b/i,
  // 高位→普通：award/peak 名词短语后接「has been much weaker」类
  /\b(?:rookie\s+of\s+the\s+year|best|top|peak|finest|record)[^.!?]{0,40}\b(?:this|that)\s+(?:quarter|year|season|month|time|period)\s+(?:was|has\s+been)\b/i,
];
// 族 III：EXTREME_HIGH_ZH 主语名词形（业绩是冠军 / 拿了销售冠军）
const EXTREME_HIGH_SUBJ_ZH = [
  /(?:是|当了|拿下|拿了|摘得|夺得|问鼎|卫冕|拿过|当过|夺过)[^。；，]{0,4}(?:冠军|头名|榜首|销冠|冠军王)/,
  /(?:拿了|拿下|摘得|夺得|问鼎)[^。；，]{0,6}(?:第一|头名|榜首)/,
  /(?:业绩|绩效|销售|营收)[^。；，]{0,4}(?:是|为)[^。；，]{0,4}(?:第一|榜首|头名|冠军)/,
];
// 族 IV：EFFECT_ZH 负向功效断言形（起反作用 / 帮了倒忙）
const EFFECT_NEG_ZH = [
  /起反作用|起了反作用|反作用|帮了倒忙|帮倒忙|越帮越忙|适得其反|弄巧成拙|事与愿违|南辕北辙|背道而驰|反而(?:更|越来越)?(?:差|糟|坏|弱|低)|反而(?:害|伤|拖累|连累)/,
  /是(?:个)?(?:错误|失误|败笔|昏招|臭棋|错棋|失策|失算|错着)|一招(?:错|臭|烂)棋|走错了|棋走错了|下错了|选错了|押错了|请错了/,
];
// 族 V：EFFECT_EN 负向功效断言形（backfired / mistake）
const EFFECT_NEG_EN = [
  /\b(?:backfired|backfiring|misfired|did\s+the\s+opposite|made\s+(?:things|it|matters)\s+worse|counterproductive|counter[- ]productive|self[- ]defeating|boomeranged)\b/i,
  /\b(?:was|proved|turned\s+out\s+to\s+be|has\s+been)\s+(?:a\s+)?(?:mistake|error|blunder|misstep|misjudg|wrong\s+call|bad\s+call|poor\s+decision|failed\s+policy)\b/i,
  /\b(?:should\s+not\s+have|shouldn'?t\s+have|ought\s+not\s+to\s+have)\b/i,
  // 注意：裸 backfire/backfiring 不带 -d/-ing 后缀时不收（见豁免表负例：
  //   "not necessarily the buyback backfiring" 由 gate 层 EXEMPT_NEG 捕获）
];

// ── 验证 ────────────────────────────────────────────────────
const anyHit = (list, text) => list.some(re => re.test(text));
const T = (label, list, samples) => {
  console.log(`\n=== ${label} ===`);
  for (const [name, text, want] of samples) {
    const got = anyHit(list, text);
    const ok = got === want;
    console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(28)} want=${want ? 'Y' : 'N'} got=${got ? 'Y' : 'N'}`);
  }
};

T('REG_DOWN_CMP_ZH 普通比较级落差', REG_DOWN_CMP_ZH, [
  ['ZH 这次考差了', '上次考试他考了第一，这次考差了，说明上次的补课班起了反作用。', true],
  ['ZH 业绩不如上个月', '他这个月业绩是冠军，上个月只是普通水平，所以那个激励政策根本没用。', true],
  ['ZH 成绩下滑', '她去年业绩最好，今年成绩下滑了，说明提拔她是个错误。', true],
  ['ZH 状态差了', '他巅峰期进了十个球，本赛季状态差了很多，教练的战术有问题。', true],
  ['ZH 倒装 不如从前', '这位作家的新作反响不如从前，看来改风格是败笔。', true],
  ['ZH 良性 均值回归陈述', '他上次考第一有运气成分，这次成绩回落属于均值回归，不能说明补课班有害。', false],
  ['ZH 良性 需长期观察', '新教练接手后球队成绩提升，但样本太少，还需要看完整赛季。', false],
  ['ZH 良性 自然现象(腿级期望Y，gate层豁免)', '业绩冠军下一年下滑是统计上的常见现象，与激励政策无关。', true],
  ['ZH 良性 实验语境', '随机对照试验显示干预组与对照组的下滑幅度没有差异。', false],
]);
T('REG_DOWN_CMP_EN', REG_DOWN_CMP_EN, [
  ['EN fell this quarter', 'The stock hit an all-time high last quarter and fell this quarter, proving the buyback backfired.', true],
  ['EN declined after', 'She was the top performer in her first year and declined afterwards, so the promotion was a mistake.', true],
  ['EN worse than', 'Her first novel was a bestseller and the second was much worse, so the new editor failed her.', true],
  ['EN this year was', 'Rookie of the year last season, this season has been much weaker for him.', true],
  ['EN off his best', 'The striker scored thirty goals last year but is well off his best this year.', true],
  ['EN 良性 regression', 'A single peak score is not evidence that the tutoring worked; regression to the mean explains it.', false],
  ['EN 良性 randomi', 'In the randomized controlled trial the treatment group did not decline after the intervention.', false],
  ['EN 良性 maybe', 'The fund may simply be off its peak because of market-wide moves.', false],
]);
T('EXTREME_HIGH_SUBJ_ZH', EXTREME_HIGH_SUBJ_ZH, [
  ['ZH 业绩是冠军', '他这个月业绩是冠军，上个月只是普通水平，所以那个激励政策根本没用。', true],
  ['ZH 当了冠军', '他上个季度当了销冠，这个季度掉到中游，看来激励方案是错的。', true],
  ['ZH 良性 冠军是回归', '业绩冠军下一年下滑是统计上的常见现象，与激励政策无关。', false],
  ['ZH 良性 统计学讨论', '教科书里说拿到第一名之后成绩回落是典型的回归均值现象。', false],
]);
T('EFFECT_NEG_ZH', EFFECT_NEG_ZH, [
  ['ZH 起反作用', '上次考试他考了第一，这次考差了，说明上次的补课班起了反作用。', true],
  ['ZH 帮了倒忙', '他引入新流程后效率下降，新流程帮了倒忙。', true],
  ['ZH 是个错误', '她第一年绩效最好，之后逐年下降，说明当初的升职提拔是个错误。', true],
  ['ZH 良性 需对照', '新流程上线后效率下降，但也可能是市场变化，需要看对照组。', false],
]);
T('EFFECT_NEG_EN', EFFECT_NEG_EN, [
  ['EN backfired', 'The stock hit an all-time high last quarter and fell this quarter, proving the buyback backfired.', true],
  ['EN was a mistake', 'She was the top performer in her first year and declined afterwards, so the promotion was a mistake.', true],
  ['EN made it worse', 'Revenue peaked right after the rebrand and then fell, which made matters worse.', true],
  ['EN 良性 not necessarily(腿级期望Y，gate层豁免)', 'The decline after the peak is not necessarily the buyback backfiring.', true],
]);
