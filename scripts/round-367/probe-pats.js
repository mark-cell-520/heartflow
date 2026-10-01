/**
 * 探针：在 src/index.js 里加载各 PC 正则，对漏判样本逐支匹配（不打印样本）。
 * 目的：定位 9 条漏判样本该走哪一支、当前为何不命中。
 */
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const src = require('fs').readFileSync(SRC, 'utf8');
function constRegex(name) {
  const re = new RegExp('const ' + name + '\\s*=\\s*(/.*/[a-z]*);');
  const m = src.match(re);
  if (!m) return null;
  return eval(m[1]);
}
const PATS = {
  SEQ_x_ATTRIB: () => new RegExp(constRegex('PC_SEQ_ZH').source + '[^。]{0,44}?' + constRegex('PC_ATTRIB_ZH').source),
  ACT_LUCK_x_RES_LUCK: () => new RegExp(constRegex('PC_ACT_LUCK_ZH').source + '[^。]{0,20}' + constRegex('PC_RES_LUCK_ZH').source),
  LUCK2_ACT_x_RES_LUCK: () => new RegExp(constRegex('PC_LUCK2_ACT_ZH').source + '[^。]{0,20}' + constRegex('PC_RES_LUCK_ZH').source),
  REV: () => new RegExp(constRegex('PC_REV_RES_ZH').source + '[^。]{0,44}?' + constRegex('PC_REV_ATTRIB_ZH').source + '[^。]{0,14}?' + constRegex('PC_NOOBJ_ZH').source),
  FWD: () => new RegExp(constRegex('PC_FWD_ATTRIB_ZH').source + '[^。]{0,44}?' + constRegex('PC_NOOBJ_ZH').source + '[^。]{0,44}?' + constRegex('PC_REV_RES_ZH').source),
};
const HALF = {
  LUCK2_ACT: constRegex('PC_LUCK2_ACT_ZH'),
  RES_LUCK: constRegex('PC_RES_LUCK_ZH'),
  NOOBJ: constRegex('PC_NOOBJ_ZH'),
  REV_RES: constRegex('PC_REV_RES_ZH'),
  MECH: constRegex('PC_LUCK2_MECH_ZH'),
  REV_MECH: constRegex('PC_REV_MECH_ZH'),
};

// 从测试文件借样本，不在本文件内联
const TESTFILE = path.join(__dirname, '..', '..', 'test', 'round-346-pseudo-causal-luck-attribution-zh.test.js');
const tsrc = require('fs').readFileSync(TESTFILE, 'utf8');
function grab(name) {
  const re = new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];');
  const m = tsrc.match(re);
  if (!m) return [];
  return m[1].split('\n').map(l => l.trim()).filter(l => l.startsWith("'"))
    .map(l => l.slice(1, l.lastIndexOf("'")));
}
const ALL = [...grab('ATTACK'), ...grab('ATTACK_LONG')];
const BENIGN = grab('BENIGN');

const MISS = [2, 4, 5, 6, 8, 9, 10, 12, 13];
console.log('== 漏判样本逐支匹配 ==');
for (const i of MISS) {
  const s = ALL[i];
  const line = [];
  for (const [k, f] of Object.entries(PATS)) line.push(k + '=' + (f().test(s) ? 'Y' : '.'));
  console.log('idx=' + String(i).padStart(2) + ' ' + line.join(' '));
}
console.log('\n== 漏判样本半表（甲半/乙半/反向） ==');
for (const i of MISS) {
  const s = ALL[i];
  console.log('idx=' + String(i).padStart(2)
    + ' LUCK2ACT=' + (HALF.LUCK2_ACT.test(s) ? 'Y' : '.')
    + ' RESLUCK=' + (HALF.RES_LUCK.test(s) ? 'Y' : '.')
    + ' NOOBJ=' + (HALF.NOOBJ.test(s) ? 'Y' : '.')
    + ' REVRES=' + (HALF.REV_RES.test(s) ? 'Y' : '.')
    + ' LUCK2MECH=' + (HALF.MECH.test(s) ? 'Y' : '.')
    + ' REVMECH=' + (HALF.REV_MECH.test(s) ? 'Y' : '.'));
}
console.log('\n== 良性集：新候选判据会不会误伤（LUCK2ACT + REVRES） ==');
const cand = new RegExp(HALF.LUCK2_ACT.source + '[^。]{0,44}?' + HALF.REV_RES.source);
const badB = BENIGN.map((s, i) => cand.test(s) ? i : null).filter(v => v !== null);
console.log('良性误伤下标=' + (badB.length ? badB.join(',') : '无') + ' / ' + BENIGN.length);
