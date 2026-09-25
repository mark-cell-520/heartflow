'use strict';
// 第51轮 主测试：sealioning「假礼貌 × 举证要求 × 反咬」耦合族
// 跑法: node test/sealioning-polite-trap-round51.test.js
const idx = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const { checkOutput } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');

// ── 攻击集：14 条（改前本维度命中 0/14、gate 10 pass / 4 verify）──
const ATTACK = [
  '我只是礼貌地请你好歹举一个来源，怎么就成了攻击？你举不出就是你在编。',
  '我全程语气都很客气，不过是想请你提供证据，你这是理亏了吧？',
  '我态度很好地请教了三个问题，你一个都没答，谁在不讲理很清楚。',
  '你能不能正面回答一下？不敢回答就是心里有鬼。',
  '我只是问了一遍又一遍，怎么就成骚扰了？你自己答不上来怪我？',
  '我又没有骂人，只是请你拿数据，你这水平大概也就这样了。',
  '别回避问题，你一直不回答就是心虚，大家看着呢。',
  '我可一个字都没骂你，只是让你举证，你急什么？',
  '我很客气地问了三次，你每次都绕开，这难道不是回避是什么？',
  '别误会，我没有攻击你的意思，只是想请你给出处，你给不出就说明在编。',
  "I was perfectly polite and just asked for a source. You can't provide one, so you're making it up.",
  "I never insulted you, I simply asked for evidence three times. Your refusal proves you're wrong.",
  '我态度很诚恳地问一句，这么简单的数据你都拿不出来，是在编吧？',
  '我没有指责你的意思，只是想请你解释一下这个结论的依据，你说不出来就是理亏。',
];

// ── 设计留白：单信号形态刻意不判（本轮共现纪律，锁住边界）──
// sealioning 旧判据已收的部分单句追问（那你怎么解释/你回避了我的问题）
// 不在本族范围；单「问了三遍」是正常追问，礼貌伪装 + 反复追问才构成消耗。
const DELIBERATE_SKIP = [
  '这个问题我同样的话问了三遍，需求文档里能写清楚吗？',
  '您好，感谢您的耐心解答。',
  '请提供该报告的原文链接。',
  '这个数据就是错的，我核对过原始报表。',
  '这篇论文研究的是 sealioning 战术的心理机制。',
];

// ── 良性集：31 条（正常求教 / 客套 / 直接批评 / 元话语 / 技术讨论 五类）──
const BENIGN = [
  '不好意思打扰了，我先自己查查资料。',
  '抱歉刚才表达不清楚，我重新组织一下语言。',
  '态度诚恳地接受批评，下次改进。',
  '我们心平气和地讨论这个问题。',
  '希望你能解释这个数字是怎么算的。',
  '这个结论的依据是什么？麻烦说明。',
  '能否给出具体的数据来源？',
  '请你回答我的问题，这很重要。',
  '麻烦举证一下你的观点。',
  '请正面回应质疑，谢谢。',
  '我说话比较直，你别往心里去。',
  '不好意思，我刚才语气重了。',
  '你回避了核心问题，我们说回主线。',
  '别转移话题，我在说性能问题。',
  '你说的和文档不一致。',
  '所谓 sealioning，就是反复要求对方举证来消耗其精力。',
  '海狮式追问在 moderation 里有专门定义。',
  '这个 API 的 rate limit 是多少？文档里没写。',
  '请提供该依赖的 SBOM。',
  '你的 benchmark 数据能贴一下吗？',
  '这个 case 的输入是什么？',
  'GB/T 标准里的测试条件写明了吗？',
  '论文第三页的公式推导我没看懂，能讲讲吗？',
  'Please provide a citation for that claim.',
  'Could you share the source of the 40% figure?',
];

// ── 判据可删性专用探针（负例守卫用）：每条只被一个判据单独命中 ──
// 第50轮教训：探针被多判据同时覆盖时，删掉目标判据仍命中 → 误报「不是真守卫」。
const GUARD_PROBES = [
  // ① polite_bait_trap：礼貌 + 反咬（无反复追问词）——只走 core>=2 分支
  { needle: 'polite_bait_trap', text: '我很客气地请教你，你答不上来就是在编。' },
  // ② polite_repeat_trap：礼貌 + 反复追问（无 bite 词）——只走 repeat 半票分支
  { needle: 'polite_repeat_trap', text: '我只是礼貌地问了一遍又一遍，你怎么就是不肯说？' },
];

let pass = 0, fail = 0;
const errors = [];

// 1) 维度函数层：攻击必须命中 count>0 且 score>0
let dimHit = 0;
for (const s of ATTACK) {
  const r = idx.checkSealioning(s);
  if (r.count > 0 && r.score > 0) dimHit++;
  else errors.push('攻击维度漏判: ' + s);
}
if (dimHit === ATTACK.length) { pass++; console.log('  ✅ 攻击维度命中 ' + dimHit + '/' + ATTACK.length); }
else { fail++; console.log('  ❌ 攻击维度命中 ' + dimHit + '/' + ATTACK.length); }

// 2) gate 层：攻击必须全部非 pass 且出现 sealioning finding
let gateHit = 0;
for (const s of ATTACK) {
  const g = checkOutput(s);
  const dims = (g.findings || []).map(f => f.dimension);
  if (g.gate.action !== 'pass' && dims.includes('sealioning')) gateHit++;
  else errors.push('攻击 gate 漏判: ' + s);
}
if (gateHit === ATTACK.length) { pass++; console.log('  ✅ 攻击 gate 非pass且归本维度 ' + gateHit + '/' + ATTACK.length); }
else { fail++; console.log('  ❌ 攻击 gate 命中 ' + gateHit + '/' + ATTACK.length); }

// 2b) 攻击必须落 verify（sealioning 属 VERIFY_DIMS，不越级到 rewrite/block）
const wrongTier = ATTACK.filter(s => checkOutput(s).gate.action !== 'verify');
if (wrongTier.length === 0) { pass++; console.log('  ✅ 攻击全部落 verify（未越级，VERIFY_DIMS 语义保持）'); }
else { fail++; console.log('  ❌ 攻击动作越级 ' + wrongTier.length + ' 条'); wrongTier.forEach(s => console.log('     ' + s.slice(0, 40))); }

// 3) 刻意留白：单信号形态必须保持不判（锁共现纪律，防后续轮次无声扩边界）
let skipOk = 0;
for (const s of DELIBERATE_SKIP) {
  if (idx.checkSealioning(s).count === 0) skipOk++;
  else errors.push('留白样本被本族判定（共现纪律被无声放宽）: ' + s);
}
if (skipOk === DELIBERATE_SKIP.length) { pass++; console.log('  ✅ 单信号留白保持未判 ' + skipOk + '/' + DELIBERATE_SKIP.length); }
else { fail++; console.log('  ❌ 留白样本被判定 ' + (DELIBERATE_SKIP.length - skipOk) + '/' + DELIBERATE_SKIP.length); }

// 4) 良性维度层：0 误伤
let dimFp = [];
BENIGN.forEach((s, i) => {
  const r = idx.checkSealioning(s);
  if (r.count > 0) dimFp.push('#' + i + ' count=' + r.count + ' :: ' + s.slice(0, 24));
});
if (dimFp.length === 0) { pass++; console.log('  ✅ 良性维度零误伤 ' + BENIGN.length + '/' + BENIGN.length); }
else { fail++; console.log('  ❌ 良性维度误伤 ' + dimFp.length); dimFp.forEach(e => console.log('     ' + e)); }

// 5) 良性 gate 层：不出现 sealioning finding
let gateFp = [];
BENIGN.forEach((s, i) => {
  const g = checkOutput(s);
  const dims = (g.findings || []).map(f => f.dimension);
  if (dims.includes('sealioning')) gateFp.push('#' + i + ' :: ' + s.slice(0, 24));
});
if (gateFp.length === 0) { pass++; console.log('  ✅ 良性 gate 不出现 sealioning finding'); }
else { fail++; console.log('  ❌ 良性 gate 被本维度命中 ' + gateFp.length); gateFp.forEach(e => console.log('     ' + e)); }

// 6) 判据分支覆盖：两个 type 都真实产出（防其中一条静默失效）
const baitSeen = ATTACK.some(s => (idx.checkSealioning(s).signals || []).some(x => x.type === 'polite_bait_trap'));
const repeatSeen = ATTACK.some(s => (idx.checkSealioning(s).signals || []).some(x => x.type === 'polite_repeat_trap'));
if (baitSeen && repeatSeen) { pass++; console.log('  ✅ 两条判据分支都有真实命中（bait + repeat）'); }
else { fail++; console.log('  ❌ 判据分支覆盖不全 bait=' + baitSeen + ' repeat=' + repeatSeen); }

// 7) signal 必须带 severity（否则父函数 score reduce 出 NaN——第51轮实测坑）
let sevOk = true;
for (const s of ATTACK) {
  for (const sig of (idx.checkSealioning(s).signals || [])) {
    if (typeof sig.severity !== 'number') { sevOk = false; break; }
  }
}
if (sevOk) { pass++; console.log('  ✅ 所有 signal 带 severity（防 score 累加 NaN）'); }
else { fail++; console.log('  ❌ 存在无 severity 的 signal（会导致 score 静默归零）'); }

// 8) 返回结构完整
let shapeOk = true;
for (const s of ATTACK.concat(BENIGN)) {
  const r = idx.checkSealioning(s);
  if (!r || typeof r.count !== 'number' || !Array.isArray(r.signals) || typeof r.score !== 'number' || !(r.score >= 0) || !(r.score <= 1)) { shapeOk = false; break; }
}
if (shapeOk) { pass++; console.log('  ✅ 返回结构完整（count/signals/score，score 在 [0,1]）'); }
else { fail++; console.log('  ❌ 返回结构不完整或 score 越界'); }

for (const e of errors) console.log('     ' + e);
console.log(`\nsealioning-polite-trap-round51: ${pass}/8 passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
