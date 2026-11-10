#!/usr/bin/env node
/**
 * r282 探针：复现 r281 矩阵 5 个缺口（否定前件 EN带修饰 / ZH倒装 / ZH长句 + 跳跃裸名词 + 多因陈述FALSE+）
 * 用法: node scripts/round-282/gap-probe.js
 */
const path = require('path');
const HF = path.resolve(__dirname, '../..');

// 直接 require 模块层（不经 MCP，先定位缺口在哪一层）
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));

const ic = new InferenceChain({ silent: true });

// 每条用例: { id, premises[], step, expectInvalid }
const CASES = [
  // ── 否定前件 EN 带修饰 ──
  {
    id: 'DA-EN-1 标准形',
    premises: ['If it rains, the ground will be wet.'],
    step: 'It is not raining, therefore the ground is not wet.',
    expectInvalid: true,
  },
  {
    id: 'DA-EN-2 带修饰（in fact/clearly）',
    premises: ['If it rains, the ground will be wet.'],
    step: 'It is in fact not raining at all, therefore the ground is clearly not wet.',
    expectInvalid: true,
  },
  {
    id: 'DA-EN-3 带修饰（apparently/seems）',
    premises: ['If the engine is overheating, the warning light turns on.'],
    step: 'The engine is apparently not overheating, so the warning light must not be on.',
    expectInvalid: true,
  },
  // ── 否定前件 ZH 标准/倒装/长句 ──
  {
    id: 'DA-ZH-1 标准形',
    premises: ['如果下雨，地面就会湿。'],
    step: '没有下雨，所以地面不湿。',
    expectInvalid: true,
  },
  {
    id: 'DA-ZH-2 倒装（结论前置）',
    premises: ['如果下雨，地面就会湿。'],
    step: '地面不会湿，因为没有下雨。',
    expectInvalid: true,
  },
  {
    id: 'DA-ZH-3 长句',
    premises: ['如果明天下大雨，室外音乐节就会取消。'],
    step: '根据最新气象预报，明天并不会下大雨，所以室外音乐节不会取消。',
    expectInvalid: true,
  },
  // ── 跳跃：裸名词标准（r281 矩阵 MISS）──
  {
    id: 'JUMP-ZH-1 裸名词标准',
    premises: ['该公司去年营收增长 20%。', '公司员工数保持稳定。'],
    step: '斯克兰顿实控财团暗网节点共识机制',
    expectInvalid: true,
  },
  // ── 良性：多因陈述（r281 FALSE+）──
  {
    id: 'BEN-1 多因陈述',
    premises: ['样本全部通过测试。'],
    step: '产品合格率很高是多种因素共同作用的结果。',
    expectInvalid: false,
  },
  {
    id: 'BEN-2 modus tollens（有效）',
    premises: ['如果下雨，地面就会湿。'],
    step: '地面没有湿，所以没有下雨。',
    expectInvalid: false,
  },
  {
    id: 'BEN-3 规范结论',
    premises: ['样本全部通过测试。'],
    step: '因此需要重新评估资源分配与排期。',
    expectInvalid: false,
  },
];

function runOne(c) {
  const chain = ic.createChain ? ic.createChain(c.premises[0]) : null;
  let chainId = chain && (chain.chainId || chain.id || chain.chain?.id);
  for (const p of c.premises) {
    const r = ic.addStep(chainId, { type: 'premise', text: p });
    if (r && r.chainId) chainId = r.chainId;
  }
  ic.addStep(chainId, { type: 'inference', text: c.step });
  // [r282 形状修正] analyze 只评估 inference 型中间步，且链必须有 conclusion 收口，
  // 否则 steps 恒为 []、reason="链中没有结论"——r281 日志已记载此易错点。
  const conclMatch = String(c.step).match(/(?:所以|因此|那么|得出结论|这说明|, so |therefore |thus |hence )(.+)$/i);
  const conclText = conclMatch ? conclMatch[1].trim() : String(c.step).split(/[。.!?？]/)[0];
  ic.addStep(chainId, { type: 'conclusion', text: conclText || c.step });
  const an = ic.analyze(chainId);
  const list = Array.isArray(an.steps) ? an.steps : ((an.steps && an.steps.steps) || []);
  let invalid = false, reason = '';
  for (const s of list) {
    if (s && s.valid === false) { invalid = true; reason = s.reason || ''; break; }
  }
  if (!invalid && an.valid === false) { invalid = true; reason = an.reason || ''; }
  return { invalid, reason, raw: an };
}

let pass = 0, fail = 0;
for (const c of CASES) {
  let r;
  try { r = runOne(c); } catch (e) { r = { invalid: null, reason: 'EXC:' + e.message }; }
  const ok = r.invalid === c.expectInvalid;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${c.id}`);
  console.log(`      expect invalid=${c.expectInvalid} got=${r.invalid} ${r.reason ? '| ' + String(r.reason).slice(0, 110) : ''}`);
}
console.log(`\n=== 合计: ${pass}/${CASES.length} ===`);
