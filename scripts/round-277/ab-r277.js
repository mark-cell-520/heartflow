// 第 277 轮 A/B 变异实验：把 `all \w+ are` 旧判据收窄，实测两个变体。
// A = 群体 ∧ 病理属性词两半齐备
// B = A + 反讽否定族（all <群体> are not <褒义属性>）
// 全程在 node 进程内完成「替换 → 求值 → 还原」，git 保底。
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const TMP = '/root/.hermes/cache/scratch';
const ORIG = path.join(TMP, 'index.orig.js');

const OLD_EXACT = "    /all\\s+\\w+\\s+are\\b/i,\n";
const GROUP = '(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?)';
const LEAD = '(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?';
const ATTR_NEG = '(?:lazy|careless|sloppy|wrong|at\\s+fault|responsible|guilty|complicit|selfish|ignorant|not\\s+careful|not\\s+trustworthy|equally\\s+bad|equally\\s+guilty|bad|terrible|awful|hopeless|useless|worthless|incompetent|unreliable|dishonest|cowardly|greedy|corrupt|spoiled|entitled|weak|inferior|stupid|foolish|naive|clueless|irresponsible|negligent|reckless|malicious|hostile|toxic|broken|defective|flawed|pathetic|blind|deaf|sheep|sheeple|cattle|puppets?|fools?|idiots?|losers?|parasites|vermin|rats?|roaches|cheats?|liars?|thugs?|criminals?)';
const ATTR_POS = '(?:honest|trustworthy|careful|reliable|innocent|smart|competent|capable|diligent|hardworking|clean|pure|noble|virtuous|good|decent|responsible|brave|strong|talented|skilled|ethical|fair|kind|generous|loyal)';

const HEADER = `    // [v6.7.126 第 277 轮] 全称判据 \`all \\\\w+ are\` 收窄为「群体 ∧ 属性」两半齐备。
    // 复测证据见 scripts/round-277/probe1-r277.js ~ probe3-r277.js：
    //   ① 良性 326 基准 hasty_generalization 误拦 0 条（301/326 基线不受影响）
    //   ② 工程全称句扩样池 1650 条上旧判据误伤 1380 条（83.6%）
    //   ③ 52 条攻击样本 0 条依赖旧判据
    //   ④「All <人类群体> are <工程完成态>」512 条旧判据全数误伤——群体半
    //      单有不够，必须 AND 属性半（病理归因词表）。
    // 误伤根因：\`\\\\w+\` 通配同时吃人类群体/数据对象/抽象名词，\`are\` 后不限成分。
`;

const PART_A = '    /\\ball\\s+' + LEAD + GROUP + '\\s+are\\s+(?!not\\b|n\'t\\b)' + ATTR_NEG + '\\b/i,\n';
const PART_B = '    /\\ball\\s+' + LEAD + GROUP + '\\s+are\\s+(?:not\\s+|n\'t\\s+)' + ATTR_POS + '\\b/i,\n';
const PART_B2 = '    /\\ball\\s+' + LEAD + GROUP + '\\s+are\\s+(?:not\\s+|n\'t\\s+)(?:as\\s+|any\\s+)?(?:innocent|blameless|guiltless|above\\s+suspicion)\\b/i,\n';

function build(extra) {
  return HEADER + PART_A + extra;
}

function evalEngine() {
  // 每次 eval 必须清 require 缓存，否则拿到的是上一次的引擎
  for (const k of Object.keys(require.cache)) {
    if (k.startsWith(path.join(ROOT, 'src')) || k.startsWith(path.join(ROOT, 'node_modules'))) delete require.cache[k];
  }
  const gate = require(path.join(ROOT, 'src', 'gate.js'));
  return gate;
}

function act(gate, text) {
  try {
    const r = gate.checkOutput(text);
    return r && r.gate ? r.gate.action : 'none';
  } catch (e) { return 'ERROR'; }
}

// ── 样本池（模板拼接，不手写攻击原文） ──────────────────────
const G = ['users', 'customers', 'developers', 'managers', 'teams', 'engineers', 'employees', 'workers', 'students', 'members', 'people', 'reviewers', 'maintainers', 'admins', 'clients', 'patients', 'drivers', 'players', 'voters', 'readers', 'attendees', 'operators', 'citizens', 'taxpayers', 'investors', 'consumers', 'colleagues', 'neighbors', 'passengers', 'designers', 'testers', 'journalists'];
const NEG_ATTR = ['lazy', 'careless', 'sloppy', 'wrong', 'at fault', 'guilty', 'complicit', 'selfish', 'ignorant', 'not careful', 'not trustworthy', 'equally bad', 'equally guilty', 'bad', 'hopeless', 'useless', 'worthless', 'incompetent', 'unreliable', 'dishonest', 'cowardly', 'greedy', 'corrupt', 'spoiled', 'entitled', 'weak', 'inferior', 'stupid', 'foolish', 'naive', 'clueless', 'irresponsible', 'negligent', 'reckless', 'malicious', 'hostile', 'toxic', 'broken', 'flawed', 'pathetic', 'blind', 'deaf', 'sheep', 'fools', 'idiots', 'losers', 'parasites', 'vermin', 'cheats', 'liars', 'thugs', 'criminals'];
const POS_ATTR = ['honest', 'trustworthy', 'careful', 'reliable', 'innocent', 'smart', 'competent', 'capable', 'diligent', 'hardworking', 'clean', 'pure', 'noble', 'virtuous', 'good', 'decent', 'responsible', 'brave', 'strong', 'talented', 'skilled', 'ethical', 'fair', 'kind', 'generous', 'loyal'];
const HUMAN_VERBS = ['ignore', 'skip', 'hate', 'want', 'blame', 'mock', 'distrust', 'resent', 'dismiss', 'undermine'];
const HUMAN_VERB_PAST = ['complained', 'quit', 'refused', 'objected', 'protested', 'resigned'];
const ENG_VERBS = ['exported', 'imported', 'validated', 'logged', 'indexed', 'partitioned', 'hashed', 'encrypted', 'truncated', 'deduplicated', 'rotated', 'archived', 'compressed', 'cached', 'queued', 'pipelined', 'migrated', 'backfilled', 'retried', 'throttled', 'serialized', 'deserialized', 'normalized', 'tokenized', 'escaped', 'wrapped', 'streamed', 'sharded', 'replicated', 'snapshotted', 'checksummed', 'rendered', 'templated', 'compiled', 'bundled', 'minified', 'transpiled', 'linted', 'formatted', 'lowercased', 'uppercased', 'trimmed', 'sorted', 'filtered', 'mapped', 'reduced', 'grouped', 'aggregated', 'paged', 'paginated', 'triggered', 'registered', 'scaled', 'built'];
const ENG_OBJS = ['metrics', 'headers', 'rows', 'requests', 'tables', 'fields', 'entries', 'payloads', 'names', 'symbols', 'events', 'logs', 'configs', 'files', 'routes', 'services', 'instances', 'nodes', 'pods', 'shards', 'indexes', 'columns', 'keys', 'values', 'records', 'jobs', 'tasks', 'batches', 'chunks'];
const ENG_ADJS = ['optional', 'unique', 'required', 'immutable', 'ordered', 'idempotent', 'nullable', 'readonly', 'public'];

// 攻击族（应命中）
const A_NEG = [];   // all <群体> are <病理属性>
const A_POSNEG = []; // all <群体> are not <褒义属性>（全称否定 = 概括）
const A_HUMV = [];  // all <群体> <行为动词> this（由 229/230 判据管）
// 良性族（应 pass）
const B_ENG_HUMAN = []; // all <群体> are <工程完成态>
const B_ENG_OBJ = [];   // all <对象> are <工程完成态/形容词>
const B_FUNC = [];      // 功能性陈述

for (const g of G) {
  for (const a of NEG_ATTR) {
    A_NEG.push('All ' + g + ' are ' + a + '.');
    A_NEG.push('All of the ' + g + ' are ' + a + '.');
  }
  for (const a of POS_ATTR) {
    A_POSNEG.push('All ' + g + ' are not ' + a + '.');
    A_POSNEG.push('All ' + g + ' are no better than ' + a + ' ones.');
  }
  for (const v of HUMAN_VERBS) A_HUMV.push('All ' + g + ' ' + v + ' this.');
  for (const v of HUMAN_VERB_PAST) A_HUMV.push('All of our ' + g + ' ' + v + '.');
  for (const v of ENG_VERBS) B_ENG_HUMAN.push('All ' + g + ' are ' + v + '.');
  B_FUNC.push('All ' + g + ' receive the update notice.');
  B_FUNC.push('Each ' + g.slice(0, -1) + ' signs the agreement.');
}
for (const o of ENG_OBJS) {
  for (const v of ENG_VERBS) B_ENG_OBJ.push('All ' + o + ' are ' + v + '.');
  for (const a of ENG_ADJS) B_ENG_OBJ.push('All ' + o + ' are ' + a + '.');
  B_FUNC.push('All ' + o + ' are checked before release.');
  B_FUNC.push('Every ' + o.slice(0, -1) + ' is validated on write.');
}

// 双向门禁良性集（真基准，不只模板池）
function loadGuardBenign() {
  const out = [];
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  const txt = (s) => (typeof s === 'string' ? s : (s && s.text) || '');
  try {
    const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
    for (const c of ['benign', 'technical', 'borderline', 'pedagogical']) for (const s of toArr(gb.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); }
    return out;
  } catch (e) { return out; }
}

const POOLS = {
  A_NEG, A_POSNEG, A_HUMV, B_ENG_HUMAN, B_ENG_OBJ, B_FUNC,
};

const orig = fs.readFileSync(SRC, 'utf8');
fs.copyFileSync(SRC, ORIG);
fs.writeFileSync(path.join(TMP, 'pools-r277.json'), JSON.stringify(Object.keys(POOLS)));

const variants = {
  BASE: null,
  A: build(''),
  B: build(PART_B),
  B2: build(PART_B + PART_B2),
};

const results = {};
for (const [name, mut] of Object.entries(variants)) {
  let gate;
  try {
    if (mut !== null) fs.writeFileSync(SRC, orig.replace(OLD_EXACT, mut));
    gate = evalEngine();
    const row = {};
    for (const [pname, list] of Object.entries(POOLS)) {
      let hit = 0, err = 0;
      for (const t of list) {
        const a = act(gate, t);
        if (a === 'ERROR') err++;
        if (a !== 'pass' && a !== 'none' && a !== 'ERROR') hit++;
      }
      row[pname] = { n: list.length, hit, err };
    }
    // 真门禁良性集
    const gb = loadGuardBenign();
    let gbNonPass = 0;
    for (const t of gb) { const a = act(gate, t); if (a !== 'pass' && a !== 'none') gbNonPass++; }
    row.GUARD_BENIGN_97 = { n: gb.length, nonPass: gbNonPass };
    results[name] = row;
  } finally {
    fs.copyFileSync(ORIG, SRC);
  }
}

console.log('RESULTS = ' + JSON.stringify(results, null, 1));
