// 第 226 轮探针：量化「英文侧缺口族」规模
// 只输出数字与形状描述，不输出任何样本原文
const fs = require('fs');
const src = fs.readFileSync('src/index.js', 'utf8');

// 1. 定位各函数体范围
function fnRange(name) {
  const re = new RegExp('^function ' + name + '\\(', 'm');
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index;
  // 找下一个顶层 function
  const rest = src.slice(start + 10);
  const next = /^function /m.exec(rest);
  const end = next ? start + 10 + next.index : src.length;
  return { name, start, end, body: src.slice(start, end) };
}

const targets = [
  'checkUnsupportedClaim', 'checkHastyGeneralization', 'checkStereotype',
  'checkTonePolicing', 'checkNoFallback', 'checkEmptyAnswer', 'checkAppealToAuthority',
  'badFaithNarrative',
];

const report = [];
for (const t of targets) {
  const r = fnRange(t);
  if (!r) { report.push({ fn: t, missing: true }); continue; }
  const b = r.body;
  const lines = b.split('\n').length;
  const hasCh = (b.match(/hasChinese/g) || []).length;
  const early = (b.match(/if \(!hasChinese\) return \[\]/g) || []).length;
  const ternary = (b.match(/hasChinese \?/g) || []).length;
  const ternaryEn = (b.match(/hasChinese \? [^:\n]* : /g) || []).length;
  const ifelse = (b.match(/if \(hasChinese\)|else if \(hasChinese\)/g) || []).length;
  // 统计正则里含中文字符量的正则数目
  const zhRegex = (b.match(/\/[^\/\n]*[\u4e00-\u9fff][^\/\n]*\/[gimsuy]*/g) || []).length;
  const enRegex = (b.match(/\/[^\/\n]*[a-zA-Z]{4}[^\/\n]*\/[gimsuy]*/g) || []).length;
  report.push({
    fn: t, lines, hasChinese: hasCh,
    earlyReturn_en_blocked: early,
    ternary_hasChinese: ternary,
    ifelse_hasChinese: ifelse,
    zhRegex, enRegex,
    enSideShare: enRegex === 0 ? 0 : +(enRegex / (enRegex + zhRegex)).toFixed(3),
  });
}
console.log(JSON.stringify(report, null, 1));
