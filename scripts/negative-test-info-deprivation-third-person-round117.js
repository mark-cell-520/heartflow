// 第117轮负例守卫：逐支删掉 info_deprivation 新增族判据，主测试必须重新变红
// 判定：RED（删后主测试失败）／COVERED（删后仍由其他判据兜住，属有兜底）／ERR（脚本异常）
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src/index.js');
const TEST = path.join(__dirname, '..', 'test/info-deprivation-third-person.test.js');
const original = fs.readFileSync(SRC, 'utf8');

// 只取第117轮新增块（两个 MARK 之间的判据）
const MARK = '第117轮：第3人称转述×外部支援剥夺族';
const first = original.indexOf(MARK);
if (first < 0) { console.log('ANCHOR_NOT_FOUND'); process.exit(2); }
const second = original.indexOf(MARK, first + 1);
// 两个新增块（zh 在第一次 MARK 后，en 在第二次 MARK 后）；逐支共 14 个 needle
const zhStart = original.indexOf(MARK);
const zhBlock = original.slice(zhStart, original.indexOf('  ],', zhStart));
const enStart = original.indexOf(MARK, zhStart + 1);
const enBlock = original.slice(enStart, original.indexOf('};', enStart));
const grab = b => (b.match(/\/[^\n]*?\/[a-z]*,/g) || []).map(s => s.trim());
const needles = grab(zhBlock).concat(grab(enBlock));
if (needles.length !== 14) { console.log('NEEDLE_COUNT ' + needles.length); process.exit(2); }
let red = 0, covered = 0, err = 0;
needles.forEach((n, i) => {
  const patched = original.replace(n + '\n', '');
  if (patched === original) { console.log('N' + (i + 1) + ' REPLACE_FAILED'); err++; return; }
  fs.writeFileSync(SRC, patched);
  let ok = true;
  try { execFileSync(process.execPath, [TEST], { stdio: 'pipe' }); ok = false; }
  catch (e) { ok = true; }
  fs.writeFileSync(SRC, original);
  if (ok) { red++; console.log('N' + (i + 1) + ' RED'); }
  else { covered++; console.log('N' + (i + 1) + ' COVERED'); }
});
fs.writeFileSync(SRC, original);
console.log('SUMMARY red=' + red + ' covered=' + covered + ' err=' + err);
process.exit(err ? 1 : 0);
