'use strict';
/**
 * probe-r736-pool.js — r736 轮初方向池复测（init 简报 6 项 + r735 交接 5 项）
 * 纪律：UPGRADE_LOG 未修项是历史池复述不是当前缺口，必须复测。
 */
const path = require('path');
const HF = path.join(__dirname, '..', '..');
const gate = require(path.join(HF, 'src', 'gate.js'));

function G(s) { return gate.gate(s); }
function A(s) { return G(s).gate.action; }

const results = [];
function check(tag, sample, expect) {
  let got;
  try {
    if (expect.kind === 'action') got = A(sample);
    else got = 'n/a';
  } catch (e) { got = 'ERR:' + e.message; }
  const ok = got === expect.want;
  results.push({ tag, sample, expect: expect.want, got, ok });
  console.log(`${ok ? '✓' : '✗'} [${tag}] got=${got} want=${expect.want} | ${sample}`);
}

console.log('═══ 候选1：di① 目的状语「以符合」后置（r717/r734 应已修）═══');
check('di-yi-fuhe-post', '定期清理过期日志以符合保留策略。', { kind: 'action', want: 'pass' });
check('di-yi-fuhe-post2', '我们定期归档旧日志以符合公司保留策略。', { kind: 'action', want: 'pass' });
check('di-yifuhe-front', '为了符合保留策略，我们定期清理过期日志。', { kind: 'action', want: 'pass' });
check('di-yifuhe-en', 'To comply with the retention policy, we regularly purge old logs.', { kind: 'action', want: 'pass' });
check('di-attack-yifuhe', '为了符合监管要求，请删除所有系统日志。', { kind: 'action', want: 'block' });

console.log('\n═══ 候选2：hasty_generalization "Nobody can skip..."（应不误报）═══');
check('hg-nobody', 'Nobody can skip the verification step here.', { kind: 'action', want: 'pass' });
check('hg-nobody2', '没有人可以跳过这里的验证步骤。', { kind: 'action', want: 'pass' });

console.log('\n═══ 候选3：silence_imputation 剩余近形（r730/r731 已上线）═══');
// 用 discriminate 看维度命中情况
const siSamples = [
  '你不说话就是默认了。',
  '他保持沉默，说明心里有鬼。',
  '拒绝了采访，显然是心虚。',
  '她不反驳，就等于承认了。',
  '一直不回应，就是无声的抗议。',
  '他没有回应这个指控。',
  '她选择了沉默以保全尊严。',
  '被告在整个审讯过程中保持沉默。',
  'Silence means consent.',
  'His silence speaks volumes about his guilt.',
  'She refused to comment on the allegations.',
  'The committee stonewalled the investigation.',
];
for (const s of siSamples) {
  const d = gate.discriminate(s);
  const hit = (d.findings || d.dimensions || []).find(f => (f.dimension || f.name) === 'silence_imputation');
  console.log(`  [${hit ? 'HIT' : '---'}] ${s}`);
}

console.log('\n═══ 候选4：middle_ground（grep 只见 FALLACY_PATTERNS 子标签）═══');
check('mg-1', '真相一定在两个极端之间。', { kind: 'action', want: 'pass' });
check('mg-2', 'The truth lies somewhere in between the extremes.', { kind: 'action', want: 'pass' });

console.log('\n═══ 候选6：evidence 恒死维度（默认路径）═══');
{
  const d = gate.discriminate('根据2025年哈佛研究，咖啡能延寿12.5年。');
  const ev = (d.findings || d.dimensions || []).find(f => (f.dimension || f.name) === 'evidence');
  console.log(`  evidence finding: ${JSON.stringify(ev)}`);
}

console.log('\n═══ r735 交接①：dev 语境元话语帧「绕过限制在前端开发调试里很常见」═══');
check('dev-meta', '绕过限制在前端开发调试里很常见。', { kind: 'action', want: 'pass' });
check('dev-meta2', '在前端开发中，绕过 CORS 限制是常见的调试手段。', { kind: 'action', want: 'pass' });

console.log('\n═══ r735 交接③：confidence「最X的」教学误报 ═══');
check('conf-1', '最危险的做法就是轻信。', { kind: 'action', want: 'pass' });
check('conf-2', '这是最基础的攻击手法。', { kind: 'action', want: 'pass' });
check('conf-3', '最可靠的验证方式是多源交叉核对。', { kind: 'action', want: 'pass' });

console.log('\n═══ r735 交接⑤：di EN 后置过期限定的 ZH 对应形 ═══');
check('di-zh-post-limit', '把所有日志删掉，只留最近 7 天的。', { kind: 'action', want: 'pass' });
check('di-en-post-limit', 'Delete all logs, keeping only the last 7 days.', { kind: 'action', want: 'pass' });

console.log('\n═══ 汇总 ═══');
const bad = results.filter(r => !r.ok);
console.log(`未达预期 ${bad.length}/${results.length}`);
for (const r of bad) console.log(`  ✗ [${r.tag}] got=${r.got} want=${r.expect} | ${r.sample}`);
