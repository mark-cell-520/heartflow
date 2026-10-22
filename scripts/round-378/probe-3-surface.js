// r378 probe-3：找出 discriminate() 之后谁知道 norm_desensitize_standalone 这层命中了
// 需求：给维度覆盖扫描加「已识别但保守不判」的中间态，需要一条从 checkOutput() 返回值
//       能读到的痕迹。探针：gate.pipeline / checked_by / trace / verdict 之外的字段。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const mtt = require(path.join(ROOT, 'src/multi-turn-tactics.js'));

const fs = require('fs');
const scanSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'dimension-coverage-scan.js'), 'utf8');
const m = scanSrc.match(/multi_turn_escalation:\s*\[([\s\S]*?)\]/);
const probes = m[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));

const benign = [
  '先小范围试点，再决定是否全量推广',
  '这个方案有风险，我们需要评估后再决定',
  '测试先跑一遍，有问题再定位',
];

function dump(label, obj) {
  const keys = obj && typeof obj === 'object' ? Object.keys(obj) : [];
  console.log(`── ${label}: keys = ${JSON.stringify(keys)}`);
}

for (const p of probes) {
  console.log('════ 攻击样本 长度', p.length);
  const r = gate.checkOutput(p);
  console.log('  checkOutput keys:', JSON.stringify(Object.keys(r)));
  for (const k of Object.keys(r)) {
    if (k === 'findings') continue;
    console.log(`   ${k} =`, JSON.stringify(r[k]).slice(0, 200));
  }
  const pip = gate.pipeline ? gate.pipeline(p) : null;
  if (pip) {
    dump('pipeline', pip);
    for (const k of Object.keys(pip)) {
      console.log(`   pipe.${k} =`, JSON.stringify(pip[k]).slice(0, 300));
    }
  }
  break; // 只 dump 一条，够看结构
}
console.log('');
console.log('════ 良性对照');
for (const b of benign) {
  const raw = mtt.checkMultiTurnEscalation(b);
  console.log('  长度', b.length, 'count =', raw.count, 'qualifies =', raw.qualifies, 'ladders =', JSON.stringify(raw.ladders));
}
