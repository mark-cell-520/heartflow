// r744 一次性修补：把插在 marker 与正则行之间的 r744 注释块移到正则行之后
// 恢复 r735 契约「marker 行下一行即正则行」（r743/r742 测试的 extractPatternLine 依赖）
'use strict';
const fs = require('fs');
const P = 'C:/Users/USER782663/heartflow-engine/src/dangerous-instruction.js';
const lines = fs.readFileSync(P, 'utf8').split('\n');

function moveBlockAfterRegex(marker, blockStart, blockEnd) {
  // marker 行号（0-based）
  const mi = lines.findIndex(l => l.includes(marker));
  if (mi < 0) throw new Error('marker not found: ' + marker);
  // 校验块边界
  if (!lines[blockStart].includes('[r744]') || !lines[blockEnd].includes('两族。') && blockEnd !== blockStart + 15) {
    // 宽松校验：只确认块首是 [r744] 注释
  }
  if (!lines[blockStart].trimStart().startsWith('// [r744]')) throw new Error('block start not [r744] comment: ' + lines[blockStart].slice(0, 50));
  // 块后第一行必须是正则行
  const reAfter = blockEnd + 1;
  if (!/^\s{2}\/(?!\/)/.test(lines[reAfter])) throw new Error('block not followed by regex line: ' + lines[reAfter].slice(0, 50));
  const block = lines.splice(blockStart, blockEnd - blockStart + 1);
  // 块移除后正则行现在是 blockStart 位置
  lines.splice(blockStart + 1, 0, ...block);
  console.log(`moved ${block.length} lines after regex for marker: ${marker}`);
}

// P1 块：523-538 行（1-based）→ 0-based 522..537
moveBlockAfterRegex('P1 动词在前（ZH）', 522, 537);
// P4 块：585-589 行（1-based）→ 0-based 584..588
moveBlockAfterRegex('P4 动词在前（EN）', 584, 588);

fs.writeFileSync(P, lines.join('\n'));
console.log('done');
