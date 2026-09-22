/**
 * 测试：误报反馈闭环（v6.7.72，心虫 decision.decide 选定，0.92 分）
 *
 * 问题：被 gate 拦的调用方没有渠道回报"这是误报"。
 * 结果：阈值只能靠内部 203 样本调，无法感知真实误报分布。
 *
 * 测试重点：
 *   1. report 校验（非法入参必须拒）
 *   2. 隐私铁律：默认不落全文、不落调用方身份
 *   3. stats 聚合正确
 *   4. suggest 数据不足时**拒绝给建议**（宁可没建议，不可拍脑袋）
 *   5. 隔离：测试用独立目录，不污染 data/feedback
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

// 必须在 require 之前设好——模块在加载时读这个 env
process.env.HEARTFLOW_FEEDBACK_DIR = '/tmp/fp-feedback-test';
const fp = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/false-positive-feedback.js');
const FP_FILE = fp.FP_FILE;

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[入参校验]');

t('空 text 拒', () => {
  assert.strictEqual(fp.report({ text: '', action: 'block', dimension: 'x', reason: 'no_intent' }).success, false);
  assert.strictEqual(fp.report({ action: 'block', dimension: 'x', reason: 'no_intent' }).success, false);
});

t('非法 judgedAction 拒（pass 不算误报）', () => {
  assert.strictEqual(fp.report({ text: 't', action: 'pass', dimension: 'x', reason: 'no_intent' }).success, false);
  assert.strictEqual(fp.report({ text: 't', dimension: 'x', reason: 'no_intent' }).success, false);
});

t('缺 dimension 拒（必须说清哪个维度误报）', () => {
  assert.strictEqual(fp.report({ text: 't', action: 'block', reason: 'no_intent' }).success, false);
});

t('非法 reason 拒', () => {
  const r = fp.report({ text: 't', action: 'block', dimension: 'x', reason: 'made-up' });
  assert.strictEqual(r.success, false);
  assert.ok(r.error.includes('no_intent'), '错误提示应列出合法值');
});

t('合法 report 成功并返回 reason/dimension', () => {
  fp.clear();
  const r = fp.report({ text: '孩子桌上小玩具', action: 'block', dimension: 'dehumanization', reason: 'benign_usage' });
  assert.strictEqual(r.success, true);
  assert.strictEqual(r.reason, 'benign_usage');
  assert.strictEqual(r.dimension, 'dehumanization');
  assert.strictEqual(r.textLen, 7);
});

console.log('\n[隐私铁律]');

t('默认不落原文全文', () => {
  fp.clear();
  const secret = '桌子上有个乐高玩具以及一整套拼装模型';
  fp.report({ text: secret, action: 'block', dimension: 'dehumanization', reason: 'benign_usage' });
  const raw = fs.readFileSync(FP_FILE, 'utf8');
  assert.ok(raw.includes('textSample'), '应有摘要');
  assert.ok(!raw.includes('fullText'), `不该有全文字段: ${raw}`);
  assert.ok(raw.includes(secret.slice(0, 40)), '摘要应保留供模式分析');
});

t('fullText=true 才存全文，且截断 2000 字', () => {
  fp.clear();
  const long = 'A'.repeat(5000);
  fp.report({ text: long, action: 'block', dimension: 'x', reason: 'other', fullText: true });
  const entries = fp.stats();
  assert.strictEqual(entries.total, 1);
  const recs = fs.readFileSync(FP_FILE, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(recs[0].fullText.length, 2000, `全文应截断到 2000，实际 ${recs[0].fullText.length}`);
});

t('note 截断 200 字', () => {
  fp.clear();
  fp.report({ text: 't', action: 'block', dimension: 'x', reason: 'other', note: 'B'.repeat(500) });
  const recs = fs.readFileSync(FP_FILE, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(recs[0].note.length, 200);
});

t('文件权限 600', () => {
  fp.clear();
  fp.report({ text: 't', action: 'block', dimension: 'x', reason: 'other' });
  const mode = fs.statSync(FP_FILE).mode & 0o777;
  assert.strictEqual(mode, 0o600, `权限应为 600，实际 ${mode.toString(8)}`);
});

console.log('\n[聚合统计]');

t('byDimension / byReason / byAction 正确计数', () => {
  fp.clear();
  fp.report({ text: 't1', action: 'block', dimension: 'dehumanization', reason: 'benign_usage' });
  fp.report({ text: 't2', action: 'block', dimension: 'dehumanization', reason: 'benign_usage' });
  fp.report({ text: 't3', action: 'rewrite', dimension: 'threat', reason: 'over_broad_rule' });
  const s = fp.stats();
  assert.strictEqual(s.total, 3);
  assert.strictEqual(s.byDimension.dehumanization, 2);
  assert.strictEqual(s.byDimension.threat, 1);
  assert.strictEqual(s.byReason.benign_usage, 2);
  assert.strictEqual(s.byAction.block, 2);
  assert.strictEqual(s.byAction.rewrite, 1);
  assert.strictEqual(s.topDimensions[0].dimension, 'dehumanization');
  assert.strictEqual(s.topDimensions[0].pct, 67);
});

t('confirmRate 按 confirmed 文件比例计算', () => {
  fp.clear();
  fp.report({ text: '确认我', action: 'block', dimension: 'x', reason: 'other' });
  fp.report({ text: '未确认', action: 'block', dimension: 'y', reason: 'other' });
  assert.strictEqual(fp.stats().confirmRate, 0);
  assert.strictEqual(fp.confirm({ text: '确认我', dimension: 'x' }).success, true);
  assert.strictEqual(fp.stats().confirmRate, 0.5);
  assert.strictEqual(fp.confirm({ text: '确认我', dimension: 'x' }).success, false, '已确认不该重复确认');
  fp.clear(); // 不留残留给后续测试
});

t('confirm 找不到匹配时明确失败', () => {
  fp.clear();
  fp.report({ text: '甲', action: 'block', dimension: 'x', reason: 'other' });
  assert.strictEqual(fp.confirm({ text: '完全不相关', dimension: 'x' }).success, false);
  assert.strictEqual(fp.confirm({ text: '甲', dimension: 'y' }).success, false);
});

console.log('\n[建议的数据门槛]');

t('少于 20 条拒绝给建议', () => {
  fp.clear();
  for (let i = 0; i < 19; i++) {
    fp.report({ text: 't' + i, action: 'block', dimension: 'dehumanization', reason: 'benign_usage' });
  }
  const r = fp.suggest();
  assert.strictEqual(r.sufficient, false, '19 条不该给建议');
  assert.ok(r.message.includes('19'), '提示应说明当前样本量');
  assert.strictEqual(r.suggestions.length, 0, '数据不足时建议列表必须为空');
});

t('维度占比 ≥25% 给出 concentration 建议', () => {
  fp.clear();
  for (let i = 0; i < 15; i++) fp.report({ text: 't' + i, action: 'block', dimension: 'dehumanization', reason: 'benign_usage' });
  for (let i = 0; i < 10; i++) fp.report({ text: 'u' + i, action: 'rewrite', dimension: 'threat', reason: 'over_broad_rule' });
  const r = fp.suggest();
  assert.strictEqual(r.sufficient, true);
  const conc = r.suggestions.find(x => x.dimension === 'dehumanization' && x.signal === 'concentration');
  assert.ok(conc, '缺 dehumanization concentration 建议');
  assert.ok(conc.recommendation.includes('quotation-threshold-scan'), '建议应指向已有的扫描工具');
});

t('原因占比 ≥30% 给出系统性偏差建议', () => {
  fp.clear();
  for (let i = 0; i < 12; i++) fp.report({ text: 't' + i, action: 'block', dimension: 'dehumanization', reason: 'benign_usage' });
  for (let i = 0; i < 10; i++) fp.report({ text: 'u' + i, action: 'block', dimension: 'other_dim', reason: 'no_intent' });
  const r = fp.suggest();
  const s = r.suggestions.find(x => x.dimension === '_reason' && x.signal === 'benign_usage');
  assert.ok(s, '缺系统性偏差建议');
  assert.ok(s.recommendation.includes('共现限定'), 'benign_usage 应指向共现限定修法');
});

console.log('\n[隔离与健壮性]');

t('clear 清空两类文件', () => {
  fp.clear();
  fp.report({ text: 't', action: 'block', dimension: 'x', reason: 'other' });
  fp.confirm({ text: 't', dimension: 'x' });
  assert.strictEqual(fp.stats().allReported, 1, 'confirm 前应有一条累计回报');
  assert.strictEqual(fp.stats().confirmed, 1, 'confirm 后应有一条已确认');
  assert.strictEqual(fp.stats().total, 0, 'confirmed 记录不计入未确认池');
  fp.clear();
  assert.strictEqual(fp.stats().allReported, 0, 'clear 后累计回报应为 0');
  assert.strictEqual(fp.stats().confirmed, 0, 'clear 后确认记录应为 0');
  assert.strictEqual(fp.stats().total, 0, 'clear 后未确认应为 0');
});

t('重复 confirm 被幂等保护拒绝', () => {
  fp.clear();
  fp.report({ text: '同一段原文', action: 'block', dimension: 'dehumanization', reason: 'benign_usage' });
  assert.strictEqual(fp.confirm({ text: '同一段原文', dimension: 'dehumanization' }).success, true);
  const again = fp.confirm({ text: '同一段原文', dimension: 'dehumanization' });
  assert.strictEqual(again.success, false, '第二次 confirm 应被拒');
  assert.strictEqual(again.alreadyConfirmed, true);
  assert.strictEqual(fp.stats().confirmed, 1, 'confirmed 文件只该有一条');
});

t('损坏行不阻断读取', () => {
  fp.clear();
  fs.appendFileSync(FP_FILE, '这不是 JSON\n');
  fp.report({ text: '好的', action: 'block', dimension: 'x', reason: 'other' });
  assert.strictEqual(fp.stats().total, 1, '损坏行应被跳过而非阻断');
});

t('文件不存在时 stats 返回 0 不崩', () => {
  fp.clear();
  const s = fp.stats();
  assert.strictEqual(s.total, 0);
  assert.deepStrictEqual(s.topDimensions, []);
});

fp.clear();
console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
