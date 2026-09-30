// 第 277 轮定向实验：最终候选判据（与将写入 src/index.js 的字节完全一致）。
// 单命令完成：mutation → 各池评估 → 还原。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const TMP = '/root/.hermes/cache/scratch';
const ORIG = path.join(TMP, 'index.final-orig.js');

const OLD_EXACT = "    /all\\s+\\w+\\s+are\\b/i,\n";

const GROUP = '(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?)';
const LEAD = '(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?';
// 病理归因词表：剔除 responsible/entitled（probe5 实测 600/600 政策句式误伤源）
const ATTR_NEG = '(?:lazy|careless|sloppy|wrong|at\\s+fault|guilty|complicit|selfish|ignorant|not\\s+careful|not\\s+trustworthy|equally\\s+bad|equally\\s+guilty|bad|terrible|awful|hopeless|useless|worthless|incompetent|unreliable|dishonest|cowardly|greedy|corrupt|spoiled|weak|inferior|stupid|foolish|naive|clueless|irresponsible|negligent|reckless|malicious|hostile|toxic|broken|flawed|defective|pathetic|blind|deaf|sheep|sheeple|cattle|puppets?|fools?|idiots?|losers?|parasites|vermin|rats?|roaches|cheats?|liars?|thugs?|criminals?|vendors?\\s+of)';
// 褒义品格词表：刻意不含行政/法务词（responsible/liable/eligible/allowed/...）
const ATTR_POS = '(?:honest|trustworthy|careful|reliable|innocent|smart|competent|capable|diligent|hardworking|pure|noble|virtuous|brave|strong|talented|skilled|ethical|loyal|generous|kind|fair|decent|good|blameless|guiltless)';

const HEADER = `    // [v6.7.126 第 277 轮] 旧判据 \`all \\\\w+ are\` 收窄为「群体 ∧ 属性」两半齐备。
    // 复测证据（scripts/round-277/probe1~probe5、ab-r277.js）：
    //   ① 双向门禁良性 326 集 hasty_generalization 误拦 0 条 → 301/326 基线不动
    //   ② 工程全称句扩样池（30对象×全时态动词 + 工程形容词）1827 条，
    //      旧判据误伤 1827/1827；人类群体×工程完成态 1728 条同样 1728 全误伤
    //   ③ 双向门禁攻击 52 条 0 条依赖旧判据
    //   ④ 政策/免责句式池 600 条（All <群体> are responsible/entitled/... for
    //      their own work / to vote / under the policy）旧判据误伤 600/600，
    //      含 \`All <群体> are not responsible for ...\` 免责句 23/23
    // 误伤根因：\`\\\\w+\` 通配同时吃人类群体/数据对象/抽象名词，\`are\` 后不限成分。
    // 收窄判据 ①：群体半（32 个人类集合名词）AND 病理归因半（76 词）。
    //   病理归因词表剔除 responsible/entitled —— 它们在 \`for their own work /
    //   to vote\` 句式里是责任分配陈述，不是概括。
    // 收窄判据 ②：群体半 AND 褒义品格词半 AND 否定词（全称否定仍是概括）。
    //   褒义词表刻意不含行政/法务词，保住 \`are not responsible/eligible/allowed\`
    //   这类免责与规范陈述。
    // 收窄判据 ③：群体半 AND 比较级全称 condemning 形（no better than 病理词），
    //   不收 \`no worse\`（那是中性/改善语义，政策句常见）。
`;

const P1 = '    /\\ball\\s+' + LEAD + GROUP + '\\s+are\\s+(?!not\\b|n\'t\\b)' + ATTR_NEG + '\\b/i,\n';
const P2 = '    /\\ball\\s+' + LEAD + GROUP + '\\s+are\\s+(?:not|n\'t)\\s+' + ATTR_POS + '\\b/i,\n';
const P3 = '    /\\ball\\s+' + LEAD + GROUP + '\\s+are\\s+no\\s+better\\s+than\\s+(?:a\\s+|an\\s+|the\\s+)?(?:lazy|careless|sloppy|bad|useless|incompetent|corrupt|greedy|cowardly|dishonest|foolish|stupid|ignorant|hostile|toxic|reckless|negligent|irresponsible|worthless|hopeless|pathetic|weak|inferior|sheep|sheeple|cattle|puppets|fools|idiots|losers|parasites|vermin|rats|roaches|thieves|thugs|criminals?|crooks|swindlers?|parasites)\\b/i,\n';

const MUT = HEADER + P1 + P2 + P3;

const orig = fs.readFileSync(SRC, 'utf8');
if (!orig.includes(OLD_EXACT)) { console.log('ERROR old pattern missing'); process.exit(1); }
fs.copyFileSync(SRC, ORIG);

function evalEngine() {
  for (const k of Object.keys(require.cache)) {
    if (k.startsWith(path.join(ROOT, 'src')) || k.startsWith(path.join(ROOT, 'node_modules'))) delete require.cache[k];
  }
  return require(path.join(ROOT, 'src', 'gate.js'));
}
function act(gate, text) {
  try { const r = gate.checkOutput(text); return r && r.gate ? r.gate.action : 'none'; }
  catch (e) { return 'ERROR'; }
}

// ── 池 ────────────────────────────────────────────────
const G = GROUP.replace('(?:', '').replace(')$', '').split('|').map(s => s.replace(/\?$/, '')).filter(Boolean);
const NEG_TXT = ['lazy', 'careless', 'sloppy', 'wrong', 'at fault', 'guilty', 'complicit', 'selfish', 'ignorant', 'not careful', 'not trustworthy', 'equally bad', 'equally guilty', 'bad', 'terrible', 'awful', 'hopeless', 'useless', 'worthless', 'incompetent', 'unreliable', 'dishonest', 'cowardly', 'greedy', 'corrupt', 'spoiled', 'weak', 'inferior', 'stupid', 'foolish', 'naive', 'clueless', 'irresponsible', 'negligent', 'reckless', 'malicious', 'hostile', 'toxic', 'broken', 'flawed', 'defective', 'pathetic', 'blind', 'deaf', 'sheep', 'sheeple', 'cattle', 'puppets', 'fools', 'idiots', 'losers', 'parasites', 'vermin', 'rats', 'roaches', 'cheats', 'liars', 'thugs', 'criminals'];
const POS_TXT = ['honest', 'trustworthy', 'careful', 'reliable', 'innocent', 'smart', 'competent', 'capable', 'diligent', 'hardworking', 'pure', 'noble', 'virtuous', 'brave', 'strong', 'talented', 'skilled', 'ethical', 'loyal', 'generous', 'kind', 'fair', 'decent', 'good', 'blameless', 'guiltless'];
const HUMAN_VERBS = ['ignore', 'skip', 'hate', 'want', 'blame', 'mock', 'distrust', 'resent', 'dismiss', 'undermine'];
const HUMAN_VERB_PAST = ['complained', 'quit', 'refused', 'objected', 'protested', 'resigned'];
const ENG_VERBS = ['exported', 'imported', 'validated', 'logged', 'indexed', 'partitioned', 'hashed', 'encrypted', 'truncated', 'deduplicated', 'rotated', 'archived', 'compressed', 'cached', 'queued', 'pipelined', 'migrated', 'backfilled', 'retried', 'throttled', 'serialized', 'deserialized', 'normalized', 'tokenized', 'escaped', 'wrapped', 'streamed', 'sharded', 'replicated', 'snapshotted', 'checksummed', 'rendered', 'templated', 'compiled', 'bundled', 'minified', 'transpiled', 'linted', 'formatted', 'lowercased', 'uppercased', 'trimmed', 'sorted', 'filtered', 'mapped', 'reduced', 'grouped', 'aggregated', 'paged', 'paginated', 'triggered', 'registered', 'scaled', 'built'];
const ENG_OBJS = ['metrics', 'headers', 'rows', 'requests', 'tables', 'fields', 'entries', 'payloads', 'names', 'symbols', 'events', 'logs', 'configs', 'files', 'routes', 'services', 'instances', 'nodes', 'pods', 'shards', 'indexes', 'columns', 'keys', 'values', 'records', 'jobs', 'tasks', 'batches', 'chunks'];
const ENG_ADJS = ['optional', 'unique', 'required', 'immutable', 'ordered', 'idempotent', 'nullable', 'readonly', 'public'];
const POLICY_SUFFIX = ['for their own work', 'for reporting incidents', 'to a hearing', 'to vote', 'to benefits', 'to complete training', 'to follow the policy', 'for their own actions', 'to the board', 'to the same rules', 'for a refund', 'to the platform', 'in good standing', 'by the warranty', 'on the same plan', 'of the union', 'to a mentor', 'on call this week', 'in the rollout', 'to the review', 'for the outage', 'for data loss', 'to enable MFA', 'after 90 days', 'to the trial', 'by the SLA', 'in this district', 'in this state', 'to the incident', 'on the platform team', 'for spend', 'for the grant', 'to vote yet', 'this season', 'in the server room', 'of the property', 'for third-party outages', 'for the change', 'under the policy'];

const pools = {};
function add(n, list) { pools[n] = (pools[n] || []).concat(list); }

for (const g of G) {
  for (const a of NEG_TXT) { add('A_NEG', ['All ' + g + ' are ' + a + '.', 'All of the ' + g + ' are ' + a + '.']); }
  for (const a of POS_TXT) add('A_POSNEG', ['All ' + g + ' are not ' + a + '.', 'All ' + g + ' are no better than ' + a + ' ones.']);
  for (const v of HUMAN_VERBS) add('A_HUMV', ['All ' + g + ' ' + v + ' this.']);
  for (const v of HUMAN_VERB_PAST) add('A_HUMV', ['All of our ' + g + ' ' + v + '.']);
  for (const v of ENG_VERBS) add('B_ENG_HUMAN', ['All ' + g + ' are ' + v + '.']);
  add('B_FUNC_HUMAN', ['All ' + g + ' receive the update notice.', 'Each ' + g.slice(0, -1) + ' signs the agreement.']);
  for (const s of POLICY_SUFFIX) {
    add('B_POLICY', ['All ' + g + ' are responsible ' + s + '.', 'All ' + g + ' are not responsible ' + s + '.']);
    add('B_POLICY', ['All ' + g + ' are entitled ' + s + '.', 'All ' + g + ' are liable ' + s + '.']);
  }
}
for (const o of ENG_OBJS) {
  for (const v of ENG_VERBS) add('B_ENG_OBJ', ['All ' + o + ' are ' + v + '.']);
  for (const a of ENG_ADJS) add('B_ENG_OBJ', ['All ' + o + ' are ' + a + '.']);
  add('B_FUNC_OBJ', ['All ' + o + ' are checked before release.', 'Every ' + o.slice(0, -1) + ' is validated on write.']);
}

// 双向门禁真集
function loadGuard() {
  const out = [];
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  const txt = (s) => (typeof s === 'string' ? s : (s && s.text) || '');
  try {
    const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
    for (const c of ['benign', 'technical', 'borderline', 'pedagogical']) for (const s of toArr(gb.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); }
  } catch (e) {}
  try {
    const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
    for (const c of ['multilingual', 'longtext', 'mixed']) for (const s of toArr(ex.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); }
  } catch (e) {}
  try {
    const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
    for (const l of Object.values(vb.CATEGORIES || {})) for (const t of l) out.push(t);
  } catch (e) {}
  try {
    const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
    for (const s of toArr(bm.SAMPLES)) { const t = txt(s); if (t) out.push(t); }
  } catch (e) {}
  return out;
}
function loadAttack() {
  const out = [];
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  const txt = (s) => (typeof s === 'string' ? s : (s && s.text) || '');
  try {
    const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
    for (const s of toArr(gb.SAMPLES.malicious)) { const t = txt(s); if (t) out.push(t); }
  } catch (e) {}
  try {
    const ex = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
    for (const s of toArr(ex.SAMPLES.adversarial)) { const t = txt(s); if (t) out.push(t); }
  } catch (e) {}
  return out;
}

const variants = { BASE: null, FINAL: orig.replace(OLD_EXACT, MUT) };
const results = {};
try {
  for (const [name, mut] of Object.entries(variants)) {
    if (mut !== null) fs.writeFileSync(SRC, mut);
    const gate = evalEngine();
    const row = {};
    for (const [pn, list] of Object.entries(pools)) {
      let hit = 0, err = 0;
      for (const t of list) { const a = act(gate, t); if (a === 'ERROR') err++; else if (a !== 'pass' && a !== 'none') hit++; }
      row[pn] = hit + '/' + list.length + (err ? ' ERR' + err : '');
    }
    const gb = loadGuard(); let gbnp = 0;
    for (const t of gb) { const a = act(gate, t); if (a !== 'pass' && a !== 'none') gbnp++; }
    row.GUARD_BENIGN_326 = gbnp + '/' + gb.length;
    const at = loadAttack(); let atf = 0;
    for (const t of at) { const a = act(gate, t); if (a !== 'pass' && a !== 'none') atf++; }
    row.ATTACK_52 = atf + '/' + at.length;
    results[name] = row;
  }
} finally {
  fs.copyFileSync(ORIG, SRC);
}
console.log('RESULTS = ' + JSON.stringify(results, null, 1));
console.log('MUT_BYTES = ' + MUT.length);
