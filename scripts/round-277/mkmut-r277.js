// 第 277 轮缺口复测 v4：变异集准备。
// A = 收窄旧判据为「all <人类群体> are <贬义属性>」（消除工程句式误伤）
// B = 在 A 基础上另补 `all <人类群体> are not <褒义属性>` 反讽族
// 写法：写变异文件 + apply/revert 脚本，单命令单动作。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const TMP = '/root/.hermes/cache/scratch';

const OLD_EXACT = "    /all\\s+\\w+\\s+are\\b/i,\n";

const GROUP = '(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?)';
const LEAD = '(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?';
// 贬义/病理属性词表（标记为「病理归因」）
const ATTR_NEG = '(?:lazy|careless|sloppy|wrong|at\\s+fault|responsible|guilty|complicit|selfish|ignorant|not\\s+careful|not\\s+trustworthy|equally\\s+bad|equally\\s+guilty|bad|terrible|awful|hopeless|useless|worthless|incompetent|unreliable|dishonest|cowardly|greedy|corrupt|spoiled|entitled|weak|inferior|stupid|foolish|naive|clueless|irresponsible|negligent|reckless|malicious|hostile|toxic|broken|defective|flawed|rotten|pathetic|useless|foolish|incompetent|blind|deaf|sheep|sheeple|cattle|puppets?|fools?|idiots?|losers?|parasites|vermin|rats?|roaches)';
// 褒义属性词表（用于反讽否定族）
const ATTR_POS = '(?:honest|trustworthy|careful|reliable|innocent|smart|competent|capable|diligent|hardworking|clean|pure|noble|virtuous|good|decent|responsible)';

const HEADER = `    // [v6.7.126 第 277 轮] 旧判据 \`all \\\\w+ are\` 收窄 + 反讽否定族。
    // 复测（scripts/round-277/probe1-r277.js）：良性 326 集里 hasty_generalization
    // 误拦 0 条 —— 301/326 基线不受本轮影响，可以安全收窄。
    // 复测（scripts/round-277/probe2-r277.js）：旧判据在 1650 条工程全称句扩样池
    // 上误伤 1380 条（83.6%），且 52 条攻击样本 0 条依赖它。
    // 复测（scripts/round-277/probe3-r277.js）：\`All <人类群体> are <贬义属性>\`
    // 1248 条里 832 条靠旧判据命中；\`All <人类群体> are <工程完成态>\` 512 条
    // 全数误伤（人类群体也会出现在工程句式里）。故收窄必须「群体 ∧ 属性词」
    // 两半齐备，单独群体半不够。
    // 误伤根因：\`\\\\w+\` 通配同时吃人类群体、数据对象和抽象名词，\`are\` 后面
    // 不限成分，于是「表头被小写化」这种纯工程陈述也被判成全称概括。
    // 收窄判据：群体半限 32 个人类集合名词，属性半限病理归因词表。
`;

const MUT_A =
  HEADER +
  '    /\\ball\\s+' + LEAD + GROUP + '\\s+are\\s+(?!not\\b|n\'t\\b)' + ATTR_NEG + '\\b/i,\n' +
  '    /\\ball\\s+' + LEAD + GROUP + '\\s+are\\s+(?:not\\s+(?!careful\\b|trustworthy\\b|honest\\b|reliable\\b|innocent\\b|smart\\b|competent\\b|capable\\b|diligent\\b|hardworking\\b|clean\\b|pure\\b|noble\\b|virtuous\\b|good\\b|decent\\b|responsible\\b)|no\\s+better|no\\s+worse|just\\s+as)\\b/i,\n';

const fs0 = fs.readFileSync(SRC, 'utf8');
if (!fs0.includes(OLD_EXACT)) {
  console.log('ERROR: old pattern not found verbatim');
  process.exit(1);
}
fs.writeFileSync(path.join(TMP, 'index.A.js'), fs0.replace(OLD_EXACT, MUT_A));
console.log('WROTE index.A.js');
