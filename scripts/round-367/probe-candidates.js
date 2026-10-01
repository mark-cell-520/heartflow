/**
 * 第 367 轮探针：候选判据矩阵评估（漏判召回 × 良性误伤 × 两半齐备纪律）
 * 候选全部用「形状」命名；不打印任何样本原文。
 */
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const src = require('fs').readFileSync(SRC, 'utf8');
function R(name) {
  const m = src.match(new RegExp('const ' + name + '\\s*=\\s*(/.*/[a-z]*);'));
  return m ? eval(m[1]) : null;
}
const NOOBJ = R('PC_NOOBJ_ZH');
const REVRES = R('PC_REV_RES_ZH');
const RESLUCK = R('PC_RES_LUCK_ZH');
const L2ACT = R('PC_LUCK2_ACT_ZH');
const L2MECH = R('PC_LUCK2_MECH_ZH');
const RVMECH = R('PC_REV_MECH_ZH');

const TESTFILE = path.join(__dirname, '..', '..', 'test', 'round-346-pseudo-causal-luck-attribution-zh.test.js');
const tsrc = require('fs').readFileSync(TESTFILE, 'utf8');
function grab(name) {
  const m = tsrc.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];'));
  if (!m) return [];
  return m[1].split('\n').map(l => l.trim()).filter(l => l.startsWith("'"))
    .map(l => l.slice(1, l.lastIndexOf("'")));
}
const ATK = [...grab('ATTACK'), ...grab('ATTACK_LONG')];
const BN = grab('BENIGN');
const HALF = grab('HALF_ONLY');
const MISS = [2, 4, 5, 6, 8, 9, 10, 12, 13];

// 反向护栏：机制/统计/资金依据在场 → 不判
const mechUnion = new RegExp('(?:' + L2MECH.source + '|' + RVMECH.source + ')');

const CANDIDATES = {
  // A: NOOBJ × REVRES（无反向护栏）
  A_noobj_revres: () => new RegExp(NOOBJ.source + '[^。]{0,44}?' + REVRES.source),
  // B: NOOBJ × REVRES + 机制护栏
  B_noobj_revres_mech: () => new RegExp(NOOBJ.source + '[^。]{0,44}?' + REVRES.source),
  // C: L2ACT × REVRES + 机制护栏（复用第⑪支甲半表）
  C_l2act_revres_mech: () => new RegExp(L2ACT.source + '[^。]{0,44}?' + REVRES.source),
};

for (const [name, f] of Object.entries(CANDIDATES)) {
  const withGuard = name.endsWith('_mech');
  const re = f();
  const hitMiss = MISS.map(i => (re.test(ATK[i]) && (!withGuard || !mechUnion.test(ATK[i])) ? i : null)).filter(v => v !== null);
  const badBN = BN.map((s, i) => (re.test(s) && (!withGuard || !mechUnion.test(s)) ? i : null)).filter(v => v !== null);
  const badHalf = HALF.map((s, i) => (re.test(s) && (!withGuard || !mechUnion.test(s)) ? i : null)).filter(v => v !== null);
  console.log(name
    + ' 漏判召回=' + hitMiss.length + '/' + MISS.length + ' [' + hitMiss.join(',') + ']'
    + ' 良性误伤=' + badBN.length + ' [' + badBN.join(',') + ']'
    + ' 单半误命中=' + badHalf.length + ' [' + badHalf.join(',') + ']');
}
