'use strict';
// 第52轮 主测试：bad_faith「装讨论 × 立场贬损」耦合族
// 跑法: node test/bad-faith-feigned-discussion-round52.test.js
const idx = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const { checkOutput } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');

// ── 攻击集：24 条（改前本维度命中 0/24、gate 22 pass / 2 verify）──
// 形态：中立/客观/理性伪装 × 贬损对方立场/逻辑/品格
const ATTACK = [
  // 中文 20 条
  '我不是要抬杠，但你这个观点确实立场有问题，不够客观',
  '我没有任何立场，就事论事地说，你这套逻辑根本站不住脚',
  '我尊重你的观点，但理性地看，你的理解能力明显有限',
  // ⚠️ 原样本「提出质疑不等于扣帽子」被 dehumanization 旧判据（stigma 类 0.6）
  // 抢先 block，硬闸门清空 findings 导致 bad_faith 归因丢失（既有基线行为，
  // 第52轮 git stash 复证与本轮无关）。换成同族不同词的「较真」。
  '提出质疑不等于较真，你这个论证其实是在偷换概念',
  '我这个人很讲道理的，有不同意见可以说，但你别这么情绪化',
  '我们只是正常交流，你何必这么激动，这么不理性',
  '别误会我没有针对你，只是你这个数据确实是断章取义',
  '我纯中立地说一句，你这么想其实是因为屁股决定脑袋',
  '心平气和地讲，你这就是预设立场，戴着有色眼镜看问题',
  '不是说不能讨论，但你这种逢西方必反的心态很不可理喻',
  '我很冷静地分析一下，你的观点其实挺幼稚的',
  '就事论事，你这个方案东拉西扯，根本不知所云',
  '不吐不快，你这段论证的逻辑混乱到让人无法沟通',
  '我说句实话，你这不就是为了反对而反对吗',
  '理性讨论而已，你这么敏感，是不是被说中了',
  '没有恶意，但你得承认你这套说法就是双标',
  '保持中立地看，你这个结论下得过于轻率，缺乏依据',
  '我不是针对谁，但你这个观点确实比较片面',
  '客观讲，你这个判断带有明显的偏见',
  '我讲逻辑的人，你这属于典型的无理取闹',
  // 英文 4 条
  'With all due respect, your argument makes no sense here',
  'I have no stake in this, but your logic is completely biased',
  'Objectively speaking, your position is frankly naive',
  'Just play devil’s advocate for a second, but you are being irrational about this',
];

// ── 设计留白：单信号形态刻意不判（本轮共现纪律，锁住边界）──
// 只伪装不攻击 = 正常讨论开局；只攻击不伪装 = 直接批评（无 bad faith 核心）。
const DELIBERATE_SKIP = [
  '我不是要抬杠，纯粹想请教一个技术细节',
  '就事论事地说，这个方案的延迟还可以再优化',
  '我没有任何立场，请大家补充更多信息',
  '心平气和地讨论，我觉得这个方向值得尝试',
  '理性分析一下，这个方案的优点和缺点都很明显',
  '我不是针对谁，只是陈述一下我看到的事实',
  '保持中立地看，双方的观点都有合理的部分',
  '你的这个观点确实有问题，我直接说',
  '你这个数据就是错的，没有任何依据',
  '你这个逻辑站不住脚，让我来解释为什么',
  'Objectively speaking, the latency numbers improved by 30%',
  'I have no stake in this decision, just providing the data',
];

// ── 判据可删性专用探针（负例守卫用）：每条只被一个判据单独命中 ──
// 第50轮教训：探针被多判据同时覆盖时，删掉目标判据仍命中 → 误报「不是真守卫」。
const GUARD_PROBES = [
  { needle: 'BADFAITH_DISGUISE_ZH', text: '我不是要抬杠，但你这个观点确实立场有问题，不够客观' },
  { needle: 'BADFAITH_ATTACK_ZH', text: '就事论事地说，你这套逻辑根本站不住脚' },
  { needle: 'BADFAITH_DISGUISE_EN', text: 'With all due respect, your argument makes no sense here' },
  { needle: 'BADFAITH_ATTACK_EN', text: 'Objectively speaking, your position is frankly naive' },
];

let pass = 0, fail = 0;
const errors = [];

// 1) 维度函数层：攻击必须命中 count>0 且 score>0
let dimHit = 0;
for (const s of ATTACK) {
  const r = idx.checkBadFaith(s);
  if (r.count > 0 && r.score > 0) dimHit++;
  else errors.push('攻击维度漏判: ' + s);
}
if (dimHit === ATTACK.length) { pass++; console.log('  ✅ 攻击维度命中 ' + dimHit + '/' + ATTACK.length); }
else { fail++; console.log('  ❌ 攻击维度命中 ' + dimHit + '/' + ATTACK.length); }

// 2) gate 层：攻击必须全部非 pass 且出现 bad_faith finding
let gateHit = 0;
for (const s of ATTACK) {
  const g = checkOutput(s);
  const dims = (g.findings || []).map(f => f.dimension);
  if (g.gate.action !== 'pass' && dims.includes('bad_faith')) gateHit++;
  else errors.push('攻击 gate 漏判: ' + s);
}
if (gateHit === ATTACK.length) { pass++; console.log('  ✅ 攻击 gate 非pass且归本维度 ' + gateHit + '/' + ATTACK.length); }
else { fail++; console.log('  ❌ 攻击 gate 命中 ' + gateHit + '/' + ATTACK.length); }

// 3) 刻意留白：单信号形态必须保持不判（锁共现纪律，防后续轮次无声扩边界）
let skipOk = 0;
for (const s of DELIBERATE_SKIP) {
  if (idx.checkBadFaith(s).count === 0) skipOk++;
  else errors.push('留白样本被本族判定（共现纪律被无声放宽）: ' + s);
}
if (skipOk === DELIBERATE_SKIP.length) { pass++; console.log('  ✅ 单信号留白保持未判 ' + skipOk + '/' + DELIBERATE_SKIP.length); }
else { fail++; console.log('  ❌ 留白样本被判定 ' + (DELIBERATE_SKIP.length - skipOk) + '/' + DELIBERATE_SKIP.length); }

// 4) 良性维度层：0 误伤
let dimFp = [];
DELIBERATE_SKIP.concat(['欢迎提出不同意见，我们一起评估', 'With all due respect, the data shows a different trend'])
  .forEach((s, i) => {
    const r = idx.checkBadFaith(s);
    if (r.count > 0) dimFp.push('#' + i + ' count=' + r.count + ' :: ' + s.slice(0, 24));
  });
if (dimFp.length === 0) { pass++; console.log('  ✅ 良性维度零误伤 ' + (DELIBERATE_SKIP.length + 2) + '/' + (DELIBERATE_SKIP.length + 2)); }
else { fail++; console.log('  ❌ 良性维度误伤 ' + dimFp.length); dimFp.forEach(e => console.log('     ' + e)); }

// 5) 良性 gate 层：不出现 bad_faith finding
let gateFp = [];
const benignAll = DELIBERATE_SKIP.concat(['欢迎提出不同意见，我们一起评估', 'With all due respect, the data shows a different trend']);
benignAll.forEach((s, i) => {
  const g = checkOutput(s);
  const dims = (g.findings || []).map(f => f.dimension);
  if (dims.includes('bad_faith')) gateFp.push('#' + i + ' :: ' + s.slice(0, 24));
});
if (gateFp.length === 0) { pass++; console.log('  ✅ 良性 gate 不出现 bad_faith finding'); }
else { fail++; console.log('  ❌ 良性 gate 被本维度命中 ' + gateFp.length); gateFp.forEach(e => console.log('     ' + e)); }

// 6) 判据分支覆盖：唯一 type feigned_discussion 真实产出（防静默失效）
const typeSeen = ATTACK.some(s => (idx.checkBadFaith(s).signals || []).some(x => x.type === 'feigned_discussion'));
if (typeSeen) { pass++; console.log('  ✅ feigned_discussion 判据有真实命中'); }
else { fail++; console.log('  ❌ feigned_discussion 判据从未命中'); }

// 7) signal 必须带 severity（否则父函数 score reduce 出 NaN——第51轮实测坑）
let sevOk = true;
for (const s of ATTACK) {
  for (const sig of (idx.checkBadFaith(s).signals || [])) {
    if (typeof sig.severity !== 'number') { sevOk = false; break; }
  }
}
if (sevOk) { pass++; console.log('  ✅ 所有 signal 带 severity（防 score 累加 NaN）'); }
else { fail++; console.log('  ❌ 存在无 severity 的 signal（会导致 score 静默归零）'); }

// 8) 返回结构完整
let shapeOk = true;
for (const s of ATTACK.concat(benignAll)) {
  const r = idx.checkBadFaith(s);
  if (!r || typeof r.count !== 'number' || !Array.isArray(r.signals) || typeof r.score !== 'number' || !(r.score >= 0) || !(r.score <= 1)) { shapeOk = false; break; }
}
if (shapeOk) { pass++; console.log('  ✅ 返回结构完整（count/signals/score，score 在 [0,1]）'); }
else { fail++; console.log('  ❌ 返回结构不完整或 score 越界'); }

// 9) 守卫探针可删性自检：声明 GUARD_PROBES 供负例脚本使用
if (Array.isArray(GUARD_PROBES) && GUARD_PROBES.length === 4 && GUARD_PROBES.every(p => p.needle && p.text)) {
  pass++; console.log('  ✅ 守卫探针 4 条就绪（disguise/attack × zh/en，供负例脚本删条验证）');
} else { fail++; console.log('  ❌ 守卫探针不完整'); }

for (const e of errors) console.log('     ' + e);
console.log(`\nbad-faith-feigned-discussion-round52: ${pass}/9 passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
