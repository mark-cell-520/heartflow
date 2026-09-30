// 调试：单条变异后直接看测试输出
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SRC = path.resolve(__dirname, '..', '..', 'src', 'index.js');
const TEST = path.resolve(__dirname, '..', '..', 'test', 'bad-faith-en-r226.test.js');
const ORIG = fs.readFileSync(SRC, 'utf8');
const EN = '  const slots = hasChinese ? BADFAITH_NARRATIVE_SLOTS : BADFAITH_NARRATIVE_SLOTS_EN;';
try {
  fs.writeFileSync(SRC, ORIG.replace(EN, EN + "\n  slots.splice(slots.findIndex(s => s.id === 'politeness_cloak'), 1);"));
  try {
    const out = execFileSync('node', [TEST], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log('=== STILL GREEN ===\n' + out);
  } catch (e) {
    console.log('=== EXIT ' + e.status + ' ===');
    console.log('STDOUT: ' + (e.stdout || '').slice(0, 400));
    console.log('STDERR: ' + (e.stderr || '').slice(0, 400));
  }
} finally {
  fs.writeFileSync(SRC, ORIG);
}
