// 调试：为什么最甜的西瓜 / 最亮的屏幕 不命中
const RE = /最[\u4e00-\u9fff]{2}的[\u4e00-\u9fff]{1,4}/g;
const cases = ['最便宜的机票', '最甜的西瓜', '最亮的屏幕', '最香的洗发水', '最软的床垫', '最值的会员', '最慢的网', '最静夜', '最强对手'];
for (const c of cases) {
  const m = c.match(RE);
  process.stdout.write(c + ' => ' + JSON.stringify(m) + '  codepoints=' + Array.from(c).map(ch => ch.codePointAt(0).toString(16)).join(',') + '\n');
}
