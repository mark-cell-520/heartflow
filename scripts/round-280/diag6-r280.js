// 第 280 轮 diag6：逐字节找出源码里零宾语尾缀的真实字面（供负例守卫锚点使用）。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const i = SRC.indexOf('disagreed))');
console.log('idx=' + i);
console.log('RAW=' + JSON.stringify(SRC.slice(i, i + 24)));
