// debug 4：直接算 _supText4 后的匹配，看每个片段是否真的必要
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
let src = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

// 提取第 223 轮那条正则字面量
const KEY = '最新(?=的|[一声音起回代批版本款项届篇篇]|';
const i = src.indexOf(KEY);
console.log('anchor idx:', i);
const lineStart = src.lastIndexOf('\n', i);
const lineEnd = src.indexOf('\n', i);
console.log(src.slice(lineStart, lineEnd + 1));

// 变异：只删「的资料」片段（M3 from）
function variant(from, to) {
  const s = src.split(from).join(to);
  return s;
}

// 用 eval 在沙盒里提取 _supText4 相关链路不可行，改为直接跑 checkConfidenceCalibration
// 已确认：中性化样本在变异前后都零命中 => 这些不是有效变异。
// 换个思路：找出**基线下被新判据命中**、且**删掉某片段就变零命中**的正向样本。
// 也就是正向池里只有该规则保护的样本。
