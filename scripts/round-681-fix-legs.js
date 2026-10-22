'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
/** scripts/round-681-fix-legs.js — r681 模块三处腿修复（A1 单维 4 miss 定位后） */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__HF, 'src/deprivation-coercion.js');
let src = fs.readFileSync(FILE, 'utf8');

function replaceOnce(anchor, insertion, tag) {
  const n = src.split(anchor).length - 1;
  if (n !== 1) { throw new Error(tag + ' anchor 不唯一（' + n + ' 处）'); }
  src = src.replace(anchor, insertion);
}

// 修复 1: POSTURE_ZH 第三模式地点表补 角落/院里/客厅/地上（「去角落里站着」无在/于前缀）
replaceOnce(
  "  String.raw`(?:楼道|走廊|阳台|门外|雪地|太阳下)(?:里|中|外)?(?:站|蹲|跪)`,\n",
  "  String.raw`(?:楼道|走廊|阳台|门外|雪地|太阳下|角落|院里|客厅|地上)(?:里|中|外)?(?:站|蹲|跪|坐)`,\n",
  'POSTURE 地点表'
);

// 修复 2: PUNISH_TIME_ZH 补「什么时候…再」时限腿（重写时丢失）
replaceOnce(
  "const PUNISH_TIME_ZH = new RegExp([\n",
  "const PUNISH_TIME_ZH = new RegExp([\n" +
  "  String.raw`(?:什么时候|何时)[^。]{0,10}(?:再|才)`,\n",
  'PUNISH_TIME 什么时候腿'
);

// 修复 3: NEED_DEPRIVE_ZH 补条件准入形与人称前置形
replaceOnce(
  "  String.raw`(?:饿|渴|冻|热)[^。]{0,6}(?:你|您|他|她|几天|三天|两顿|一顿|求饶)`,\n",
  "  String.raw`(?:饿|渴|冻|热)[^。]{0,6}(?:你|您|他|她|几天|三天|两顿|一顿|求饶)`,\n" +
  "  // (b3) 条件准入形（「什么时候认错了再给你进屋」——准入本身被条件化）\n" +
  "  String.raw`(?:再|才)[^。]{0,4}(?:给|让|准)[^。]{0,2}(?:你|您|他|她|孩子)[^。]{0,4}(?:进屋|进门|回家|饭吃|吃饭|饭|睡|睡觉|吃|喝|上厕所|如厕|药|治疗|空调|暖气)`,\n" +
  "  // (b4) 人称前置形（「你就没有饭吃」——剥夺动词在人称后）\n" +
  "  String.raw`(?:你|您|他|她|孩子|对方)(?:就|也|都)?(?:没有|没)[^。]{0,4}(?:饭吃|吃饭|饭|食物|睡|睡觉|吃|喝|水|药|治疗|空调|暖气|热水)`,\n",
  'NEED 准入/人称形'
);

// 修复 4: PUNISH_TIME_EN 动词后允许时态后缀（admitted / confesses）
replaceOnce(
  "  String.raw`\\buntil\\s+(?:you|he|she|they)\\s+(?:finish|complete|write|learn|admit|confess)\\b`,\n",
  "  String.raw`\\buntil\\s+(?:you|he|she|they)\\s+(?:finish|complete|write|learn|admit|confess)\\w*`,\n",
  'PUNISH_TIME_EN 时态后缀'
);

fs.writeFileSync(FILE, src, 'utf8');
console.log('修复完成，字节数: ' + src.length);
