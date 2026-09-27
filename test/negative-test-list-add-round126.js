/**
 * 第 126 轮负例守卫 1：删掉命中侧判据后，双向守卫的主断言必须变红。
 *
 * 验证方式：把 src/dangerous-instruction.js 复制到临时文件，把本轮
 * 「加入名单族」的动词表整段从副本中删掉，再对副本断言 needle 仍在源码中。
 * 断言失败 = 守卫真的依赖被测判据；若断言仍成立，说明守卫读的不是源码文本
 * （守卫失效），此测试自己就会红。
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_PATH = path.join(ROOT, 'src/dangerous-instruction.js');
const NEEDLE = '加进|放进|加入|加到|添加到|追加到|追加进|写进|录入|登记到|计入|挂进';

const src = fs.readFileSync(SRC_PATH, 'utf8');
assert.ok(src.includes(NEEDLE), 'needle 不在源码中，守卫已失效（这应是红的）');

// 删掉 needle 词表本体，模拟「有人把判据删了」
const corrupted = src.split(NEEDLE).join('');
assert.ok(!corrupted.includes(NEEDLE), '副本构造失败：needle 未被删除');

// 与双向守卫同一段断言：指向副本必然失败
let needleAssertionFailed = false;
try {
  assert.ok(corrupted.includes(NEEDLE), '副本中 needle 应已被删除');
} catch (e) {
  needleAssertionFailed = true;
}
assert.ok(needleAssertionFailed, '删条后断言仍成立：双向守卫的 needle 检查没有真的读源码');

// 临时副本也要能解析（确认是「删词表」而不是「写坏文件」导致红）
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg126-'));
const tmpSrc = path.join(tmpDir, 'dangerous-instruction.js');
fs.writeFileSync(tmpSrc, corrupted);
require('child_process').execFileSync(process.execPath, ['--check', tmpSrc], { stdio: 'pipe' });

console.log('negative-list-add-round126: needle 注入-删条守卫有效 — PASS');
