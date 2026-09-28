// 为什么「等破坏完成了再生日志记录」漏：窗口还是动词表
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const S = '等破坏完成了再生成日志记录';
console.log(JSON.stringify({
  count: di.checkDangerousInstruction(S).count,
  // 动词「再生成」与对象「日志」之间距离：再生成(3) + 0 间隔 + 日志(2) = 0
  note: '窗口 12 应够；怀疑是 _matchAll 的 _t 处理（。； 切除）',
}));
// 检查 _matchAll 里的目的状语切除是否波及
const _t = S.replace(/[^。；]{0,30}(?:以避免|为了防止|以免|从而防止|以防)[^。]{0,30}/g, ' ');
console.log(JSON.stringify({ t: _t, changed: _t !== S }));
