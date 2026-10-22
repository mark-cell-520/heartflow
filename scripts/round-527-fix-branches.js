'use strict';
// r527 修正：git checkout 未回滚（src/harm-invalidation.js 是 untracked），
// 上一轮补支把多行字符串写成了无引号的裸正则行导致 SyntaxError。
// 本脚本把 77-80 行修成合法的单引号字符串行，并撤销受损插入。
const fs = require('node:fs');
const path = require('node:path');
const p = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const lines = fs.readFileSync(p, 'utf8').split('\n');

// 找到 [r527 补支] 标记行与其后的裸正则行，整体替换为合法形态
const markIdx = lines.findIndex((l) => l.includes('[r527 补支]'));
if (markIdx < 0) { console.error('未找到补支标记'); process.exit(2); }

const fixed = [];
fixed.push("  // [r527 补支] 量级否认：没什么大不了");
fixed.push("  '(?:没|未)(?:什|甚)(?:么|啥)(?:大|了)(?:不|的)(?:了|起)',");
fixed.push("  // [r527 补支] 受害表述被否定：未受任何影响/受损（atk#5）");
fixed.push("  '(?:没|未)(?:有|受)(?:遭|被|产|受)(?:任|何|任何|被|遭|受)(?:影|损|伤)(?:响|损|失|害|响)(?:，|,)?',");
fixed.push("  // [r527 补支] 转述否认：其实并没有真的受损/受影响（atk#8）");
fixed.push("  '(?:其|事|实)(?:实|际|上)(?:并|未|不)(?:非|是|没|有)(?:真|真的|真心|实质)(?:受|被|遭|感|受)(?:损|影|累|响|响)(?:失|响|响)?',");
fixed.push("  // [r527 补支] 无人受损的量级校准（atk#8，EN nobody was hurt 的 ZH 对应）");
fixed.push("  '(?:没|未)(?:有|见)(?:人|谁|任何)(?:受|掉|缺|受)(?:伤|块|胳|肉|腿|影)(?:肉|胳|腿|响|失)?',");

// 从 markIdx 开始，删到 ].join 行之前
let end = markIdx;
while (end < lines.length && !lines[end].includes('].join')) end++;
lines.splice(markIdx, end - markIdx, ...fixed);

fs.writeFileSync(p, lines.join('\n'));
console.log('已修正，新增合法行 ' + fixed.length);
