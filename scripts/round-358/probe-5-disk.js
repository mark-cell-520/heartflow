// r358 probe-5：验证 patch 后的正则是否真被 node 编译进运行时
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

// 直接从模块内部拿：用 vm 跑 index.js 抓不到闭包，改从文件读当前磁盘内容
const fs = require('fs');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const i = src.indexOf('const GROUP_FACT_DIFF_EN');
const chunk = src.slice(i, i + 700);
console.log('--- disk content around 1462 ---');
console.log(chunk);

// 现在验证运行时：有没有可能 require 缓存了别的文件？
console.log('--- resolved module paths ---');
console.log(require.resolve(path.join(ROOT, 'src/index.js')));

// 检查是否存在同名的其他常量定义（重复声明会让后者生效但语法崩，所以应是唯一）
const count = (src.match(/const GROUP_FACT_DIFF_EN = \{/g) || []).length;
console.log('declarations of GROUP_FACT_DIFF_EN:', count);
