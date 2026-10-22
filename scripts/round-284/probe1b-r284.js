// 第 284 轮 probe1b：把 silent 清单按 run-all 的 runner 选择逻辑分类
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'p1-r284-silent.json'), 'utf8'));

const cats = { archive: [], mount: [], jest: [], sub: [], empty: [] };
for (const s of j.silent) {
  const rel = s.file;
  if (rel.includes('archive/')) { cats.archive.push(rel); continue; }
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const isMount = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/.test(src);
  const isJest = /\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src);
  if (s.len === 0) { cats.empty.push({ rel, isMount, isJest }); continue; }
  if (isMount) cats.mount.push(rel);
  else if (isJest) cats.jest.push(rel);
  else cats.sub.push(rel);
}
console.log('archive', cats.archive.length, 'mount', cats.mount.length, 'jest', cats.jest.length, 'sub', cats.sub.length, 'empty', cats.empty.length);
console.log('EMPTY_DETAIL ' + JSON.stringify(cats.empty));
console.log('MOUNT ' + cats.mount.join(' '));
console.log('JEST ' + cats.jest.join(' '));
fs.writeFileSync(path.join(__dirname, 'p1b-r284-cats.json'), JSON.stringify(cats, null, 1));
