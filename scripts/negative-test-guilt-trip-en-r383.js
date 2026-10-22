// r383 负例守卫：guilt_trip 英文三支的「删一条就变红」还原点
// 依据 r382 教训：还原点删除单位是 |<branch>（连前导竖线），
// 源码英文支起点是稳定字面量 |\b（中文支用 |(?:第…）——用字符串切分逐支删。
// 期望：baseline 全绿 + 逐支删除后测试全部失败（fail > 0 或进程退出码非 0）
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'multi-turn-tactics.js');
const TEST = path.join(__dirname, '..', 'test', 'guilt-trip-en-r383.test.js');

// 四个还原点：三个英文支的起点字面量 + 尾动词白名单
// （按源码顺序，含前导 | —— 删掉它那一支就断）
const ANCHORS = [
  { name: 'EN-同侪对比支', anchor: '|\\b(?:everyone|everybody|all|other|the\\s+other|my|the)' },
  { name: 'EN-条件义务支', anchor: '|\\bif\\s+you\\s+(?:are|were|really)' },
  { name: 'EN-cared-about支', anchor: '|\\bif\\s+you\\s+(?:really\\s+|truly\\s+)?cared' },
  { name: 'EN-拒绝定性支', anchor: '|\\bif\\s+you\\s+(?:refuse|decline|deny|reject)' },
  { name: '尾动词白名单', anchor: 'do\\s+that|do\\s+so' },
];

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { green: /0 failed/.test(out) === false && /0 失败/.test(out) === false ? true : /0\s+失败/.test(out), out };
  } catch (e) {
    return { green: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function isGreen(res) {
  return res.green;
}

(function main() {
  const orig = fs.readFileSync(SRC, 'utf8');

  const base = runTest();
  console.log('baseline: ' + (isGreen(base) ? 'GREEN' : 'RED'));
  if (!isGreen(base)) {
    console.log('  ✗ 基线不是绿的，负例守卫无从判断 —— 先修测试');
    process.exit(1);
  }

  let allRed = true;
  let stripped = 0;
  for (const { name, anchor } of ANCHORS) {
    const before = fs.readFileSync(SRC, 'utf8');
    if (!before.includes(anchor)) {
      console.log(`  ⚠ ${name}: 锚点未命中（源码已变），跳过`);
      continue;
    }
    const idx = before.indexOf(anchor);
    const after = before.slice(0, idx) + before.slice(idx + anchor.length);
    fs.writeFileSync(SRC, after);

    const r = runTest();
    const red = !isGreen(r);
    if (red) stripped++;
    else allRed = false;
    fs.writeFileSync(SRC, orig);

    console.log(`  删[${name}] → ${red ? 'RED ✓' : 'GREEN ✗ (守卫失效)'}`);
  }

  fs.writeFileSync(SRC, orig);
  const restored = fs.readFileSync(SRC, 'utf8');
  console.log('restore: ' + (restored === orig ? 'OK' : 'MISMATCH'));

  console.log(`\n负例守卫: ${stripped}/${ANCHORS.length} 个还原点删除后变红`);
  if (!allRed) process.exit(1);
})();
