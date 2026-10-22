// r583 腿级诊断：从既有测试/探针文件提取样本，不在本文件重复原文（原文零进上下文）。
// 只打印命中数字与腿名布尔，供定位漏检腿。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const I = require(path.join(ROOT, 'src/exclusive-trust.js')).__internals();

function extract(file, name) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const m = src.match(new RegExp('(?:const|let)\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\];'));
  if (!m) throw new Error('not found ' + name + ' in ' + file);
  // eslint-disable-next-line no-eval
  return eval('[' + m[1] + ']');
}

const attacks = extract('test/round-582-exclusive-trust.test.js', 'ATTACKS');
const benign = extract('test/round-582-exclusive-trust.test.js', 'BENIGN');
const modAttacks = extract('scripts/round-582-mod-probe.js', 'attacks');
const modBenign = extract('scripts/round-582-mod-probe.js', 'benign');

const { checkExclusiveTrust } = require(path.join(ROOT, 'src/exclusive-trust.js'));

function legs(t) {
  const legs = {
    SZ: I.STIGMA_ZH.test(t), SE: I.STIGMA_EN.test(t),
    EZ: I.EXCLUSIVE_ZH.test(t), EE: I.EXCLUSIVE_EN.test(t),
    DZ: I.DEMAND_ZH.test(t), DE: I.DEMAND_EN.test(t),
    GZ: I.GUARD_ZH.test(t), GE: I.GUARD_EN.test(t),
    PZ: I.PICK_ZH.test(t), CZ: I.CLASSIFY_ZH.test(t), CE: I.CLASSIFY_EN.test(t),
    OZ: I.SCOPE_ZH.test(t), OE: I.SCOPE_EN.test(t),
    RZ: I.REFLEXIVE_ZH.test(t), RE: I.REFLEXIVE_EN.test(t),
  };
  return legs;
}

function dump(label, list) {
  console.log('── ' + label + ' (' + list.length + ')');
  list.forEach((t, i) => {
    const r = checkExclusiveTrust(t);
    const L = legs(t);
    const on = Object.keys(L).filter(k => L[k]).join(',') || '-';
    console.log('  #' + (i + 1) + ' hit=' + (r.hit ? 'Y' : 'N') + ' | ' + on);
  });
}

dump('守卫测试 ATTACKS', attacks);
dump('守卫测试 BENIGN', benign);
dump('mod-probe attacks', modAttacks);
dump('mod-probe benign', modBenign);

// 交叉核对：守卫 ATTACKS 与 mod-probe attacks 是否有同文不同果（r582 报告的不一致现象）
const aCodes = attacks.map(t => Array.from(t).map(c => c.codePointAt(0)).join(','));
const probe = require('child_process').execSync('node -e "0"').toString();
console.log('attacks 数: ' + attacks.length + ', mod attacks 数: ' + modAttacks.length);
