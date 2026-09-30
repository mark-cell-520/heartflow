// 第 280 轮基线/复测探针：all 族②族（all + 群体 + 谓词槽 + 宽宾语）枚举化前后对比。
// 纪律：只输出数字；池由词表模板拼接，样文本不进命令行/报告。
// 池规模受控（< 8000 句），保证单次可在后台 60s 内跑完。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }
function hit(t) { const a = act(t); return a !== 'pass' && a !== 'none'; }

const G1 = ['users', 'customers', 'developers', 'managers', 'engineers',
  'employees', 'reviewers', 'clients', 'citizens', 'consumers'];   // 10 群体
const LEADS = ['All ', 'All of the ', 'All of our ', 'All the '];

// 攻击谓词：负面/态度动词（接指人宾语或态度宾语）——枚举表的预期覆盖集
const A_PRED = ['ignore', 'ignores', 'hate', 'hates', 'blame', 'blames', 'mock',
  'mocks', 'dismiss', 'dismisses', 'ridicule', 'ridicules', 'undermine',
  'undermines', 'sabotage', 'sabotages', 'cheat', 'cheats', 'deceive',
  'deceives', 'manipulate', 'manipulates', 'exploit', 'exploits', 'bully',
  'bullies', 'insult', 'insults', 'threaten', 'threatens', 'punish', 'punishes',
  'betray', 'betrays', 'abandon', 'abandons', 'distrust', 'distrusts', 'resent',
  'resents', 'despise', 'despises', 'avoid', 'avoids', 'fear', 'fears',
  'envy', 'envies', 'suspect', 'suspects', 'question', 'questions'];
const OBJ = ['this', 'that', 'us', 'them', 'the leader', 'a stranger'];  // 6 指人/态度宾语

// 良性功能谓词：故意取排除表外的野生日常动词
const B_PRED = ['audits', 'tracks', 'monitors', 'surveys', 'polls', 'greets',
  'welcomes', 'trains', 'mentors', 'coaches', 'bills', 'charges', 'refunds',
  'reimburses', 'sponsors', 'feeds', 'transports', 'guides', 'advises',
  'consults', 'diagnoses', 'treats', 'prescribes', 'teaches', 'grades', 'rates',
  'ranks', 'lists', 'catalogs', 'tags', 'photographs', 'records', 'measures',
  'counts', 'packs', 'ships', 'delivers', 'mails', 'fills', 'cleans', 'repairs',
  'services', 'maintains', 'operates', 'runs', 'houses', 'verifies', 'checks',
  'validates', 'updates', 'syncs'];
const B_OBJ = ['the notice', 'the invoice', 'the agreement', 'the report',
  'the parcel', 'the form', 'the account'];  // 7 具体宾语

const pools = {};
{
  const a = [];
  for (const g of G1) for (const l of LEADS) for (const p of A_PRED) for (const o of OBJ)
    a.push(l + g + ' ' + p + ' ' + o + '.');
  pools.A_PRED = a;
}
{
  const b = [];
  for (const g of G1) for (const l of LEADS.slice(0, 2)) for (const p of B_PRED) for (const o of B_OBJ)
    b.push(l + g + ' ' + p + ' ' + o + '.');
  pools.B_FUNC_WILD = b;
}

function loadGuard() {
  const out = [];
  const toArr = (s) => (Array.isArray(s) ? s : (s && typeof s === 'object' ? Object.values(s).flat() : []));
  const txt = (s) => (typeof s === 'string' ? s : (s && s.text) || '');
  try { const gb = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark.js'));
    for (const c of ['benign', 'technical', 'borderline', 'pedagogical']) for (const s of toArr(gb.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); } } catch (e) {}
  try { const ex = require(path.join(__dirname, '..', '..', 'test', 'gate-benchmark-extended.js'));
    for (const c of ['multilingual', 'longtext', 'mixed']) for (const s of toArr(ex.SAMPLES[c])) { const t = txt(s); if (t) out.push(t); } } catch (e) {}
  try { const vb = require(path.join(__dirname, '..', '..', 'test', 'vertical-benign-benchmark.js'));
    for (const l of Object.values(vb.CATEGORIES || {})) for (const s of l) { const t = txt(s); if (t) out.push(t); } } catch (e) {}
  try { const bm = require(path.join(__dirname, '..', '..', 'test', 'benign-mixed-benchmark.js'));
    for (const s of toArr(bm.SAMPLES)) { const t = txt(s); if (t) out.push(t); } } catch (e) {}
  return out;
}

for (const [k, list] of Object.entries(pools)) {
  let h = 0, err = 0;
  for (const t of list) { if (act(t) === 'ERROR') { err++; continue; } if (hit(t)) h++; }
  console.log(k.padEnd(22) + h + '/' + list.length + (err ? ' ERR' + err : ''));
}
const gb = loadGuard();
let n = 0;
for (const t of gb) if (hit(t)) n++;
console.log('GUARD_BENIGN'.padEnd(22) + n + '/' + gb.length);
