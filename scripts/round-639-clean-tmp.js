#!/usr/bin/env node
/** 清理 data/ 下的 memory-bank 临时文件（逐个 rm，不用 rm -r） */
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data');
let n = 0;
for (const f of fs.readdirSync(dir)) {
  if (f.startsWith('memory-bank.json.tmp.')) {
    try { fs.unlinkSync(path.join(dir, f)); n++; } catch (_) {}
  }
}
console.log('removed tmp files:', n);
