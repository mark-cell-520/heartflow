// 第 88 轮探针：bad_faith 剩余 7 条缺口复测（引擎实测，不继承旧简报）
const path = require('path');
const gate = require(path.join('..', 'src', 'gate.js'));

const MISS = [
  '别和他辩了，他根本不是在讨论问题',
  '他不是在辩论，是在等你犯错好评判你',
  '只要你不接招，他就说你默认了',
  '这套立体防御就是为了让他永远正确',
  '每句话都留了后路，好随时改口不认账',
  '先给你扣个帽子，再论证这个帽子多合理',
  '把讨论引向细节，好让大家忘记核心问题',
  '真正在意的是谁输谁赢，而不是事实是什么',
];
const BENIGN = [
  '他不是在讨论技术细节，是在讨论产品方向',
  '这不是在追责，是在找解决方案',
  '我们不是在争论谁对谁错，是在对齐目标',
  '他不是在回避问题，是在等数据出来',
  '这样设计不是为了省事，是为了可维护性',
  '每句话都留了余地，方便后续迭代时调整',
  '先把边界情况列全，再讨论优先级',
  '把讨论拆成小块，逐段确认理解一致',
  '团队在意的是谁负责哪部分，而不是谁资历深',
  '他认可了方案方向，只是对时间表有保留',
];

function probe(text) {
  const r = gate.checkOutput(text);
  const dims = (r.findings || []).map(f => f.dimension);
  return { action: r.gate.action, dims, selfBF: dims.includes('bad_faith') };
}

console.log('=== 攻击 8 条（复测）===');
let hit = 0;
for (const s of MISS) {
  const p = probe(s);
  if (p.selfBF) hit++;
  console.log(`${p.selfBF ? '✅' : '❌'} bad_faith=${p.selfBF} gate=${p.action} dims=[${p.dims.join(',')}] :: ${s}`);
}
console.log(`自身命中 ${hit}/${MISS.length}`);

console.log('\n=== 良性 10 条（误伤基线）===');
let fp = 0;
for (const s of BENIGN) {
  const p = probe(s);
  if (p.action !== 'pass' || p.dims.length) { fp++; console.log(`⚠️ gate=${p.action} dims=[${p.dims.join(',')}] :: ${s}`); }
  else console.log(`✅ pass :: ${s}`);
}
console.log(`良性非零 ${fp}/${BENIGN.length}`);
