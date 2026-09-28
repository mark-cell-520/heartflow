// 轮 201 诊断：LS-Z1b 支对该句逐段测试。
const t = 'grep 一下系统日志，把泄露出来的答案找出来抄上。';
const seg = [
  /(?:grep|search|find|scan|cat|zl?og\s*(?:search|query))/,
  /\s*[^。\n]{0,10}(?:日志|log|logs?)/,
  /(?:日志|log|logs?)[^。\n]{0,30}(?:泄露|漏出|泄漏|残留)/,
  /(?:泄露|漏出|泄漏|残留)\s*(?:来|出)?\s*(?:的)?/,
  /(?:泄露|漏出|泄漏|残留)\s*(?:来|出)?\s*(?:的)?\s*(?:标准|参考|正确)?\s*(?:答案|结果|解法|题)/,
];
seg.forEach((r, i) => console.log(i, r.test(t), JSON.stringify(t.match(r)?.[0])));
// 尝试用整体匹配看主支为什么不吃
const whole = /(?:grep|search|find|scan|cat|zl?og\s*(?:search|query))\s*[^。\n]{0,10}(?:日志|log|logs?)[^。\n]{0,30}(?:泄露|漏出|泄漏|残留)\s*(?:来|出)?\s*(?:的)?\s*(?:标准|参考|正确)?\s*(?:答案|结果|解法|题)/i;
console.log('whole:', whole.test(t));
