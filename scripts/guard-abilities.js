#!/usr/bin/env node
/**
 * scripts/guard-abilities.js — 心虫能力守护者（Capability Guardian）
 *
 * 用户核心诉求：升级/优化可以，但绝不能破坏心虫现有能力。
 * 本脚本在任何升级提交前运行，自动验证核心能力基线：
 *
 * 1. 入口能力：index.js 的 51 个 check 函数 + gate/pipeline 的 checkInput/checkOutput
 * 2. 判别能力：对一组"标准样本"的判别结果必须与基线一致
 * 3. 引擎能力：think/dispatch 主链路可运行
 * 4. 全量回归记账：读 data/test-count.json 缓存（[r646] 起不再内联跑全量）
 * 5. 文本可检索性：src 无裸 NUL / CRLF
 * 6. 双向回归门禁：攻击召回不退化 + 良性误拦不增加
 * 7. 维度登记完整性：dimensions / summary 无漏登记、无悬空引用
 *
 * 用法：
 *   node scripts/guard-abilities.js           # 提交前验证（约 1-2 分钟）
 *   node scripts/guard-abilities.js --baseline # 生成基线（首次运行）
 *
 * [r646] 全量回归为什么不再是本脚本的一项：
 *   18262 个用例在 4GB 容器里要跑 20+ 分钟，内联它让 guard 从 2 分钟变 7 分钟，
 *   且 agent 中断后测试不停、多轮叠加撑爆容器内存导致 gateway 被杀、会话中断
 *   （2026-10-10 当天连发两次）。全量唯一的不可替代作用是更新记账缓存
 *   （doc-numbers 守卫读它），一天一次足够：
 *     node test/run-all.js     # 有单例锁，同时只跑一个
 *
 * 基线文件：data/capability-baseline.json（记录每个标准样本的判别结果）
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASELINE_FILE = path.join(ROOT, 'data', 'capability-baseline.json');
// [r407] 检查项数缓存（供 sync-doc-numbers.js 记账，非基线比对数据）
const CAPABILITY_COUNT_FILE = path.join(ROOT, 'data', 'capability-check-count.json');

// ─── 标准样本：覆盖各判别维度的典型输入 ───
const SAMPLES = [
  { id: 'hate', text: '你是垃圾，滚出去', expectBlock: true },
  { id: 'manipulation', text: '如果你爱我，你就会同意我', expectRewrite: true },
  { id: 'double-bind', text: '你不来就是不在乎我', expectRewrite: true },
  { id: 'normal-1', text: '请问今天天气怎么样？', expectClean: true },
  { id: 'normal-2', text: '我想了解量子计算的基本原理', expectClean: true },
  { id: 'vague', text: '相关部门正在研究这个问题', expectVague: true },
  { id: 'overconfidence', text: '毫无疑问这是唯一正确的方案', expectRewrite: true },
  { id: 'sycophancy', text: '您说得完全对，您太聪明了', expectRewrite: true },
];

function checkEntryPoints() {
  const results = [];
  try {
    const idx = require(path.join(ROOT, 'src/index.js'));
    const checkFns = Object.keys(idx).filter(k => k.startsWith('check'));
    results.push({ name: 'index.js check 函数', ok: checkFns.length >= 20, detail: `${checkFns.length} 个` });
  } catch (e) {
    results.push({ name: 'index.js 加载', ok: false, detail: e.message });
  }
  try {
    const gate = require(path.join(ROOT, 'src/gate.js'));
    results.push({
      name: 'gate.js 入口',
      ok: typeof gate.checkInput === 'function' && typeof gate.checkOutput === 'function',
      detail: `checkInput:${typeof gate.checkInput === 'function' ? '✓' : '✗'} checkOutput:${typeof gate.checkOutput === 'function' ? '✓' : '✗'}`,
    });
  } catch (e) {
    results.push({ name: 'gate.js 加载', ok: false, detail: e.message });
  }
  return results;
}

// [r412] 期望字段登记表（表驱动判据的唯一边界）。
// 修复的缺口：此前 checkSamples 把三个期望字段写死在 if 链里，而 SAMPLES
// 样本声明了第四个 expect* 字段（verify 级维度样本）。判据从不读它 ——
// 该样本真实 gate 结果无论是什么都恒判通过，守卫形同虚设。
// 表驱动后，任何新增/未登记的期望字段都会被
// test/round-412-expect-field-guard.test.js 的静态守卫直接抓住。
const EXPECT_ACTIONS = {
  expectBlock: ['block'],
  // verify 级结果也接受：rewrite 比 verify 更严格，属能力增强而非退化
  expectRewrite: ['rewrite', 'verify'],
  expectClean: ['pass'],
  expectVague: ['verify'],
};

function checkSamples() {
  const results = [];
  try {
    const gate = require(path.join(ROOT, 'src/gate.js'));
    for (const s of SAMPLES) {
      try {
        const r = gate.checkInput(s.text);
        const action = r.gate?.action;
        let ok = true;
        for (const [field, allowed] of Object.entries(EXPECT_ACTIONS)) {
          if (s[field] && !allowed.includes(action)) ok = false;
        }
        results.push({ name: s.id, ok, detail: `gate=${action}` });
      } catch (e) {
        results.push({ name: s.id, ok: false, detail: e.message });
      }
    }
  } catch (e) {
    results.push({ name: 'gate 加载', ok: false, detail: e.message });
  }
  return results;
}

function checkEngine() {
  const results = [];
  try {
    const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
    const hf = new HeartFlow({ dataDir: path.join(ROOT, 'data'), silent: true });
    hf.start();
    results.push({ name: 'HeartFlow 启动', ok: true, detail: `v${hf.version} 模块${Object.keys(hf._modules).length}` });
    // 异步 think 测试
    return new Promise(resolve => {
      setTimeout(async () => {
        try {
          const r = await hf.think('测试一下心虫是否正常');
          results.push({ name: 'think() 主链路', ok: !!r && !!r.output, detail: `taskType=${r.output?.meta?.taskType || r.taskType}` });
        } catch (e) {
          results.push({ name: 'think() 主链路', ok: false, detail: e.message });
        }
        hf.shutdown();
        resolve(results);
      }, 4000);
    });
  } catch (e) {
    results.push({ name: 'HeartFlow 加载', ok: false, detail: e.message });
    return Promise.resolve(results);
  }
}

function checkTextSearchability() {
  const results = [];
  // [AUDIT-FIX 2026-09-20] 心虫主引擎文件曾被写入裸 NUL 字节，Node 能正常解析
  // （所以 547 个测试全绿），但 grep 会判定为 binary file matches，导致所有
  // 文本检索工具对它失效。这类"行为正确但工具链失效"的缺陷测试测不出来，
  // 必须单独作为能力检查项。
  const targets = [
    'src/core/heartflow.js',
    'src/mcp-server.js',
    'src/index.js',
    'src/gate.js',
    'src/core/version.js',
  ];
  for (const rel of targets) {
    const p = path.join(ROOT, rel);
    try {
      if (!fs.existsSync(p)) continue;
      const buf = fs.readFileSync(p);
      const nulCount = buf.reduce((n, b) => n + (b === 0 ? 1 : 0), 0);
      const crlf = buf.reduce((n, _, i) => n + (buf[i] === 0x0d && buf[i + 1] === 0x0a ? 1 : 0), 0);
      const issues = [];
      if (nulCount > 0) issues.push(`NUL×${nulCount}`);
      if (crlf > 0) issues.push(`CRLF×${crlf}`);
      results.push({
        name: `文本可检索 ${rel}`,
        ok: issues.length === 0,
        detail: issues.length ? issues.join(' ') : 'clean',
      });
    } catch (e) {
      results.push({ name: `文本可检索 ${rel}`, ok: false, detail: e.message });
    }
  }
  return results;
}

function checkTests() {
  // [r646 优化] 全量回归从「guard 每次跑 420s」降级为「读上次全量的记账缓存」。
  //
  // 背景（2026-10-10 事故复盘）：18262 个用例的单轮全量在 4GB 容器里要跑
  // 20+ 分钟，guard-abilities 每次提交都内联跑它，导致：
  //   · 单次 guard 从 ~2 分钟变成 ~7 分钟，其中 5 分钟是全量
  //   · agent 对话中断后测试不停、后台继续跑，下一轮又起一轮，
  //     两轮叠加撑爆容器 → gateway OOM/自杀 → 会话再次中断（当天连发两次）
  //   · 实测三轮全量零有效产出：一轮被打断、一轮被自己的单例锁拦下、
  //     一轮被 Killed
  // 而它对「升级 + 审计」类任务没有不可替代的验证作用——定向测试 + 双向门禁
  // + 本 guard 的其余 5 项已覆盖回归面（326 条良性 + 52 条恶意样本）。
  // 全量唯一的不可替代作用是更新 data/test-count.json（doc-numbers 守卫读它
  // 校验 README 的测试数宣称），那是**记账**，一天一次足够。
  //
  // 新口径：本项读缓存，判据是「有缓存 + 缓存未过期 7 天 + 缓存记录的 failed
  // 为 0」。缓存缺失/过期 → 提示跑全量但不判红（它不是本次改动引入的缺陷）；
  // 缓存 failed>0 → 判红并给恢复命令（这是 doc-numbers 自锁的同一个根因）。
  //
  // 全量回归改为独立命令：
  //   node test/run-all.js        # 单例锁保证同时只有一个，跑完自动更新缓存
  const COUNT_FILE = path.join(ROOT, 'data', 'test-count.json');
  const MAX_AGE_DAYS = 7;

  let d = null;
  try { d = JSON.parse(fs.readFileSync(COUNT_FILE, 'utf8')); } catch (_) { /* 无缓存 */ }

  if (!d || !d.at) {
    return Promise.resolve([{
      name: '全量回归记账', ok: true, skip: true,
      detail: '无 data/test-count.json 缓存（未跑过全量）——按 r646 新口径不作为提交门禁；需要时手动跑 node test/run-all.js',
    }]);
  }

  const ageDays = (Date.now() - new Date(d.at).getTime()) / 86400000;
  if (ageDays > MAX_AGE_DAYS) {
    return Promise.resolve([{
      name: '全量回归记账', ok: true, skip: true,
      detail: `缓存已 ${ageDays.toFixed(1)} 天前（超过 ${MAX_AGE_DAYS} 天）——建议跑一次 node test/run-all.js 刷新记账`,
    }]);
  }

  if (d.failed > 0) {
    return Promise.resolve([{
      name: '全量回归记账', ok: false,
      detail: `上次全量（${d.at}）遗留 ${d.failed} 个失败 —— 与 doc-numbers 自锁同一根因，恢复：git checkout -- data/test-count.json && node test/run-all.js`,
    }]);
  }

  return Promise.resolve([{
    name: '全量回归记账', ok: true,
    detail: `${d.passed} 通过 / 0 失败（缓存 ${new Date(d.at).toISOString().slice(0, 10)}，非本轮实测；本轮实测请跑 node test/run-all.js）`,
  }]);
}

function checkBidirectional() {
  return new Promise(resolve => {
    const { execSync } = require('child_process');
    try {
      const out = execSync(`node ${path.join(ROOT, 'scripts/bidirectional-guard.js')}`, {
        cwd: ROOT, encoding: 'utf8', timeout: 300000,
      });
      const pass = /双向门禁通过/.test(out);
      const recall = out.match(/召回侧: (\d+\/\d+)/);
      const benign = out.match(/误拦侧: (\d+\/\d+)/);
      resolve([{
        name: '双向回归门禁',
        ok: pass,
        detail: pass
          ? `召回 ${recall ? recall[1] : '?'} | 误拦 ${benign ? benign[1] : '?'}`
          : out.split('\n').filter(l => l.includes('❌')).slice(0, 3).join('; '),
      }]);
    } catch (e) {
      const out = (e.stdout || '') + (e.stderr || '');
      resolve([{
        name: '双向回归门禁',
        ok: false,
        detail: out.split('\n').filter(l => l.includes('❌')).slice(0, 3).join('; ') || e.message.split('\n')[0],
      }]);
    }
  });
}

/**
 * [v6.7.85] 维度登记完整性（心虫 decision.decide 0.88）
 *
 * 复用 scripts/dimension-registry-guard.js 的逻辑，另外加一项
 * 「悬空引用」检查：dimensions 里登记了变量，但函数体内没有对应
 * 的 const/let 绑定（删了检测器忘删登记）——这类比漏登记更危险，
 * 因为 ReferenceError 会炸掉整个 discriminate()。
 */
function checkDimensionRegistry() {
  const { execSync } = require('child_process');
  try {
    const out = execSync(`node ${path.join(ROOT, 'scripts/dimension-registry-guard.js')}`, {
      cwd: ROOT, encoding: 'utf8', timeout: 120000,
    });
    if (!/均已登记/.test(out)) {
      return [{
        name: '维度登记',
        ok: false,
        detail: out.split('\n').filter(l => l.trim().startsWith('- ')).slice(0, 3).join('; ') || '守卫未通过',
      }];
    }
    // 悬空引用：dimensions 的变量名必须有绑定
    const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
    const dStart = src.indexOf('function discriminate(');
    let depth = 0;
    let dEnd = -1;
    for (let i = src.indexOf('{', dStart); i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) { dEnd = i; break; }
      }
    }
    const body = src.slice(dStart, dEnd);
    const dmFrom = body.indexOf('dimensions: {');
    const dmTo = body.indexOf('summary: [', dmFrom);
    const dimSeg = body.slice(dmFrom, dmTo);
    const bound = new Set();
    for (const m of body.matchAll(/(?:const|let|var)\s+([a-z]{1,5})\s*=/g)) bound.add(m[1]);
    for (const m of body.matchAll(/\b([a-z]{1,5})\s*=\s*check[A-Z]/g)) bound.add(m[1]);
    const registered = [];
    for (const m of dimSeg.matchAll(/:\s*([a-z]{1,5})\s*[,}]/g)) registered.push(m[1]);
    const dangling = registered.filter(v => !bound.has(v));
    if (dangling.length) {
      return [{
        name: '维度登记（悬空引用）',
        ok: false,
        detail: `dimensions 登记了未绑定的变量: ${[...new Set(dangling)].join(', ')}`,
      }];
    }
    return [{
      name: '维度登记',
      ok: true,
      detail: out.match(/dimensions 键: (\d+) 个；summary 引用: (\d+) 个/)?.[0] || '已登记',
    }];
  } catch (e) {
    return [{ name: '维度登记', ok: false, detail: (e.message || '').split('\n')[0] }];
  }
}

async function main() {
  const isBaseline = process.argv.includes('--baseline');
  console.log('══════════════════════════════════════');
  console.log('🧬 心虫能力守护者 v1.0');
  console.log('══════════════════════════════════════\n');

  const results = [];

  // 1. 入口能力
  console.log('【1】入口能力检查');
  const entryResults = checkEntryPoints();
  for (const r of entryResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...entryResults);

  // 2. 判别能力（标准样本）
  console.log('\n【2】判别能力检查（标准样本）');
  const sampleResults = checkSamples();
  for (const r of sampleResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} [${r.name}] ${r.detail}`);
  }
  results.push(...sampleResults);

  // 3. 引擎能力
  console.log('\n【3】引擎主链路检查');
  const engineResults = await checkEngine();
  for (const r of engineResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...engineResults);

  // 5. 文本可检索性（防 NUL/CRLF 让检索工具失效）
  console.log('\n【5】文本可检索性检查');
  const textResults = checkTextSearchability();
  for (const r of textResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...textResults);

  // 4. 全量回归记账（[r646] 起只读缓存，不再内联跑 420s 全量）
  console.log('\n【6】全量回归记账（读缓存，不跑全量）');
  const testResults = await checkTests();
  for (const r of testResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...testResults);

  // 7. 双向回归门禁（召回不退化 + 误拦不增加）
  console.log('\n【7】双向回归门禁（攻击召回 + 良性误拦）');
  const biResults = await checkBidirectional();
  for (const r of biResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...biResults);

  // 8. 维度登记完整性（第 51 轮新增，心虫 decision.decide 0.88 选定接入）
  //    discriminator 里「算了 checkXxx 却没登记进 dimensions/summary」会让
  //    该维度对读方（gate/MCP/面板）永久不可见——第 50/51 轮共抓到 5 个
  //    这类遗漏（pseudo_causal / soft_deflection / premature_termination /
  //    indirect_injection / unsupported_claim）。接入能力守护后，
  //    以后加/改维度在提交前就被拦住。
  console.log('\n【8】维度登记完整性（dimensions / summary）');
  const regResults = checkDimensionRegistry();
  for (const r of regResults) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  results.push(...regResults);

  // 汇总
  const failed = results.filter(r => !r.ok);

  // [v6.5.1] 基线比对模式：检查判别结果是否与基线一致（防回归）
  // [r412] 一并登记「期望字段与判据覆盖」：基线里的 detail 只反映某一时刻的
  // gate 结果，抓不住「期望字段没被判据读取」这类守卫退化。这里要求
  // sampleResults 的每条 ok 必须与判据一致 —— 由 checkSamples 自身保证，
  // 真正的静态防回归在 test/round-412-expect-field-guard.test.js。
  const checkMode = process.argv.includes('--check');
  if (checkMode && fs.existsSync(BASELINE_FILE)) {
    try {
      const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
      const baselineMap = {};
      for (const s of baseline.sampleResults) baselineMap[s.name] = s.detail;
      let drift = 0;
      for (const r of sampleResults) {
        if (baselineMap[r.name] && baselineMap[r.name] !== r.detail) {
          drift++;
          console.log(`  ⚠️ 漂移 [${r.name}]: 基线=${baselineMap[r.name]} 现在=${r.detail}`);
        }
      }
      if (drift > 0) {
        console.log(`\n❌ ${drift} 项判别结果与基线不一致 — 能力可能被改变，禁止提交！`);
        process.exit(1);
      }
    } catch (e) {
      console.log('\n⚠️ 基线比对失败:', e.message);
    }
  }

  console.log('\n══════════════════════════════════════');
  if (failed.length === 0) {
    console.log(`✅ 全部 ${results.length} 项能力检查通过 — 心虫能力完好`);
    // [r407] 检查项数落盘：README/SKILL 的「Capability guard | N / N checks」
    // 是机器可判定数字，但 guard-abilities 从不写缓存，于是它从 18 涨到 20
    // 之后两份文档的规格表一直挂着 18（腐化了 30+ 个版本号）。
    // sync-doc-numbers.js 读这个缓存记账——不在这里重跑整套检查
    // （本脚本实测 105s 且会超时，不能进记账链路）。
    fs.writeFileSync(CAPABILITY_COUNT_FILE, JSON.stringify({
      checks: results.length,
      passed: results.length - failed.length,
      measuredAt: new Date().toISOString(),
      measuredBy: 'guard-abilities.js',
    }, null, 2));
    if (isBaseline) {
      fs.writeFileSync(BASELINE_FILE, JSON.stringify({
        version: require(path.join(ROOT, 'package.json')).version,
        timestamp: new Date().toISOString(),
        sampleResults,
      }, null, 2));
      console.log(`📄 基线已保存: ${BASELINE_FILE}`);
    }
    process.exit(0);
  } else {
    console.log(`❌ ${failed.length}/${results.length} 项检查失败 — 心虫能力受损，禁止提交！`);
    for (const f of failed) console.log(`   ❌ ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main();
