/**
 * 第 332 轮变异守卫：本轮新增的三半判据若被削弱，守卫必须变红。
 * 参考 r327 教训：变异写完先确认「变异真的改变了行为」——
 * 空操作变异（如 slice(-0)）会让守卫看起来失效。
 * 本文件用**片段级变异**（两个窗口收窄、动词半改必现、全称表删词）。
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const IDX = path.join(ROOT, 'src/index.js');
const CHILD = path.join(ROOT, 'scripts/round-332/probe-10-child.js');

const MARKER = '个别|一次)[^。！？；]{0,22}';
const SRC = fs.readFileSync(IDX, 'utf8');
const lines = SRC.split('\n');
let target = -1;
lines.forEach((l, i) => { if (l.includes(MARKER) && !l.trim().startsWith('//')) target = i; });
assert(target >= 0, '未定位到本轮新增判据行（index.js 可能已变）');
const ORIGINAL = lines[target];

/** 跑子探针，返回命中的攻击条数 */
function runProbe() {
  const out = execFileSync('node', [CHILD], { encoding: 'utf8', timeout: 100000 });
  const m = out.match(/MUT_ATTACK_DETECT=(\d+)\//);
  assert(m, '子探针输出无法解析: ' + out);
  return Number(m[1]);
}

/** 用变异行替换后跑，跑完还原（即便断言失败也还原） */
function withMutation(label, mutationLine) {
  const backup = lines[target];
  lines[target] = mutationLine;
  fs.writeFileSync(IDX, lines.join('\n'));
  let hits;
  try {
    hits = runProbe();
  } finally {
    fs.writeFileSync(IDX, backup + '\n', 'utf8');
    // 立即还原为原始文件内容（避免行尾差异）
    fs.writeFileSync(IDX, SRC);
  }
  console.log(`  变异「${label}」→ 攻击命中 ${hits}/6`);
  return hits;
}

const FULL = 6;
let pass = 0, fail = 0;
function expectRed(label, hits) {
  if (hits < FULL) { pass++; console.log(`    ✔ 变红（命中降到 ${hits}）`); }
  else { fail++; console.log(`    ✘ 守卫未变红：${label}`); }
}

// ── 变异 1：动词半改必现 → 「一次失败说明」族应掉出 ──
const M1 = ORIGINAL.replace(
  '(?:遇到|碰见|碰到|碰到过|遇见|见过|认识|接触过|打过|经历过|听过|试过|用过|合作过|招过|面过|聊过|问过)?',
  '(?:遇到|碰见|碰到|碰到过|遇见|见过|认识|接触过|打过|经历过|听过|试过|用过|合作过|招过|面过|聊过|问过)');
assert.notStrictEqual(M1, ORIGINAL, '变异 1 未真正改变文本（空操作）');
expectRed('动词半改必现', withMutation('动词半改必现', M1));

// ── 变异 2：连接半删「说明」 → 「一次失败说明/不顺说明」两族应掉出 ──
const M2 = ORIGINAL.replace('(?:就知道|说明|可见', '(?:就知道|可见');
assert.notStrictEqual(M2, ORIGINAL, '变异 2 未真正改变文本（空操作）');
expectRed('连接半删「说明」', withMutation('连接半删「说明」', M2));

// ── 变异 3：全称半删「从来没」 → 「从来没成功过/从来走不通」族应掉出 ──
const M3 = ORIGINAL.replace('(?:都|全都|统统|个个|人人|所有人|每个人|一律|从来没|从来|压根|根本|一个德行|一丘之貉|没一个)',
  '(?:都|全都|统统|个个|人人|所有人|每个人|一律|压根|根本|一个德行|一丘之貉|没一个)');
assert.notStrictEqual(M3, ORIGINAL, '变异 3 未真正改变文本（空操作）');
expectRed('全称半删「从来没」', withMutation('全称半删「从来没」', M3));

// ── 还原后必须满命中（自证：还原真的生效）──
const after = runProbe();
if (after === FULL) { pass++; console.log(`  还原后攻击命中 ${after}/6 ✔`); }
else { fail++; console.log(`  还原后未回满命中：${after}/6`); }

console.log(`r332 hasty 变异守卫：${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exit(1);
