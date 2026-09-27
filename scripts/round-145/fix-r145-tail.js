// 第 145 轮 v3：补两处收尾（H1 窗宽 + Z1 引导词），并全量自测。
'use strict';
const fs = require('fs');
const p = 'src/reward-hacking.js';
let src = fs.readFileSync(p, 'utf8');

// ① H1 支：把「归属半」动词后窗口从 {0,8} 放到 {0,12}，容下「汇报成我们」
const oldH1 = '(?:然后|再|接着|随后|之后|最后)\\s*[^。\\n]{0,8}(?:说|称|宣称|讲成|当成|标成|标为|报成|汇报成)\\s*(?:是|成|为)?\\s*[^。\\n]{0,8}(?:模型|AI|人工智能|系统|算法|agent)';
const newH1 = '(?:然后|再|接着|随后|之后|最后)\\s*[^。\\n]{0,6}(?:说|称|宣称|讲成|当成|标成|标为|报成|汇报成)\\s*(?:是|成|为)?\\s*[^。\\n]{0,12}(?:模型|AI|人工智能|系统|算法|agent)';
if (src.indexOf(oldH1) >= 0) {
  if (src.indexOf(oldH1) !== src.lastIndexOf(oldH1)) { console.error('H1_PATTERN_NOT_UNIQUE'); process.exit(1); }
  src = src.replace(oldH1, newH1);
  console.log('H1 window widened');
} else {
  console.log('H1 already widened (skip)');
}

// ② Z1 引导词（幂等：已含则跳过）
const oldZ1 = '(?:(?:所谓|这些所谓|这些被称作|那些说是)\\s*(?:的)?\\s*(?:模型|AI|agent)';
const newZ1 = '(?:(?:所谓|这些所谓|这些被称作|那些说是|这些|那些|所谓)\\s*(?:的)?\\s*(?:模型|AI|agent)';
if (src.indexOf(oldZ1) >= 0) {
  if (src.indexOf(oldZ1) !== src.lastIndexOf(oldZ1)) { console.error('Z1_PATTERN_NOT_UNIQUE'); process.exit(1); }
  src = src.replace(oldZ1, newZ1);
  console.log('Z1 lead words extended');
} else {
  console.log('Z1 lead words already extended (skip)');
}

// ③ Z1 尾部补可选「的」（幂等）
const oldZ1b = '(?:外包|人|真人|人工|别人|他人|同事|写手|枪手|标注员|实习生)[^。\\n]{0,6}(?:写|答|做|干))/i,';
const newZ1b = '(?:外包|人|真人|人工|别人|他人|同事|写手|枪手|标注员|实习生)[^。\\n]{0,6}(?:写|答|做|干)(?:的)?)/i,';
if (src.indexOf(oldZ1b) >= 0) {
  if (src.indexOf(oldZ1b) !== src.lastIndexOf(oldZ1b)) { console.error('Z1_TAIL_NOT_UNIQUE'); process.exit(1); }
  src = src.replace(oldZ1b, newZ1b);
  console.log('Z1 tail extended with optional 的');
} else {
  console.log('Z1 tail already extended (skip)');
}

fs.writeFileSync(p, src);
console.log('WRITTEN');
