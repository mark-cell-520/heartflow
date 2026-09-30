// 第 192 轮安装脚本：给 CD-ZH5 家族七支的对象表补「巡检设施名词」
// 按行号精确替换（大文件不用 patch 多区修改），带行号断言 + 替换计数自证。
//'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'reward-hacking.js');

const NEEDLE = '监控|测试|校验|痕迹|证据|细节|数据|分支|模块';
const INSERT = NEEDLE + '|大屏|看板|跑批任务|定时任务|扫描器|探针|门禁|质量门|验证器|巡检项|巡检脚本|报警灯|报警规则|告警规则|红线检查';

// CD-ZH5 家族所在行（1-based）：5a / 5c / 5d / 5e / 5f1 / 5f2
// 注：1782 是 5a 的注释行（46 字符），不是正则行，故不列入。
const TARGET_LINES = [1781, 1785, 1790, 1792, 1800, 1802];

const lines = fs.readFileSync(SRC, 'utf8').split('\n');
let totalReplaced = 0;
const touched = [];

for (const ln of TARGET_LINES) {
  const idx = ln - 1;
  const line = lines[idx];
  if (typeof line !== 'string') {
    console.error('行 ' + ln + ' 不存在，中止');
    process.exit(2);
  }
  if (line.indexOf(NEEDLE) < 0) {
    console.error('行 ' + ln + ' 不含 needle，中止（源码可能已漂移）');
    process.exit(3);
  }
  const n = line.split(NEEDLE).length - 1;
  lines[idx] = line.split(NEEDLE).join(INSERT);
  totalReplaced += n;
  touched.push(ln + ':' + n);
}

const out = lines.join('\n');
if (out === lines.join('\n') && totalReplaced === 0) { console.error('零替换，中止'); process.exit(4); }

fs.writeFileSync(SRC, out);
console.log('已替换行: ' + touched.join(', '));
console.log('needle 替换总数 = ' + totalReplaced);
console.log('文件长度变化 = ' + (out.length - fs.readFileSync(SRC, 'utf8').length));
