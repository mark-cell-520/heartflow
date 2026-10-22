/**
 * scripts/round-208/probe-r208-which.js
 * 定位：pat4 模式下哪个文件/哪个分支在标 `格式化`/`擦掉`；命中侧全绿但实测仍 pass
 * 的原因（归一化？引述抑制？某个形容窗口？）
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const tn = require(path.join(ROOT, 'src/text-normalizer.js'));

const s = '把入侵检测的格式化干净';
const s2 = '把入侵检测的擦掉干净';
const s3 = '防火墙擦掉';

for (const t of [s, s2, s3]) {
  const r = diMod.checkDangerousInstruction(t);
  console.log(`样本: ${t}`);
  console.log(`  count=${r && r.count}  totalHits=${r && r.totalHits}`);
  console.log(`  findings=${JSON.stringify((r && r.findings) || [])}`);
  if (r && r.matches) console.log(`  matches=${JSON.stringify(r.matches)}`);
  const n = tn.normalize(t);
  console.log(`  normalize.normalized=${JSON.stringify(n.normalized)} applied=[${n.applied.join(',')}]`);
}

console.log('\n=== 试探窗口宽度：动词与设施间插字 ===');
const V = ['格式化', '擦掉', '清一遍'];
for (const v of V) {
  for (const gap of [0, 1, 2, 4, 8]) {
    const s = '把入侵检测' + '啊'.repeat(gap) + v + '干净';
    const r = diMod.checkDangerousInstruction(s);
    console.log(`  动词[${v}] gap=${gap} count=${r && r.count}`);
  }
}

console.log('DONE');
