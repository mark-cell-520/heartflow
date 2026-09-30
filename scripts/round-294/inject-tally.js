// 第 294 轮：给跨形态测试文件注入 run-all 兼容计数汇总。
//
// 问题：run-all.js 只把 stdout 匹配「N 通过, M 失败」的文件计入统计
//       （run-all.js L113/L127）。node:test 原生 reporter 打的是
//       「pass N / fail N」，于是两个文件明明跑完且全绿，却被计为失败。
//
// 方案：把 `const test = require('node:test')` 换成计票包装。
//   包装本身仍调用原生 test()，断言语义完全不变；只是旁路记录
//   pass/fail 计数，进程退出时补一行汇总供 run-all 解析。
//   node:test 原生 reporter 的输出保持原样（✔/✖ + pass/fail）。
// 用法: node inject-tally.js <file...>
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const INJECT = [
  "",
  "// [v6.7.130 \u7b2c294\u8f6e] run-all \u517c\u5bb9\u4fa7\u8def\u8ba1\u6570\u3002",
  "// run-all.js \u53ea\u8bc6\u522b stdout \u91cc\u7684\u300cN \u901a\u8fc7, M \u5931\u8d25\u300d\uff1b",
  "// node:test \u539f\u751f reporter \u6253\u7684\u662f pass/fail\uff0c\u672c\u6587\u4ef6\u56e0\u6b64\u88ab",
  "// \u8ba1\u4e3a\u5931\u8d25\u3002\u4e0b\u9762\u628a test \u6539\u6307\u5411\u4fa7\u8def\u8ba1\u6570\u5305\u88c5\uff08\u4ecd\u8c03",
  "// \u539f\u751f test()\uff0c\u65ad\u8a00\u8bed\u4e49\u4e0d\u53d8\uff09\uff0c\u8fdb\u7a0b\u9000\u51fa\u65f6\u8865\u6c47\u603b\u884c\u3002",
  "const __hfNativeTest = require('node:test').test;",
  "const __hfSub = require('node:test');",
  "let __pass = 0, __fail = 0;",
  "const test = function (name, opts, fn) {",
  "  if (typeof opts === 'function') { fn = opts; opts = undefined; }",
  "  return __hfNativeTest(name, opts, async (...a) => {",
  "    try {",
  "      await fn(...a);",
  "      __pass++;",
  "    } catch (e) {",
  "      __fail++;",
  "      throw e;",
  "    }",
  "  });",
  "};",
  "process.on('exit', () => {",
  "  console.log('\\n' + __pass + ' \u901a\u8fc7, ' + __fail + ' \u5931\u8d25');",
  "});",
  "",
].join('\n');

const MARK = '__nativeTest';

for (const f of process.argv.slice(2)) {
  const p = path.resolve(ROOT, f);
  let src = fs.readFileSync(p, 'utf8');
  if (src.includes(MARK)) { console.log('skip ' + f + ' (already instrumented)'); continue; }
  const anchor = "const test = require('node:test');";
  if (!src.includes(anchor)) { console.log('ERR ' + f + ': anchor missing'); continue; }
  // 去掉原 const test 声明（包装里自取原生 test），避免重复声明
  src = src.replace(anchor, '');
  // 在 'use strict' 之后注入
  const strict = "'use strict';";
  if (!src.includes(strict)) { console.log('ERR ' + f + ': no use strict'); continue; }
  src = src.replace(strict, strict + '\n' + INJECT);
  fs.writeFileSync(p, src);
  console.log('instrumented ' + f);
}
