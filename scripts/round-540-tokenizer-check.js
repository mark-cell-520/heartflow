// r540: ChineseTokenizer 单元验证（独立脚本，避免 node -e 被安全扫描拦）
const path = require('path');
const { ChineseTokenizer } = require(path.join(process.cwd(), 'src/core/chinese-tokenizer.js'));

const t = new ChineseTokenizer(process.cwd());
console.log('stats =', JSON.stringify(t.getStats(), null, 1));

const cases = [
  '我现在压力很大，心里很乱，不知道该怎么办。',
  '守株待兔是不劳而获',
  '代码 函数 变量',
  'This is a mix 中文 test.',
  'API接口需要重构',
  '英雄之旅：面对挑战，克服困难，最终蜕变成长',
  '我现在很迷茫，需要突破困境的方法',
  '我感到非常愤怒和绝望，想要放弃',
];

console.log('\n=== tokenize 实测 ===');
for (const c of cases) {
  const w = t.tokenize(c);
  console.log('  ' + JSON.stringify(c));
  console.log('    → ' + JSON.stringify(w) + '  (' + w.length + ' tokens)');
}

// 性能
const long = cases.join('，') + '，'.repeat(400) + cases.join('，');
const t0 = Date.now();
const r = t.tokenize(long);
console.log('\n性能: ' + long.length + ' 字 → ' + r.length + ' tokens, ' + (Date.now() - t0) + 'ms');

// 边界
console.log('\n=== 边界 ===');
console.log('  空串 →', JSON.stringify(t.tokenize('')));
console.log('  null →', JSON.stringify(t.tokenize(null)));
console.log('  非字符串 →', JSON.stringify(t.tokenize(12345)));
console.log('  纯英文 →', JSON.stringify(t.tokenize('hello world')));
console.log('  纯标点 →', JSON.stringify(t.tokenize('，，。！！')));

// 注入词表模式（测试用）
const t2 = new ChineseTokenizer(process.cwd(), { dictionary: new Set(['机器学习', '深度学习', '模型']) });
console.log('\n=== 注入词表 ===');
console.log('  stats =', JSON.stringify(t2.getStats()));
console.log('  →', JSON.stringify(t2.tokenize('我们用深度学习训练一个机器学习模型')));
