// 第 283 轮三修：281 判据补 everyone/everybody 直连系动词独立分支
// 目标：Everyone is a fool. / Everybody is vermin. / Everyone isn't ...（否定仍排除）
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'src', 'index.js');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');
const n = 4920;
const line = lines[n - 1];

// 281 判据前缀：\b(?:everyone|everybody|every|each)(?:\s+\w+){0,2}\s+(?:GRP)\s+(?:is|are)\s+...
// everyone 后直接跟 is 时，\s+(?:GRP) 强制要求群体词 -> 整族漏
// 修法：把中缀+群体半改成「群体半 OR 空」两个分支：
//   \b(?:everyone|everybody)(?=\s+(?:is|are))\s+(?:is|are)\s+<ATTR>   ← 新分支
//   原分支加前缀排除，避免重复告警（不，重复无害，保留）
// 更稳的做法：新增一条独立判据，避免动 229~230 族已稳定的正则
const ATTR = "(?:a\\s+|an\\s+)?(?:fools?|idiots?|liars?|losers?|thieves|thief|cowards?|parasites?|vermin|cattle|sheep|sheeple|clowns?|brutes?|criminals?|crooks|con\\s+artists?|savages?|cockroaches|stray\\s+dogs?|wild\\s+animals|rats|roaches|worthless|inferior|hopeless|pathetic|nobody|chaff)";
const ANCHOR = "(?=\\s*(?:[.,;:!?]|$))";
const NEWRE = `    // [第 283 轮] everyone/everybody 直连系动词独立支：281 判据的
    // 中缀 \`(?:\\s+\\w+){0,2}\\s+(?:GRP)\` 强制要求群体词，\`everyone\` 后
    // 直接跟系动词时无群体半可吃，整族 16 条漏（probe1 实测）。
    // 复测（scripts/round-283/probe1-r283.js）：\`Everyone is <表语>\` 一族
    // 16 条（17 表语 × 1 群体词）全 pass。本支只收 \`everyone|everybody\`
    // 直连 \`is|are\`，表语表与锚点边界沿用 281 口径（否定排除 + 句读锚）。
    /\\b(?:everyone|everybody)\\s+(?:is|are)\\s+(?!not\\b|n't\\b)${ATTR}\\b${ANCHOR}/i,`;

// 插在 281 判据（行 4920）之后
lines.splice(n, 0, NEWRE);
fs.writeFileSync(FILE, lines.join('\n'));
console.log('inserted after line', n);

// 验证新正则
const re = eval('[' + NEWRE.trim().replace(/,$/, '') + ']');
const cases = [
  'Everyone is a fool.', 'Everybody is vermin.', 'Everyone is worthless.',
  'Everyone are fools.', 'Everyone is a nobody.',
  // 否定排除
  "Everyone isn't a problem.", 'Everyone is not responsible.',
  // 良性
  'Every person is unique.', 'Everyone is welcome.', 'Everyone is entitled to an opinion.',
  'Everyone is a member.', 'Everyone is different.',
];
for (const c of cases) console.log((re[0].test(c) ? 'HIT ' : 'pass'), c);
