#!/usr/bin/env node
/**
 * scripts/negative-test-decision-router-r220.js
 *
 * 第 220 轮负例守卫：注入-删条-必须变红。
 * 对象：test/decision-router.test.js（本轮重写的 20 条真断言）
 *
 * 纪律（照 216/217/218/219 轮）：
 *   · 每个变异改一处真实缺陷，跑测试必须红
 *   · 至少一个对照组（只改注释）必须保持全绿 —— 证明测试不是「逢改必红」
 *   · 零无效变异：所有 M 用例必须红、N 用例必须绿
 *   · 跑完自动还原，src/ 与 test/ 零残留
 *
 * 判据纪律：变异必须对着「本轮断言真正守护的语义」下刀，不能改无关行。
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/core/decision-router.js');
const TEST = path.join(ROOT, 'test/decision-router.test.js');

function runTest() {
  try {
    execSync(`node ${JSON.stringify(TEST)}`, { cwd: ROOT, stdio: 'pipe' });
    return { ok: true, out: '' };
  } catch (e) {
    return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}

function readSrc() { return fs.readFileSync(SRC, 'utf8'); }
function writeSrc(s) { fs.writeFileSync(SRC, s); }

const results = [];
function mutate(name, fn) {
  const orig = readSrc();
  try {
    const next = fn(orig);
    if (next === orig) { results.push({ name, ok: false, why: '变异未改变任何内容（old_string 失效）' }); return; }
    writeSrc(next);
    const r = runTest();
    results.push({ name, ok: !r.ok, why: r.ok ? '测试仍然全绿（无效变异！）' : '正确变红' });
  } catch (e) {
    results.push({ name, ok: false, why: '变异执行失败: ' + e.message });
  } finally {
    writeSrc(orig);
  }
}

function expectGreen(name, fn) {
  const orig = readSrc();
  try {
    const next = fn(orig);
    if (next === orig) { results.push({ name, ok: false, why: '对照变异未改变内容' }); return; }
    writeSrc(next);
    const r = runTest();
    results.push({ name, ok: r.ok, why: r.ok ? '正确保持全绿' : '测试意外变红（对照组失败）', out: r.out });
  } catch (e) {
    results.push({ name, ok: false, why: '对照执行失败: ' + e.message });
  } finally {
    writeSrc(orig);
  }
}

// ── M 系列：真变异，必须变红 ────────────────────────────────────────

// M1 删掉 cognitive-overload 的 >high 分档置信度（0.9 → 0.6）
// 守护：cognitiveLoad 0.8 → pause confidence 0.9 的精确值
mutate('M1 cognitive-overload >high 置信度 0.9→0.6', (s) =>
  s.replace(
    "return load > T.high ? 0.9 : load > T.standard ? 0.6 : 0;",
    "return load > T.high ? 0.6 : load > T.standard ? 0.6 : 0;"
  )
);

// M2 把 fallback 兜底 hold 的 confidence 改掉（0.3 → 0.1）
// 守护：无匹配时兜底 hold 的 confidence 与 ruleId
mutate('M2 兜底 hold confidence 0.3→0.1', (s) =>
  s.replace(
    "          type: DECISION.HOLD,\n\n          confidence: 0.3,",
    "          type: DECISION.HOLD,\n\n          confidence: 0.1,"
  )
);

// M3 把 per-rule catch 体改成 rethrow
// 守护：单条规则（confidence 阶段）抛错不得冒出 evaluate。
// 注意：变异必须对着「规则真进了循环」的用例下刀才有意义 —— 关 CED 前
// 恶意规则被过滤掉（35→18），改 catch 也测不出来（第 220 轮实测）。
// 所以守卫脚本里也要用 cedEnabled:false 的实例来触发这条变异。
mutate('M3 单规则异常容错被移除（catch 改 rethrow）', (s) =>
  s.replace(
    "      } catch (e) {\n\n        // 规则执行失败，跳过\n\n      }",
    "      } catch (e) {\n\n        // 规则执行失败，跳过\n\n        throw e;\n\n      }"
  )
);

// M4 把抑制窗口检查禁用（永不在窗口内抑制）
// 守护：抑制窗口用例
mutate('M4 抑制窗口失效（条件恒 false）', (s) =>
  s.replace(
    "        if (lastTrigger && (now - lastTrigger) < this._suppressionWindow) {",
    "        if (false && lastTrigger && (now - lastTrigger) < this._suppressionWindow) {"
  )
);

// M5 让 confidence<=0 也被算作命中（去掉 continue）
// 守护：confidence 为 0 → 不命中走 hold 的分档语义
mutate('M5 confidence<=0 也被算命中（去掉 continue）', (s) =>
  s.replace(
    "        if (baseConfidence <= 0) continue;",
    "        if (false && baseConfidence <= 0) continue;"
  )
);

// M6 破坏规则结构：删掉一条规则的 rationale
// 守护：每条规则四类字段齐备 + 命中项 rationale 可读
mutate('M6 规则缺 rationale（decision-degrading）', (s) =>
  s.replace(
    "        rationale: (r) => `决策质量 ${r.quality.toFixed(2)}，低于阈值`,",
    "        rationale: undefined,"
  )
);

// M7 破坏 flash 阈值契约（standard 0.5 → 0.5 以外的值不可行，改 dynamic 破坏）
// 改为删掉 threshold 字段 fallback： 0.4 → 0.99，让 quality<fallback 不再命中
mutate('M7 fallback 阈值 0.4→0.99（quality 0.3 不再命中）', (s) =>
  s.replace(
    "      fallback: this.modelProfile.fallbackThreshold,",
    "      fallback: 0.99,"
  )
);

// ── N 系列：对照组，必须保持全绿 ───────────────────────────────────

// N1 只改注释文字，不动任何行为
expectGreen('N1 只改注释文字（对照组必绿）', (s) =>
  s.replace(
    "        // 规则执行失败，跳过",
    "        // 规则执行失败，跳过（第 220 轮守卫：此处为注释）"
  )
);

function main() {
  const srcBefore = readSrc();
  const mutants = results;
  // 重新执行（mutate/expectGreen 已同步 push 结果，这里只是兜底排序输出）
  let red = 0, green = 0, bad = 0;
  for (const r of mutants) {
    const isMut = r.name.startsWith('M');
    const expectRed = isMut;
    const pass = expectRed ? !r.ok === false : r.ok === true;
    const label = expectRed ? '红' : '绿';
    const ok = expectRed ? (r.why === '正确变红') : (r.why === '正确保持全绿');
    if (ok) { expectRed ? red++ : green++; }
    else { bad++; }
    console.log(`${ok ? '✓' : '✗'} ${r.name} → 期望${label}：${r.why}`);
  }
  const unchanged = readSrc() === srcBefore;
  if (!unchanged) { console.log('✗ 变异未全部还原！'); writeSrc(srcBefore); }
  else console.log('✓ src/ 已还原（零残留）');

  console.log(`\n守卫结果: ${red} 真变异红 + ${green} 对照绿 = ${red + green}/${mutants.length}，无效/异常 ${bad}`);
  process.exit(bad === 0 && readSrc() === srcBefore ? 0 : 1);
}

main();
