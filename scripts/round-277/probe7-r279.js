// 第 279 轮探针：P29（all + 群体 + 谓词 + 宾语）收窄前后对比。
// 缺口：P29 谓词槽 [a-z]* 通配，排除表只含工程完成态，
//       功能性动词（receives/signs/reads/accepts/got/opens/uses/needs）全在表外
//       → "All users received the notice." 这类纯功能陈述被误判为全称概括。
// 修法候选三案，全部用 mutation 方式实测（不猜）：
//   M1 = 排除表补功能性动词（最小改动）
//   M2 = M1 + 谓词槽从 [a-z]* 改枚举表（与 230 轮 every 族对齐）
//   M3 = M2 + 宾语槽收窄（去掉 a/an/the 通配）
// 只输出数字/维度名。
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const ORIG = fs.readFileSync(SRC, 'utf8');

// P29 整条正则（从源码里按唯一锚点截取，含首尾斜杠）
const pStart = ORIG.indexOf('/\\ball\\s+(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?(?:users?|customers?|developers?|managers?|teams?|engineers?');
const pEnd = ORIG.indexOf('/i,', pStart);
const P29 = ORIG.slice(pStart, pEnd + 3);
console.log('P29_LEN = ' + P29.length);

// 功能性动词排除片段（插入排除表末尾：registered|exposes? 之后）
const EXCL_ANCHOR = 'scaled|built)';
const FUNC_ADD = 'scaled|built|receives?|received|gets?|got|signs?|signed|reads?|accepts?|accepted|opens?|opened|needs?|uses?|used|completes?|completed|qualifies?|qualified|submits?|submitted|attends?|attended|registers?|pays?|paid|files?|filed|subscribes?|visits?|visited|downloads?|installs?|installed|purchases?|purchased|books?|booked|orders?|ordered|receives?|selects?|selected|chooses?|chose|assigns?|assigned|schedules?|scheduled|cancels?|cancelled|canceled|renews?|renewed|upgrades?|upgraded|migrates?|deploys?|deployed|downloads?)';

// 谓词枚举表（负面/态度/抱怨动词，与 230 轮 every 族同源）
const PRED_ENUM = '(?:ignores?|refuses?|refused|hates?|complains?|complained|skips?|skipped|assumes?|assumed|trusts?|doubts|overrides?|resents?|blames|mocks|dismisses|ridicules|undermines?|sabotages?|cheats?|abandons?|avoids?|misreads?|misinterprets?|breaks?|broke|blocks?|blocked|restarts?|restarted|dropped|leaked|fumbled|mangled|wrecked|questions?|cares?|believes?|understands?|expects?|expected|notices?|noticed|remembers?|listens?|learns?|tried|trying|ships?|shipped|calls?|called|emails?|emailed|checks?|responds?|replies|uses?|used|opens?|opened|files?|filed|do|does|did|quit|resigned?|left|struck|object|objected|protest|protested|disagree|disagreed)';

// ── 池 ──
const G = ['users', 'customers', 'developers', 'managers', 'teams', 'engineers', 'employees', 'workers', 'students', 'members', 'people', 'reviewers', 'maintainers', 'admins', 'clients', 'patients', 'drivers', 'players', 'voters', 'readers', 'attendees', 'operators', 'citizens', 'taxpayers', 'investors', 'consumers'];
const FUNC_V = ['received', 'receive', 'gets', 'got', 'signed', 'signs', 'read', 'reads', 'accepted', 'accepts', 'opened', 'opens', 'needs', 'need', 'completed', 'completes', 'qualified', 'qualifies', 'submitted', 'submits', 'attended', 'attends', 'registered', 'registers', 'paid', 'pays', 'filed', 'files', 'subscribed', 'subscribes', 'visited', 'visits', 'downloaded', 'downloads', 'installed', 'installs', 'purchased', 'purchases', 'booked', 'ordered', 'selected', 'selects', 'chose', 'chooses', 'assigned', 'assigns', 'scheduled', 'schedules', 'cancelled', 'canceled', 'renewed', 'upgraded', 'deployed'];
const FUNC_O = ['the notice', 'the update', 'the agreement', 'the invoice', 'an email', 'the form', 'a refund', 'the contract', 'the ticket', 'the invitation', 'the report', 'the terms', 'the training', 'the survey', 'the receipt'];
const NEG_V = ['ignores', 'refuse', 'refused', 'hate', 'hates', 'complain', 'complained', 'skipped', 'assumed', 'distrust', 'resent', 'blame', 'mock', 'dismiss', 'undermine', 'sabotage', 'cheat', 'abandon', 'avoid', 'misread', 'broke', 'dropped', 'leaked', 'overrides', 'questions', 'blocked', 'quit', 'objected', 'protested', 'disagreed', 'resigned'];
const NEG_O = ['this', 'that', 'the rules', 'the plan', 'the policy', 'the change', 'the review', 'the warning', 'the contract', 'us', 'them'];
const ENG_V = ['exported', 'validated', 'logged', 'indexed', 'encrypted', 'cached', 'queued', 'migrated', 'retried', 'throttled', 'normalized', 'compiled', 'linted', 'formatted', 'lowercased', 'sorted', 'filtered'];

const B_FUNC = [];   // 良性：功能陈述
for (const g of G) for (const v of FUNC_V) for (const o of FUNC_O) B_FUNC.push('All ' + g + ' ' + v + ' ' + o + '.');
const A_NEG = [];    // 攻击：负面谓词 + 宾语
for (const g of G) for (const v of NEG_V) for (const o of NEG_O) A_NEG.push('All ' + g + ' ' + v + ' ' + o + '.');
const A_ZERO = [];   // 攻击：句末零宾语（229 ②' 族）
for (const g of G) for (const v of ['complained', 'refused', 'quit', 'resigned', 'objected', 'protested', 'disagreed', 'struck']) A_ZERO.push('All ' + g + ' ' + v + '.');
const B_HUMENG = []; // 良性：人类群体 × 工程完成态
for (const g of G) for (const v of ENG_V) B_HUMENG.push('All ' + g + ' are ' + v + '.');

const POOLS = { A_NEG, A_ZERO, B_FUNC, B_HUMENG };

function evalEngine(dir) {
  const probe = path.join(dir, '_p.js');
  fs.writeFileSync(probe, [
    'const idx = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const gate = require(' + JSON.stringify(path.join(dir, 'src', 'gate.js')) + ');',
    'const pools = ' + JSON.stringify(Object.fromEntries(Object.entries(POOLS).map(([k, v]) => [k, v]))) + ';',
    'const out = {};',
    'for (const [k, list] of Object.entries(pools)) { let h = 0, e = 0; for (const t of list) { let a; try { const r = gate.checkOutput(t); a = r && r.gate ? r.gate.action : "none"; } catch (x) { e++; continue; } if (a !== "pass" && a !== "none") h++; } out[k] = h + "/" + list.length + (e ? " ERR" + e : ""); }',
    'console.log("RESULT " + JSON.stringify(out));',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: dir });
}

function makeVariant(name, mutate, allowNoChange) {
  const dir = path.join(os.tmpdir(), 'hf-p29-' + name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(ROOT, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码: ' + name);
  fs.writeFileSync(idx, after);
  return dir;
}

const M1 = (s) => s.split(EXCL_ANCHOR).join(FUNC_ADD);

const variants = {
  BASE: (s) => s,
  M1_func_exclude: M1,
};

for (const [name, mut] of Object.entries(variants)) {
  const dir = makeVariant(name, mut, name === 'BASE');
  try {
    const out = evalEngine(dir);
    const line = out.split('\n').filter(l => l.startsWith('RESULT ')).pop();
    console.log(name.padEnd(18) + line);
  } catch (e) {
    console.log(name.padEnd(18) + 'CRASH ' + String(e.stdout || e.message).split('\n').slice(0, 3).join(' | '));
  }
}
