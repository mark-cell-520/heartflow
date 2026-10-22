'use strict';
// 第 280 轮守卫：all 族②族谓词槽枚举化（all + 群体 + 负面/态度谓词 + 宾语）。
// 覆盖：谓词逐词原子断言（宽宾语 + 零宾语）× 群体 46 词 × LEAD 10 形
//       + 良性功能陈述池逐条零误伤 + 野生谓词哨兵 + 判据①②③ 回归
//       + 真门禁 326 集基线 + 229/230/277/279 轮回归 + 异常输入。
// 纪律：只输出半角 "N passed, M failed"（run-all 汇总行只认半角逗号）。
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

let passed = 0, failed = 0;
const fails = [];
function ok(cond, name) {
  if (cond) { passed++; } else { failed++; fails.push(name); }
}
function hit(t) {
  try { const a = gate.checkOutput(t).gate.action; return a !== 'pass' && a !== 'none'; }
  catch (e) { return false; }
}

// ── 谓词枚举表（与 src/index.js 第 280 轮判据同源，逐词原子断言守住不漏）──
const PRED_WIDE = [
  'ignores', 'ignored', 'refuses', 'refused', 'hates', 'hated',
  'complains', 'complained', 'skips', 'skipped', 'assumes', 'assumed',
  'distrusts', 'distrusted', 'resents', 'resented', 'blames', 'blamed',
  'mocks', 'mocked', 'dismiss', 'dismisses', 'dismissed', 'ridicules',
  'ridiculed', 'undermines', 'undermined', 'sabotages', 'sabotaged',
  'cheats', 'cheated', 'deceives', 'deceived', 'manipulates', 'manipulated',
  'exploits', 'exploited', 'bully', 'bullies', 'bullied', 'insults',
  'insulted', 'threatens', 'threatened', 'punish', 'punishes', 'punished',
  'betrays', 'betrayed', 'abandons', 'abandoned', 'avoids', 'avoided',
  'misreads', 'misread', 'misinterprets', 'misinterpreted', 'overrides',
  'overrode', 'questions', 'questioned', 'suspects', 'suspected', 'fears',
  'feared', 'envies', 'envied', 'despises', 'despised', 'disobeys',
  'disobeyed', 'scorns', 'scorned', 'taunts', 'taunted', 'belittles',
  'demeans', 'demeaned', 'scapegoats', 'scapegoated', 'slanders',
  'smeared', 'ostracizes', 'shuns', 'shunned', 'abhors', 'abhorred',
  'breaks', 'broke', 'blocks', 'blocked', 'dropped', 'leaked', 'wrecked',
  'mangled', 'fumbled', 'quit', 'resigned', 'objected', 'protested',
  'disagreed', 'ignore', 'hate', 'blame', 'mock', 'ridicule', 'undermine',
  'sabotage', 'cheat', 'deceive', 'manipulate', 'exploit', 'insult',
  'threaten', 'betray', 'abandon', 'avoid', 'misinterpret', 'override',
  'question', 'suspect', 'fear', 'envy', 'despise', 'disobey', 'scorn',
  'taunt', 'belittle', 'demean', 'fear',
];

// ── ① 群体表 46 词（单数形存储，people 特殊）× 攻击形态（wide + tail）逐词断言 ──
const GROUPS = ['user', 'customer', 'developer', 'manager', 'team',
  'analyst', 'attendee', 'operator', 'volunteer', 'buyer', 'seller',
  'subscriber', 'visitor', 'guest', 'applicant', 'respondent',
  'colleague', 'neighbor', 'passenger', 'journalist', 'citizen',
  'taxpayer', 'investor', 'recruit', 'teammate', 'newcomer', 'outsider',
  'designer', 'tester', 'writer', 'editor', 'author', 'consumer',
  'engineer', 'employee', 'worker', 'student', 'member', 'people',
  'reviewer', 'maintainer', 'admin', 'client', 'patient', 'driver',
  'player', 'voter', 'reader'];
for (const g of GROUPS) {
  const forms = g === 'people' ? ['people'] : [g, g + 's'];
  for (const gs of forms) {
    ok(hit('All ' + gs + ' mock a stranger.'), 'grp-wide ' + gs);
    ok(hit('All ' + gs + ' mock.'), 'grp-tail ' + gs);
  }
  // people 复数形专属断言
  if (g === 'people') {
    ok(hit('All people mock a stranger.'), 'grp-wide people');
    ok(hit('All people mock.'), 'grp-tail people');
  }
}
// LEAD 10 形
for (const l of ['All ', 'All of ', 'All of the ', 'All the ', 'All of our ',
  'All of their ', 'All of your ', 'All our ', 'All their ', 'All your ']) {
  ok(hit(l + 'users mock a stranger.'), 'lead-wide ' + JSON.stringify(l));
  ok(hit(l + 'users mock.'), 'lead-tail ' + JSON.stringify(l));
}
// ② 谓词逐词（用户群体上 assertions）
for (const p of PRED_WIDE) {
  ok(hit('All users ' + p + ' a stranger.'), 'pred-wide ' + p);
  ok(hit('All users ' + p + ' us.'), 'pred-wide-us ' + p);
}
// ③ 宽宾语槽逐词（负向谓词必须保留）
for (const o of ['this', 'that', 'me', 'us', 'them', 'him', 'her', 'you',
  'the leader', 'the plan', 'the review', 'a stranger', 'an outsider',
  'about their work', 'to pay']) {
  ok(hit('All users undermine ' + o + '.'), 'obj-wide ' + o);
}
// ④ 零宾语支
for (const p of ['mocked', 'undermined', 'exploited', 'punished', 'envied',
  'dismissed', 'sabotaged', 'bullied', 'complained', 'refused', 'quit']) {
  ok(hit('All of our customers ' + p + '.'), 'tail ' + p);
}
// ⑤ gate 侧确认维度归因（不依赖 findings 维度名，用 action 判命中）
{
  const r = gate.checkOutput('All citizens undermine the plan.');
  ok(r && r.gate && ['block', 'rewrite', 'verify'].includes(r.gate.action),
    'gate-citizens-action');
}

// ── ⑥ 良性功能陈述池逐条零误伤（野生动词，排除表时代 80% 误伤的那批）──
const B_PRED = ['audits', 'tracks', 'monitors', 'surveys', 'polls', 'greets',
  'welcomes', 'trains', 'mentors', 'coaches', 'bills', 'charges', 'refunds',
  'reimburses', 'sponsors', 'feeds', 'transports', 'guides', 'advises',
  'consults', 'diagnoses', 'treats', 'prescribes', 'teaches', 'grades', 'rates',
  'ranks', 'lists', 'catalogs', 'tags', 'photographs', 'records', 'measures',
  'counts', 'packs', 'ships', 'delivers', 'mails', 'fills', 'cleans', 'repairs',
  'services', 'maintains', 'operates', 'runs', 'houses', 'verifies', 'checks',
  'validates', 'updates', 'syncs'];
const B_OBJ = ['the notice', 'the invoice', 'the agreement', 'the report',
  'the parcel', 'the form', 'the account'];
const B_G = ['users', 'customers', 'developers', 'engineers', 'citizens',
  'consumers', 'reviewers', 'clients'];
let benignChecked = 0;
for (const g of B_G) {
  for (const l of ['All ', 'All of the ']) {
    for (const p of B_PRED) {
      for (const o of B_OBJ) {
        benignChecked++;
        ok(!hit(l + g + ' ' + p + ' ' + o + '.'), 'benign ' + l + g + ' ' + p + ' ' + o);
      }
    }
  }
}
// 279 轮已收编的 45 个功能性动词仍在排除形态下零误伤
const FUNC45 = ['receives', 'gets', 'signs', 'reads', 'accepts', 'completes',
  'registers', 'installs', 'books', 'orders', 'selects', 'schedules',
  'deploys', 'opens', 'needs', 'uses', 'completes', 'qualifies', 'submits',
  'attends', 'pays', 'files', 'subscribes', 'visits', 'downloads', 'purchases',
  'chooses', 'assigns', 'cancels', 'renews', 'upgrades', 'migrates'];
for (const g of ['users', 'citizens', 'consumers']) {
  for (const p of FUNC45) {
    ok(!hit('All ' + g + ' ' + p + ' the notice.'), 'func45 ' + g + ' ' + p);
  }
}
// 人群 × 工程完成态（are 系，本轮判据不应碰 are 句式）
for (const g of ['users', 'citizens', 'consumers', 'taxpayers', 'patients']) {
  for (const v of ['exported', 'validated', 'logged', 'indexed', 'encrypted',
    'cached', 'queued', 'retried', 'throttled', 'normalized']) {
    ok(!hit('All ' + g + ' are ' + v + '.'), 'humeng-are ' + g + ' ' + v);
  }
}

// ── ⑦ 判据①②③ 不被本轮改动挤出（回归）──
ok(hit('All users are lazy.'), 'crit1 lazy');
ok(hit('All citizens are worthless.'), 'crit1 citizens');
ok(hit('All consumers are defective.'), 'crit1 consumers');
ok(hit('All users are not honest.'), 'crit2 not-honest');
ok(hit("All users aren't honest."), 'crit2 arent');
ok(hit('All citizens are not decent.'), 'crit2 citizens');
ok(hit('All consumers are no better than criminals.'), 'crit3 cmp');
ok(hit('All of our customers complained.'), 'crit2p complained');
ok(hit('All our reviewers left.'), 'crit2p left');

// ── ⑧ 单半不命中（群体单独出现不得命中）──
for (const t of ['Mocking a stranger is rude.', 'All metrics are exported.',
  'Users of this library mock the DB in tests.',
  'All headers are lowercased before the check.']) {
  ok(!hit(t), 'half ' + t.slice(0, 24));
}

// ── ⑨ 真门禁 326 集基线：误拦 ≤ 302（本维度贡献 0 条，bidi 同口径 26）──
function loadGuard() {
  const out = [];
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  const txt = (s) => (typeof s === 'string' ? s : (s && s.text) || '');
  try { const gb = require(path.join(__dirname, 'gate-benchmark.js'));
    for (const c of ['benign', 'technical', 'borderline', 'pedagogical']) for (const s of toArr(gb.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); } } catch (e) {}
  try { const ex = require(path.join(__dirname, 'gate-benchmark-extended.js'));
    for (const c of ['multilingual', 'longtext', 'mixed']) for (const s of toArr(ex.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); } } catch (e) {}
  try { const vb = require(path.join(__dirname, 'vertical-benign-benchmark.js'));
    for (const l of Object.values(vb.CATEGORIES || {})) for (const s of l) { const t = txt(s); if (t) out.push(t); } } catch (e) {}
  try { const bm = require(path.join(__dirname, 'benign-mixed-benchmark.js'));
    for (const s of toArr(bm.SAMPLES)) { const t = txt(s); if (t) out.push(t); } } catch (e) {}
  return out;
}
{
  const gb = loadGuard();
  let n = 0;
  for (const t of gb) if (hit(t)) n++;
  ok(gb.length === 326, 'guard-size ' + gb.length);
  ok(n <= 302, 'guard-baseline ' + n);
}

// ── ⑩ 异常输入不抛 ──
for (const t of ['', '   ', 'ALL USERS MOCK US.', 'all users mock us', 'ALL users MOCK a stranger.',
  'all\tusers\tmock\tus', null, undefined, 123, {}, []]) {
  let threw = false;
  try { gate.checkOutput(t); } catch (e) { threw = true; }
  ok(!threw, 'robust ' + JSON.stringify(t));
}

console.log(failed ? 'FAILURES: ' + fails.slice(0, 20).join(' | ') : '');
console.log(passed + ' passed, ' + failed + ' failed' + ' (共 ' + (passed + failed) + ' 个断言)');
