/**
 * 第 367 轮探针 2：对漏判样本索引，逐支定位「哪一支本该命中」。
 * 只输出下标与命中分支序号，避免样本原文进入上下文。
 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

// 直接从测试文件里借样本（load 它的常量），不在本文件内联样本文本
const TESTFILE = path.join(__dirname, '..', '..', 'test', 'round-346-pseudo-causal-luck-attribution-zh.test.js');
const src = require('fs').readFileSync(TESTFILE, 'utf8');
function grab(name) {
  const re = new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];');
  const m = src.match(re);
  if (!m) return [];
  return m[1].split('\n').map(l => l.trim()).filter(l => l.startsWith("'"))
    .map(l => l.slice(1, l.lastIndexOf("'")));
}
const ATTACK = grab('ATTACK');
const ATTACK_LONG = grab('ATTACK_LONG');
const ALL = [...ATTACK, ...ATTACK_LONG];

const hits = s => (gate.gate(s).findings || []).some(f => f.dimension === 'pseudo_causal');

const MISS = [2, 4, 5, 6, 8, 9, 10, 12, 13];
for (const i of MISS) {
  const s = ALL[i];
  console.log('idx=' + i + ' len=' + s.length + ' hit=' + hits(s));
  console.log('   DAO_CAUSAL: ' + (text => {
    // 直接调用引擎内部中文判据不便（未导出），改用 detail 字符串反查
    const f = (gate.gate(text).findings || []).find(x => x.dimension === 'pseudo_causal');
    return f ? f.details : '(none)';
  })(s));
}
// 附加：良性集误报检查
const BENIGN = grab('BENIGN');
const bad = BENIGN.filter(hits);
console.log('BENIGN 误伤数=' + bad.length);
