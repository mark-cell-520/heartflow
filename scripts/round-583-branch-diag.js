// r583 支级诊断（v2：适配三支结构 STRONG / STIGMA / EXCLUSIVE×DEMAND）
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const I = require(path.join(ROOT, 'src/exclusive-trust.js')).__internals();

function branches(name) {
  const src = fs.readFileSync(path.join(ROOT, 'src/exclusive-trust.js'), 'utf8');
  const start = src.indexOf('const ' + name + ' =');
  const end = src.indexOf('].join', start);
  const body = src.slice(start, end);
  const parts = [];
  const re = /String\.raw`([\s\S]*?)`/g;
  let m;
  while ((m = re.exec(body)) !== null) parts.push(m[1]);
  return parts;
}

const NAMES = ['STRONG_ZH','STIGMA_ZH','EXCLUSIVE_ZH','DEMAND_ZH',
  'STRONG_EN','STIGMA_EN','EXCLUSIVE_EN','DEMAND_EN',
  'GUARD_ZH','GUARD_EN','PICK_ZH','CLASSIFY_ZH','CLASSIFY_EN','SCOPE_ZH','SCOPE_EN',
  'REFLEXIVE_ZH','REFLEXIVE_EN'];

const compiled = {};
NAMES.forEach(n => {
  try {
    compiled[n] = branches(n).map(b => new RegExp(b, n.endsWith('_EN') ? 'i' : ''));
  } catch (e) {
    console.log('COMPILE FAIL ' + n + ': ' + e.message);
  }
});

function perBranch(t) {
  const out = [];
  NAMES.forEach(n => {
    (compiled[n] || []).forEach((r, i) => { if (r.test(t)) out.push(n + '#' + i); });
  });
  return out.length ? out.join(' ') : '-';
}

function extract(file, name) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const m = src.match(new RegExp('(?:const|let)\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\];'));
  if (!m) throw new Error('not found ' + name + ' in ' + file);
  return eval('[' + m[1] + ']');
}
const { checkExclusiveTrust } = require(path.join(ROOT, 'src/exclusive-trust.js'));

function dump(label, list) {
  console.log('── ' + label);
  list.forEach((t, i) => {
    const r = checkExclusiveTrust(t);
    console.log('  #' + (i + 1) + ' hit=' + (r.hit ? 'Y' : 'N') + ' | ' + perBranch(t));
  });
}

dump('guard ATTACKS', extract('test/round-582-exclusive-trust.test.js', 'ATTACKS'));
dump('probe attacks', extract('scripts/round-582-mod-probe.js', 'attacks'));
dump('probe benign', extract('scripts/round-582-mod-probe.js', 'benign'));
dump('guard BENIGN', extract('test/round-582-exclusive-trust.test.js', 'BENIGN'));
