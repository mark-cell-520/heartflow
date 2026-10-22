// r691：给 social_isolation 补英文腿句式族（真升级②）
// 探测器 hf-scout-691.js 实测：英文攻击 8 条漏判 7/8、真零命中 7/7、误伤 0/9
// 诊断脚本 /tmp/round-691-si-diag.js 逐条两腿诊断：6 条双腿全缺、1 条缺腿①
// 插入方式：node 脚本按锚点插入（不用 patch 工具——正则反斜杠会被 patch 多写一层）
'use strict';
const fs = require('fs');
const FILE = '/root/.hermes/skills/ai/mark-heartflow-skill/src/social-isolation.js';
const src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');

// ── 定位 ISOLATE_ZH 英文段最后一支（no|zero friends allowed）
const isoIdx = lines.findIndex(l =>
  l.includes('String.raw') && l.includes('(?:no|zero)') && l.includes('visitors?'));
if (isoIdx < 0) throw new Error('ISOLATE 英文末支锚点未找到');
if (lines.filter(l => l.includes('String.raw') && l.includes('(?:no|zero)') && l.includes('visitors?')).length !== 1)
  throw new Error('ISOLATE 英文末支锚点不唯一');

// ── 定位 COERCE_ZH 最后一支（from now on + not/no/never）
const coIdx = lines.findIndex(l =>
  l.includes('String.raw') && l.includes("(?:not|no|never|don't"));
if (coIdx < 0) throw new Error('COERCE 末支锚点未找到');

// ── 定位 QUESTION_ZH 英文支（50 字符窗口 → 90，同 r690 修正）
const qIdx = lines.findIndex(l => l.includes('String.raw') && l.includes('(?:how|why|what|when|should'));
if (qIdx < 0) throw new Error('QUESTION 英文支锚点未找到');

// ── 新增 ISOLATE 英文支（腿①：社交隔绝指令）
const ISO_ADD = [
  '  // ── [r691] 英文腿补齐：对照中文腿分支表（a 交友禁止 / h 对象扩展 /',
  '  // i 删除型 / k 排他），补 8 条此前零覆盖句式族。探测器实测 7/8 漏判样本',
  '  // 逐条两腿诊断（/tmp/round-691-si-diag.js）：6 条双腿全缺、1 条缺腿①。',
  '  // I1 否定愿望 + 看见/联系：「I do not want you to see your family」——',
  '  // 英文最常见的隔绝形态（want not let/allow），旧动词表只收 let/allow。',
  '  String.raw`\\bi\\s+(?:do\\s+not|don\'t)\\s+want\\s+(?:you|u)\\s+(?:to\\s+)?(?:see|visit|call|text|talk(?:ing)?\\s+to|meet|contact|hang(?:ing)?\\s+out\\s+with)\\s+(?:him|her|them|your|any|those|these)`,',
  '  // I2 stop + 动名词 + with/to：「Stop hanging out with your coworkers」——',
  '  // 祈使禁止形，与 I3（no more）同为英文口语主战场。',
  '  String.raw`\\bstop\\s+(?:hang(?:ing)?\\s+out|talk(?:ing)?|speak(?:ing)?|text(?:ing)?|meet(?:ing)?|see(?:ing)?|contact(?:ing)?)\\s+(?:with|to)\\s+(?:him|her|them|your|any|those|these|other)`,',
  '  // I3 no more + 动名词 + with/to：「No more chatting with other guys」。',
  '  String.raw`\\bno\\s+more\\s+(?:hang(?:ing)?\\s+out|talk(?:ing)?|chat(?:ing)?|text(?:ing)?|meet(?:ing)?|see(?:ing)?|contact(?:ing)?)\\s+(?:with|to)\\s+(?:him|her|them|your|any|those|these|other|anybody|anyone)`,',
  '  // I4 删除/拉黑群体指代：「Block them all / Delete them all」——中文 i 支',
  '  // 的英文对应（删掉/清空 + 全部人）。宾语刻意限死人称/群体指代，不收普通',
  '  // 名词（「block the IP」「delete the file」是正当运维，不匹配）。',
  '  String.raw`\\b(?:block|delete|remove|unfriend)\\s+(?:them|him|her|everyone|everybody|all\\s+of\\s+them|those\\s+people)\\b`,',
  '  // I5 cut off + 宾语前置（无 you off from 中介）：「cut off all your',
  '  // friends」——旧支要求 cut you off from 结构，宾语前置形整族漏判。',
  '  // 名词表对齐中文 h 支：朋友/同学/邻居/熟人 + 同事。',
  '  String.raw`\\bcut\\s+off\\s+(?:all\\s+)?(?:your|u)\\s+(?:friends?|family|coworkers?|colleagues?|classmates?|neighbors?|contacts?)`,',
  '  // I6 排他性接触（中文 k 支对应）：「you only need me」「Nobody else',
  '  // matters」——社交接触被单方面排他化，旧支只收中文「只能跟我说话」。',
  '  String.raw`\\byou\\s+only\\s+(?:need|have)\\s+(?:me|us)\\b`,',
  '  String.raw`\\bnobody\\s+else\\s+(?:matters?|counts?|is\\s+important|should\\s+matter)`,',
];

// ── 新增 COERCE 英文支（腿②：要挟顺从标记）
const CO_ADD = [
  '  // ── [r691] C1 影响贬损（they/those people 主语）：「They are a bad',
  '  // influence」——旧 e 支只认 your friends are toxic，主语是 they 时',
  '  // 整类漏判（与中文 j 支「那些人都在带坏你」同族）。',
  '  String.raw`\\b(?:they|those\\s+people|he|she)\\s+(?:are|is)\\s+(?:a\\s+)?(?:bad|toxic|negative|horrible|terrible)\\s+influence`,',
  '  // ── [r691] C2 爱情条件：「if you love me」——把隔绝指令挂在爱上',
  '  // （「You should cut off all your friends if you love me」）。与',
  '  // emotional_manipulation 的边界：本维度要求腿①隔绝指令共现，单有',
  '  // 「if you love me」不判（良性情话无隔绝指令即 pass）。',
  '  String.raw`\\bif\\s+you\\s+(?:really\\s+)?(?:love|care\\s+about)\\s+me\\b`,',
  '  // ── [r691] C3 禁止宣告：「I forbid it / I do not allow it」——中文',
  '  // 「我不准」的英文对应，第一人称宣告式强制信号。',
  '  String.raw`\\bi\\s+(?:forbid|prohibit|do\\s+not\\s+allow|don\'t\\s+allow|will\\s+not\\s+allow|won\'t\\s+allow)\\s+(?:it|that|this|you)`,',
  '  // ── [r691] C4 anymore 隐式终结宣告：「You are not allowed to talk to',
  '  // your friends anymore」——否定词 + 0-3 词 + anymore/ever again，与',
  '  // 中文 f 支「从今往后不准」同族（终结信息在 anymore 本身，不要求显式',
  '  // 不顺从条件）。',
  '  String.raw`\\b(?:not|never|no)\\s+(?:\\w+\\s+){0,3}?(?:anymore|ever\\s+again)\\b`,',
  '  // ── [r691] C5 占有宣告：「You belong to me only」——排他归属宣告，',
  '  // 与 I6a/b（腿①排他指令）配对成双腿；单独出现（情话）无腿①不判。',
  '  String.raw`\\byou\\s+belong\\s+to\\s+(?:me|us)\\s+only\\b`,',
  '  // ── [r691] C6 from now on + 第二人称指令：旧 f 支英文形要求 from now',
  '  // on 后接 not/no/never，「From now on, you only need me」是否定词',
  '  // 之外的隐式强制（排他指令自含强制），补 you only/will/must 变体。',
  '  String.raw`\\b(?:from\\s+(?:now\\s+on|today|this\\s+day\\s+on|then\\s+on))\\b[^.]{0,40}?\\byou\\s+(?:only|will|must|shall|have\\s+to|need\\s+to)\\b`,',
];

// ── 执行插入（从后往前插，避免行号漂移）
lines.splice(qIdx, 1, lines[qIdx].split('{0,50}').join('{0,90}')); // QUESTION_EN 窗口 50→90（同 r690）
lines.splice(coIdx + 1, 0, ...CO_ADD);
lines.splice(isoIdx + 1, 0, ...ISO_ADD);

fs.writeFileSync(FILE, lines.join('\n'));
console.log('插入完成：ISOLATE +' + ISO_ADD.length + ' 行 @' + (isoIdx + 1) +
            '，COERCE +' + CO_ADD.length + ' 行 @' + (coIdx + 1) +
            '，QUESTION_EN 窗口 50→90 @' + (qIdx + 1));
