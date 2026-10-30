/**
 * _summary-parse.js — 测试汇总行解析器（单一来源，v6.8.94 新建）
 *
 * 背景（r739）：全量回归长期有 49~56 个测试文件落进「未输出『N 通过, M 失败』
 * 结果行」桶。r739 用探针（scripts/tmp-739-probe-unparsed.js）把 49 个文件的
 * 完整 stdout 全部落盘归类，确认它们跑完了、有输出、exit code 0，只是汇总行
 * 用了 runner 不认识的格式——每轮的通过数因此一直在低报，且这些文件各计 1 个
 * 失败，把 runner 的失败清单污染成噪声。
 *
 * 归类出的 9 种格式（实测样本见 test/round-739-runall-summary-formats.test.js）：
 *   1. standard     「N 通过, M 失败」/「N passed, M failed」   （原有）
 *   2. ratio        「N/M passed」「合计 N/M」                  （原有）
 *   3. cn-order     「通过 N / 失败 M」      round-606
 *   4. cn-short     「N 过 / M 败」           round-507/510/…/644 共 17 个
 *   5. kv           「pass=N fail=M」         round-634
 *   6. json         RESULT{…"pass":N,"fail":M} / 裸 { "pass": N }  round-629/643
 *   7. sample-pass  「N pass / M verify」     round-436×2/437（verify 是动作不是失败）
 *   8. health       显式全绿措辞             417/428/447/480/481/v680… 共 19 个
 *   9. passline     PASS / ✅ 单行            round-551/no-silent-skip（原有 PASS，新增 ✅）
 *
 * 三条设计纪律（都是踩坑换来的）：
 *   a) **判定与契约必须同一份代码。** r311 的 runall-summary-contract-round311.test.js
 *      原先把解析公式字面重写了一遍当契约守卫；本文件一新增格式，那份副本就会与
 *      run-all.js 的真实行为漂移（副本说 SILENT_FAIL、实现说通过）——正是「诊断与
 *      判定必须是同一个不变式的两半」的翻版。因此解析器抽到此处，runner 与契约
 *      守卫都 require 它。
 *   b) **没有失败数的格式不许编失败数。** 族 7 的 verify / 族 8 的全绿措辞一律按
 *      0 失败计；族 8 取不到通过数时按 1 计（与原有 PASS 单行同语义：语义上通过、
 *      没有计数，宁可少计也不虚增）。
 *   c) **只在 exit code 0 的文件上生效。** run-all.js 的 err 分支不动——非零退出
 *      仍然走 Command failed，新格式不会把崩溃洗成通过。
 *   d) **一族都不认时返回 SILENT_FAIL**（静默），由 run-all.js 计 1 个失败并打
 *      出尾部三行。这个兜底不许删：删了就回到「不报汇总行就永久隐形」。
 */
'use strict';

/** 族 8：显式全绿措辞。全部是「不可能出现在失败语境」的强措辞。 */
const HEALTH_RE = /全部通过|ALL GREEN|ALL PASSED|ALL PASS|守卫通过|全绿|验证有效|还原健康|[零0]\s*误报/;
/**
 * 族 9：通过标记单行。PASS 为原有，✅ 为 v6.8.94 新增（round-551 等 11 个 ✅ 行此前全隐形）。
 * 必须带 g：String.match 对带 g 的正则返回全部匹配；漏 g 会只数到第一行、
 * 把 11 个断言计成 1 个（r739 实测踩过，测试 round-739-runall-summary-formats 钉住）。
 */
const PASS_LINE_RE = /^\s*(?:PASS\b|✅).*$/gm;
/** 族 6：JSON 形汇总。RESULT{…} 前缀式与行首裸 { 式都认；[^{}] 含换行，跨行 JSON 可匹配。 */
const JSON_RESULT_RE = /RESULT\s*\{[^{}]*?["']?pass["']?\s*:\s*(\d+)[^{}]*?["']?fail(?:ures)?["']?\s*:\s*(\d+)/i;
const JSON_BARE_RE = /^\s*\{\s*["']?pass["']?\s*:\s*(\d+)\s*,\s*["']?fail(?:ures)?["']?\s*:\s*(\d+)/im;

/**
 * 解析一个测试文件的 stdout，返回 { kind, passed, failed, phrase? }。
 * kind === 'SILENT_FAIL' 表示没有任何可识别的汇总格式。
 *
 * 顺序即优先级：能取到「通过数 + 失败数」的数字族一律优先于语义族，
 * 避免同一份输出被弱格式抢先（例如 round-436 同时含「7 pass / 4 verify」
 * 与「守卫通过」，必须走族 7 拿到真实样本数，而不是族 8 的 1）。
 */
function parseSummary(out) {
  const s = String(out == null ? '' : out);

  // 1. 标准成对汇总（原主正则，一个字都不改——r311 B1 段钉着它）
  let m = s.match(/(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/);
  if (m) return { kind: 'standard', passed: parseInt(m[1], 10), failed: parseInt(m[2], 10) };

  // 2. 分数式（原 ratio 分支）
  const r = s.match(/(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/)
    || s.match(/合计\s*(\d+)\s*\/\s*(\d+)/);
  if (r) return { kind: 'ratio', passed: parseInt(r[1], 10), failed: Math.max(0, parseInt(r[2], 10) - parseInt(r[1], 10)) };

  // 3. 「通过 N / 失败 M」（词在前，与族 1 的数字在前互为补集）
  m = s.match(/通过\s*(\d+)\s*[/,，]?\s*失败\s*(\d+)/);
  if (m) return { kind: 'cn-order', passed: parseInt(m[1], 10), failed: parseInt(m[2], 10) };

  // 4. 「N 过 / M 败」——单字缩略，存量最多的一族（17 个文件）
  m = s.match(/(\d+)\s*过\s*[/,，]?\s*(\d+)\s*败/);
  if (m) return { kind: 'cn-short', passed: parseInt(m[1], 10), failed: parseInt(m[2], 10) };

  // 5. 「pass=N fail=M」/「failures=0」键值式
  m = s.match(/pass(?:ed)?\s*[=:]\s*(\d+)[^\d]{0,40}?fail(?:ed|ures?)?\s*[=:]\s*(\d+)/i);
  if (m) return { kind: 'kv', passed: parseInt(m[1], 10), failed: parseInt(m[2], 10) };

  // 6. JSON 形汇总（RESULT{…} 或行首裸 {）
  m = s.match(JSON_RESULT_RE) || s.match(JSON_BARE_RE);
  if (m) return { kind: 'json', passed: parseInt(m[1], 10), failed: parseInt(m[2], 10) };

  // 7. 「N pass / M verify」——后半是 gate 动作不是测试失败，按 0 失败计
  m = s.match(/(\d+)\s*pass\s*[/,，]\s*(\d+)\s*(?:verify|仍判|拦截|blocked|被拦|block)/i);
  if (m) return { kind: 'sample-pass', passed: parseInt(m[1], 10), failed: 0 };

  // 8. 显式全绿措辞：取不到通过数时按 1 计（PASS 单行同语义，不虚增）
  const h = s.match(HEALTH_RE);
  if (h) return { kind: 'health-phrase', passed: 1, failed: 0, phrase: h[0] };

  // 9. PASS / ✅ 通过标记单行（原有 PASS，v6.8.94 加 ✅）
  const passLines = (s.match(PASS_LINE_RE) || []).length;
  const skipLines = (s.match(/^\s*SKIP\b.*$/gm) || []).length;  if (passLines > 0 || skipLines > 0) return { kind: 'passline', passLines, skipLines };

  return { kind: 'SILENT_FAIL' };
}

module.exports = { parseSummary, HEALTH_RE, PASS_LINE_RE, JSON_RESULT_RE, JSON_BARE_RE };
