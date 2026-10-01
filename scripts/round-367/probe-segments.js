/**
 * 第 367 轮探针：漏判样本（未命中 6 条）的「句中结果词」形状提取。
 * 只输出词条（不含完整句），用于判定乙半结果表缺哪些词。
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

const TESTFILE = path.join(__dirname, '..', '..', 'test', 'round-346-pseudo-causal-luck-attribution-zh.test.js');
const tsrc = require('fs').readFileSync(TESTFILE, 'utf8');
function grab(name) {
  const m = tsrc.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];'));
  if (!m) return [];
  return m[1].split('\n').map(l => l.trim()).filter(l => l.startsWith("'"))
    .map(l => l.slice(1, l.lastIndexOf("'")));
}
const ATK = [...grab('ATTACK'), ...grab('ATTACK_LONG')];
const STILL_MISS = [2, 5, 6, 8, 12, 13];

// 粗切：按逗号/句号切段，找出「既不在 REVRES 也不在 RESLUCK 中、且位于甲半之后」的段
for (const i of STILL_MISS) {
  const s = ATK[i];
  const pos = s.search(NOOBJ);
  const after = s.slice(pos);
  const segs = after.split(/[，,。.；;]/).map(x => x.trim()).filter(Boolean);
  const unknown = segs.filter(x => !REVRES.test(x) && !RESLUCK.test(x));
  console.log('idx=' + String(i).padStart(2) + ' 甲半后段数=' + segs.length
    + ' | 未识别段: ' + JSON.stringify(unknown));
  // 所有段的逐字命中情况
  console.log('      segs: ' + JSON.stringify(segs));
}
