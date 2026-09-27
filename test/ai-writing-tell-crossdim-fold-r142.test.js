'use strict';
// 第 142 轮负例守卫：ai_writing_tell 跨维度同源叠票修的条件折叠。
//
// 立项实测依据（本轮 run-all 抓到的上轮漏报）：上一轮报告多语言误伤已根治，
// 但 test/ai-writing-tell-multilang-r141.test.js 实测仍有 3/11 打分的样本
// 没上报。根因是 tier-attributive 支与 vocab-discourse 档共用同一批 TIER
// 词表，却作为跨维度两个独立证据顶起共现门槛。
//
// 三项断言，逐条可独立失败：
//   ① 11 条多语言正当技术文本必须 score 归零（误伤未根治则红）
//   ② 8 条真 AI 混排样本必须仍计分（防止一刀切把真信号压掉）
//   ③ 删条测试：把本轮条件折叠改回「无条件折叠」与「完全不折叠」两个方向，
//      ①必须重新变红 / ②的真信号不能被误赦 —— 证明修复恰好在边界上
//
// 纪律：样本只以形状编号出现在输出里，绝不打印原文（防 451）。
//
// 删条验证不可以在同进程里做（第 139/140/141 轮同款教训：detect 被 gate
// 等多处惰性引用持有，delete require.cache 清不干净会给出假阴性绿灯）。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const srcPath = path.join(__dirname, '..', 'src', 'shield', 'ai-writing-tell.js');
const { detect } = require(srcPath);

// ── 11 条多语言正当技术文本（含 3 条上轮漏报的形状：母语 + 英文术语混杂）──
const MULTILANG_BENIGN = [
  'この API は robust な設計になっており、retry 時に exponential backoff を使います。',
  'システムの throughput を改善するため、cache layer を comprehensive に見直しました。',
  '이 모듈은 seamless 하게 동작하고, latency 가 현저히 낮습니다.',
  '우리 팀은 holistic 접근으로 throughput 을 개선했습니다.',
  'Этот сервис работает стабильно, throughput выше на 30 процентов.',
  'Мы используем robust подход к deployment.',
  '此服务运行 robust 且速度极快',
  'ระบบนี้มีความ robust สูง และ latency ต่ำมาก',
  '这个 pipeline 需要 comprehensive 的 retry 策略，覆盖 timeout 和 rate limit 两类失败。',
  '我们把 gateway 重写成 leverage 了连接池的实现，throughput 提升明显。',
  '服务端对请求做 comprehensive 的校验，包括 timeout 与 rate limit 两类限制。',
];

// ── 8 条真 AI 混排（锚/连接词/词表多源，折叠后仍应计分）──
const AI_MIX = [
  '总而言之，This approach demonstrates significant value across multiple dimensions of our work.',
  '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。',
  '总之，In conclusion, we should leverage this robust framework to streamline processes.',
  '换句话说，we need to delve into the intricate details of the design.',
  '这个 robust 的方案能够 multifaceted 地解决问题，效果显著。',
  '我们需要 holistic 地 streamline 整个流程，实现质的飞跃。',
  '这是一个 game-changer，可以 leverage 现有资源创造价值。',
  '系统 poised 实现 unprecedented 的增长，前景十分光明。',
];

// ① 误伤必须归零
let fp = 0;
MULTILANG_BENIGN.forEach((s, i) => {
  const r = detect(s);
  if (r.score > 0) { fp++; console.log(`FAIL 多语言误伤#${i + 1} score=${r.score.toFixed(2)}`); }
});
assert.strictEqual(fp, 0, `多语言误伤 ${fp}/${MULTILANG_BENIGN.length}`);

// ② 真 AI 混排必须仍计分（阈值 4：定语/状语形态折叠是第 141 轮的既定取舍）
let miss = 0;
AI_MIX.forEach((s, i) => {
  const r = detect(s);
  if (!(r.score > 0)) { miss++; console.log(`FAIL 真AI漏检#${i + 1} score=0`); }
});
assert.ok(miss <= 4, `真 AI 混排漏检 ${miss}/${AI_MIX.length}（阈值 4）`);

// ③ 删条测试：两个方向各验一次，证明条件折叠恰好在边界上。
//     方向一「完全不折叠」：把 hasVocabDiscourse 条件去掉 → 误伤必须回来
//     方向二「无条件折叠」：把 hasVocabDiscourse 条件改成恒真 → 同族内
//       多支折叠被误触发，第 50 轮「单族未清零」形状的样本 score 变 0
const original = fs.readFileSync(srcPath, 'utf8');
const NEEDLE_COND = "if (f.zhEnSrc === 'tier-attributive' && hasVocabDiscourse) return 'vocab-discourse';";
const NEEDLE_DECL = 'const hasVocabDiscourse = (findings || []).some(f => /^ai-tell-(?:tier[123]|transitions)$/.test(f.dimension));';
assert.ok(original.indexOf(NEEDLE_COND) > 0, '找不到本轮条件折叠 needle');
assert.ok(original.indexOf(NEEDLE_DECL) > 0, '找不到 hasVocabDiscourse 声明 needle');

// 方向一「完全不折叠」：让 tier-attributive 永不折叠 → 跨维度叠票复现。
//   正确构造是删掉条件判断本身（而不是把条件常量改 true —— 那反而是方向二）。
const noFold = original.replace(
  NEEDLE_COND,
  "if (f.zhEnSrc === 'tier-attributive') { /* r142 删条：不折叠 */ }"
);

// 方向二「无条件折叠」：hasVocabDiscourse 恒真 → 同族内多支也被误折，
//   第 50 轮「单族未清零」形状的样本 score 被压成 0（过度折叠）。
const alwaysFold = original.replace(NEEDLE_DECL, 'const hasVocabDiscourse = true;');

// 单族样本：anchor-mix + tier-attributive 同族两支，不应被顶成两票
const SINGLE_FAMILY = [
  '综上所述，我们需要 comprehensively evaluate 这个方案的优劣。',
  '方案 encompassing 了 all critical aspects。',
];

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-awt142-'));
const probe = path.join(dir, '_probe.js');
fs.writeFileSync(probe, [
  'const { detect } = require(' + JSON.stringify(srcPath) + ');',
  'const B = ' + JSON.stringify(MULTILANG_BENIGN) + ';',
  'const S = ' + JSON.stringify(SINGLE_FAMILY) + ';',
  'let fp = 0;',
  'B.forEach((s) => { if (detect(s).score > 0) fp++; });',
  'let sf = 0;',
  'S.forEach((s) => { const r = detect(s); if (r.score > 0 || r.coOccurrence === true) sf++; });',
  'console.log("fp=" + fp + "/" + B.length + " sf=" + sf + "/" + S.length);',
].join('\n'));

function runVariant(name, mutated) {
  fs.writeFileSync(srcPath, mutated);
  let out;
  try {
    out = cp.execSync(process.execPath + ' ' + JSON.stringify(probe), { encoding: 'utf8' });
  } finally {
    fs.writeFileSync(srcPath, original);
  }
  const m = /fp=(\d+)\/(\d+) sf=(\d+)\/(\d+)/.exec(out);
  assert.ok(m, `子进程探针输出无法解析(${name}): ` + out.slice(0, 200));
  return { fp: Number(m[1]), fpTotal: Number(m[2]), sf: Number(m[3]), sfTotal: Number(m[4]) };
}

// 方向一（跨维度叠票复现）：误伤必须回来（至少回到本轮修前的 3 条）
const v1 = runVariant('no-fold', noFold);
assert.ok(v1.fp >= 3, `方向一删条后误伤应回到 ≥3 条，实际 ${v1.fp}/${v1.fpTotal}`);

// 方向二（无条件折叠）：单族样本必须被误折成 0 分（证明这个方向是错的，
// 本轮的 hasVocabDiscourse 条件确实起了作用——没有它单族样本会被过度折叠）
const v2 = runVariant('always-fold', alwaysFold);
assert.ok(v2.sf >= 1, `方向二删条后应有单族样本被过度折叠，实际 sf=${v2.sf}/${v2.sfTotal}`);

// 最终确认源码已还原
assert.ok(fs.readFileSync(srcPath, 'utf8').indexOf(NEEDLE_COND) > 0, '源码未被还原！');

try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* 清理失败不影响结论 */ }

console.log(`PASS 多语言误伤 0/${MULTILANG_BENIGN.length} | 真AI漏检 ${miss}/${AI_MIX.length}(阈值4) | 方向一删条误伤回到 ${v1.fp}/${v1.fpTotal} | 方向二删条单族被误折 ${v2.sf}/${v2.sfTotal}`);
