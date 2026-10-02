#!/usr/bin/env node
/**
 * r410 负例守卫：doc-numbers 测试数断言的三个不变式 [round 410]
 *
 * 为什么需要它：r409 修「记账自锁」时只留了补丁、没留负例（承诺的
 * negative-test-doc-numbers-round409.js 不存在）。r410 立刻实测发现
 * r409 补丁自身有缺陷 —— 自锁告警被 total 比对挡住不可达。事实再次
 * 证明：**把一条会变红的断言改成分支，没有负例就必然烂掉**。
 *
 * 四组变异各打一条不变式（按上面的设计，注入-删条必须变红）：
 *   N1  缓存 failed=3  → 必须报自锁告警（不是文档漂移）
 *   N2  文档 passing 漂移 + failed=0 → 必须报总数不符（不能永远绿）
 *   N3  缓存文件不存在 → 必须显式抛错（无缓存不许静默通过）
 *   N4  缓存 failed=-1（非法值）→ 不许绕过：负 failed 不能被当 0 用
 *
 * 纪律（沿用 r407/r408 教训）：
 *   · 基线 = 当前磁盘状态（不用 git show HEAD:）
 *   · 每组只改一处，跑完立刻还原（N3 挪走缓存文件也要还原）
 *   · 负例自身不许留任何残留：finally 全量还原 + 退出前自证
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'data/test-count.json');
const TEST = path.join(ROOT, 'test/doc-numbers-accuracy.test.js');

const RED = '\x1b[31m', GREEN = '\x1b[32m', RESET = '\x1b[0m';

const cacheOriginal = fs.readFileSync(CACHE, 'utf8');
const j0 = JSON.parse(cacheOriginal);
const DOC_PASSING = j0.passed; // 文档 Test suite 行里的 passing 数 = 全绿态 total

function runTest() {
  const r = cp.spawnSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  return { rc: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

function restore() {
  fs.writeFileSync(CACHE, cacheOriginal);
}

/** 取 README 规格表 Test suite 行当前值（用于报日志） */
function docSuiteLine() {
  const src = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  return (src.match(/\| Test suite \|[^\n]*/) || ['<none>'])[0].trim();
}

const MUTATIONS = [
  {
    key: 'N1-selflock-must-warn',
    note: '缓存 failed=3 时必须报自锁告警+恢复命令，而不是文档漂移',
    setup() { const j = JSON.parse(cacheOriginal); j.failed = 3; fs.writeFileSync(CACHE, JSON.stringify(j, null, 2)); },
    check(r) {
      const hasLock = /自锁|遗留 \d+ 个失败|恢复命令/.test(r.out);
      const mislabelled = /实测共 \d+ 个用例/.test(r.out);
      // 红了 + 命中自锁文案 + 没有被误标成文档漂移
      return { ok: r.rc !== 0 && hasLock && !mislabelled,
        detail: hasLock ? '自锁告警可达' : '未命中自锁文案' };
    },
  },
  {
    key: 'N2-doc-drift-must-still-red',
    note: 'failed=0 但文档 passing 漂移时必须报总数不符（守卫不能改成永远绿）',
    docPatch: true,
    setup() { /* 文档漂移在 check 阶段做 */ },
    check(r) {
      const hitTotal = /实测共 \d+ 个用例|规格表 Test suite/.test(r.out);
      return { ok: r.rc !== 0 && hitTotal, detail: hitTotal ? '漂移仍报红' : '漂移未被检出(守卫变绿!)' };
    },
  },
  {
    key: 'N3-no-cache-must-throw',
    note: '缓存文件不存在时必须显式抛错，不许静默跳过',
    hideCache: true,
    setup() { if (fs.existsSync(CACHE)) fs.renameSync(CACHE, CACHE + '.r410-hidden'); },
    teardown() { if (fs.existsSync(CACHE + '.r410-hidden')) fs.renameSync(CACHE + '.r410-hidden', CACHE); },
    check(r) {
      const threw = /没有 data\/test-count\.json 实测缓存|Error/.test(r.out) && r.rc !== 0;
      return { ok: threw, detail: threw ? '无缓存显式抛错' : '无缓存静默通过(守卫失效!)' };
    },
  },
  {
    key: 'N4-negative-failed-must-not-pass',
    note: '缓存 failed 为负（非法值）不许被当成 0 蒙混过关',
    setup() { const j = JSON.parse(cacheOriginal); j.failed = -1; fs.writeFileSync(CACHE, JSON.stringify(j, null, 2)); },
    check(r) {
      // failed=-1: total = passed-1, 自锁分支不触发, total 比对应红
      // （若实现用 Math.max(0,failed) 之类把它洗成 0 就会变绿 = 守卫失效）
      const red = r.rc !== 0;
      return { ok: red, detail: red ? '负 failed 仍报红（未被洗成 0）' : '负 failed 被洗成 0 后变绿(守卫失效!)' };
    },
  },
];

function main() {
  if (!fs.existsSync(CACHE)) { console.error(RED + '拒绝运行：基线缓存 data/test-count.json 不存在，先跑 run-all' + RESET); process.exit(3); }

  const results = [];
  let docBackup = null;
  const README = path.join(ROOT, 'README.md');

  try {
    // 0. 基线自证：干净缓存 + 干净文档下必须全绿，否则后面所有"变红"不可信
    {
      const b = runTest();
      results.push({ key: 'BASE-clean-green', ok: b.rc === 0,
        note: b.rc === 0 ? '基线全绿 21/21' : `基线就红 rc=${b.rc}: ${b.out.slice(0, 200)}` });
    }

    for (const m of MUTATIONS) {
      // 每组起跑前强制还原缓存到基线（上一组可能污染）
      restore();
      docBackup = fs.readFileSync(README, 'utf8');
      try {
        m.setup();

        // N2 的文档漂移在这里做（只动 README 一处 passing 数字）
        if (m.docPatch) {
          const cur = fs.readFileSync(README, 'utf8');
          const from = new RegExp(`\\| Test suite \\| ${String(DOC_PASSING).replace(/(\d)(?=(\d{3})+$)/g, '$1,')} passing`);
          if (!from.test(cur)) {
            results.push({ key: m.key, ok: false, note: `锚点未找到：文档 passing=${docSuiteLine()}` });
            continue;
          }
          fs.writeFileSync(README, cur.replace(from, '| Test suite | 0 passing'));
        }

        const r = runTest();
        const c = m.check(r);
        results.push({ key: m.key, ok: c.ok, note: c.detail });
      } finally {
        if (docBackup !== null) fs.writeFileSync(README, docBackup);
        if (m.teardown) m.teardown();
        restore();
      }
    }
  } finally {
    restore();
  }

  console.log('\n══ doc-numbers 测试数断言负例变异结果（r410） ══');
  let pass = 0;
  for (const r of results) {
    console.log(`  ${r.ok ? GREEN + 'OK' : RED + 'NG'} ${RESET} ${r.key} :: ${r.note}`);
    if (r.ok) pass++;
  }

  // 退出前自证无残留：缓存必须逐字节等于开跑前
  const clean = fs.readFileSync(CACHE, 'utf8') === cacheOriginal;
  console.log(`  ${clean ? GREEN + 'OK' : RED + 'NG'} ${RESET} NO-RESIDUE :: 缓存还原自证`);
  if (clean) pass++;
  const total = results.length + 1;

  console.log(`\n${pass === total ? GREEN : RED}结果: ${pass}/${total} 符合预期${RESET}`);
  process.exit(pass === total ? 0 : 1);
}

main().catch(e => { console.error(RED + '负例脚本自身崩溃: ' + (e && e.message) + RESET); process.exit(2); });
