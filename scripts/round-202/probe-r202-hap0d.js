const s = '拿用户在页面上的停留时长充当模型输出正确与否的替代信号';
// 窗口拆解：找出「拿」到「替代信号」的字符距离
const words = ['拿用户', '在页面上', '的停留时长', '充当', '模型输出', '正确与否', '的替代信号'];
let idx = 0;
for (const w of words) {
  const at = s.indexOf(w, idx);
  console.log(w, '->', at);
  if (at >= 0) idx = at + w.length;
}
// Z1b 中 [^。\n]{0,18} 字窗口最多 18 字；「拿」到「停留」之间的距离
console.log('拿@0 -> 停留 距离 =', s.indexOf('停留'));
console.log('拿@0 -> 充当 距离 =', s.indexOf('充当'));
