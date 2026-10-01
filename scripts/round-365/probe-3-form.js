// 探测 src/index.js 中关键正则行的实际字符形态（ASCII 转义 or 实际中文）
'use strict';
const fs = require('fs');
const src = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js', 'utf8');
const lines = src.split('\n');
lines.forEach((l, i) => {
  if (l.includes('得(?:多|少)') || l.includes('得(?:少|多)') || l.includes('为什么') || l.includes('为何')) {
    const ln = i + 1;
    if (ln > 9870 && ln < 9920) {
      console.log(`L${ln} len=${l.length} hasBackslashU=${l.includes('\\u')} head=${l.slice(0, 60)}`);
    }
  }
});
