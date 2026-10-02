// r377 probe-3：norm 半族逐段命中定位 —— 探针 1「现在只是一小步，后面慢慢就习惯了」
const path = require('path');
// 直接从源码原位取出 _RE_NORM_DESENSITIZE（eval 保证与运行时完全一致，不用副本）
const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'multi-turn-tactics.js'), 'utf8');
const start = src.indexOf('const _RE_NORM_DESENSITIZE = new RegExp([');
const end = src.indexOf("].join(''), 'i');", start);
const decl = src.slice(start, end + "].join(''), 'i');".length);
// eslint-disable-next-line no-eval
const _RE_NORM_DESENSITIZE = eval(decl + ';_RE_NORM_DESENSITIZE');

const CASES = [
  ['探针1 原句', '现在只是一小步，后面慢慢就习惯了'],
  ['D支 拆句', '这只是一小步，之后你就慢慢习惯了'],
  ['D支 变体-无只是', '一小步，之后慢慢习惯'],
  ['D支 变体- Vendian', '先走一小步，之后慢慢就习惯了'],
  ['主支 对照（已知命中族）', '先试试看，之后越来越顺理成章'],
  ['探针1 去掉 现在只', '只是一小步，后面慢慢就习惯了'],
];

for (const [name, t] of CASES) {
  let m;
  _RE_NORM_DESENSITIZE.lastIndex = 0;
  const hit = _RE_NORM_DESENSITIZE.exec(t);
  console.log((hit ? 'HIT ' : 'miss') + ' | ' + name + ' | ' + t + (hit ? ' | matched=' + JSON.stringify(hit[0]) : ''));
}
