'use strict';
const fs = require('fs');
const src = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/appeal-tradition.js', 'utf8');
const out = src.replace(/const CROWD_EN = [^;]+;/i, '/(?!x)x/')
  .replace(/^const (CROWD_ZH|CROWD_EN|SINGLE_OUT_ZH|SINGLE_OUT_EN) =/gm, (m) => m.replace(/^const /, 'var '));
src.split('\n').forEach((l, i) => { if (/^\s*const (CROWD_ZH|CROWD_EN|SINGLE_OUT_ZH|SINGLE_OUT_EN) =/.test(l)) console.log('ORIG', i + 1, l.slice(0, 40)); });
out.split('\n').forEach((l, i) => { if (/^\s*var (CROWD_ZH|CROWD_EN|SINGLE_OUT_ZH|SINGLE_OUT_EN) =/.test(l)) console.log('OUT ', i + 1, l.slice(0, 40)); });
console.log('use strict line?', /^'use strict'/.test(src));
