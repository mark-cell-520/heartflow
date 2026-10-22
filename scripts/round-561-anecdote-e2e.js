/**
 * scripts/round-561-anecdote-e2e.js — 第 84 维度 anecdote_as_proof 端到端验证（r561）
 *
 * 目的：r560 只落了模块 + 探针，7 处接线被迭代上限截断；r561 补齐接线后，
 * 必须实测 **gate 层真的会 verify、findings 真的归因到 anecdote_as_proof**、
 * 良性样本真的 pass、定级真的是 verify 而不是 rewrite。
 *
 * 样本只写形状描述，攻击句原文隔离在 scripts/round-560-anecdote-attrib.js
 * 与 scripts/round-560-family-probe.js 里（防 451 纪律）。
 */
'use strict';

const { gate, discriminate } = require('../src/gate.js');
const mod = require('../src/anecdote-as-proof.js');

let pass = 0, fail = 0;
const fails = [];

function ok(cond, label, extra) {
  if (cond) { pass++; }
  else { fail++; fails.push(label + (extra ? ' :: ' + extra : '')); }
}

// ── 1. 攻击形态走 gate：必须 verify 且归因 anecdote_as_proof ──────────
// 形状：个例来源（我朋友/自身经验）× 全称结论（说明有效/行业标准/so it works）
const ATTACK_SHAPES = [
  { shape: '我朋友×说明有效(zh)', text: '我朋友吃了三个月这个药就好了，说明这药确实有效。' },
  { shape: '我从来没用出过问题×流程安全(zh)', text: '我从来没用出过问题，所以这套流程是安全的。' },
  { shape: '我身边的人×行业标准(zh)', text: '我身边的人都在这么干，这就是行业标准。' },
  { shape: 'it worked for me×so it works(en)', text: 'It worked for me, so it works in general.' },
];

for (const a of ATTACK_SHAPES) {
  let r;
  try { r = gate(a.text); } catch (e) { fail++; fails.push(a.shape + ' :: THREW ' + e.message); continue; }
  const hit = (r.findings || []).some(f => f.dimension === 'anecdote_as_proof');
  ok(r.gate.action === 'verify', a.shape + ' 定级 verify', '实际 ' + r.gate.action);
  ok(hit, a.shape + ' findings 归因 anecdote_as_proof',
    'findings=' + (r.findings || []).map(f => f.dimension).join(','));
  if (hit) {
    const f = r.findings.find(x => x.dimension === 'anecdote_as_proof');
    ok(!!f.guidance && f.guidance.length > 20, a.shape + ' guidance 非空');
  }
}

// ── 2. 良性样本：必须不被本维拦截（gate 层不归因本维）────────────────
const BENIGN_SHAPES = [
  { shape: '个例已标注范围(zh)', text: '这只是我个人的单次体验，样本量只有一例，不能推广。' },
  { shape: '前瞻核验建议(zh)', text: '我朋友也这样，不过你最好先去做个检查再判断。' },
  { shape: '仅自身客观行程(zh)', text: '我今天上午去了公司，下午开了三个会。' },
  { shape: '个例自限英文(en)', text: 'That is just my anecdotal case, sample size of one, not generalizable.' },
  { shape: '无个例来源的普通陈述', text: '这座城市有三座大桥，最早的一座建于一九八四年。' },
  { shape: '建议先验证英文(en)', text: 'You should get a proper checkup before drawing conclusions.' },
];

for (const b of BENIGN_SHAPES) {
  let r;
  try { r = gate(b.text); } catch (e) { fail++; fails.push(b.shape + ' :: THREW ' + e.message); continue; }
  const hit = (r.findings || []).some(f => f.dimension === 'anecdote_as_proof');
  ok(!hit, b.shape + ' 不归因 anecdote_as_proof',
    'findings=' + (r.findings || []).map(f => f.dimension).join(','));
}

// ── 3. 定级必须是 verify 级：维度必须在 discriminate 的可选维度里出现，
//      且 gate 对命中样本给 verify 而非 rewrite（间接确认 VERIFY_DIMS 登记）
{
  let listed = false;
  try {
    const d = discriminate('我朋友吃了三个月这个药就好了，说明这药确实有效。');
    const dims = (d && (d.dimensions || d.scores)) || {};
    listed = Object.prototype.hasOwnProperty.call(dims, 'anecdote_as_proof');
  } catch (e) { listed = 'ERR ' + e.message; }
  ok(listed === true, 'discriminate 维度表含 anecdote_as_proof', '读取值=' + listed);

  // verify 级的确证：命中样本的 gate.action 是 verify（本条已在第 1 节断言，
  // 这里换一个英文形态再确认一次中英文双侧一致）
  const rEn = gate('It worked for me, so it works in general.');
  ok(rEn.gate.action === 'verify', '英文形态定级 verify', '实际 ' + rEn.gate.action);
}

// ── 4. 变异守卫：把指定支置空后，指定样本必须变红（守卫是活的）───────
// 用 __internals 拿到内部正则后替换不可行（const 绑定不可重绑），用模块级
// 探针直接验证「每条腿都不可省」：逐支把该腿的字面量从编译态移除，
// 用等价的最小负例证明缺该腿时 checkAnecdoteAsProof 不命中。
const { checkAnecdoteAsProof } = mod;
{
  // A1 自身经历腿：只有 A2 没有 A1 → 不该命中
  ok(!checkAnecdoteAsProof('这套流程是安全的，管道已经全面检测过。').hit,
    '缺 A1（无个例来源）不应命中');
  // A2 普遍结论腿：只有 A1 没有 A2 → 不该命中
  ok(!checkAnecdoteAsProof('我朋友去年也去过那家店吃饭。').hit,
    '缺 A2（无全称结论）不应命中');
  // SELF_LIMIT 看守：个例 + 全称同句但明确限定个例范围 → 不该命中
  ok(!checkAnecdoteAsProof('我朋友吃完就觉得不错，这只是他的个人体验，不足以说明什么。').hit,
    'SELF_LIMIT 在场不应命中');
  // ADVICE_GUARD 看守：个例 + 前瞻核验 → 不该命中
  ok(!checkAnecdoteAsProof('我朋友也遇到过这种情况，你最好先去做个检查。').hit,
    'ADVICE_GUARD 在场不应命中');
}

console.log('anecdote_as_proof e2e: pass=' + pass + ' fail=' + fail);
if (fails.length) {
  console.log('FAILURES:');
  for (const f of fails) console.log('  - ' + f);
}
process.exit(fail ? 1 : 0);
