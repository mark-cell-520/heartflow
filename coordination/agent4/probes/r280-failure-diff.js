// r280 存量失败对比：从 run-all 输出提取失败测试文件名集合并 diff
const fs = require('fs');
function extract(fp) {
  const txt = fs.readFileSync(fp, 'utf8');
  const idx = txt.indexOf('失败的测试:');
  if (idx < 0) return { files: new Set(), summary: 'NO-SUMMARY' };
  const sec = txt.slice(idx);
  const files = new Set();
  for (const line of sec.split('\n')) {
    let m = line.match(/^ {2}- · ([A-Za-z0-9_\-./]+\.test\.js)/);
    if (m) { files.add(m[1]); continue; }
    m = line.match(/^ {2}- ([A-Za-z0-9_\-./]+\.test\.js) Command failed/);
    if (m) { files.add(m[1]); continue; }
    m = line.match(/^ {2}- ([A-Za-z0-9_\-./]+\.test\.js) 文件自报失败/);
    if (m) { files.add(m[1]); continue; }
  }
  const sm = txt.match(/测试结果: (\d+) 通过, (\d+) 失败, 共 (\d+) 个/);
  return { files, summary: sm ? sm[0] : 'NO-SUMMARY' };
}
const cur = extract('/data/home/heartflow/coordination/agent4/r280-run-all.output.txt');
const base = extract('/data/home/heartflow/coordination/agent4/r280-run-all-baseline.output.txt');
console.log('r280  :', cur.summary, '失败文件数', cur.files.size);
console.log('基线  :', base.summary, '失败文件数', base.files.size);
const newFail = [...cur.files].filter(f => !base.files.has(f));
const fixed = [...base.files].filter(f => !cur.files.has(f));
console.log('\n== r280 新增失败（' + newFail.length + '）==');
for (const f of newFail) console.log('  +', f);
console.log('\n== 基失败 r280 消失（' + fixed.length + '）==');
for (const f of fixed) console.log('  -', f);
