#!/usr/bin/env node
/**
 * 负例守卫：sync-doc-numbers.js 记账目标必须能发现漂移 [r408]
 *
 * 为什么需要它：r408 修了 r407 引入的回归 —— 防呆用 falsy 判断
 * (`if (!want[num])`)，把「合法测量值 0」误判为「没有缓存」。
 * 失败数最常见的真实值就是 0，于是规格表的 failing 永远停在历史值。
 * 一个记账脚本如果「永远报已一致」，它就不叫守卫。
 *
 * 本脚本在 r407 的 8 组变异之上，补 4 组专打「0 值记账」的变异：
 *   · M9  规格表 failing 停在旧值 2 → --check 必须红（r408 回归本体）
 *   · M10 README 横幅 passing tests 漂移 → 必须红（r408 新记账位置）
 *   · M11 缓存里的 failed 改成 3 → 文档必须跟着改成 3（证明 0 是记账
 *         后写入的真实值，且非零失败数也记得上）
 *   · M12 防呆回归：无 capability 缓存时仍不许刷成 0/0（r407 的防呆必须
 *         在 r408 改成 != null 之后依然成立，否则修复就是把呆撤了）
 *
 * 纪律（沿用 r407 的教训）：
 *   · 基线 = 当前磁盘状态（不用 git show HEAD:，那会把 commit 时机耦合进测试）
 *   · 每组变异跑完立刻还原该文档，变异一次只污染一处
 *   · 缓存文件也要还原（M11 会改 data/test-count.json）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DOCS = ['AGENTS.md', 'README.md', 'SKILL.md'];
const SYNC = path.join(ROOT, 'scripts/sync-doc-numbers.js');
const TEST_COUNT = path.join(ROOT, 'data/test-count.json');

const RED = '\x1b[31m', GREEN = '\x1b[32m', RESET = '\x1b[0m';

function runCheck() {
  const r = cp.spawnSync('node', [SYNC, '--check'], { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  return { rc: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const MUTATIONS = [
  {
    key: 'M9-spec-failing-stuck-at-2',
    doc: 'README.md',
    from: '| Test suite | 17,343 passing / 0 failing |',
    to: '| Test suite | 17,343 passing / 2 failing |',
    expectNum: 'testsFailed',
    note: 'r408 回归本体：spec failing 停在历史值 2，--check 必须红',
  },
  {
    key: 'M10-banner-passing-tests-drift',
    doc: 'README.md',
    from: '17,343 passing tests',
    to: '17,000 passing tests',
    expectNum: 'tests',
    note: 'r408 新记账位置：README 横幅 passing tests 漂移必须红',
  },
  {
    key: 'M11-cache-failed-3-must-follow',
    doc: 'README.md',
    from: '| Test suite | 17,343 passing / 0 failing |',
    to: '| Test suite | 17,343 passing / 0 failing |',
    cachePatch: { failed: 3 },
    expectNum: 'testsFailed',
    note: '缓存 failed=3 时文档必须改成 3（证明 0 是记账写下的真实值，非零也记得上）',
  },
  {
    key: 'M12-no-capability-cache-must-not-zero',
    doc: 'README.md',
    from: '__NO_MUTATION__',
    to: '__NO_MUTATION__',
    expectNum: 'capabilityChecks',
    note: '防呆回归：无 capability 缓存时不许把 20/20 刷成 0/0（r407 防呆在 r408 改判后仍须成立）',
  },
];

async function main() {
  const backups = new Map();
  const results = [];

  // [r408 修正] 开跑前先自证「磁盘文档 = git HEAD 干净基线」。
  // 为什么不能像 r407 那样直接用磁盘当基线：M11 跑的是全量 sync，
  // 它会把三份文档全改成一致值；若上一次运行结束时没还原干净
  // （进程被杀 / 提前退出），这一次的 backups 读到的就是**被上次污染过的
  // 磁盘状态」，于是 M11 的期望值「改成 3」在污染的基线上恒成立，
  // M12 又以 SKILL 残留 3 为由报红 —— 实测 5 组里 2 组假红。
  // 也不能像 r406 之前那样直接 git show HEAD: —— 那会把 commit 时机
  // 耦合进测试（r407 实测：记账后未即时 commit，HEAD 取到旧值导致 BASE 假红）。
  // 所以：比一比，不一致就拒绝跑并告知先 git checkout。判定权交给 git，
  // 脚本自己不猜基线。
  {
    const headDirty = [];
    for (const f of DOCS) {
      const disk = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const head = cp.spawnSync('git', ['show', `HEAD:${f}`], { cwd: ROOT, encoding: 'utf8' });
      if (head.status !== 0) { headDirty.push(f + '(git 读取失败)'); continue; }
      if (head.stdout !== disk) headDirty.push(f);
    }
    if (headDirty.length) {
      console.error(RED + `❌ 拒绝运行：${headDirty.join(', ')} 与 git HEAD 不一致——磁盘已被上次运行污染。` + RESET);
      console.error('   先执行 git checkout -- ' + headDirty.filter(d => !d.includes('git')).join(' ') + ' 再重跑。');
      process.exit(3);
    }
  }

  // 把三份文档 + 缓存还原成「当前磁盘状态」基线（自证过与 HEAD 一致）
  for (const f of DOCS) {
    backups.set(f, fs.readFileSync(path.join(ROOT, f), 'utf8'));
  }
  let cacheBackup = null;
  if (fs.existsSync(TEST_COUNT)) cacheBackup = fs.readFileSync(TEST_COUNT, 'utf8');

  const restoreAll = () => {
    for (const [f, txt] of backups) fs.writeFileSync(path.join(ROOT, f), txt);
    if (cacheBackup !== null) fs.writeFileSync(TEST_COUNT, cacheBackup);
  };

  try {
    // 0. 基线自证：干净 + 缓存存在时 --check 必须全绿（否则后面所有"变红"都不可信）
    {
      const b = runCheck();
      const ok = b.rc === 0;
      results.push({ key: 'BASE-clean-green', ok, note: ok ? '基线 --check 全绿' : `基线就红：${b.out.slice(0, 200)}` });
    }

    for (const m of MUTATIONS) {
      let cacheTouched = false;
      // [r408 修正] 每组起跑前先确认文档与缓存都回到基线 —— r407 修过
      // 「变异不还原会累积到下一组」，但没修「还原顺序」：M11 先跑 sync
      // 把磁盘文档改成 failing=3，finally 里先还原缓存再还原文档，
      // 于是 M12 起点上文档残留 3，--check 正确地报红 → M12 假红。
      // 现在改成：进入每组前强制还原**两个**状态（文档 + 缓存），
      // 从干净起点开始，红只可能来自本轮自己的变异。
      try {
        // 进入每组前还原**全部**三份文档 + 缓存（不只 m.doc）：M11 的 sync
        // 会把 SKILL.md 也改成 failing=3，只还原 README 的话 SKILL 残留。
        for (const f of DOCS) fs.writeFileSync(path.join(ROOT, f), backups.get(f));
        if (cacheBackup !== null) fs.writeFileSync(TEST_COUNT, cacheBackup);
        if (m.from === '__NO_MUTATION__') {
          // M12：挪走 capability 缓存，验证「不许刷成 0/0」的防呆在 r408 改判后仍成立
          const cachePath = path.join(ROOT, 'data/capability-check-count.json');
          const moved = cachePath + '.r408-hidden';
          let hidden = false;
          try {
            if (fs.existsSync(cachePath)) { fs.renameSync(cachePath, moved); hidden = true; }
          } catch (_) { /* 缓存不存在也算满足测试前提 */ }

          let cur = fs.readFileSync(path.join(ROOT, m.doc), 'utf8');
          cur = cur.replace('| Capability guard | 18 / 18 checks |', '| Capability guard | 20 / 20 checks |');
          fs.writeFileSync(path.join(ROOT, m.doc), cur);

          const r = runCheck();
          const after = fs.readFileSync(path.join(ROOT, m.doc), 'utf8');
          const keptTwenty = /Capability guard \| 20 \/ 20 checks \|/.test(after);
          const notZeroed = !/Capability guard \| 0 \/ 0 checks \|/.test(after);
          const ok = keptTwenty && notZeroed && r.rc === 0;
          if (hidden) fs.renameSync(moved, cachePath);
          results.push({
            key: m.key, ok,
            note: ok ? '无缓存 → 跳过记账，文档 20/20 原样保留（防呆未撤）'
              : `无缓存时行为异常：文档=${after.match(/\| Capability guard[^\n]*/)?.[0]} rc=${r.rc} out=${r.out.slice(0, 200).replace(/\n/g, ' | ')}`,
          });
          continue;
        }

        // M11：改缓存，文档保持含旧值原状 → 记账必须把文档改成与缓存一致
        if (m.cachePatch) {
          const j = JSON.parse(fs.readFileSync(TEST_COUNT, 'utf8'));
          j.failed = m.cachePatch.failed;
          fs.writeFileSync(TEST_COUNT, JSON.stringify(j, null, 2));
          cacheTouched = true;
        } else {
          let cur = fs.readFileSync(path.join(ROOT, m.doc), 'utf8');
          if (!cur.includes(m.from)) {
            results.push({ key: m.key, ok: false, note: `锚点未找到（基线里没有 "${m.from.slice(0, 40)}"）` });
            continue;
          }
          fs.writeFileSync(path.join(ROOT, m.doc), cur.replace(m.from, m.to));
        }

        if (m.cachePatch) {
          // M11 走的是「记账后文档应等于缓存」：直接跑同步脚本，验证写盘结果
          cp.spawnSync('node', [SYNC], { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
          const after = fs.readFileSync(path.join(ROOT, m.doc), 'utf8');
          const followed = new RegExp('passing / ' + m.cachePatch.failed + ' failing').test(after);
          results.push({
            key: m.key, ok: followed,
            note: followed ? `文档 failing 已跟随缓存改成 ${m.cachePatch.failed}` : `文档未跟随缓存：${after.match(/\| Test suite[^\n]*/)?.[0]}`,
          });
          continue;
        }

        const r = runCheck();
        const mentioned = new RegExp(m.expectNum).test(r.out) || /\d/.test(r.out);
        const ok = r.rc !== 0 && mentioned;
        results.push({
          key: m.key, ok, mentioned,
          note: ok ? `红（${m.to.trim().slice(0, 32)}）` : `未变红 rc=${r.rc} out=${r.out.slice(0, 160).replace(/\n/g, ' | ')}`,
        });
      } finally {
        // [r408 修正] 每组跑完还原**全部**三份文档 + 缓存，不只 m.doc。
        // M11 跑的是不带目标的 sync（全量记账），它会把 SKILL.md 也一起
        // 改成 failing=3；只还原 m.doc(=README) 的话 SKILL 残留 3，
        // 下一组 M12 的 --check 就以 SKILL 的正确残留为由报红 → 假红。
        for (const f of DOCS) fs.writeFileSync(path.join(ROOT, f), backups.get(f));
        if (cacheBackup !== null) fs.writeFileSync(TEST_COUNT, cacheBackup);
      }
    }
  } finally {
    restoreAll();
  }

  console.log('\n══ sync-doc-numbers 负例变异结果（r408 追加 0 值记账族） ══');
  let pass = 0;
  for (const r of results) {
    console.log(`  ${r.ok ? GREEN + '✅' : RED + '❌'} ${RESET} ${r.key} — ${r.note}`);
    if (r.ok) pass++;
  }
  const total = results.length;
  console.log(`\n${pass === total ? GREEN : RED}结果: ${pass}/${total} 组变异符合预期${RESET}`);
  process.exit(pass === total ? 0 : 1);
}

main().catch(e => {
  console.error(RED + '负例脚本自身崩溃：' + (e && e.message) + RESET);
  process.exit(2);
});
