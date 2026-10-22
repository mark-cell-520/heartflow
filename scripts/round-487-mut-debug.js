'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const src = fs.readFileSync(__HF + '/src/appeal-tradition.js', 'utf8');
const out = src.replace(/const CROWD_EN = [^;]+;/i, '/(?!x)x/')
  .replace(/^const (CROWD_ZH|CROWD_EN|SINGLE_OUT_ZH|SINGLE_OUT_EN) =/gm, (m) => m.replace(/^const /, 'var '));
src.split('\n').forEach((l, i) => { if (/^\s*const (CROWD_ZH|CROWD_EN|SINGLE_OUT_ZH|SINGLE_OUT_EN) =/.test(l)) console.log('ORIG', i + 1, l.slice(0, 40)); });
out.split('\n').forEach((l, i) => { if (/^\s*var (CROWD_ZH|CROWD_EN|SINGLE_OUT_ZH|SINGLE_OUT_EN) =/.test(l)) console.log('OUT ', i + 1, l.slice(0, 40)); });
console.log('use strict line?', /^'use strict'/.test(src));
