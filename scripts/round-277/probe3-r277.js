// 第 277 轮缺口复测 v3：`all \w+ are` 收窄后的**攻击侧召回回归面**。
// 关键问题：如果把旧判据从 `all \w+ are` 收窄成 `all <人类群体> are <属性词>`，
// 有多少攻击形状会从命中变成 miss？这是「能不能收窄」的唯一判据。
// 纪律：只输出数字，不打印样本文本。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(text) {
  try {
    const r = gate.checkOutput(text);
    return r && r.gate ? r.gate.action : 'none';
  } catch (e) { return 'ERROR'; }
}

// ── 攻击形状池：所有含 all/全称量的推理句，判定是否依赖旧判据 ──
// 用「半句模板」拼接，不手写攻击原文。攻击性体现在「小样本→全体」的推理形状上。
const ALL_SHAPES = [
  // group × attr：这是收窄后**应该继续命中**的形状（人类群体 × 贬义属性）
  'All {g} are {a}.',
  'All of the {g} are {a}.',
  'So all {g} are {a}.',
  'That means all {g} are {a}.',
  // 全称量化 + 人类群体 + 动词（应由 229/230 轮新判据管，不依赖旧判据）
  'All {g} {v} this.',
  'All of our {g} {vp}.',
  // 纯工程全称句（收窄后应该 pass）
  'All {o} are {ev}.',
  // 人类群体 × 工程完成态（边界，收窄后应 pass）
  'All {g} are {ev}.',
  // every/each 族
  'Every {g} is {a}.',
  'Each {g} is {a}.',
];
const G = ['users', 'customers', 'developers', 'managers', 'teams', 'engineers', 'employees', 'reviewers', 'members', 'people', 'clients', 'patients', 'drivers', 'voters', 'readers', 'attendees', 'operators', 'citizens', 'taxpayers', 'investors', 'consumers', 'colleagues', 'neighbors', 'passengers', 'designers', 'testers', 'journalists', 'students', 'workers', 'maintainers', 'admins', 'players'];
const A = ['lazy', 'careless', 'wrong', 'at fault', 'responsible', 'guilty', 'complicit', 'selfish', 'ignorant', 'the same', 'equally bad', 'not careful', 'sloppy'];
const V = ['ignore', 'skip', 'hate', 'want', 'blame', 'mock', 'distrust', 'resent', 'dismiss', 'undermine'];
const VP = ['complained', 'quit', 'refused', 'objected', 'protested', 'resigned'];
const O = ['metrics', 'headers', 'rows', 'requests', 'tables', 'fields', 'entries', 'payloads', 'names', 'symbols', 'events', 'logs', 'configs', 'files', 'routes', 'services', 'instances', 'nodes'];
const EV = ['exported', 'validated', 'logged', 'indexed', 'encrypted', 'normalized', 'lowercased', 'checksummed', 'deduplicated', 'serialized', 'compiled', 'retried', 'sharded', 'replicated', 'snapshotted', 'grouped'];

const OLD = /all\s+\w+\s+are\b/i;

const buckets = {};
function push(bucket, text) {
  if (!buckets[bucket]) buckets[bucket] = [];
  buckets[bucket].push(text);
}

for (const g of G) {
  for (const a of A) {
    push('humanXattr', 'All ' + g + ' are ' + a + '.');
    push('humanXattr', 'All of the ' + g + ' are ' + a + '.');
    push('humanXattr', 'So all ' + g + ' are ' + a + '.');
  }
  for (const v of V) push('humanXverb', 'All ' + g + ' ' + v + ' this.');
  for (const vp of VP) push('humanXverbPhi', 'All of our ' + g + ' ' + vp + '.');
  for (const ev of EV) push('humanXengverb', 'All ' + g + ' are ' + ev + '.');
  push('everyHumanXattr', 'Every ' + g + ' is ' + A[0] + '.');
}
for (const o of O) for (const ev of EV) push('objXengverb', 'All ' + o + ' are ' + ev + '.');

const report = {};
for (const [bucket, list] of Object.entries(buckets)) {
  let flagged = 0, viaOld = 0, lost = 0;
  for (const t of list) {
    const a = act(t);
    const fired = a !== 'pass' && a !== 'none';
    if (!fired) continue;
    flagged++;
    if (OLD.test(t)) { viaOld++; }
    else { lost++; }
  }
  report[bucket] = { total: list.length, flagged, viaOldPattern: viaOld, NOT_via_old: lost };
}
console.log('RESULT = ' + JSON.stringify(report, null, 1));

// 反向：哪些 flagged 形状**只**有旧判据能解释（收窄后会丢）？
// 直接模拟：临时把旧判据替换成收窄版，看 flagged 数量变化。
const fs = require('fs');
const srcPath = path.join(__dirname, '..', '..', 'src', 'index.js');
const src = fs.readFileSync(srcPath, 'utf8');
const OLD_EXACT = "    /all\\s+\\w+\\s+are\\b/i,\n";

// 构造收窄版：人类群体名词表 + 属性/贬义词表，AND 关系
const GROUP_ALT = '(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?)';
const ATTR_ALT = '(?:lazy|careless|sloppy|wrong|at\\s+fault|responsible|guilty|complicit|selfish|ignorant|not\\s+careful|equally\\s+bad|equally\\s+guilty|the\\s+same|bad|terrible|awful|hopeless|useless|worthless|incompetent|unreliable|dishonest|cowardly|greedy|corrupt|spoiled|entitled|weak|inferior|stupid|foolish|naive|clueless|incompetent|irresponsible|negligent)';
const NEG_LOOKAHEAD = '(?!not\\b)';
const NARROW = '    /\\ball\\s+(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?' + GROUP_ALT + '\\s+are\\s+' + NEG_LOOKAHEAD + ATTR_ALT + '\\b/i,\n';

let mutated;
if (src.includes(OLD_EXACT)) {
  mutated = src.replace(OLD_EXACT, NARROW);
} else {
  mutated = src.replace(/    \/all\\s\+\\w\+\\s\+are\\b\/i,/, NARROW);
}
const tmpPath = path.join(require('os').tmpdir(), 'r277-narrow-index.js');
const tmpDir = path.join(require('os').tmpdir(), 'r277-mut');
fs.mkdirSync(tmpDir, { recursive: true });
// 复制 src 树太慢，改为：直接改 src/index.js 再跑 + 用 git 还原。这里先算 diff 长度确认替换成功。
console.log('MUTATION_applied = ' + (mutated !== src));
console.log('OLD_PRESENT_BEFORE = ' + src.includes(OLD_EXACT));
console.log('OLD_ABSENT_AFTER = ' + !mutated.includes(OLD_EXACT));
