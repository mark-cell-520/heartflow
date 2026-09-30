// 第 284 轮 probe3：量化 123 个静默文件的成因分布（mount 形 / jest 形），
// 并确认这些文件在 run-all 下的 runner 选择与实际执行路径。
// 只报数字与结构，不贴样本原文。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');

const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'p1-r284-silent.json'), 'utf8'));
const empty = j.silent.filter(s => !s.file.includes('archive/') && s.len === 0);

const rep = [];
for (const s of empty) {
  const rel = s.file;
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const isMount = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/.test(src);
  const isJest = /\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src);
  // run-all 会用哪个 runner？
  const runner = isMount ? '_mount' : (isJest ? '_jest-globals' : 'sub');
  let direct = { len: 0, exit: null }, harness = { len: 0, exit: null };
  try {
    direct.out = execSync(`node ${rel}`, { cwd: ROOT, encoding: 'utf8', timeout: 100000, maxBuffer: 48 * 1024 * 1024 });
    direct.len = (direct.out || '').length; direct.exit = 0;
  } catch (e) { direct.len = ((e.stdout || '')).length; direct.exit = e.status === undefined ? 'err' : e.status; }
  try {
    harness.out = execSync(`node ${runner === 'sub' ? rel : 'test/' + runner + '.js ' + rel}`, { cwd: ROOT, encoding: 'utf8', timeout: 100000, maxBuffer: 48 * 1024 * 1024 });
    harness.len = (harness.out || '').length; harness.exit = 0;
  } catch (e) { harness.len = ((e.stdout || '')).length; harness.exit = e.status === undefined ? 'err' : e.status; }
  rep.push({ rel, runner, direct: direct.len, harness: harness.len, harnessExit: harness.exit });
}
const stats = {
  total: rep.length,
  directSilent: rep.filter(r => r.direct === 0).length,
  mountHasOutput: rep.filter(r => r.runner === '_mount' && r.harness > 0).length,
  mountSilent: rep.filter(r => r.runner === '_mount' && r.harness === 0).length,
  jestHasOutput: rep.filter(r => r.runner === '_jest-globals' && r.harness > 0).length,
  jestSilent: rep.filter(r => r.runner === '_jest-globals' && r.harness === 0).length,
  subHasOutput: rep.filter(r => r.runner === 'sub' && r.direct > 0).length,
  subSilent: rep.filter(r => r.runner === 'sub' && r.direct === 0).length,
};
console.log(JSON.stringify(stats, null, 1));
console.log('SILENT_EVEN_WITH_HARNESS ' + JSON.stringify(rep.filter(r => (r.runner === 'sub' ? r.direct : r.harness) === 0).map(r => r.rel)));
fs.writeFileSync(path.join(__dirname, 'p3-r284-empty.json'), JSON.stringify({ stats, rep }, null, 1));
