'use strict';
const fs = require('node:fs');
const FILE = '/root/.hermes/skills/ai/mark-heartflow-skill/src/harm-invalidation.js';
const B = String.fromCharCode(92);
const SB = B + B;
const src = fs.readFileSync(FILE, 'utf8');

// 定位损坏的 EN 收尾段：从 "[r528 补支] claiming" 注释行到 "], 'i');"
const startMarker = '  // [r528 补支] claiming the complaint was invented';
const endMarker = "], 'i');";
const si = src.indexOf(startMarker);
const ei = src.indexOf(endMarker, si);
if (si < 0 || ei < 0) { console.error('FAIL 锚点未找到', si, ei); process.exit(1); }
console.log('替换区间 start=', si, 'end=', ei);

const NL = String.fromCharCode(10);
const newBlock = [
  "  // [r528 补支] claiming the complaint was invented or exaggerated wholesale",
  "  '" + SB + "b(?:imagining|invented|exaggerat(?:ing|ed)|making" + SB + "s+up)" + SB + "s+" +
    "(?:the" + SB + "s+)?(?:whole|entire|all" + SB + "s+of)" + SB + "s+" +
    "(?:thing|incident|situation|story|problem)',",
  "  // [r529 补支] nothing to settle（负面词列防误伤正当审计/对账/结算语境）",
  "  '(?:" + SB + "b(?:there" + SB + "s+is" + SB + "s+)?(?:nothing|little)" + SB + "s+to" + SB + "s+" +
    "settle" + SB + "b(?!.{0,45}(?:audit|reconcil|remediat|closed|completed|resolved" +
    "|outstanding|vendor|complaint|invoice|billing|settled|register|reconciled)))',",
].join(NL);

const out = src.slice(0, si) + newBlock + src.slice(ei);
fs.writeFileSync(FILE, out);
console.log('已重写 EN 收尾段');
console.log('语法检查...');
