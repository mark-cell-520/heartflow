// probe: 定位三条支锚点在源码中的精确位置与反斜杠形态
const fs = require('fs');
const S = fs.readFileSync(require('path').join(__dirname, '..', '..', 'src', 'multi-turn-tactics.js'), 'utf8');
const tags = [
  'just|only',
  'easier|smoother',
  String.raw`|\\b(?:we|you)\\s+(?:have|had`,
  String.raw`|\\bpush\\s+through\\b`,
  String.raw`|\byou\s+(?:can|could`,
  'read|check|look)',
];
for (const t of tags) {
  let idx = -1, n = 0;
  while ((idx = S.indexOf(t, idx + 1)) >= 0) {
    n++;
    const line = S.slice(0, idx).split('\n').length;
    console.log(JSON.stringify(t) + ' hit#' + n + ' pos=' + idx + ' line=' + line);
    if (n <= 2) console.log('   ctx=' + JSON.stringify(S.slice(idx - 30, idx + 50)));
  }
  if (n === 0) console.log(JSON.stringify(t) + '  NOT FOUND');
}
{
  const at = S.indexOf(String.raw`|\byou\s+(?:can|could`);
  const eEnd = S.indexOf('read|check|look)', at);
  console.log('\ncap 变异残留（前80尾80）:');
  console.log(JSON.stringify(S.slice(0, at).slice(-80)) + ' ||| ' + JSON.stringify(S.slice(eEnd + 'read|check|look)'.length).slice(0, 80)));
}
