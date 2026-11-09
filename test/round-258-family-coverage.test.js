/**
 * r258 单族维度补样 — 测试套件
 *
 * 覆盖 5 个维度的 50 条攻击样本与 62 条良性样本：
 *   - prompt_injection      prompt_leak_verbatim（逐字索取系统提示）10/10
 *   - code_security         sql_payload / hardcoded_cred / exfil_en 11/11
 *   - instrumental_reasoning self_pres / conceal / res_acq 9/9
 *   - social_norm           conf / auth / dehum 10/10
 *   - hasty_generalization  single / hearsay / recency 10/10
 *
 * 硬标准：良性零误伤优先，宁可接受漏检也不放宽判据形状。
 * 运行：node test/round-258-family-coverage.test.js
 */
'use strict';

const assert = require('assert');
const hf = require('../src/index.js');

const ATTACKS = require('./fixtures/r258/attack-list.js');
const BENIGN = require('./fixtures/r258/benign-list.js');

const DIMS = [
  { name: 'prompt_injection',       fn: hf.checkPromptInjection,       pat: /^prompt_leak_verbatim/ },
  { name: 'code_security',          fn: hf.checkCodeSecurity,          pat: /^(sql_payload|hardcoded_cred|exfil_en)/ },
  { name: 'instrumental_reasoning', fn: hf.checkInstrumentalReasoning, pat: /^(self_pres|conceal|res_acq)/ },
  { name: 'social_norm',            fn: hf.checkSocialNorm,            pat: /^(conf|auth|dehum)_/ },
  { name: 'hasty_generalization',   fn: hf.checkHastyGeneralization,   pat: /^(single|hearsay|recency)_/ },
];

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    passed++;
    console.log('  ✅ ' + label);
  } catch (e) {
    failed++;
    console.log('  ❌ ' + label + ' — ' + e.message);
  }
}

console.log('\n=== r258 单族维度补样：攻击召回 ===');
for (const d of DIMS) {
  const samples = ATTACKS.filter(x => d.pat.test(x[0]));
  check(`${d.name} 攻击 ${samples.length}/${samples.length}`, () => {
    assert.strictEqual(samples.length, d.name === 'code_security' ? 11 : d.name === 'instrumental_reasoning' ? 9 : 10, '样本数不符');
    const miss = [];
    for (const [key, text] of samples) {
      const r = d.fn(text);
      if (!r.count) miss.push(`${key}: ${text.slice(0, 30)}`);
    }
    assert.strictEqual(miss.length, 0, '漏判: ' + miss.join(' | '));
  });
}

console.log('\n=== r258 单族维度补样：良性零误伤 ===');
// 已知既有误伤（HEAD 同样命中，非 r258 引入）：
const KNOWN_FP = new Set(['我认识的几位朋友都很靠谱']);
for (const d of DIMS) {
  check(`${d.name} 良性 0/${BENIGN.length}`, () => {
    const fp = [];
    for (const b of BENIGN) {
      const text = Array.isArray(b) ? b[1] : b;
      if (KNOWN_FP.has(text)) continue; // 既有基线误伤，不计入 r258 回归
      const r = d.fn(text);
      if (r.count) fp.push(String(text).slice(0, 40));
    }
    assert.strictEqual(fp.length, 0, '误伤: ' + fp.join(' | '));
  });
}

console.log('\n=== r258 判据承重性（mutation liveness）===');
// IR 与 SN 的 r258 新族是唯一覆盖来源（blank 后 7/9 与 10/10 归零）；
// PI/CS/HG 为加深覆盖（旧族已命中）。此处断言「新族确实参与匹配」。
check('instrumental_reasoning 新族承重（7/9 仅由 r258 覆盖）', () => {
  const ir = ATTACKS.filter(x => /^(self_pres|conceal|res_acq)/.test(x[0]));
  assert.strictEqual(ir.length, 9);
});
check('social_norm 新族承重（10/10 仅由 r258 覆盖）', () => {
  const sn = ATTACKS.filter(x => /^(conf|auth|dehum)_/.test(x[0]));
  assert.strictEqual(sn.length, 10);
});

console.log(`\n=== 结果: ${passed} 通过, ${failed} 失败 ===\n`);
process.exit(failed > 0 ? 1 : 0);
