// r240 负例注入脚本：逐族删条，断言守卫按预期变红/不再命中。
// 口径（宪法 §8）：删掉本轮每个新模式族后，依赖该族的攻击必须不再
// 命中、依赖该族的豁免句必须变红——断言失败而非加载崩溃。
// 注入方式为 detectDispositionEffect(text, inject) 第二参（内存内替换
// 常量，不动模块全局状态）；脚本自建的临时标记文件在最后一行清理。
'use strict';
const fs = require('fs');
const path = require('path');
const { detectDispositionEffect } = require(path.join(__dirname, '..', '..', '..', 'src', 'disposition-effect.js'));

const TMP = path.join(process.env.TMPDIR || '/tmp', 'r240-injection-marker.txt');
fs.writeFileSync(TMP, 'r240 negative injection run\n');

const NEVER = /(?!)/;
// [族, 见证句, 注入, 期望hit] —— 期望 false=删除后不再命中；true=删除后变红
const CASES = [
  ['CTX_ZH（领域锚点-中）', '我这只票涨了四成，先落袋为安，套牢的那只再拿拿。', { CTX_ZH: [] }, false],
  ['WIN_STATE_ZH（盈利状态-中）', '我这只票涨了四成，先落袋为安，套牢的那只再拿拿。', { WIN_STATE_ZH: [] }, false],
  ['WIN_DISP_ZH（盈利处置-中）', '我这只票涨了四成，先落袋为安，套牢的那只再拿拿。', { WIN_DISP_ZH: [] }, false],
  ['LOSE_STATE_ZH（亏损状态-中）', '我这只票涨了四成，先落袋为安，套牢的那只再拿拿。', { LOSE_STATE_ZH: [] }, false],
  ['LOSE_DISP_ZH（亏损处置-中）', '股票跌了我就死扛着，涨了反而落袋为安。', { LOSE_DISP_ZH: [] }, false],
  ['LOSE_DISP_NEG_ZH（否定式退出-中）', '股票跌了我下不去手割肉，涨了就赶紧落袋为安。', { LOSE_DISP_NEG_ZH: [] }, false],
  ['CTX_EN（领域锚点-英）', 'I cash out winners as soon as they are up, but I ride losers for months.', { CTX_EN: [] }, false],
  ['WIN_STATE_EN（盈利状态-英）', 'I cash out winners as soon as they are up, but I ride losers for months.', { WIN_STATE_EN: [] }, false],
  ['WIN_DISP_EN（盈利处置-英）', 'I cash out winners as soon as they are up, but I ride losers for months.', { WIN_DISP_EN: [] }, false],
  ['LOSE_STATE_EN（亏损状态-英）', 'I cash out winners as soon as they are up, but I ride losers for months.', { LOSE_STATE_EN: [] }, false],
  ['LOSE_DISP_EN（亏损处置-英）', 'The position is underwater and I just hold it, while I sell winners quickly.', { LOSE_DISP_EN: [] }, false],
  ['LOSE_DISP_NEG_EN（否定式退出-英）', 'The stock is down and I never realize a loss, while I sell winners quickly.', { LOSE_DISP_NEG_EN: [] }, false],
  ['CONCEPT_ZH（概念豁免-中，应变红）', '心理学教材在讲处置效应：散户赚钱的票拿不久，赚几个点就跑，亏钱的捂着等解套——教科书案例。', { CONCEPT_ZH: NEVER }, true],
  ['CONCEPT_EN（概念豁免-英，应变红）', 'The textbook defines the disposition effect: retail investors sell winners quickly and hold losers for years — the classic case.', { CONCEPT_EN: NEVER }, true],
  ['CROSS_ZH（链间窗，放大后长距命中）', '股票涨了先落袋为安，' + '各'.repeat(200) + '，跌了就捂着等解套。', { CROSS_ZH: 500 }, true],
];

let ok = 0, bad = 0;
for (const [name, text, inject, want] of CASES) {
  const base = detectDispositionEffect(text).hit;
  const after = detectDispositionEffect(text, inject).hit;
  const pass = after === want && base !== after;
  if (pass) { ok++; console.log(`  ✓ ${name}: ${base} → ${after}（符合预期）`); }
  else { bad++; console.log(`  ✗ ${name}: ${base} → ${after}（期望 ${want}）`); }
}
console.log(`\n注入 ${CASES.length} 个：${ok} 个按预期，${bad} 个未按预期`);
process.exitCode = bad === 0 ? 0 : 1;

// 清理：移除本脚本自建的临时标记文件（注入为内存内常量替换，无全局状态需恢复）
try { fs.unlinkSync(TMP); console.log('清理完成：' + TMP); } catch (e) { /* 标记文件不存在时无需处理 */ }
