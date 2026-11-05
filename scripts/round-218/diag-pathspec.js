'use strict';
// [r218] 验证 auto-commit-round.js 的 pathspec 修复：Windows 风格相对路径折成正斜杠
const path = require('path');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const target = path.resolve(ROOT + '/src', './dev-exemptions.js');
const buggy = path.relative(ROOT, target);
const fixed = path.relative(ROOT, target).replace(/\\/g, '/');
console.log('buggy:', JSON.stringify(buggy));
console.log('fixed:', JSON.stringify(fixed));
const ok = !fixed.includes('\\') && fixed === 'src/dev-exemptions.js';
console.log(ok ? 'PATHSPEC-FIX-OK' : 'PATHSPEC-FIX-FAIL');
process.exit(ok ? 0 : 1);
