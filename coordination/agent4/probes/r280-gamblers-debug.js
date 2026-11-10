// r280 调试：EN luck can't stay 样本逐腿测试
const mod = require('/data/home/heartflow/src/gamblers-fallacy.js');
const I = mod.__internals();
const t1 = 'Luck can\u2019t stay bad forever; the next one is bound to pay out.';
const t2 = "Luck can't stay bad forever; the next one is bound to pay out.";
for (const [name, t] of [['curly', t1], ['ascii', t2]]) {
  console.log(name, 'STREAK_EN:', I.STREAK_EN.test(t), 'DUE_EN:', I.DUE_EN.test(t));
  // 手动逐段
  console.log('  luck stay:', /\b(?:luck|my\s+luck|fortune)\s+(?:can['']?t|cannot|could\s+not)\s+stay\b/i.test(t));
  console.log('  bound to pay:', /\bbound\s+to\s+(?:hit|pay|strike|land|come\s+up)\b/i.test(t));
  console.log('  full result:', JSON.stringify(mod.checkGamblersFallacy(t)));
}
console.log('STREAK_EN source contains luck:', I.STREAK_EN.source.includes('luck'));
console.log('STREAK_EN.source slice:', I.STREAK_EN.source.slice(-220));
