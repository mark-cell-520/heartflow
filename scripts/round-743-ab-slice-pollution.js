'use strict';
/**
 * scripts/round-743-ab-slice-pollution.js
 * [v6.8.98 第 743 轮] A/B 探针：同一临时仓、同一切片，旧 run-all.js vs 新 run-all.js
 *
 * 要回答的问题只有一个：**分段回归到底有没有污染全量记账缓存？**
 *   · 旧实现 = `git show HEAD:test/run-all.js`（改动前那一份，618 行，无 scope 概念）
 *   · 新实现 = 工作区 test/run-all.js（写入走 measure-core.writeTestCount）
 * 两者跑完全相同的 HF_RUN_ALL_SLICE=2/2，比较 data/test-count.json 的字节。
 * 旧实现不落盘副本——每次从 git 现取，保证比的真是 HEAD 那一份。
 *
 * 临时仓只放 run-all.js 必需的最小集合，全部是真实文件的逐字节副本
 * （run-all.js 顶部 require _summary-parse.js 与 ../src/core/measure-core.js，
 * _MG() 又 require ../src/core/mutation-guard.js，少一个就 MODULE_NOT_FOUND）。
 *
 * 用法：node scripts/round-743-ab-slice-pollution.js
 * 退出码 0 = 跑完（结论打在 stdout，不替你判红绿）。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NEW_RUNNER = path.join(ROOT, 'test/run-all.js');
// 旧实现现取，不落副本：比的必须是 HEAD 那一份，不是某次手工拷贝
const OLD_SRC = cp.execSync('git show HEAD:test/run-all.js', { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 }).toString();

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-ab-r743-'));

/** 造一个只含最小集合的临时仓，主缓存预置一份「全量真值」 */
function scaffold(dir, runnerSrc) {
  fs.mkdirSync(path.join(dir, 'test'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src', 'core'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  for (const rel of ['test/_summary-parse.js', 'src/core/measure-core.js', 'src/core/mutation-guard.js']) {
    fs.copyFileSync(path.join(ROOT, rel), path.join(dir, rel));
  }
  fs.writeFileSync(path.join(dir, 'src', 'engine.js'), "'use strict';\nmodule.exports = {};\n");
  fs.writeFileSync(path.join(dir, 'test', 'zz-fake-a.test.js'),
    "'use strict';\nconsole.log('临时仓夹具 A: 1 通过, 0 失败, 共 1 个');\n");
  fs.writeFileSync(path.join(dir, 'test', 'zz-fake-b.test.js'),
    "'use strict';\nconsole.log('临时仓夹具 B: 1 通过, 0 失败, 共 1 个');\n");
  fs.writeFileSync(path.join(dir, 'test', 'run-all.js'), runnerSrc);
  fs.writeFileSync(path.join(dir, 'data', 'test-count.json'), JSON.stringify({
    passed: 19993, failed: 25, total: 20018, files: 625, at: '2026-11-04T19:20:04.721Z',
  }, null, 2));
}

function runOnce(tag, runnerSrc) {
  const dir = path.join(TMP, tag);
  scaffold(dir, runnerSrc);
  const main = path.join(dir, 'data', 'test-count.json');
  const side = path.join(dir, 'data', 'test-count-slice.json');
  const before = fs.readFileSync(main, 'utf8');

  const env = {};
  for (const k of Object.keys(process.env)) if (k !== 'HF_RUN_ALL_SLICE') env[k] = process.env[k];
  env.HF_RUN_ALL_SLICE = '2/2';
  env.HF_RUN_ALL_JOBS = '1';
  const r = cp.spawnSync('node', [path.join(dir, 'test', 'run-all.js')], {
    cwd: dir, encoding: 'utf8', timeout: 180000, env,
  });
  return {
    tag,
    exit: r.status,
    before,
    after: fs.existsSync(main) ? fs.readFileSync(main, 'utf8') : null,
    sideTxt: fs.existsSync(side) ? fs.readFileSync(side, 'utf8') : null,
    out: r.stdout || '',
  };
}

console.log('=== A/B：同一临时仓夹具 + 同一 HF_RUN_ALL_SLICE=2/2 ===\n');
const oldR = runOnce('old', OLD_SRC);
const newR = runOnce('new', fs.readFileSync(NEW_RUNNER, 'utf8'));

function report(label, r) {
  const polluted = r.after !== r.before;
  console.log(`[${label}] exit=${r.exit}`);
  console.log(`  主缓存 data/test-count.json：${polluted ? '❌ 被改写' : '✅ 逐字节未动'}`);
  if (polluted) console.log('  改写后内容：' + String(r.after).replace(/\s+/g, ' '));
  console.log(`  侧车 data/test-count-slice.json：${r.sideTxt ? '✅ 有' : '— 无'}`);
  if (r.sideTxt) console.log('  侧车内容：' + r.sideTxt.replace(/\s+/g, ' '));
  const acct = (r.out.match(/\[记账\][^\n]*/g) || []).join(' | ');
  if (acct) console.log('  记账行：' + acct);
  console.log('');
  return polluted;
}

const oldPolluted = report('旧实现 git HEAD:test/run-all.js', oldR);
const newPolluted = report('新实现 工作区 test/run-all.js', newR);

console.log('── 结论 ──');
console.log(`旧实现污染主缓存 = ${oldPolluted}（r742 事故形态：分段数字覆写全量真值）`);
console.log(`新实现污染主缓存 = ${newPolluted}`);
console.log(`新实现侧车落分段数字 = ${!!newR.sideTxt}`);

// 顺带量一下：两种实现写出的主缓存，读取方各拿到什么
const MC = require(path.join(ROOT, 'src/core/measure-core.js'));
const oldGot = new MC.MeasureCore({ rootPath: path.join(TMP, 'old'), silent: true }).readTestCount();
const newGot = new MC.MeasureCore({ rootPath: path.join(TMP, 'new'), silent: true }).readTestCount();
console.log(`\n旧实现写出的主缓存喂给读取方：passed=${oldGot.passed} refused=${oldGot.refused || '(无)'}`);
console.log(`新实现写出的主缓存喂给读取方：passed=${newGot.passed} scope=${newGot.scope}`);

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
