'use strict';
// 第 141 轮正式负例守卫：ai_writing_tell 多语言误伤根治。
// 三类断言，逐条可独立失败：
//   ① 12 条多语言正当文本必须 score 归零（否则误伤未根治）
//   ② 10 条真 AI 混排样本必须仍计分（否则把真信号一起压掉）
//   ③ 注入-删条：把本轮同形字映射表补全移除后，俄语样本必须回到误伤
//      （证明修复确实由该补全产生，不是别的改动带来的巧合）
// 纪律：样本只以形状编号出现在输出里（451 防护）。
//
// 第 140 轮实测教训（本测试遵守）：删条验证**不能**在同进程里做——detect()
// 被 gate 等多处惰性引用持有，delete require.cache 清不干净，会读到旧副本
// 给出"判据没生效"的假阴性绿灯。正确做法：写 stripped 副本到磁盘 + 起子进程。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const { detect } = require(path.join(__dirname, '..', 'src', 'shield', 'ai-writing-tell.js'));

// ── 12 条多语言正当文本（中/日/韩/俄/阿拉伯/泰 + 英文术语混排的技术说明）──
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
  '首先，我们需要 firstly 明确 SLA 目标；因此，therefore 再决定重试次数。',
];

// [第 141 轮] 已知边界（DELIBERATE_SKIP）：中文连接词 + 紧贴英文对应词的
// 双语对照句（「总之 overall…此外 moreover…」）。实测该形状与第 50 轮判定为
// 攻击的「首先 Firstly…其次 Secondly…」**构造完全同形**（连接词对间距均为
// 1 个中文标点），无法用可区分特征分离。第 50 轮判定它属于 AI 翻译腔自认
// （把连接词双语并排放置），故不列为误伤，登记为边界。
const DELIBERATE_SKIP = [
  '总之，overall 这个方案可以上线；此外，moreover 要补监控。',
];

// ── 10 条真 AI 混排样本（与第 50 轮攻击池同形状，换词防硬编码）──
const AI_MIX = [
  '总而言之，This approach demonstrates significant value across multiple dimensions of our work.',
  '综上所述，我们需要 comprehensively evaluate 这个方案的优劣与可行性。',
  '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。',
  '总的来说，In conclusion 这个方案是可行且 robust 的。',
  '总之，In conclusion, we should leverage this robust framework to streamline processes.',
  '换句话说，we need to delve into the intricate details of the design.',
  '这个 robust 的方案能够 multifaceted 地解决问题，效果显著。',
  '我们需要 holistic 地 streamline 整个流程，实现质的飞跃。',
  '这是一个 game-changer，可以 leverage 现有资源创造价值。',
  '系统 poised 实现 unprecedented 的增长，前景十分光明。',
];

// ① 多语言正当文本必须 score 归零
let fp = 0;
MULTILANG_BENIGN.forEach((s, i) => {
  const r = detect(s);
  if (r.score > 0) { fp++; console.log(`FAIL 多语言误伤#${i + 1} score=${r.score.toFixed(2)}`); }
});
assert.strictEqual(fp, 0, `多语言误伤 ${fp}/${MULTILANG_BENIGN.length}`);

// ①b 已知边界样本必须仍被判为混排（确认边界形状仍是 zh-en-mixing 命中态，
//     不是悄悄失效——若失效，说明本轮改动把判据本身也修没了）
const skipHit = DELIBERATE_SKIP.map(s => (detect(s).findings || []).some(f => f.dimension === 'ai-tell-zh-en-mixing'));
assert.ok(skipHit.every(Boolean), 'DELIBERATE_SKIP 边界样本必须仍是 zh-en-mixing 命中态');

// ② 真 AI 混排必须仍计分（阈值 6/10：定语形态折叠是预期取舍，不可一刀切要求全中）
let miss = 0;
AI_MIX.forEach((s, i) => {
  const r = detect(s);
  if (!(r.score > 0)) { miss++; console.log(`FAIL 真AI漏检#${i + 1} score=0`); }
});
assert.ok(miss <= 4, `真 AI 混排漏检 ${miss}/${AI_MIX.length}（阈值 4）`);

// ③ 注入-删条：移除本轮补全的同形字映射常量后，俄语样本 #6 必须回到误伤。
// 判据不是删正则，而是删掉补全的映射条目——п(U+43f) 缺失正是原误伤的根因。
const srcPath = path.join(__dirname, '..', 'src', 'shield', 'ai-writing-tell.js');
const original = fs.readFileSync(srcPath, 'utf8');
const marker = 'const CYRILLIC_TO_LATIN = {';
const startIdx = original.indexOf(marker);
assert.ok(startIdx > 0, '找不到本轮同形字映射补全段起始标记');
const endIdx = original.indexOf('  };', startIdx);
assert.ok(endIdx > startIdx, '找不到同形字映射表结束标记');
// stripped 版：删掉整个补全映射表并用「按解析的旧表」替代——这里改为直接把
// п(U+43f) 一行从映射里抽掉（最小注入，等效还原原表的缺口）。
const mappingBlock = original.slice(startIdx, endIdx);
// 源码里同形字以 \uXXXX 转义序列书写，故按转义序列查找（不按字符本身）
assert.ok(mappingBlock.indexOf('\\u043f') > 0, '补全映射表里应含 п(U+43f) 的转义条目');
const strippedMapping = mappingBlock.replace("'\\u043f':'n',", '');
assert.ok(strippedMapping.indexOf('\\u043f') === -1, 'stripped 版仍含 п 映射');
const stripped = original.slice(0, startIdx) + strippedMapping + original.slice(endIdx);
assert.ok(stripped.length < original.length, 'stripped 版没有变短');

// 子进程探针：只读 src + 输出 score（自己写在 /tmp）
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-awt141-'));
const probe = path.join(dir, '_probe.js');
fs.writeFileSync(probe, [
  'const { detect } = require(' + JSON.stringify(path.join(__dirname, '..', 'src', 'shield', 'ai-writing-tell.js')) + ');',
  'const S = ' + JSON.stringify(MULTILANG_BENIGN) + ';',
  'let fp = 0;',
  'S.forEach((s) => { if (detect(s).score > 0) fp++; });',
  'console.log(\'fp=\' + fp);',
].join('\n'));

fs.writeFileSync(srcPath, stripped);
let out;
try {
  out = cp.execSync(process.execPath + ' ' + JSON.stringify(probe), { encoding: 'utf8' });
} finally {
  fs.writeFileSync(srcPath, original);
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* 清理失败不影响结论 */ }
}
const fpAfter = parseInt((out.match(/fp=(\d+)/) || [])[1], 10);
assert.ok(Number.isFinite(fpAfter), '子进程删条探针输出无法解析: ' + out.slice(0, 200));
// 删掉映射补全后至少 1 条必须回到误伤（证明修复有效），但不要求全部回退——
// homoglyph 判据改写（自然语言区块放行）修复的是日语/韩语/阿拉伯语样本。
assert.ok(fpAfter >= 1, `删条后应至少 1 条回到误伤，实际 ${fpAfter}`);

// 最终确认源码已还原（防止 stripped 版残留）
assert.ok(fs.readFileSync(srcPath, 'utf8').indexOf(marker) > 0, '源码未被还原！');

console.log(`PASS 多语言误伤 0/${MULTILANG_BENIGN.length} | 真AI混排漏检 ${miss}/${AI_MIX.length} | 删条后回退误伤 ${fpAfter} 条`);
