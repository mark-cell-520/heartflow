// 第 280 轮 mutation：把 all 族②族（all + 群体 + 谓词槽 + 宽宾语）的谓词通配
// 改成负面/态度动词枚举表（与 230 轮 every 族同构），群体表补全到 46 词，
// 并新增句末零宾语支。原地改 src/index.js，改前断言锚点唯一命中；只输出数字。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'index.js');

const src = fs.readFileSync(SRC, 'utf8');

// ── 锚点：先从唯一的 wildcard 谓词槽标记定位，再回溯到该条正则的起点 ──
const WILD = '(?!exported|imported|validated';
const wIdx = [];
let q = src.indexOf(WILD);
while (q !== -1) { wIdx.push(q); q = src.indexOf(WILD, q + 1); }
if (wIdx.length !== 1) { console.error('WILD_ANCHOR ' + wIdx.length); process.exit(2); }
const from = wIdx[0];

// 正则起点：from 之前最近的 "/\ball\s+(?:of\s+)?" 字面量
const RE_START = '/\\ball\\s+(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?(?:users?';
const sIdx = src.lastIndexOf(RE_START, from);
if (sIdx < 0) { console.error('RE_START_NOT_FOUND'); process.exit(2); }

// 正则终点：宽宾语槽收尾 "opt|agree|accept))" 之后的 "/i,"
const OBJ_TAIL = 'opt|agree|accept))';
const oIdx = src.indexOf(OBJ_TAIL, sIdx);
if (oIdx < 0) { console.error('OBJ_TAIL_NOT_FOUND'); process.exit(2); }
const eIdx = src.indexOf('/i,', oIdx);
if (eIdx < 0) { console.error('END_NOT_FOUND'); process.exit(2); }
const end = eIdx + 3;

const OLD = src.slice(sIdx, end);
if (!/upgraded\)\[a-z\]\*/.test(OLD)) { console.error('OLD_SHAPE_MISMATCH'); process.exit(2); }
console.log('OLD_LEN ' + OLD.length);

// ── 新群体表：与判据①②③ 的 46 词人类集合表同源 ──
const GROUP = '(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?)';
const LEAD = '(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?';

// ── 新谓词枚举表：仅负面/态度/贬损动词 ──
// 刻意**不含**功能动词（receives/gets/signs/reads/uses/opens/files/checks/ships/
// validates/updates/deploys…）：那类是行政/业务/工程完成态陈述，枚举表天然不命中，
// 不需要排除表事后穷举（229→277→279 三轮补 76 词仍未收敛的根因）。
// 保留 229/230/277/279 四轮已验证的攻击谓词，保证攻击池命中数不降。
const PRED = '(?:ignores?|ignored|refuses?|refused|hates?|hated|complains?|complained|skips?|skipped|assumes?|assumed|distrusts?|distrusted|resents?|resented|blames?|blamed|mocks?|mocked|dismisses?|dismissed|ridicules?|ridiculed|undermines?|undermined|sabotages?|sabotaged|cheats?|cheated|deceives?|deceived|manipulates?|manipulated|exploits?|exploited|bullies|bullied|insults?|insulted|threatens?|threatened|punishes?|punished|betrays?|betrayed|abandons?|abandoned|avoids?|avoided|misreads?|misread|misinterprets?|misinterpreted|overrides?|overrode|questions?|questioned|suspects?|suspected|fears?|feared|envies?|envied|despises?|despised|disobeys?|disobeyed|scorns?|scorned|taunts?|taunted|belittles|demeans|demeaned|scapegoats?|scapegoated|slanders?|smeared|ostracizes?|shuns?|shunned|abhors|abhorred|breaks?|broke|blocks?|blocked|dropped|leaked|wrecked|mangled|fumbled|quit|resigned?|objected|protested|disagreed)';

const OBJ = '(?:this\\b|that\\b|me\\b|us\\b|them\\b|him\\b|her\\b|you\\b|about\\s+\\w+|a\\b|an\\b|the\\b|to\\s+(?:pay|support|help|fix|replace|upgrade|renew|wait|talk|share|review|test|deploy|switch|move|change|read|sign|answer|reply|comply|listen|trust|believe|join|leave|stay|go|do|use|try|buy|cancel|opt|agree|accept))';

const NEW = [
  '// [第 280 轮] ②族谓词槽从通配 `(?!…)[a-z]*` 改为**负面/态度动词枚举表**（与',
  '    // 230 轮 every 族同构：前置约束替代事后排除）。',
  '    // 复测（scripts/round-280/base-r280.js、diag1-r280.js、diag2-r280.js）：',
  '    //   ① 良性功能陈述池 10 群体 × 51 野生功能谓词 × 7 宾语 = 3570 条，',
  '    //      通配+排除表形态误伤 2856（80%，排除表只含 279 轮补过的 45 词，',
  '    //      表外野生动词 51/51 全部命中）；',
  '    //   ② 句末零宾语形态 52/52 攻击谓词全部漏判（宽宾语槽吃不到句末）；',
  '    //   ③ 群体表只含 20 词，citizens/consumers 等 26 个人类集合名词整族漏判',
  '    //      （diag2：All citizens mock a stranger. → pass）。',
  '    // 改动三重：谓词枚举化（误伤面结构性归零）+ 群体表补全 46 词 + 新增零宾语支。',
  '    // 排除表整体退役——谓词不在枚举表内的功能性动词天然不命中，',
  '    // 不再需要每轮补词（本轮 mutation 后 B_FUNC 应归零，A_NEG/A_ZERO 不降）。',
  '    /\\ball\\s+' + LEAD + GROUP + '\\s+' + PRED + '\\s+' + OBJ + '/i,',
  '    // [第 280 轮] 句末零宾语支（All of our customers mocked.）：谓词枚举化后',
  '    // 零宾语形态与宽宾语形态共用同一张表。原 ②\' 族只枚举 complain/refuse/',
  '    // object/protest/disagree/quit/resigned/left/struck 九词，',
  '    // 覆盖不了 mock/undermine/exploit 类谓词的零宾语形。',
  '    /\\ball\\s+' + LEAD + GROUP + '\\s+' + PRED + '\\s*\\.\\s*$/im,',
].join('\n');

const out = src.slice(0, sIdx) + NEW + src.slice(end);
if (out === src) { console.error('NO_CHANGE'); process.exit(2); }
fs.writeFileSync(SRC, out);
console.log('WROTE delta=' + (out.length - src.length));
