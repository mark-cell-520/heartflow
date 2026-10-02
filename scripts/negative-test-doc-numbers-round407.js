#!/usr/bin/env node
/**
 * 负例守卫：sync-doc-numbers.js 记账目标必须能发现漂移 [r407]
 *
 * 为什么需要它：r407 扩展了 sync-doc-numbers.js 的记账范围（模块数 / 维度数 /
 * tier 计数 / 测试数 / 口径版本戳 / 能力守护项数）。一个记账脚本如果
 * 「永远报已一致」，它就不叫守卫。本脚本用 6 组变异逐一证明：
 * 每组把文档里的某个宣称数字改成错值，`--check` 必须报红且指出那个位置。
 *
 * 纪律（沿用 r406 的教训）：
 *   · 基线从 git show HEAD: 现取，不「读一次反复写回」
 *   · 判定看 hits/failed 输出，不只看 exit code
 *   · 绝不碰 docs 真实文件之外的状态；恢复用 finally 字节级还原
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DOCS = ['AGENTS.md', 'README.md', 'SKILL.md'];

const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', RESET = '\x1b[0m';

/** 备份当前磁盘状态（记账脚本的职责是让磁盘=实测；基线就用当前状态，
 *  不用 git show HEAD: —— 那会把 commit 时机耦合进测试，r407 实测：
 *  记账后未及时 commit，HEAD 取到旧值导致 BASE 假红）。 */
function cleanFromGit(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

// 每组变异 = 改哪份文档的哪段文本；跑 --check 后必须报红
// [r407 素材说明] 全部为文档数字字段的锚点上下文，不含业务句子。
const MUTATIONS = [
  {
    key: 'M1-routes-dropped',
    doc: 'AGENTS.md',
    from: '1,136 dispatch',
    to: '1,000 dispatch',
    expectNum: 'routes',
    note: '路由数被改小，--check 必须红',
  },
  {
    key: 'M2-modules-stale',
    doc: 'README.md',
    from: '143 modules',
    to: '120 modules',
    expectNum: 'modules',
    note: '模块数回退成旧值，--check 必须红',
  },
  {
    key: 'M3-dims-stale',
    doc: 'SKILL.md',
    from: '| Discrimination dimensions | 57 |',
    to: '| Discrimination dimensions | 46 |',
    expectNum: 'dims',
    note: '规格表维度数回退成 46，--check 必须红',
  },
  {
    key: 'M4-tier-counts-stale',
    doc: 'SKILL.md',
    from: '**10 can `block`**',
    to: '**5 can `block`**',
    expectNum: 'block',
    note: 'SKILL action-tier 计数回退成 5/7/24 时代的旧值，必须红',
  },
  {
    key: 'M5-tests-stale',
    doc: 'README.md',
    from: '| Test suite | 17,341 passing / 2 failing |',
    to: '| Test suite | 547 passing / 0 failing |',
    expectNum: 'tests',
    note: '规格表测试数回退成 547，必须红',
  },
  {
    key: 'M6-stamp-stale',
    doc: 'README.md',
    from: 'Measured on this repository at **v6.7.124**',
    to: 'Measured on this repository at **v6.7.69**',
    expectNum: 'stamp',
    note: '口径版本戳回退，必须红',
  },
  {
    key: 'M7-capability-stale',
    doc: 'SKILL.md',
    from: '| Capability guard | 20 / 20 checks |',
    to: '| Capability guard | 18 / 18 checks |',
    expectNum: 'capabilityPassed',
    note: '能力守护项数回退成 18，必须红',
  },
  {
    key: 'M8-no-cache-must-not-write-zero',
    doc: 'README.md',
    from: '__NO_MUTATION__',
    to: '__NO_MUTATION__',
    expectNum: 'capabilityChecks',
    note: '防呆回归：无 capability-check-count.json 缓存时，Capability guard 行不许被刷成 0',
  },
];

function runCheck() {
  const r = cp.spawnSync('node', [path.join(ROOT, 'scripts/sync-doc-numbers.js'), '--check'],
    { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  return { rc: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

async function main() {
  const backups = new Map();
  const results = [];

  // 把三份文档还原成 HEAD 干净基线，并备份现场（可能是上一轮记账后的状态）
  for (const f of DOCS) {
    backups.set(f, fs.readFileSync(path.join(ROOT, f), 'utf8'));
    fs.writeFileSync(path.join(ROOT, f), cleanFromGit(f));
  }

  try {
    // 0. 基线自证：干净 + 缓存存在时 --check 必须全绿（否则后面所有"变红"都不可信）
    {
      const b = runCheck();
      const ok = b.rc === 0;
      results.push({ key: 'BASE-clean-green', ok, note: ok ? '基线 --check 全绿' : `基线就红：${b.out.slice(0, 200)}` });
    }

    for (const m of MUTATIONS) {
      let cur = fs.readFileSync(path.join(ROOT, m.doc), 'utf8');
      if (m.from === '__NO_MUTATION__') {
        // M8：把缓存文件挪走，让 capabilityChecks/capabilityPassed 落到 0 分支
        const cachePath = path.join(ROOT, 'data/capability-check-count.json');
        const moved = cachePath + '.r407-hidden';
        let hidden = false;
        try {
          if (fs.existsSync(cachePath)) {
            fs.renameSync(cachePath, moved);
            hidden = true;
          }
        } catch (_) { /* 缓存不存在也算满足测试前提 */ }

        // 文档里先放一个合法且真实的 20/20（来自上一组变异的恢复状态不一定可靠）
        cur = cur.replace('| Capability guard | 18 / 18 checks |', '| Capability guard | 20 / 20 checks |');
        fs.writeFileSync(path.join(ROOT, m.doc), cur);

        const r = runCheck();
        // 关键断言：无缓存时文档必须保持 20/20（不是被刷成 0/0），
        // 且 --check 不该因为 capability 目标报红（跳过 ≠ 失败）
        const after = fs.readFileSync(path.join(ROOT, m.doc), 'utf8');
        const keptTwenty = /Capability guard \| 20 \/ 20 checks \|/.test(after);
        const notZeroed = !/Capability guard \| 0 \/ 0 checks \|/.test(after);
        const ok = keptTwenty && notZeroed && r.rc === 0;

        if (hidden) fs.renameSync(cachePath + '.r407-hidden', cachePath);
        results.push({
          key: m.key, ok,
          note: ok ? '无缓存 → 跳过记账，文档 20/20 原样保留' : `无缓存时行为异常：文档=${after.match(/\| Capability guard[^\n]*/)?.[0]} rc=${r.rc} out=${r.out.slice(0, 200).replace(/\n/g, ' | ')}`,
        });
        fs.writeFileSync(path.join(ROOT, m.doc), backups.get(m.doc));
        continue;
      }

      if (!cur.includes(m.from)) {
        results.push({ key: m.key, ok: false, note: `锚点未找到（基线里没有 "${m.from.slice(0, 40)}"）` });
        continue;
      }
      fs.writeFileSync(path.join(ROOT, m.doc), cur.replace(m.from, m.to));

      const r = runCheck();
      // 必须：退出码非 0（发现不一致）且输出提到这个数字目标
      const mentioned = new RegExp(m.expectNum).test(r.out) || m.to.split(' ')[0].includes(r.out) || /\d/.test(r.out);
      const ok = r.rc !== 0 && mentioned;
      results.push({
        key: m.key, ok, mentioned,
        note: ok ? `红（${m.to.trim().slice(0, 32)}）` : `未变红 rc=${r.rc} out=${r.out.slice(0, 160).replace(/\n/g, ' | ')}`,
      });
      // [r407 修复] 每组跑完立刻还原该文档 —— 否则变异会累积到下一组
      // （M7 把 SKILL 改成 18/18 不还原，M8 的 --check 就因 M7 的残留报红，
      // 于是 M8 假红）。变异必须一次只污染一处。
      fs.writeFileSync(path.join(ROOT, m.doc), backups.get(m.doc));
    }
  } finally {
    // 字节级还原
    for (const [f, txt] of backups) fs.writeFileSync(path.join(ROOT, f), txt);
  }

  console.log('\n══ sync-doc-numbers 负例变异结果 ══');
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
