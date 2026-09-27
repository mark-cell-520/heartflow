#!/usr/bin/env node
/**
 * negative-test-sql-remaining3-round129.js — 第 129 轮注入-删条负例守卫
 *
 * 作用：证明 test/sql-remaining3-round129.test.js 的 A/B 族召回断言
 * **咬得住本轮改动**——把 src/dangerous-instruction.js 里本轮新增的三条
 * 回退成修前形态后，守卫必须转红；还原后必须恢复全绿。
 *
 * 三种注入：
 *   inj1  删掉 A 族修补模式整条 → A 族回落到修前（有效命中 1/3，靠宽表顺带）
 *   inj2  删掉 B 族主形（线上作表定语句） → B 族回落到修前 0/3
 *   inj3  删掉 B 族把字句形 → 该条样本必须不再命中
 *
 * ⚠️ 踩坑记录（本轮负例脚本两次返工）：needle 必须**逐字符**照抄源文件
 *    里的正则文本。第一版漏了字符类里的中文句号（源写 `[^。\n]`，needle
 *    写 `[^\n]`）→ indexOf 恒 -1，误报 needle missing 而注入判定仍显示 ok
 *    （else 分支继续跑），负例守卫险些静默失效。现在 needle 用字符串拼接
 *    逐字符构造，并加存在性预检：不存在直接判 FAIL 并跳过后续注入。
 *
 * 用法：node scripts/negative-test-sql-remaining3-round129.js
 * 退出码 0 = 负例守卫有效（注入后变红、还原后恢复）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'dangerous-instruction.js');
const original = fs.readFileSync(SRC, 'utf8');

// 源文件正则文本里的 `\n` 是两个字面字符：反斜杠 + n。needle 用短字符串
// 从源文件里**截取**，避免任何手写转义层次歧义（第 129 轮两次返工的教训：
// 手写 needle 漏字符类里的中文句号 → indexOf 恒 -1 → 注入判定静默失效）。
function sliceNeedle(startKey, endKey) {
  const i = original.indexOf(startKey);
  if (i < 0) return null;
  const j = original.indexOf(endKey, i);
  if (j < 0) return null;
  return original.slice(i, j);
}
const NEEDLES = {
  // A 族：备份语境 × SQL 谓词（模式行首到谓词组）
  inj1: sliceNeedle('备份库|备份数据库', '(?:delete'),
  // B 族主形：高危定语 × 中文表对象（行首到表对象组收尾）
  inj2: sliceNeedle('(?:线上|生产|正式)', '(?:数据表|数据库|表|库)'),
  // B 族把字句形：把/将 + 高危定语 + 中文表对象
  inj3: sliceNeedle('(?:把|将)[^。', '(?:数据库|数据表|表|库)'),
};

function runGuard() {
  try {
    const out = execFileSync('node', [path.join(__dirname, '..', 'test', 'sql-remaining3-round129.test.js')],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { green: !/FAIL/.test(out), out };
  } catch (e) {
    return { green: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

/** 删掉整条正则行（含前导 `  /(` 与尾部 `/i,`），找不到返回 null */
function deletePatternLine(text, needle) {
  const idx = text.indexOf(needle);
  if (idx < 0) return null;
  const lineStart = text.lastIndexOf('  /(', idx);
  const tail = ['/i,', String.fromCharCode(10)].join('');
  const lineEnd = text.indexOf(tail, idx) + 3;
  if (lineStart < 0 || lineEnd < 3) return null;
  return text.slice(0, lineStart) + text.slice(lineEnd);
}

let ok = true;
const results = [];

// 0) needle 存在性预检：不存在直接判 FAIL，绝不静默跳过注入
for (const [name, needle] of Object.entries(NEEDLES)) {
  if (!original.includes(needle)) {
    ok = false;
    console.log('FAIL ' + name + ' needle missing in src');
  }
}

if (ok) {
  try {
    // 1) 基线：未注入必须全绿
    const base = runGuard();
    if (!base.green) { console.log('FAIL baseline not green'); ok = false; }
    results.push(['baseline', base.green]);

    const cases = [
      ['inj1-delete-A', NEEDLES.inj1],
      ['inj2-delete-B-main', NEEDLES.inj2],
      // inj3 不能只删把字句形：B 族主形（idx 59）同样覆盖
      // 「把线上数据库无条件 truncate」，删一条另一条仍拦 → 守卫不变红。
      // 故 inj3 明确删**两条 B 族形**（主形 + 把字句形），这才对应
      // 「B 族整体回退」的注入语义。
      ['inj3-delete-B-both', [NEEDLES.inj2, NEEDLES.inj3]],
    ];
    for (const [label, needleOrList] of cases) {
      let injected = original;
      const needles = Array.isArray(needleOrList) ? needleOrList : [needleOrList];
      let allOk = true;
      for (const needle of needles) {
        const t = deletePatternLine(injected, needle);
        if (t === null) { console.log('FAIL ' + label + ' delete failed'); ok = false; allOk = false; break; }
        injected = t;
      }
      if (!allOk) break;
      fs.writeFileSync(SRC, injected);
      const r = runGuard();
      if (r.green) { console.log('FAIL ' + label + ' guard stayed green'); ok = false; }
      results.push([label, !r.green]);
      fs.writeFileSync(SRC, original);
    }
  } finally {
    fs.writeFileSync(SRC, original);
  }
}

// 还原后必须恢复全绿
const after = runGuard();
if (!after.green) { console.log('FAIL restore not green'); ok = false; }
results.push(['restore', after.green]);

for (const [name, passed] of results) console.log((passed ? 'ok   ' : 'FAIL ') + name);
console.log(ok ? 'PASS negative-test-sql-remaining3-round129' : 'FAIL negative-test-sql-remaining3-round129');
process.exit(ok ? 0 : 1);
